import { requireAdmin } from "../../../utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("🔥 PRODUCT PUT ROUTE HIT");
  console.log("=================================");

  try {
    const id = getRouterParam(event, "id");

    console.log("PRODUCT ID:", id);

    const body = await readBody(event);

    console.log("BODY RECEIVED:");
    console.log(JSON.stringify(body, null, 2));

    console.log("ABOUT TO CHECK ADMIN");

    const { supabase } = await requireAdmin(event);

    console.log("ADMIN CHECK PASSED");

    const updateData = {
      name: body.name,
      slug: body.slug,
      category_id: body.category_id,
      blurb: body.blurb,
      price: body.price,
      oldPrice: body.oldPrice,
      stock: body.stock,
      featured: body.featured,
      refurbished: body.refurbished,
      images: Array.isArray(body.images) ? body.images : [],
      description: Array.isArray(body.description) ? body.description : [],
      active: body.active,
    };

    console.log("UPDATE DATA:");
    console.log(JSON.stringify(updateData, null, 2));

    console.log("ABOUT TO UPDATE SUPABASE");

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    console.log("SUPABASE RESPONSE RECEIVED");

    if (error) {
      console.error("🔥 SUPABASE ERROR:");
      console.error(JSON.stringify(error, null, 2));

      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    console.log("🔥 PRODUCT UPDATE SUCCESS");
    console.log(data);

    return data;
  } catch (error: any) {
    console.error("🔥🔥🔥 PRODUCT PUT FAILED 🔥🔥🔥");
    console.error(error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Product update failed",
    });
  }
});
