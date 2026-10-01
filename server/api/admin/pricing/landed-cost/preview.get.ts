import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const round = (value: number) => Math.max(1, Math.round(value));

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const supabase = getAdminSupabase();

  const { data: settings, error: settingsError } = await supabase
    .from("pricing_cost_settings")
    .select("use_landed_cost_for_pricing")
    .eq("id", 1)
    .maybeSingle();

  if (settingsError) {
    throw createError({
      statusCode: 500,
      statusMessage: settingsError.message,
    });
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,product_code,buy_price_ex_gst,landed_cost_ex_gst,sell_markup_percent,rrp_markup_percent,price,oldPrice",
    )
    .not("landed_cost_ex_gst", "is", null)
    .order("name");

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const products = (data || [])
    .map((product: any) => {
      const cost = Number(
        (product.landed_cost_ex_gst ?? product.buy_price_ex_gst) || 0,
      );

      const sell = round(
        cost * (1 + Number(product.sell_markup_percent || 0) / 100) * 1.1,
      );

      const rrp = round(
        cost * (1 + Number(product.rrp_markup_percent || 0) / 100) * 1.1,
      );

      return {
        ...product,
        new_price: sell,
        new_rrp: rrp,
        price_change: sell - Number(product.price || 0),
      };
    })
    .filter(
      (product: any) =>
        product.new_price !== Number(product.price || 0) ||
        product.new_rrp !== Number(product.oldPrice || 0),
    );

  return {
    enabled: settings?.use_landed_cost_for_pricing !== false,
    products,
  };
});
