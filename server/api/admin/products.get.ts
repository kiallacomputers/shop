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
    .select("*")
    .order("name", {
      ascending: true,
    });

  console.log("🔥 ADMIN PRODUCTS SUPABASE RESULT:");
  console.log(JSON.stringify(data, null, 2));

  console.log("🔥 ADMIN PRODUCTS SUPABASE ERROR:");
  console.log(error);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data || [];
});
