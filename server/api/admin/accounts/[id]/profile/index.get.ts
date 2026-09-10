import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const userId = String(getRouterParam(event, "id") || "");
  if (!userId) throw createError({ statusCode: 400, statusMessage: "Customer ID is required." });

  const supabase = getAdminSupabase();
  const { data: authResult, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authResult?.user) {
    throw createError({ statusCode: 404, statusMessage: authError?.message || "Customer not found." });
  }

  const user = authResult.user;

  const [profileResult, addressResult, orderResult, wishlistResult, quoteResult, pricingResult] = await Promise.all([
    supabase.from("customer_crm_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("customer_addresses").select("id,label,full_name,address_line_1,address_line_2,suburb,state,postcode,country,phone,is_primary").eq("user_id", userId).order("is_primary", { ascending: false }),
    supabase.from("orders").select("id,total,status,customer_name,customer_email,tracking_number,carrier,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("customer_wishlist").select("product_id,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("customer_quote_requests").select(`id,quote_number,status,customer_message,admin_notes,quoted_total,expires_at,quoted_at,sent_at,created_at,updated_at,customer_quote_request_items(id,product_id,variant_id,product_name,variant_name,product_code,quantity,requested_price,quoted_price)`).eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("customer_pricing_assignments").select("pricing_level_key").eq("user_id", userId).maybeSingle(),
  ]);

  for (const result of [profileResult, addressResult, orderResult, wishlistResult, quoteResult]) {
    if (result.error) throw createError({ statusCode: 500, statusMessage: result.error.message });
  }

  const wishlistIds = (wishlistResult.data || []).map((row: any) => Number(row.product_id));
  let wishlistProducts: any[] = [];
  if (wishlistIds.length) {
    const { data, error } = await supabase.from("products").select("id,name,slug,price,images").in("id", wishlistIds);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    const map = new Map((data || []).map((row: any) => [Number(row.id), row]));
    wishlistProducts = wishlistIds.map((id) => map.get(id)).filter(Boolean);
  }

  const { data: levels, error: levelsError } = await supabase
    .from("customer_pricing_levels")
    .select("key,name,markup_percent,active,sort_order")
    .eq("active", true)
    .order("sort_order");
  if (levelsError) throw createError({ statusCode: 500, statusMessage: levelsError.message });

  const assignedKey = pricingResult.data?.pricing_level_key || "standard";
  const pricingLevel = (levels || []).find((l: any) => l.key === assignedKey) ||
    (levels || []).find((l: any) => l.key === "standard") ||
    { key: "standard", name: "Standard", markup_percent: 20 };

  const orders = orderResult.data || [];
  const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

  return {
    account: {
      id: user.id,
      email: user.email || "",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
    },
    profile: profileResult.data || {
      user_id: userId,
      display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || "",
      business_name: "",
      phone: "",
      preferred_contact: "email",
      order_updates: true,
      back_in_stock_updates: true,
      marketing_updates: false,
      admin_notes: "",
      tags: [],
    },
    pricingLevel: {
      key: pricingLevel.key,
      name: pricingLevel.name,
      markup_percent: Number(pricingLevel.markup_percent),
    },
    pricingLevels: levels || [],
    stats: {
      orders: orders.length,
      totalSpent,
      wishlist: wishlistProducts.length,
      quotes: (quoteResult.data || []).length,
      lastOrderAt: orders[0]?.created_at || null,
    },
    addresses: addressResult.data || [],
    orders,
    wishlist: wishlistProducts,
    quotes: quoteResult.data || [],
  };
});
