import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  // ----------------------------------------
  // CHECK ADMIN
  // ----------------------------------------

  await requireAdmin(event);

  // ----------------------------------------
  // RUNTIME CONFIG
  // ----------------------------------------

  const config = useRuntimeConfig();

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
    .select(
      `
      id,
      name,
      price,
      stock,
      image,
      category (
        id,
        name
      )
    `,
    )
    .order("name", {
      ascending: true,
    });

  // ----------------------------------------
  // DATABASE ERROR
  // ----------------------------------------

  if (error) {
    console.error("ADMIN PRODUCTS ERROR:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to load products",
    });
  }

  // ----------------------------------------
  // RETURN PRODUCTS
  // ----------------------------------------

  return products || [];
});
