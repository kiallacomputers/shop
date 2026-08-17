import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";

export type AdminRole = "superadmin" | "admin";

export const getAdminSupabase = () => {
  const config = useRuntimeConfig();

  const supabaseUrl =
    config.public?.supabaseUrl ||
    process.env.SUPABASE_URL;

  const supabaseSecretKey =
    config.supabaseSecretKey ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Supabase URL is not configured",
    });
  }

  if (!supabaseSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Supabase secret key is not configured",
    });
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
};

export const getAdminUser = async (
  event: H3Event,
) => {
  let user: any = null;

  try {
    user = await serverSupabaseUser(event);
  } catch (error) {
    console.error(
      "SUPABASE USER CHECK ERROR:",
      error,
    );

    user = null;
  }

  if (!user) {
    return {
      user: null,
      isAdmin: false,
      isSuperAdmin: false,
      role: null as AdminRole | null,
      adminUser: null,
    };
  }

  const userId = user.id || user.sub;

  if (
    !userId ||
    typeof userId !== "string"
  ) {
    return {
      user,
      isAdmin: false,
      isSuperAdmin: false,
      role: null as AdminRole | null,
      adminUser: null,
    };
  }

  const adminSupabase =
    getAdminSupabase();

  const {
    data: adminUser,
    error: adminError,
  } = await adminSupabase
    .from("admin_users")
    .select("id, email, created_at, role")
    .eq("id", userId)
    .maybeSingle();

  if (adminError) {
    console.error(
      "ADMIN USER LOOKUP ERROR:",
      adminError,
    );

    return {
      user,
      isAdmin: false,
      isSuperAdmin: false,
      role: null as AdminRole | null,
      adminUser: null,
    };
  }

  const role =
    adminUser?.role === "superadmin"
      ? "superadmin"
      : adminUser
        ? "admin"
        : null;

  const isAdmin =
    role === "admin" ||
    role === "superadmin";

  const isSuperAdmin =
    role === "superadmin";

  return {
    user,
    isAdmin,
    isSuperAdmin,
    role,
    adminUser,
  };
};

export const requireAdmin = async (
  event: H3Event,
) => {
  const result =
    await getAdminUser(event);

  if (!result.user) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "Authentication required",
    });
  }

  if (!result.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Administrator access required",
    });
  }

  return result.user;
};

export const requireSuperAdmin = async (
  event: H3Event,
) => {
  const result =
    await getAdminUser(event);

  if (!result.user) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "Authentication required",
    });
  }

  if (!result.isSuperAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "SuperAdmin access required",
    });
  }

  return result.user;
};
