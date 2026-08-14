<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- HEADER -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Edit Product</h1>

        <p class="text-gray-500 mt-1">
          Update product information, stock, images and description.
        </p>
      </div>

      <NuxtLink
        to="/admin/products"
        class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        ← Back to Products
      </NuxtLink>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="bg-white rounded-xl shadow p-8 text-center">
      <p class="text-gray-500">Loading product...</p>
    </div>

    <!-- ERROR -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- PRODUCT -->
    <form v-else @submit.prevent="saveProduct" class="space-y-8">
      <!-- BASIC INFORMATION -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">
          Product Information
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- NAME -->
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Product Name
            </label>

            <input
              v-model="product.name"
              type="text"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- SLUG -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Slug
            </label>

            <input
              v-model="product.slug"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- CATEGORY -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>

            <select
              v-model="product.category_id"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="null">Uncategorised</option>

              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- BLURB -->
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Short Description
            </label>

            <textarea
              v-model="product.blurb"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- PRICING / STOCK -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">
          Pricing & Stock
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- PRICE -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Price
            </label>

            <input
              v-model.number="product.price"
              type="number"
              step="0.01"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>

          <!-- OLD PRICE -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Old Price
            </label>

            <input
              v-model.number="product.oldPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>

          <!-- STOCK -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Stock
            </label>

            <input
              v-model.number="product.stock"
              type="number"
              min="0"
              step="1"
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>
        </div>
      </section>

      <!-- IMAGES -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">
          Product Images
        </h2>

        <!-- EXISTING IMAGES -->
        <div
          v-if="images.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6"
        >
          <div
            v-for="(image, index) in images"
            :key="`${image}-${index}`"
            class="relative border border-gray-200 rounded-lg bg-gray-50 p-2"
          >
            <img
              :src="image"
              :alt="`${product.name} image ${index + 1}`"
              class="w-full h-40 object-contain rounded"
              @error="handleImageError(image)"
            />

            <button
              type="button"
              @click="removeImage(index)"
              class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center"
              title="Remove image"
            >
              ×
            </button>

            <p class="text-xs text-gray-500 mt-2 break-all">
              {{ image }}
            </p>
          </div>
        </div>

        <!-- NO IMAGES -->
        <div
          v-else
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6"
        >
          <p class="text-gray-400">No product images.</p>
        </div>

        <!-- ADD IMAGE -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Add Image URL
          </label>

          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="newImage"
              type="text"
              placeholder="/images/products/example.png"
              class="flex-1 border border-gray-300 rounded-lg px-4 py-3"
            />

            <button
              type="button"
              @click="addImage"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Image
            </button>
          </div>

          <p class="text-xs text-gray-500 mt-2">
            Example: /images/products/Intel_Ultra5.png
          </p>
        </div>
      </section>

      <!-- DESCRIPTION -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">
          Product Description
        </h2>

        <p class="text-sm text-gray-500 mb-4">
          The product description is stored as a JSON array.
        </p>

        <textarea
          v-model="descriptionJson"
          rows="20"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>

        <p v-if="descriptionError" class="text-red-600 text-sm mt-2">
          {{ descriptionError }}
        </p>
      </section>

      <!-- OPTIONS -->
      <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">
          Product Options
        </h2>

        <div class="flex flex-col gap-4">
          <label class="flex items-center gap-3">
            <input v-model="product.featured" type="checkbox" class="w-5 h-5" />

            <span class="text-gray-700"> Featured Product </span>
          </label>

          <label class="flex items-center gap-3">
            <input
              v-model="product.refurbished"
              type="checkbox"
              class="w-5 h-5"
            />

            <span class="text-gray-700"> Refurbished Product </span>
          </label>

          <label class="flex items-center gap-3">
            <input v-model="product.active" type="checkbox" class="w-5 h-5" />

            <span class="text-gray-700"> Active </span>
          </label>
        </div>
      </section>

      <!-- SAVE -->
      <div class="flex flex-col sm:flex-row justify-end gap-3">
        <NuxtLink
          to="/admin/products"
          class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 text-center hover:bg-gray-50"
        >
          Cancel
        </NuxtLink>

        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? "Saving..." : "Save Product" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const route = useRoute();

const adminFetch = useAdminFetch();

const loading = ref(true);
const saving = ref(false);

const errorMessage = ref("");
const descriptionError = ref("");

const newImage = ref("");

const images = ref<string[]>([]);

const categories = ref<any[]>([]);

const descriptionJson = ref("[]");

const product = ref<any>({
  id: null,
  name: "",
  slug: "",
  blurb: "",
  price: 0,
  oldPrice: null,
  stock: 0,
  category_id: null,
  images: [],
  description: [],
  featured: false,
  refurbished: false,
  active: true,
});

/*
 * ----------------------------------------
 * LOAD PRODUCT
 * ----------------------------------------
 */

const loadProduct = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await adminFetch<any>(
      `/api/admin/products/${route.params.id}`,
    );

    console.log("🔥 EDIT PRODUCT:", data);

    console.log("🔥 PRODUCT IMAGES:", data.images);

    /*
     * Store product
     */

    product.value = {
      ...product.value,
      ...data,
    };

    /*
     * IMPORTANT
     *
     * images is a JSON array
     */

    images.value = Array.isArray(data.images) ? [...data.images] : [];

    /*
     * Description JSON
     */

    descriptionJson.value = JSON.stringify(
      Array.isArray(data.description) ? data.description : [],
      null,
      2,
    );
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load product.";
  } finally {
    loading.value = false;
  }
};

/*
 * ----------------------------------------
 * LOAD CATEGORIES
 * ----------------------------------------
 */

const loadCategories = async () => {
  try {
    const data = await adminFetch<any[]>("/api/admin/categories");

    categories.value = data || [];
  } catch (error: any) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);
  }
};

/*
 * ----------------------------------------
 * ADD IMAGE
 * ----------------------------------------
 */

const addImage = () => {
  const image = newImage.value.trim();

  if (!image) {
    return;
  }

  /*
   * Don't add duplicates
   */

  if (!images.value.includes(image)) {
    images.value.push(image);
  }

  newImage.value = "";
};

/*
 * ----------------------------------------
 * REMOVE IMAGE
 * ----------------------------------------
 */

const removeImage = (index: number) => {
  images.value.splice(index, 1);
};

/*
 * ----------------------------------------
 * IMAGE ERROR
 * ----------------------------------------
 */

const handleImageError = (image: string) => {
  console.warn("⚠️ IMAGE FAILED TO LOAD:", image);
};

/*
 * ----------------------------------------
 * SAVE PRODUCT
 * ----------------------------------------
 */

const saveProduct = async () => {
  saving.value = true;

  errorMessage.value = "";
  descriptionError.value = "";

  /*
   * Validate description JSON
   */

  let description: any[];

  try {
    description = JSON.parse(descriptionJson.value);

    if (!Array.isArray(description)) {
      throw new Error("Description must be a JSON array.");
    }
  } catch (error: any) {
    descriptionError.value = error?.message || "Invalid description JSON.";

    saving.value = false;

    return;
  }

  try {
    const body = {
      name: product.value.name?.trim() || "",

      slug: product.value.slug?.trim() || "",

      blurb: product.value.blurb?.trim() || "",

      price: Number(product.value.price) || 0,

      oldPrice:
        product.value.oldPrice === null || product.value.oldPrice === ""
          ? null
          : Number(product.value.oldPrice),

      stock: Math.max(0, Number(product.value.stock) || 0),

      category_id:
        product.value.category_id === null || product.value.category_id === ""
          ? null
          : Number(product.value.category_id),

      /*
       * IMPORTANT
       *
       * Send images, not image.
       */

      images: [...images.value],

      description,

      featured: Boolean(product.value.featured),

      refurbished:
        product.value.refurbished === null
          ? null
          : Boolean(product.value.refurbished),

      active: Boolean(product.value.active),
    };

    console.log("🔥 SAVING PRODUCT:", body);

    const updated = await adminFetch<any>(
      `/api/admin/products/${route.params.id}`,
      {
        method: "PUT",
        body,
      },
    );

    console.log("🔥 PRODUCT UPDATED:", updated);

    await navigateTo("/admin/products");
  } catch (error: any) {
    console.error("🔥 SAVE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to save product.";
  } finally {
    saving.value = false;
  }
};

/*
 * ----------------------------------------
 * START
 * ----------------------------------------
 */

await Promise.all([loadProduct(), loadCategories()]);
</script>
