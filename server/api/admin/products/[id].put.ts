import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("🔥 ADMIN PRODUCT UPDATE");

  // Check admin
  await requireAdmin(event);

  const productId = getRouterParam(event, "id");

  console.log("🔥 UPDATING PRODUCT:", productId);

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const body = await readBody(event);

  console.log("🔥 UPDATE BODY:", body);

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
   * Validate name
   */
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product name is required",
    });
  }

  /*
   * ----------------------------------------
   * IMAGES
   * ----------------------------------------
   *
   * images MUST be an array.
   */

  let images: string[] = [];

  if (Array.isArray(body.images)) {
    images = body.images.filter(
      (image: unknown): image is string =>
        typeof image === "string" && image.trim().length > 0,
    );
  }

  console.log("🔥 IMAGES BEING SAVED:", images);

  /*
   * ----------------------------------------
   * DESCRIPTION
   * ----------------------------------------
   */

  let description: any[] = [];

  if (Array.isArray(body.description)) {
    description = body.description;
  }

  console.log("🔥 DESCRIPTION BEING SAVED:", description);

  /*
   * ----------------------------------------
   * CATEGORY
   * ----------------------------------------
   */

  let categoryId = null;

  if (
    body.category_id !== null &&
    body.category_id !== undefined &&
    body.category_id !== ""
  ) {
    categoryId = Number(body.category_id);
  }

  /*
   * ----------------------------------------
   * UPDATE
   * ----------------------------------------
   */

  const { data, error } = await supabase
    .from("products")
    .update({
      name: String(body.name).trim(),

      slug:
        body.slug !== null && body.slug !== undefined
          ? String(body.slug).trim()
          : null,

      blurb:
        body.blurb !== null && body.blurb !== undefined
          ? String(body.blurb).trim()
          : null,

      category_id: categoryId,

      price:
        body.price !== null && body.price !== undefined
          ? Number(body.price)
          : 0,

      oldPrice:
        body.oldPrice !== null &&
        body.oldPrice !== undefined &&
        body.oldPrice !== ""
          ? Number(body.oldPrice)
          : null,

      stock:
        body.stock !== null && body.stock !== undefined
          ? Math.max(0, Number(body.stock))
          : 0,

      featured: Boolean(body.featured),

      refurbished:
        body.refurbished === null || body.refurbished === undefined
          ? null
          : Boolean(body.refurbished),

      active: body.active === undefined ? true : Boolean(body.active),

      /*
       * IMPORTANT:
       * JSON ARRAY
       */
      images,

      /*
       * IMPORTANT:
       * JSON ARRAY
       */
      description,
    })
    .eq("id", Number(productId))
    .select("*")
    .single();

  if (error) {
    console.error("🔥 PRODUCT UPDATE ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  console.log("🔥 PRODUCT UPDATED:", data);

  console.log("🔥 UPDATED IMAGES:", data?.images);

  return data;
});
