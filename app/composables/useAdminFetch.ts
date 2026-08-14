export const useAdminFetch = async <T>(url: string, options: any = {}) => {
  const supabase = useSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required");
  }

  return await $fetch<T>(url, {
    ...options,

    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  });
};
