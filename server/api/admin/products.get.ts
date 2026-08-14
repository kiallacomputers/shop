import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  console.log("=================================");
  console.log("ADMIN PRODUCTS API");
  console.log("=================================");

  // ----------------------------------------
  // CHECK ADMIN
  // ----------------------------------------

  await requireAdmin(event);

  console.log("ADMIN CHECK PASSED");

  // ----------------------------------------
  // RUNTIME CONFIG
  // ----------------------------------------

  const config = useRuntimeConfig();

  console.log("SUPABASE URL:", config.public.supabaseUrl);

  console.log("SECRET KEY EXISTS:", !!config.supabaseSecretKey);

  // ----------------------------------------
  // SERVER SUPABASE CLIENT
  // ----------------------------------------

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

  // ----------------------------------------
  // GET PRODUCTS
  // ----------------------------------------

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("name", {
      ascending: true,
    });

  // ----------------------------------------
  // ERROR
  // ----------------------------------------

  if (error) {
    console.error("SUPABASE PRODUCTS ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to load products",
    });
  }

  console.log("PRODUCT COUNT:", products?.length || 0);

  console.log("PRODUCTS:", products);

  // ----------------------------------------
  // RETURN
  // ----------------------------------------

  return products || [];
});
