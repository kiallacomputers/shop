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

  const { data, error } = await supabase.from("products").select("*");

  console.log("🔥🔥🔥 SERVER PRODUCTS 🔥🔥🔥", JSON.stringify(data, null, 2));

  console.log("🔥🔥🔥 SERVER ERROR 🔥🔥🔥", error);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data || [];
});
