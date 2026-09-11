import {
  getAdminSupabase,
  requireSuperAdmin,
} from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const currentUser = await requireSuperAdmin(event);
  const supabase = getAdminSupabase();

  const allUsers: any[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || "Unable to load user accounts.",
      });
    }

    const users = data?.users ?? [];
    allUsers.push(...users);

    if (users.length < perPage) break;
    page++;
    if (page > 100) break;
  }

  const [
    adminResult,
    pricingLevelsResult,
    pricingAssignmentsResult,
    crmProfilesResult,
    ordersResult,
    wishlistResult,
    quotesResult,
  ] = await Promise.all([
    supabase.from("admin_users").select("id,email,created_at,role"),
    supabase
      .from("customer_pricing_levels")
      .select("key,name,markup_percent,sort_order,active")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("customer_pricing_assignments").select("user_id,pricing_level_key"),
    supabase
      .from("customer_crm_profiles")
      .select("user_id,display_name,business_name,phone,preferred_contact,marketing_updates,order_updates,back_in_stock_updates,tags,updated_at"),
    supabase
      .from("orders")
      .select("user_id,total,status,created_at")
      .not("user_id", "is", null),
    supabase
      .from("customer_wishlist")
      .select("user_id,product_id"),
    supabase
      .from("customer_quote_requests")
      .select("user_id,id,status,created_at")
      .not("user_id", "is", null),
  ]);

  const failed = [
    adminResult,
    pricingLevelsResult,
    pricingAssignmentsResult,
    crmProfilesResult,
    ordersResult,
    wishlistResult,
    quotesResult,
  ].find((result) => result.error);

  if (failed?.error) {
    throw createError({
      statusCode: 500,
      statusMessage: failed.error.message || "Unable to load customer CRM information.",
    });
  }

  const adminMap = new Map(
    (adminResult.data ?? []).map((admin: any) => [String(admin.id), admin]),
  );

  const pricingLevels = pricingLevelsResult.data ?? [];
  const pricingLevelMap = new Map(
    pricingLevels.map((level: any) => [String(level.key), level]),
  );
  const pricingAssignmentMap = new Map(
    (pricingAssignmentsResult.data ?? []).map((assignment: any) => [
      String(assignment.user_id),
      String(assignment.pricing_level_key),
    ]),
  );
  const standardLevel = pricingLevelMap.get("standard") || {
    key: "standard",
    name: "Standard",
    markup_percent: 20,
  };

  const profileMap = new Map(
    (crmProfilesResult.data ?? []).map((profile: any) => [
      String(profile.user_id),
      profile,
    ]),
  );

  const orderStats = new Map<string, {
    count: number;
    totalSpent: number;
    lastOrderAt: string | null;
    lastOrderStatus: string | null;
  }>();

  for (const order of ordersResult.data ?? []) {
    const userId = String((order as any).user_id || "");
    if (!userId) continue;

    const current = orderStats.get(userId) || {
      count: 0,
      totalSpent: 0,
      lastOrderAt: null,
      lastOrderStatus: null,
    };

    current.count += 1;
    current.totalSpent += Number((order as any).total || 0);

    const createdAt = (order as any).created_at || null;
    if (createdAt && (!current.lastOrderAt || new Date(createdAt).getTime() > new Date(current.lastOrderAt).getTime())) {
      current.lastOrderAt = createdAt;
      current.lastOrderStatus = String((order as any).status || "");
    }

    orderStats.set(userId, current);
  }

  const wishlistCount = new Map<string, number>();
  for (const row of wishlistResult.data ?? []) {
    const userId = String((row as any).user_id || "");
    if (!userId) continue;
    wishlistCount.set(userId, (wishlistCount.get(userId) || 0) + 1);
  }

  const quoteStats = new Map<string, { count: number; open: number; accepted: number }>();
  for (const row of quotesResult.data ?? []) {
    const userId = String((row as any).user_id || "");
    if (!userId) continue;
    const current = quoteStats.get(userId) || { count: 0, open: 0, accepted: 0 };
    current.count += 1;
    const status = String((row as any).status || "").toLowerCase();
    if (["new", "reviewing", "quoted"].includes(status)) current.open += 1;
    if (status === "accepted") current.accepted += 1;
    quoteStats.set(userId, current);
  }

  const currentUserId =
    (currentUser as any)?.id ||
    (currentUser as any)?.sub ||
    "";

  const pricingLevelOptions = pricingLevels.map((level: any) => ({
    key: String(level.key),
    name: String(level.name),
    markup_percent: Number(level.markup_percent),
  }));

  return allUsers
    .map((user: any) => {
      const userId = String(user.id);
      const adminRecord = adminMap.get(userId);
      const profile = profileMap.get(userId) || {};
      const stats = orderStats.get(userId) || {
        count: 0,
        totalSpent: 0,
        lastOrderAt: null,
        lastOrderStatus: null,
      };
      const quotes = quoteStats.get(userId) || { count: 0, open: 0, accepted: 0 };

      const authDisplayName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
      const displayName = String(profile.display_name || authDisplayName || "");

      const assignedKey = pricingAssignmentMap.get(userId) || "standard";
      const level = pricingLevelMap.get(assignedKey) || standardLevel;

      return {
        id: user.id,
        email: user.email ?? "",
        display_name: displayName,
        business_name: String(profile.business_name || ""),
        phone: String(profile.phone || ""),
        preferred_contact: String(profile.preferred_contact || "email"),
        tags: Array.isArray(profile.tags) ? profile.tags : [],
        marketing_updates: Boolean(profile.marketing_updates),
        order_updates: profile.order_updates !== false,
        back_in_stock_updates: profile.back_in_stock_updates !== false,
        profile_updated_at: profile.updated_at || null,
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        role: adminRecord?.role || null,
        is_admin: Boolean(adminRecord),
        is_superadmin: adminRecord?.role === "superadmin",
        admin_since: adminRecord?.created_at ?? null,
        is_current_user: userId === String(currentUserId),
        pricing_level_key: String(level.key),
        pricing_level_name: String(level.name),
        pricing_markup_percent: Number(level.markup_percent),
        pricing_levels: pricingLevelOptions,
        order_count: stats.count,
        total_spent: Number(stats.totalSpent.toFixed(2)),
        last_order_at: stats.lastOrderAt,
        last_order_status: stats.lastOrderStatus,
        wishlist_count: wishlistCount.get(userId) || 0,
        quote_count: quotes.count,
        open_quote_count: quotes.open,
        accepted_quote_count: quotes.accepted,
      };
    })
    .sort((a: any, b: any) => {
      const nameA = a.display_name || a.business_name || a.email || "";
      const nameB = b.display_name || b.business_name || b.email || "";
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
});
