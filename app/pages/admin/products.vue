<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const products = ref<any[]>([]);
const search = ref("");
const loading = ref(true);
const saving = ref<number | null>(null);

const loadProducts = async () => {
  loading.value = true;

  try {
    products.value = await $fetch("/api/admin/products");
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const filteredProducts = computed(() => {
  const searchTerm = search.value.toLowerCase();

  return products.value.filter((product) =>
    product.name.toLowerCase().includes(searchTerm),
  );
});

const saveStock = async (product: any) => {
  saving.value = product.id;

  try {
    const result = await $fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",

      body: {
        stock: Number(product.stock),
      },
    });

    product.stock = result.stock;
  } catch (error) {
    console.error(error);

    alert("Unable to update stock");
  } finally {
    saving.value = null;
  }
};

onMounted(loadProducts);
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white border-b">
      <div
        class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between"
      >
        <div>
          <h1 class="text-2xl font-bold">Products</h1>

          <p class="text-sm text-gray-500">Manage products and inventory</p>
        </div>

        <NuxtLink
          to="/admin"
          class="px-4 py-2 bg-gray-800 text-white rounded-lg"
        >
          Dashboard
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Search -->

      <div class="bg-white p-4 rounded-xl shadow-sm mb-6">
        <input
          v-model="search"
          type="text"
          placeholder="Search products..."
          class="w-full md:w-96 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <!-- Product table -->

      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left p-4">Product</th>

                <th class="text-left p-4">Category</th>

                <th class="text-right p-4">Price</th>

                <th class="text-center p-4">Stock</th>

                <th class="text-right p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="product in filteredProducts"
                :key="product.id"
                class="border-b hover:bg-gray-50"
              >
                <td class="p-4">
                  <p class="font-semibold">
                    {{ product.name }}
                  </p>

                  <p class="text-xs text-gray-400">ID: {{ product.id }}</p>
                </td>

                <td class="p-4 text-gray-600">
                  {{ product.categories?.name || "Uncategorised" }}
                </td>

                <td class="p-4 text-right">
                  ${{ Number(product.price).toFixed(2) }}
                </td>

                <td class="p-4">
                  <div class="flex justify-center">
                    <input
                      v-model.number="product.stock"
                      type="number"
                      min="0"
                      class="w-24 border rounded-lg px-3 py-2 text-center font-semibold"
                    />
                  </div>

                  <div class="text-center mt-1">
                    <span
                      v-if="product.stock > 5"
                      class="text-green-600 text-xs"
                    >
                      In Stock
                    </span>

                    <span
                      v-else-if="product.stock > 0"
                      class="text-orange-600 text-xs font-semibold"
                    >
                      Low Stock
                    </span>

                    <span v-else class="text-red-600 text-xs font-semibold">
                      Out of Stock
                    </span>
                  </div>
                </td>

                <td class="p-4 text-right">
                  <button
                    @click="saveStock(product)"
                    :disabled="saving === product.id"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {{ saving === product.id ? "Saving..." : "Save" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>
