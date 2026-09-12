export const useWishlist = () => {
  const supabase = useSupabaseClient();
  const productIds = useState<number[]>("customer-wishlist-product-ids", () => []);
  const loaded = useState<boolean>("customer-wishlist-loaded", () => false);
  const loading = useState<boolean>("customer-wishlist-loading", () => false);

  async function authFetch<T = any>(url: string, options: any = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("You must be signed in.");
    return await $fetch<T>(url, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  }

  async function load(force = false) {
    if (!import.meta.client || loading.value || (loaded.value && !force)) return;

    // Set this before the first await so a page containing many ProductCards
    // cannot start multiple wishlist/session requests at the same time.
    loading.value = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        productIds.value = [];
        loaded.value = true;
        return;
      }

      const result = await $fetch<{ productIds: number[] }>("/api/account/wishlist", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      productIds.value = (result?.productIds || []).map(Number);
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  const isSaved = (productId: string | number) =>
    productIds.value.includes(Number(productId));

  async function toggle(productId: string | number) {
    const id = Number(productId);
    if (!Number.isInteger(id)) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      await navigateTo({ path: "/auth/signin", query: { redirect: useRoute().fullPath } });
      return false;
    }

    if (isSaved(id)) {
      await authFetch(`/api/account/wishlist/${id}`, { method: "DELETE" });
      productIds.value = productIds.value.filter((value) => value !== id);
      return false;
    }

    await authFetch("/api/account/wishlist", { method: "POST", body: { product_id: id } });
    if (!productIds.value.includes(id)) productIds.value = [id, ...productIds.value];
    return true;
  }

  return { productIds, loaded, loading, load, isSaved, toggle };
};
