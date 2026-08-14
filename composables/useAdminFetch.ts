export const useAdminFetch = () => {
  const supabase = useSupabaseClient();

  const adminFetch = async <T>(url: string, options: any = {}): Promise<T> => {
    // ----------------------------------------
    // GET CURRENT SESSION
    // ----------------------------------------

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // ----------------------------------------
    // NOT LOGGED IN
    // ----------------------------------------

    if (!session) {
      await navigateTo("/auth/signin");

      throw new Error("User is not authenticated");
    }

    // ----------------------------------------
    // CALL ADMIN API
    // ----------------------------------------

    return await $fetch<T>(url, {
      ...options,

      headers: {
        ...(options.headers || {}),

        Authorization: `Bearer ${session.access_token}`,
      },
    });
  };

  return {
    adminFetch,
  };
};
