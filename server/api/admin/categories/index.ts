import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ============================================================
  // REQUIRE ADMIN
  // ============================================================

  await requireAdmin(event);

  // ============================================================
  // SUPABASE SERVER CONFIG
  // ============================================================

  const config = useRuntimeConfig();

  const supabaseUrl =
    config.public.supabaseUrl || config.supabaseUrl || process.env.SUPABASE_URL;

  const serviceKey =
    config.supabaseSecretKey ||
    config.supabaseServiceKey ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase URL is not configured",
    });
  }

  if (!serviceKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase server secret key is not configured",
    });
  }

  // ============================================================
  // SERVICE CLIENT
  // ============================================================

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ============================================================
  // GET CATEGORIES
  // ============================================================

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", {
      ascending: true,
    });

  console.log("🔥 SUPABASE CATEGORIES:", data);
  console.log("🔥 SUPABASE CATEGORY ERROR:", error);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data || [];
});
