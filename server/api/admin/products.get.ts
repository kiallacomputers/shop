import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

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

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      name,
      category_id,
      blurb,
      price,
      stock,
      image,
      description
    `,
    )
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error("ADMIN PRODUCTS ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load products",
    });
  }

  console.log("🔥 PRODUCTS FROM SUPABASE:", data);

  return data || [];
});
