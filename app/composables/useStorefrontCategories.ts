export const useStorefrontCategories = () => {
  const { data, pending, error, refresh } = useFetch("/api/storefront/categories", {
    key: "storefront-categories",
    default: () => [],
  });

  const visibleCategories = computed(() =>
    (data.value || []).filter((category: any) => category?.active !== false),
  );

  return { categories: data, visibleCategories, pending, error, refresh };
};
