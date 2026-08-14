<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ===================================== -->
    <!-- HEADER -->
    <!-- ===================================== -->

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
        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        ← Back to Products
      </NuxtLink>
    </div>

    <!-- ===================================== -->
    <!-- LOADING -->
    <!-- ===================================== -->

    <div v-if="loading" class="bg-white border rounded-xl p-10 text-center">
      <p class="text-gray-500">Loading product...</p>
    </div>

    <!-- ===================================== -->
    <!-- ERROR -->
    <!-- ===================================== -->

    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-5 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- ===================================== -->
    <!-- FORM -->
    <!-- ===================================== -->

    <form v-else @submit.prevent="saveProduct" class="space-y-8">
      <!-- =================================== -->
      <!-- PRODUCT INFORMATION -->
      <!-- =================================== -->

      <section class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="text-xl font-bold mb-6">Product Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- NAME -->

          <div class="md:col-span-2">
            <label class="block font-semibold mb-2"> Product Name </label>

            <input
              v-model="product.name"
              type="text"
              required
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- SLUG -->

          <div>
            <label class="block font-semibold mb-2"> Slug </label>

            <input
              v-model="product.slug"
              type="text"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- CATEGORY -->

          <div>
            <label class="block font-semibold mb-2"> Category </label>

            <select
              v-model="product.category_id"
              class="w-full border rounded-lg px-4 py-3 bg-white"
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
            <label class="block font-semibold mb-2"> Short Description </label>

            <textarea
              v-model="product.blurb"
              rows="4"
              class="w-full border rounded-lg px-4 py-3"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- =================================== -->
      <!-- PRICE / STOCK -->
      <!-- =================================== -->

      <section class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="text-xl font-bold mb-6">Price & Stock</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- PRICE -->

          <div>
            <label class="block font-semibold mb-2"> Price </label>

            <input
              v-model.number="product.price"
              type="number"
              step="0.01"
              min="0"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- OLD PRICE -->

          <div>
            <label class="block font-semibold mb-2"> Old Price </label>

            <input
              v-model.number="product.oldPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- STOCK -->

          <div>
            <label class="block font-semibold mb-2"> Stock </label>

            <input
              v-model.number="product.stock"
              type="number"
              min="0"
              step="1"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>
        </div>
      </section>

      <!-- =================================== -->
      <!-- IMAGES -->
      <!-- =================================== -->

      <section class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="text-xl font-bold mb-6">Product Images</h2>

        <!-- DEBUG INFORMATION -->

        <div class="bg-gray-100 rounded-lg p-4 mb-6">
          <p class="font-bold">Images returned from database:</p>

          <pre class="text-xs mt-2 whitespace-pre-wrap break-all">{{
            JSON.stringify(product.images, null, 2)
          }}</pre>

          <p class="font-bold mt-4">Images currently being edited:</p>

          <pre class="text-xs mt-2 whitespace-pre-wrap break-all">{{
            JSON.stringify(images, null, 2)
          }}</pre>
        </div>

        <!-- IMAGE GRID -->

        <div
          v-if="images.length > 0"
          class="grid grid-cols-2 md:grid-cols-4 gap-5"
        >
          <div
            v-for="(image, index) in images"
            :key="index"
            class="border rounded-lg bg-gray-50 p-2 relative"
          >
            <img
              :src="image"
              :alt="product.name"
              class="w-full h-40 object-contain"
            />

            <button
              type="button"
              @click="removeImage(index)"
              class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8"
            >
              ×
            </button>

            <p class="text-xs text-gray-500 mt-2 break-all">
              {{ image }}
            </p>
          </div>
        </div>

        <!-- NO IMAGE -->

        <div
          v-else
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
        >
          <p class="text-gray-500">No images found.</p>
        </div>

        <!-- ADD IMAGE -->

        <div class="mt-6">
          <label class="block font-semibold mb-2"> Add Image URL </label>

          <div class="flex flex-col md:flex-row gap-3">
            <input
              v-model="newImage"
              type="text"
              placeholder="/images/products/example.png"
              class="flex-1 border rounded-lg px-4 py-3"
            />

            <button
              type="button"
              @click="addImage"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add Image
            </button>
          </div>
        </div>
      </section>

      <!-- =================================== -->
      <!-- DESCRIPTION -->
      <!-- =================================== -->

      <section class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4">Product Description</h2>

        <p class="text-sm text-gray-500 mb-4">
          Description is stored as a JSON array.
        </p>

        <textarea
          v-model="descriptionJson"
          rows="20"
          class="w-full border rounded-lg px-4 py-3 font-mono text-sm"
        ></textarea>

        <p v-if="descriptionError" class="text-red-600 mt-2">
          {{ descriptionError }}
        </p>
      </section>

      <!-- =================================== -->
      <!-- OPTIONS -->
      <!-- =================================== -->

      <section class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="text-xl font-bold mb-6">Options</h2>

        <div class="space-y-4">
          <label class="flex gap-3 items-center">
            <input v-model="product.featured" type="checkbox" class="w-5 h-5" />

            <span> Featured Product </span>
          </label>

          <label class="flex gap-3 items-center">
            <input
              v-model="product.refurbished"
              type="checkbox"
              class="w-5 h-5"
            />

            <span> Refurbished Product </span>
          </label>

          <label class="flex gap-3 items-center">
            <input v-model="product.active" type="checkbox" class="w-5 h-5" />

            <span> Active </span>
          </label>
        </div>
      </section>

      <!-- =================================== -->
      <!-- BUTTONS -->
      <!-- =================================== -->

      <div class="flex flex-col sm:flex-row justify-end gap-3">
        <NuxtLink
          to="/admin/products"
          class="px-6 py-3 border rounded-lg text-center hover:bg-gray-50"
        >
          Cancel
        </NuxtLink>

        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          {{ saving ? "Saving..." : "Save Product" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
/*
 * ========================================
 * PAGE
 * ========================================
 */

definePageMeta({
  layout: "default",
});

/*
 * ========================================
 * ROUTE
 * ========================================
 */

const route = useRoute();

/*
 * ========================================
 * STATE
 * ========================================
 */

const loading = ref(true);

const saving = ref(false);

const errorMessage = ref("");

const descriptionError = ref("");

const newImage = ref("");

/*
 * ========================================
 * PRODUCT
 * ========================================
 */

const product = ref<any>({
  id: null,
  name: "",
  slug: "",
  blurb: "",
  category_id: null,
  price: 0,
  oldPrice: null,
  stock: 0,

  /*
   * JSON ARRAY
   */
  images: [],

  /*
   * JSON ARRAY
   */
  description: [],

  featured: false,
  refurbished: null,
  active: true,
});

/*
 * ========================================
 * IMAGES
 * ========================================
 */

const images = ref<string[]>([]);

/*
 * ========================================
 * CATEGORIES
 * ========================================
 */

const categories = ref<any[]>([]);

/*
 * ========================================
 * DESCRIPTION
 * ========================================
 */

const descriptionJson = ref("[]");

/*
 * ========================================
 * LOAD PRODUCT
 * ========================================
 */

const loadProduct = async () => {
  loading.value = true;

  errorMessage.value = "";

  try {
    console.log("🔥🔥🔥 LOADING PRODUCT", route.params.id);

    const data: any = await $fetch(`/api/admin/products/${route.params.id}`, {
      credentials: "include",
    });

    console.log("🔥🔥🔥 FULL PRODUCT RESPONSE:", data);

    console.log("🔥 PRODUCT IMAGES:", data?.images);

    console.log("🔥 IMAGE TYPE:", typeof data?.images);

    console.log("🔥 IS ARRAY:", Array.isArray(data?.images));

    /*
     * Store product
     */

    product.value = {
      ...data,
    };

    /*
     * ------------------------------------
     * IMAGES
     * ------------------------------------
     *
     * This is the important part.
     */

    if (Array.isArray(data?.images)) {
      images.value = [...data.images];
    } else {
      images.value = [];
    }

    /*
     * Force product.images
     * to use the same array.
     */

    product.value.images = [...images.value];

    console.log("🔥🔥🔥 IMAGES REF:", images.value);

    /*
     * ------------------------------------
     * DESCRIPTION
     * ------------------------------------
     */

    if (Array.isArray(data?.description)) {
      descriptionJson.value = JSON.stringify(data.description, null, 2);
    } else {
      descriptionJson.value = "[]";
    }
  } catch (error: any) {
    console.error("🔥🔥🔥 LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.message ||
      "Unable to load product.";
  } finally {
    loading.value = false;
  }
};

/*
 * ========================================
 * LOAD CATEGORIES
 * ========================================
 */

const loadCategories = async () => {
  try {
    console.log("🔥 LOADING CATEGORIES");

    const data: any[] = await $fetch("/api/admin/categories", {
      credentials: "include",
    });

    console.log("🔥 CATEGORIES:", data);

    categories.value = Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error("🔥 CATEGORY ERROR:", error);
  }
};

/*
 * ========================================
 * ADD IMAGE
 * ========================================
 */

const addImage = () => {
  const image = newImage.value.trim();

  if (!image) {
    return;
  }

  if (!images.value.includes(image)) {
    images.value.push(image);
  }

  /*
   * Keep product.images
   * synchronised.
   */

  product.value.images = [...images.value];

  newImage.value = "";
};

/*
 * ========================================
 * REMOVE IMAGE
 * ========================================
 */

const removeImage = (index: number) => {
  images.value.splice(index, 1);

  /*
   * Keep product.images
   * synchronised.
   */

  product.value.images = [...images.value];
};

/*
 * ========================================
 * SAVE
 * ========================================
 */

const saveProduct = async () => {
  saving.value = true;

  errorMessage.value = "";

  descriptionError.value = "";

  /*
   * Parse description
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

  /*
   * Make sure images
   * is an array.
   */

  const productImages = Array.isArray(images.value) ? [...images.value] : [];

  /*
   * Request body
   */

  const body = {
    name: product.value.name?.trim() || "",

    slug: product.value.slug?.trim() || "",

    blurb: product.value.blurb?.trim() || "",

    category_id:
      product.value.category_id === null || product.value.category_id === ""
        ? null
        : Number(product.value.category_id),

    price: Number(product.value.price) || 0,

    oldPrice:
      product.value.oldPrice === null || product.value.oldPrice === ""
        ? null
        : Number(product.value.oldPrice),

    stock: Math.max(0, Number(product.value.stock) || 0),

    /*
     * JSON ARRAY
     */
    images: productImages,

    /*
     * JSON ARRAY
     */
    description,

    featured: Boolean(product.value.featured),

    refurbished:
      product.value.refurbished === null
        ? null
        : Boolean(product.value.refurbished),

    active: Boolean(product.value.active),
  };

  console.log("🔥🔥🔥 SAVING PRODUCT:", body);

  try {
    const result: any = await $fetch(`/api/admin/products/${route.params.id}`, {
      method: "PUT",

      credentials: "include",

      body,
    });

    console.log("🔥🔥🔥 SAVE RESULT:", result);

    await navigateTo("/admin/products");
  } catch (error: any) {
    console.error("🔥🔥🔥 SAVE ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.message ||
      "Unable to save product.";
  } finally {
    saving.value = false;
  }
};

/*
 * ========================================
 * LOAD
 * ========================================
 */

await Promise.all([loadProduct(), loadCategories()]);
</script>
