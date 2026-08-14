<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Edit Product</h1>

        <p class="text-gray-500 mt-1">Update product details and stock.</p>
      </div>

      <NuxtLink
        to="/admin/products"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
      >
        ← Back to Products
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
      Loading product...
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- Product Form -->
    <form
      v-else
      @submit.prevent="updateProduct"
      class="bg-white rounded-lg shadow p-6 space-y-6"
    >
      <!-- Product Name -->
      <div>
        <label class="block font-semibold text-gray-700 mb-2">
          Product Name
        </label>

        <input
          v-model="product.name"
          type="text"
          required
          class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Price -->
      <div>
        <label class="block font-semibold text-gray-700 mb-2"> Price </label>

        <div class="relative">
          <span class="absolute left-4 top-3 text-gray-500"> $ </span>

          <input
            v-model.number="product.price"
            type="number"
            min="0"
            step="0.01"
            required
            class="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Stock -->
      <div>
        <label class="block font-semibold text-gray-700 mb-2"> Stock </label>

        <input
          v-model.number="product.stock"
          type="number"
          min="0"
          step="1"
          required
          class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <p v-if="product.stock <= 0" class="text-red-600 text-sm mt-2">
          This product is currently out of stock.
        </p>
      </div>

      <!-- Image -->
      <div>
        <label class="block font-semibold text-gray-700 mb-2">
          Product Image
        </label>

        <input
          v-model="product.image"
          type="text"
          placeholder="/images/products/product.png"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Image Preview -->
      <div v-if="product.image">
        <label class="block font-semibold text-gray-700 mb-2">
          Image Preview
        </label>

        <div
          class="w-48 h-48 border rounded-lg flex items-center justify-center bg-gray-50 p-4"
        >
          <img
            :src="product.image"
            :alt="product.name"
            class="max-w-full max-h-full object-contain"
          />
        </div>
      </div>

      <!-- Category -->
      <div>
        <label class="block font-semibold text-gray-700 mb-2"> Category </label>

        <select
          v-model="product.category"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Category</option>

          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>

      <!-- Description -->
      <div>
        <label class="block font-semibold text-gray-700 mb-2">
          Description
        </label>

        <textarea
          v-model="product.description"
          rows="8"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <!-- Buttons -->
      <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
        <NuxtLink
          to="/admin/products"
          class="px-6 py-3 text-center bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200"
        >
          Cancel
        </NuxtLink>

        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? "Saving..." : "Save Product" }}
        </button>
      </div>

      <!-- Success -->
      <div
        v-if="successMessage"
        class="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4"
      >
        {{ successMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// ----------------------------------------
// ADMIN AUTH
// ----------------------------------------

definePageMeta({
  middleware: "admin",
});

// ----------------------------------------
// ADMIN API
// ----------------------------------------

const { adminFetch } = useAdminFetch();

// ----------------------------------------
// ROUTE
// ----------------------------------------

const route = useRoute();

const productId = route.params.id;

// ----------------------------------------
// STATE
// ----------------------------------------

const loading = ref(true);

const saving = ref(false);

const errorMessage = ref("");

const successMessage = ref("");

// ----------------------------------------
// PRODUCT
// ----------------------------------------

const product = ref<any>({
  id: null,
  name: "",
  price: 0,
  stock: 0,
  image: "",
  category: "",
  description: "",
});

// ----------------------------------------
// CATEGORIES
// ----------------------------------------

const categories = ref<any[]>([]);

// ----------------------------------------
// LOAD PRODUCT
// ----------------------------------------

const loadProduct = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    const data = await adminFetch<any>(`/api/admin/products/${productId}`);

    product.value = {
      ...product.value,
      ...data,
    };
  } catch (error: any) {
    console.error("LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load product.";
  } finally {
    loading.value = false;
  }
};

// ----------------------------------------
// LOAD CATEGORIES
// ----------------------------------------

const loadCategories = async () => {
  try {
    const data = await adminFetch<any[]>("/api/admin/categories");

    categories.value = data || [];
  } catch (error) {
    console.error("LOAD CATEGORIES ERROR:", error);
  }
};

// ----------------------------------------
// UPDATE PRODUCT
// ----------------------------------------

const updateProduct = async () => {
  saving.value = true;

  errorMessage.value = "";

  successMessage.value = "";

  try {
    const updated = await adminFetch<any>(`/api/admin/products/${productId}`, {
      method: "PUT",

      body: {
        name: product.value.name,

        price: Number(product.value.price),

        stock: Number(product.value.stock),

        image: product.value.image,

        category: product.value.category,

        description: product.value.description,
      },
    });

    product.value = {
      ...product.value,
      ...updated.product,
    };

    successMessage.value = "Product updated successfully.";
  } catch (error: any) {
    console.error("UPDATE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to update product.";
  } finally {
    saving.value = false;
  }
};

// ----------------------------------------
// LOAD DATA
// ----------------------------------------

await Promise.all([loadProduct(), loadCategories()]);
</script>
