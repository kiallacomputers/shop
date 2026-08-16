import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export async function isAdminUser(event: any) {
  try {
    // Get the currently logged-in Supabase user
    const user = await serverSupabaseUser(event);

    // No authenticated user
    if (!user) {
      return {
        user: null,
        isAdmin: false,
      };
    }

    // Get the Supabase server client
    const supabase = await serverSupabaseClient(event);

    // Check whether the user exists in admin_users
    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Admin check error:", error);

      return {
        user,
        isAdmin: false,
      };
    }

    return {
      user,
      isAdmin: !!data,
    };
  } catch (error) {
    console.error("isAdminUser error:", error);

    return {
      user: null,
      isAdmin: false,
    };
  }
}
