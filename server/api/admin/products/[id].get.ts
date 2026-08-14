import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("🔥 ADMIN PRODUCT GET");

  // Check admin
  await requireAdmin(event);

  const productId = getRouterParam(event, "id");

  console.log("🔥 PRODUCT ID:", productId);

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const config = useRuntimeConfig();

  /*
   * Server-side Supabase client
   */
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

  /*
   * Get product
   */
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", Number(productId))
    .single();

  console.log("🔥 DATABASE PRODUCT:", data);

  console.log("🔥 DATABASE IMAGES:", data?.images);

  console.log("🔥 IMAGES IS ARRAY:", Array.isArray(data?.images));

  console.log("🔥 DATABASE DESCRIPTION:", data?.description);

  if (error) {
    console.error("🔥 PRODUCT GET ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  /*
   * Make absolutely sure images
   * is returned as an array.
   */
  if (!Array.isArray(data.images)) {
    data.images = [];
  }

  /*
   * Make sure description
   * is returned as an array.
   */
  if (!Array.isArray(data.description)) {
    data.description = [];
  }

  console.log("🔥 RETURNING PRODUCT:", data);

  return data;
});
