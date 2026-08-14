export const useAdminFetch = () => {
  const user = useSupabaseUser();

  const adminFetch = async (url: string, options: any = {}) => {
    if (!user.value) {
      throw new Error("Authentication required");
    }

    const supabase = useSupabaseClient();

    // Get the current Supabase session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("SESSION ERROR:", error);
      throw error;
    }

    if (!session?.access_token) {
      throw new Error("Authentication required");
    }

    console.log("🔥 ADMIN FETCH:", url);

    return await $fetch(url, {
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
