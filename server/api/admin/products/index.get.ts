import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async () => {
  await requireAdmin(event);

  const config = useRuntimeConfig();

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      stock,
      category,
      categories (
        id,
        name
      )
    `,
    )
    .order("name");

  if (error) {
    console.error("PRODUCTS ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
