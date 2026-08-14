<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- HEADER -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Edit Product</h1>

        <p class="text-gray-500 mt-1">
          Update product details, images, stock and description.
        </p>
      </div>

      <NuxtLink
        to="/admin/products"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
      >
        ← Back to Products
      </NuxtLink>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
      Loading product...
    </div>

    <!-- ERROR -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- FORM -->
    <form
      v-else
      @submit.prevent="updateProduct"
      class="bg-white rounded-lg shadow p-6 space-y-6"
    >
      <!-- NAME -->
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

      <!-- PRICE -->
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

      <!-- STOCK -->
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

      <!-- CATEGORY -->
      <div>
        <label class="block font-semibold text-gray-700 mb-2"> Category </label>

        <input
          v-model="product.category"
          type="number"
          min="1"
          placeholder="Category ID"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <p class="text-xs text-gray-500 mt-1">
          Category ID stored in the products table.
        </p>
      </div>

      <!-- IMAGES JSON -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block font-semibold text-gray-700">
            Product Images
          </label>

          <span class="text-xs text-gray-500"> JSON Array </span>
        </div>

        <textarea
          v-model="imageJson"
          rows="8"
          spellcheck="false"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='[
  "/images/products/product.png"
]'
        ></textarea>

        <p v-if="imageError" class="text-red-600 text-sm mt-2">
          {{ imageError }}
        </p>
      </div>

      <!-- IMAGE PREVIEW -->
      <div>
        <label class="block font-semibold text-gray-700 mb-3">
          Image Preview
        </label>

        <div
          v-if="imagePreview.length"
          class="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div
            v-for="(image, index) in imagePreview"
            :key="index"
            class="border rounded-lg bg-gray-50 p-3"
          >
            <img
              :src="image"
              :alt="`${product.name} image ${index + 1}`"
              class="w-full h-32 object-contain"
            />
          </div>
        </div>

        <div v-else class="border rounded-lg p-8 text-center text-gray-400">
          No images
        </div>
      </div>

      <!-- DESCRIPTION JSON -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block font-semibold text-gray-700">
            Product Description
          </label>

          <span class="text-xs text-gray-500"> JSON Array </span>
        </div>

        <textarea
          v-model="descriptionJson"
          rows="25"
          spellcheck="false"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>

        <p v-if="descriptionError" class="text-red-600 text-sm mt-2">
          {{ descriptionError }}
        </p>
      </div>

      <!-- BUTTONS -->
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
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? "Saving..." : "Save Product" }}
        </button>
      </div>

      <!-- SUCCESS -->
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
// ADMIN FETCH
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

const descriptionError = ref("");

const imageError = ref("");

// ----------------------------------------
// PRODUCT
// ----------------------------------------

const product = ref<any>({
  id: null,
  name: "",
  price: 0,
  stock: 0,
  category: null,
  image: [],
  description: [],
});

// ----------------------------------------
// JSON EDITORS
// ----------------------------------------

const imageJson = ref("[]");

const descriptionJson = ref("[]");

// ----------------------------------------
// IMAGE PREVIEW
// ----------------------------------------

const imagePreview = computed(() => {
  try {
    const images = JSON.parse(imageJson.value);

    if (!Array.isArray(images)) {
      return [];
    }

    return images.filter(
      (image: any) => typeof image === "string" && image.length > 0,
    );
  } catch {
    return [];
  }
});

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

    // IMAGE JSON

    imageJson.value = JSON.stringify(
      Array.isArray(data.image) ? data.image : [],
      null,
      2,
    );

    // DESCRIPTION JSON

    descriptionJson.value = JSON.stringify(
      Array.isArray(data.description) ? data.description : [],
      null,
      2,
    );
  } catch (error: any) {
    console.error("LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load product.";
  } finally {
    loading.value = false;
  }
};

// ----------------------------------------
// UPDATE PRODUCT
// ----------------------------------------

const updateProduct = async () => {
  saving.value = true;

  errorMessage.value = "";

  successMessage.value = "";

  imageError.value = "";

  descriptionError.value = "";

  // ----------------------------------------
  // PARSE IMAGES
  // ----------------------------------------

  let images;

  try {
    images = JSON.parse(imageJson.value);
  } catch {
    imageError.value = "Product images contain invalid JSON.";

    saving.value = false;

    return;
  }

  // ----------------------------------------
  // CHECK IMAGE ARRAY
  // ----------------------------------------

  if (!Array.isArray(images)) {
    imageError.value = "Product images must be a JSON array.";

    saving.value = false;

    return;
  }

  // ----------------------------------------
  // PARSE DESCRIPTION
  // ----------------------------------------

  let description;

  try {
    description = JSON.parse(descriptionJson.value);
  } catch {
    descriptionError.value = "Product description contains invalid JSON.";

    saving.value = false;

    return;
  }

  // ----------------------------------------
  // CHECK DESCRIPTION ARRAY
  // ----------------------------------------

  if (!Array.isArray(description)) {
    descriptionError.value = "Product description must be a JSON array.";

    saving.value = false;

    return;
  }

  // ----------------------------------------
  // UPDATE API
  // ----------------------------------------

  try {
    const result = await adminFetch<any>(`/api/admin/products/${productId}`, {
      method: "PUT",

      body: {
        name: product.value.name,

        price: Number(product.value.price),

        stock: Number(product.value.stock),

        category: product.value.category
          ? Number(product.value.category)
          : null,

        image: images,

        description: description,
      },
    });

    // ----------------------------------------
    // UPDATE LOCAL PRODUCT
    // ----------------------------------------

    product.value = {
      ...product.value,

      ...result.product,
    };

    // ----------------------------------------
    // REFORMAT IMAGE JSON
    // ----------------------------------------

    imageJson.value = JSON.stringify(result.product.image || [], null, 2);

    // ----------------------------------------
    // REFORMAT DESCRIPTION JSON
    // ----------------------------------------

    descriptionJson.value = JSON.stringify(
      result.product.description || [],
      null,
      2,
    );

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
// LOAD
// ----------------------------------------

await loadProduct();
</script>
