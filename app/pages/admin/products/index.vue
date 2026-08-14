<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const { adminFetch } = useAdminFetch();

const products = ref<any[]>([]);
const categories = ref<any[]>([]);

const loading = ref(false);
const errorMessage = ref("");

console.log("🔥 ADMIN PRODUCTS PAGE LOADING");

const loadProducts = async () => {
  console.log("🔥 LOAD PRODUCTS STARTED");

  try {
    const data = await adminFetch("/api/admin/products");

    console.log("🔥 ADMIN PRODUCTS RESPONSE:", data);

    products.value = data;

    console.log("🔥 PRODUCTS STORED:", products.value);
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCTS ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to load products";
  }
};

const loadCategories = async () => {
  console.log("🔥 LOADING CATEGORIES");

  try {
    const data = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:", data);

    categories.value = data;
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);
  }
};

const getCategoryName = (categoryId: number | null) => {
  if (!categoryId) {
    return "Uncategorised";
  }

  const category = categories.value.find(
    (category) => Number(category.id) === Number(categoryId),
  );

  return category?.name || "Uncategorised";
};

const load = async () => {
  loading.value = true;

  try {
    await Promise.all([loadProducts(), loadCategories()]);
  } finally {
    loading.value = false;
  }
};

await load();
</script>
