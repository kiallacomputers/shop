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

  const [profileResult, addressResult, orderResult, wishlistResult, quoteResult, pricingResult, backInStockResult] = await Promise.all([
    supabase.from("customer_crm_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("customer_addresses").select("id,label,full_name,address_line_1,address_line_2,suburb,state,postcode,country,phone,is_primary").eq("user_id", userId).order("is_primary", { ascending: false }),
    supabase.from("orders").select("id,total,status,customer_name,customer_email,tracking_number,carrier,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("customer_wishlist").select("product_id,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("customer_quote_requests").select(`id,quote_number,status,customer_message,admin_notes,quoted_total,expires_at,quoted_at,sent_at,created_at,updated_at,customer_quote_request_items(id,product_id,variant_id,product_name,variant_name,product_code,quantity,requested_price,quoted_price)`).eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("customer_pricing_assignments").select("pricing_level_key,created_at,updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("customer_back_in_stock_notifications").select("id,product_id,variant_id,status,requested_at,sent_at,cancelled_at,products(name,slug),product_variants(name)").eq("user_id", userId).order("requested_at", { ascending: false }),
  ]);

  for (const result of [profileResult, addressResult, orderResult, wishlistResult, quoteResult]) {
    if (result.error) throw createError({ statusCode: 500, statusMessage: result.error.message });
  }

  // Back-in-stock is a newer CRM feature. Keep the customer profile usable if
  // the migration has not reached an environment yet.
  const backInStockRows = backInStockResult.error?.code === "42P01" ? [] : (backInStockResult.data || []);
  if (backInStockResult.error && backInStockResult.error.code !== "42P01") {
    throw createError({ statusCode: 500, statusMessage: backInStockResult.error.message });
  }

  const wishlistIds = (wishlistResult.data || []).map((row: any) => Number(row.product_id));
  let wishlistProducts: any[] = [];
  if (wishlistIds.length) {
    const { data, error } = await supabase.from("products").select("id,name,slug,price,images").in("id", wishlistIds);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    const map = new Map((data || []).map((row: any) => [Number(row.id), row]));
    wishlistProducts = (wishlistResult.data || []).map((saved: any) => {
      const product: any = map.get(Number(saved.product_id));
      return product ? { ...product, wishlist_created_at: saved.created_at } : null;
    }).filter(Boolean);
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

  const timeline: any[] = [];
  const addEvent = (event: any) => {
    if (event?.at) timeline.push(event);
  };

  addEvent({
    id: `account-${user.id}`, type: "account", at: user.created_at,
    title: "Customer account created", detail: user.email || "Customer account created",
  });

  for (const order of orders) addEvent({
    id: `order-${order.id}`, type: "order", at: order.created_at,
    title: `Order #${order.id} placed`,
    detail: `${String(order.status || "processing").replaceAll("_", " ")} · ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(order.total || 0))}`,
    href: `/admin/orders/${order.id}`,
  });

  for (const quote of (quoteResult.data || [])) {
    addEvent({ id: `quote-requested-${quote.id}`, type: "quote", at: quote.created_at, title: `${quote.quote_number || `Quote #${quote.id}`} requested`, detail: quote.customer_message || "Customer requested a quote" });
    if (quote.quoted_at) addEvent({ id: `quote-ready-${quote.id}`, type: "quote", at: quote.quoted_at, title: `${quote.quote_number || `Quote #${quote.id}`} prepared`, detail: quote.quoted_total != null ? `Quoted total ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(quote.quoted_total || 0))}` : "Quote prepared" });
    if (quote.sent_at) addEvent({ id: `quote-sent-${quote.id}`, type: "email", at: quote.sent_at, title: `${quote.quote_number || `Quote #${quote.id}`} emailed`, detail: "Quote sent to customer" });
  }

  for (const item of wishlistProducts) addEvent({
    id: `wishlist-${item.id}-${item.wishlist_created_at}`, type: "wishlist", at: item.wishlist_created_at,
    title: "Added to wishlist", detail: item.name, href: `/product/${item.slug}`,
  });

  for (const notice of backInStockRows as any[]) {
    const product: any = Array.isArray(notice.products) ? notice.products[0] : notice.products;
    const variant: any = Array.isArray(notice.product_variants) ? notice.product_variants[0] : notice.product_variants;
    const productName = [product?.name, variant?.name].filter(Boolean).join(" — ") || `Product #${notice.product_id}`;
    addEvent({ id: `stock-request-${notice.id}`, type: "stock", at: notice.requested_at, title: "Back-in-stock alert requested", detail: productName, href: product?.slug ? `/product/${product.slug}` : undefined });
    if (notice.sent_at) addEvent({ id: `stock-sent-${notice.id}`, type: "email", at: notice.sent_at, title: "Back-in-stock email sent", detail: productName, href: product?.slug ? `/product/${product.slug}` : undefined });
    if (notice.cancelled_at) addEvent({ id: `stock-cancelled-${notice.id}`, type: "stock", at: notice.cancelled_at, title: "Back-in-stock alert cancelled", detail: productName, href: product?.slug ? `/product/${product.slug}` : undefined });
  }

  if (profileResult.data?.updated_at) addEvent({ id: "profile-updated", type: "profile", at: profileResult.data.updated_at, title: "Customer profile updated", detail: "CRM profile or communication preferences changed" });
  if (pricingResult.data?.updated_at) addEvent({ id: "pricing-updated", type: "pricing", at: pricingResult.data.updated_at, title: "Pricing level updated", detail: pricingLevel.name });

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

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
    timeline: timeline.slice(0, 250),
  };
});
