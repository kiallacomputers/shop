export const useAdminFetch = () => {
  const supabase = useSupabaseClient();

  const adminFetch = async <T>(url: string, options: any = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      await navigateTo("/login");

      throw new Error("User is not authenticated");
    }

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
