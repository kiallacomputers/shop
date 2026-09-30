import { requireRequestUser } from "~~/server/utils/requestUser";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

const money = (value: any) =>
  Math.round(Number(value || 0) * 100) / 100;

export default defineEventHandler(async (event) => {
  const user: any = await requireRequestUser(event);
  const body: any = await readBody(event);
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const db = getAdminSupabase();

  const items = rawItems
    .map((item: any) => ({
      id: Number(item.id),
      cartKey: String(item.cartKey || item.id || ""),
      variantId:
        item.variantId == null || item.variantId === ""
          ? null
          : Number(item.variantId),
      variantName: item.variantName || null,
      productCode: item.productCode || null,
      name: String(item.name || "").trim(),
      slug: String(item.slug || "").trim(),
      price: money(item.price),
      image: item.image || null,
      selectedAddons: Array.isArray(item.selectedAddons)
        ? item.selectedAddons
        : [],
      quantity: Math.max(1, Number(item.quantity || 1)),
    }))
    .filter(
      (item: any) =>
        Number.isInteger(item.id) &&
        item.id > 0 &&
        item.name &&
        Number.isFinite(item.price),
    );

  const now = new Date().toISOString();

  const {
    data: openRows,
    error: openError,
  } = await db
    .from("abandoned_carts")
    .select("id,status")
    .eq("user_id", user.id)
    .in("status", ["active", "abandoned", "recovered"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (openError) {
    console.error("ABANDONED CART LOOKUP ERROR:", openError);
    throw createError({
      statusCode: 500,
      statusMessage: `Unable to find cart recovery record: ${openError.message}`,
    });
  }

  const open = openRows?.[0] || null;

  if (!items.length) {
    if (open?.id) {
      const { error } = await db
        .from("abandoned_carts")
        .update({
          status: "expired",
          updated_at: now,
        })
        .eq("id", open.id);

      if (error) {
        console.error("ABANDONED CART EXPIRE ERROR:", error);
        throw createError({
          statusCode: 500,
          statusMessage: `Unable to expire cart recovery record: ${error.message}`,
        });
      }
    }

    return { ok: true, empty: true };
  }

  const cartValue = money(
    items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    ),
  );
  const itemCount = items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0,
  );

  const payload = {
    customer_email: user.email || null,
    customer_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      null,
    items,
    cart_value: cartValue,
    item_count: itemCount,
    status: "active",
    last_activity_at: now,
    abandoned_at: null,
    updated_at: now,
  };

  if (open?.id) {
    const { error } = await db
      .from("abandoned_carts")
      .update(payload)
      .eq("id", open.id);

    if (error) {
      console.error("ABANDONED CART UPDATE ERROR:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Unable to update cart recovery record: ${error.message}`,
      });
    }

    console.info("ABANDONED CART UPDATED:", {
      id: open.id,
      userId: user.id,
      itemCount,
      cartValue,
    });

    return { ok: true, id: open.id, action: "updated" };
  }

  const { data, error } = await db
    .from("abandoned_carts")
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select("id")
    .single();

  if (error) {
    console.error("ABANDONED CART INSERT ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Unable to create cart recovery record: ${error.message}`,
    });
  }

  console.info("ABANDONED CART CREATED:", {
    id: data.id,
    userId: user.id,
    itemCount,
    cartValue,
  });

  return { ok: true, id: data.id, action: "created" };
});
