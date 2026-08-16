import { requireAdmin, getAdminSupabase } from "../../../utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🔥 PRODUCT PUT ROUTE HIT");
  console.log("=================================");

  try {
    // -----------------------------------------
    // CHECK ADMIN AUTHENTICATION
    // -----------------------------------------

    const user = await requireAdmin(event);

    console.log("ADMIN USER:", user.email);

    // -----------------------------------------
    // GET ADMIN SUPABASE CLIENT
    // -----------------------------------------

    const supabase = getAdminSupabase();

    console.log("ADMIN SUPABASE CLIENT CREATED");

    // -----------------------------------------
    // GET PRODUCT ID
    // -----------------------------------------

    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Product ID is required",
      });
    }

    console.log("PRODUCT ID:", id);

    // -----------------------------------------
    // READ REQUEST BODY
    // -----------------------------------------

    const body = await readBody(event);

    console.log("BODY RECEIVED:");
    console.log(JSON.stringify(body, null, 2));

    // -----------------------------------------
    // IMAGES
    // -----------------------------------------

    let images: string[] = [];

    if (Array.isArray(body.images)) {
      images = body.images
        .map((image: any) => {
          // Normal string
          if (typeof image === "string") {
            return image.trim();
          }

          // Object containing URL
          if (
            image &&
            typeof image === "object" &&
            typeof image.url === "string"
          ) {
            return image.url.trim();
          }

          // Object containing path
          if (
            image &&
            typeof image === "object" &&
            typeof image.path === "string"
          ) {
            return image.path.trim();
          }

          return "";
        })
        .filter(Boolean);
    }

    console.log("IMAGES:", images);

    // -----------------------------------------
    // DESCRIPTION
    // -----------------------------------------

    let description: any[] = [];

    if (Array.isArray(body.description)) {
      description = body.description;
    }

    console.log("DESCRIPTION:", description);

    // -----------------------------------------
    // NORMALISE VALUES
    // -----------------------------------------

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const slug = typeof body.slug === "string" ? body.slug.trim() : "";

    const blurb = typeof body.blurb === "string" ? body.blurb.trim() : "";

    const categoryId =
      body.category_id !== undefined &&
      body.category_id !== null &&
      body.category_id !== ""
        ? Number(body.category_id)
        : null;

    const price =
      body.price !== undefined && body.price !== null && body.price !== ""
        ? Number(body.price)
        : 0;

    const oldPrice =
      body.oldPrice !== undefined &&
      body.oldPrice !== null &&
      body.oldPrice !== ""
        ? Number(body.oldPrice)
        : null;

    const stock =
      body.stock !== undefined && body.stock !== null && body.stock !== ""
        ? Number(body.stock)
        : 0;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Product name is required",
      });
    }

    if (Number.isNaN(price)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid product price",
      });
    }

    if (Number.isNaN(stock)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid stock value",
      });
    }

    if (oldPrice !== null && Number.isNaN(oldPrice)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid old price",
      });
    }

    // -----------------------------------------
    // BUILD UPDATE DATA
    // -----------------------------------------

    const updateData: Record<string, any> = {
      name,
      slug,
      category_id: categoryId,
      blurb,

      price,
      oldPrice,

      stock,

      featured: Boolean(body.featured),
      refurbished: Boolean(body.refurbished),

      images,

      description,

      active: body.active !== false,
    };

    console.log("=================================");
    console.log("UPDATE DATA:");
    console.log(JSON.stringify(updateData, null, 2));
    console.log("=================================");

    // -----------------------------------------
    // UPDATE PRODUCT
    // -----------------------------------------

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    // -----------------------------------------
    // SUPABASE ERROR
    // -----------------------------------------

    if (error) {
      console.error("=================================");
      console.error("🔥 SUPABASE PRODUCT UPDATE ERROR");
      console.error("MESSAGE:", error.message);
      console.error("DETAILS:", error.details);
      console.error("HINT:", error.hint);
      console.error("CODE:", error.code);
      console.error("=================================");

      throw createError({
        statusCode: 500,
        statusMessage: error.message || "Failed to update product",
      });
    }

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    console.log("=================================");
    console.log("🔥 PRODUCT UPDATED SUCCESSFULLY");
    console.log("PRODUCT:", data);
    console.log("=================================");

    return data;
  } catch (error: any) {
    console.error("=================================");
    console.error("🔥🔥🔥 PRODUCT PUT FAILED 🔥🔥🔥");
    console.error(error);
    console.error("=================================");

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Product update failed",
    });
  }
});
