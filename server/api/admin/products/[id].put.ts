import { requireAdmin } from "../../../../utils/adminAuth";

export default defineEventHandler(async (event) => {
  const { supabase } = await requireAdmin(event);

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const body = await readBody(event);

  console.log("=================================");
  console.log("ADMIN PRODUCT UPDATE");
  console.log("PRODUCT ID:", id);
  console.log("BODY:", body);
  console.log("=================================");

  // -----------------------------------------
  // IMAGES
  // -----------------------------------------

  let images: string[] = [];

  if (Array.isArray(body.images)) {
    images = body.images
      .map((image: any) => {
        if (typeof image === "string") {
          return image.trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  // -----------------------------------------
  // DESCRIPTION
  // -----------------------------------------

  let description = [];

  if (Array.isArray(body.description)) {
    description = body.description;
  }

  // -----------------------------------------
  // UPDATE DATA
  // -----------------------------------------

  const updateData: any = {
    name: body.name,
    slug: body.slug,
    category_id: body.category_id,
    blurb: body.blurb,

    price: body.price,
    oldPrice: body.oldPrice,

    stock: body.stock,

    featured: body.featured,
    refurbished: body.refurbished,

    images: images,
    description: description,

    active: body.active,
  };

  console.log("IMAGES BEING SAVED:", images);
  console.log("DESCRIPTION BEING SAVED:", description);

  // -----------------------------------------
  // UPDATE
  // -----------------------------------------

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PRODUCT UPDATE ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  console.log("PRODUCT UPDATED:", data);

  return data;
});
