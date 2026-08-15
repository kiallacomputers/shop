export const useAdminFetch = () => {
  const supabase = useSupabaseClient();

  const adminFetch = async (url: string, options: any = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Authentication required");
    }

    return await $fetch(url, {
      ...options,

      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  };

  return adminFetch;
};

export default useAdminFetch;
