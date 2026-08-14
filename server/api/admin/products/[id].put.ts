import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = Number(getRouterParam(event, "id"));

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid product ID",
    });
  }

  const body = await readBody(event);

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

  /*
   * ----------------------------------------
   * VALIDATE DATA
   * ----------------------------------------
   */

  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product name is required",
    });
  }

  /*
   * ----------------------------------------
   * PREPARE IMAGES
   * ----------------------------------------
   */

  let images: string[] = [];

  if (Array.isArray(body.images)) {
    images = body.images.filter(
      (image: any) => typeof image === "string" && image.trim() !== "",
    );
  }

  /*
   * ----------------------------------------
   * PREPARE DESCRIPTION
   * ----------------------------------------
   */

  let description: any[] = [];

  if (Array.isArray(body.description)) {
    description = body.description;
  }

  /*
   * ----------------------------------------
   * UPDATE PRODUCT
   * ----------------------------------------
   */

  const { data, error } = await supabase
    .from("products")
    .update({
      name: body.name.trim(),

      slug: body.slug ? body.slug.trim() : null,

      blurb: body.blurb ? body.blurb.trim() : null,

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
          ? Number(body.stock)
          : 0,

      category_id:
        body.category_id !== null &&
        body.category_id !== undefined &&
        body.category_id !== ""
          ? Number(body.category_id)
          : null,

      featured: Boolean(body.featured),

      refurbished:
        body.refurbished === null || body.refurbished === undefined
          ? null
          : Boolean(body.refurbished),

      active: body.active === undefined ? true : Boolean(body.active),

      /*
       * IMPORTANT
       *
       * Database column is "images"
       */
      images,

      /*
       * Database column is "description"
       * and contains a JSON array.
       */
      description,
    })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    console.error("ADMIN PRODUCT UPDATE ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  console.log("🔥 PRODUCT UPDATED:", data);

  return data;
});
