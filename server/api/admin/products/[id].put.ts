import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ----------------------------------------
  // CHECK ADMIN
  // ----------------------------------------

  await requireAdmin(event);

  // ----------------------------------------
  // GET PRODUCT ID
  // ----------------------------------------

  const productId = getRouterParam(event, "id");

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  // ----------------------------------------
  // GET REQUEST BODY
  // ----------------------------------------

  const body = await readBody(event);

  // ----------------------------------------
  // VALIDATE STOCK
  // ----------------------------------------

  if (body.stock === undefined || body.stock === null) {
    throw createError({
      statusCode: 400,
      statusMessage: "Stock value is required",
    });
  }

  const stock = Number(body.stock);

  if (!Number.isFinite(stock) || stock < 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Stock must be a valid number greater than or equal to zero",
    });
  }

  // Make sure stock is an integer
  const newStock = Math.floor(stock);

  // ----------------------------------------
  // RUNTIME CONFIG
  // ----------------------------------------

  const config = useRuntimeConfig();

  // ----------------------------------------
  // SERVER SUPABASE CLIENT
  // ----------------------------------------

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // ----------------------------------------
  // UPDATE PRODUCT
  // ----------------------------------------

  const { data, error } = await supabase
    .from("products")
    .update({
      stock: newStock,
    })
    .eq("id", productId)
    .select("id, name, price, stock, image")
    .single();

  // ----------------------------------------
  // DATABASE ERROR
  // ----------------------------------------

  if (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to update product",
    });
  }

  // ----------------------------------------
  // SUCCESS
  // ----------------------------------------

  console.log(`ADMIN STOCK UPDATE: Product ${productId} stock = ${newStock}`);

  return {
    success: true,
    product: data,
  };
});
