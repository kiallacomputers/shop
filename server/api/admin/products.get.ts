import { requireAdmin, getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("ADMIN PRODUCTS ERROR:", error);

      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    console.log("ADMIN PRODUCTS FOUND:", data?.length ?? 0);

    return data ?? [];
  } catch (error: any) {
    console.error("ADMIN PRODUCTS REQUEST ERROR:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to load products",
    });
  }
});
