import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ----------------------------------------
  // ADMIN AUTH
  // ----------------------------------------

  await requireAdmin(event);

  // ----------------------------------------
  // PRODUCT ID
  // ----------------------------------------

  const productId = getRouterParam(event, "id");

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  // ----------------------------------------
  // REQUEST BODY
  // ----------------------------------------

  const body = await readBody(event);

  // ----------------------------------------
  // NAME
  // ----------------------------------------

  if (!body.name || !body.name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product name is required",
    });
  }

  // ----------------------------------------
  // PRICE
  // ----------------------------------------

  const price = Number(body.price);

  if (!Number.isFinite(price) || price < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid price",
    });
  }

  // ----------------------------------------
  // STOCK
  // ----------------------------------------

  const stock = Number(body.stock);

  if (!Number.isFinite(stock) || stock < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid stock",
    });
  }

  // ----------------------------------------
  // IMAGE JSON ARRAY
  // ----------------------------------------

  if (!Array.isArray(body.image)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image must be a JSON array",
    });
  }

  // ----------------------------------------
  // DESCRIPTION JSON ARRAY
  // ----------------------------------------

  if (!Array.isArray(body.description)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Description must be a JSON array",
    });
  }

  // ----------------------------------------
  // SUPABASE
  // ----------------------------------------

  const config = useRuntimeConfig();

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
  // UPDATE
  // ----------------------------------------

  const { data, error } = await supabase
    .from("products")
    .update({
      name: body.name.trim(),

      price: price,

      stock: Math.floor(stock),

      category: body.category_id ? Number(body.category_id) : null,

      image: body.image,

      description: body.description,
    })
    .eq("id", productId)
    .select("*")
    .single();

  // ----------------------------------------
  // SUPABASE ERROR
  // ----------------------------------------

  if (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to update product",
    });
  }

  console.log(`ADMIN PRODUCT UPDATED: ${productId}`);

  // ----------------------------------------
  // RETURN
  // ----------------------------------------

  return {
    success: true,

    product: data,
  };
});
