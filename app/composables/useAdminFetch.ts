export function useAdminFetch() {
  const supabase = useSupabaseClient();

  const adminFetch = async <T>(url: string, options: any = {}): Promise<T> => {
    // ----------------------------------------
    // GET CURRENT SUPABASE SESSION
    // ----------------------------------------

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // ----------------------------------------
    // SESSION ERROR
    // ----------------------------------------

    if (sessionError) {
      console.error("SESSION ERROR:", sessionError);

      throw sessionError;
    }

    // ----------------------------------------
    // USER NOT LOGGED IN
    // ----------------------------------------

    if (!session) {
      console.log("No active Supabase session");

      await navigateTo("/auth/signin");

      throw new Error("User is not authenticated");
    }

    console.log("Authenticated user:", session.user.email);

    // ----------------------------------------
    // CALL ADMIN API
    // ----------------------------------------

    try {
      return await $fetch<T>(url, {
        ...options,

        headers: {
          ...(options.headers || {}),

          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error("ADMIN API ERROR:", error);

      throw error;
    }
  };

  return {
    adminFetch,
  };
}
