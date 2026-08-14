<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- HEADER -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Edit Product</h1>

        <p class="text-gray-500 mt-1">Update product information</p>
      </div>

      <NuxtLink
        to="/admin/products"
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
      >
        Back
      </NuxtLink>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
      Loading product...
    </div>

    <!-- ERROR -->
    <div
      v-if="errorMessage"
      class="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- FORM -->
    <form v-if="!loading" @submit.prevent="saveProduct" class="space-y-8">
      <!-- BASIC INFORMATION -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-6">Product Information</h2>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- NAME -->
          <div>
            <label class="block font-semibold mb-2"> Product Name </label>

            <input
              v-model="product.name"
              type="text"
              class="w-full border rounded-lg px-4 py-3"
              required
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

          <!-- PRICE -->
          <div>
            <label class="block font-semibold mb-2"> Price </label>

            <input
              v-model.number="product.price"
              type="number"
              step="0.01"
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
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- CATEGORY -->
          <div>
            <label class="block font-semibold mb-2"> Category </label>

            <select
              v-model="product.category_id"
              class="w-full border rounded-lg px-4 py-3"
            >
              <option :value="null">Select Category</option>

              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- BLURB -->
        <div class="mt-6">
          <label class="block font-semibold mb-2"> Short Description </label>

          <textarea
            v-model="product.blurb"
            rows="4"
            class="w-full border rounded-lg px-4 py-3"
          ></textarea>
        </div>
      </div>

      <!-- IMAGES -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">Product Images</h2>

          <button
            type="button"
            @click="addImage"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Image
          </button>
        </div>

        <div
          v-if="product.images.length === 0"
          class="text-gray-500 border border-dashed rounded-lg p-6 text-center"
        >
          No images configured.
        </div>

        <!-- IMAGE ARRAY -->
        <div
          v-for="(image, index) in product.images"
          :key="index"
          class="flex gap-4 mb-4"
        >
          <div class="flex-1">
            <input
              v-model="product.images[index]"
              type="text"
              placeholder="/images/products/product.png"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- PREVIEW -->
          <div
            class="w-24 h-20 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50"
          >
            <img
              v-if="image"
              :src="image"
              class="max-w-full max-h-full object-contain"
              @error="imageError(index)"
            />

            <span v-else class="text-xs text-gray-400"> No Image </span>
          </div>

          <!-- REMOVE -->
          <button
            type="button"
            @click="removeImage(index)"
            class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Remove
          </button>
        </div>

        <!-- DEBUG -->
        <div class="mt-6 bg-gray-100 rounded-lg p-4">
          <p class="font-semibold mb-2">Images JSON</p>

          <pre class="text-sm overflow-auto">{{ product.images }}</pre>
        </div>
      </div>

      <!-- DESCRIPTION JSON -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">Description JSON</h2>

        <textarea
          v-model="descriptionJson"
          rows="20"
          class="w-full border rounded-lg px-4 py-3 font-mono text-sm"
        ></textarea>
      </div>

      <!-- OPTIONS -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-6">Options</h2>

        <div class="flex flex-wrap gap-8">
          <label class="flex items-center gap-2">
            <input v-model="product.featured" type="checkbox" />

            Featured
          </label>

          <label class="flex items-center gap-2">
            <input v-model="product.refurbished" type="checkbox" />

            Refurbished
          </label>

          <label class="flex items-center gap-2">
            <input v-model="product.active" type="checkbox" />

            Active
          </label>
        </div>
      </div>

      <!-- SAVE -->
      <div class="flex justify-end gap-4">
        <NuxtLink
          to="/admin/products"
          class="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </NuxtLink>

        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50"
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

const productId = route.params.id;

const loading = ref(true);
const saving = ref(false);

const errorMessage = ref("");

const categories = ref<any[]>([]);

/*
|--------------------------------------------------------------------------
| PRODUCT
|--------------------------------------------------------------------------
*/

const product = reactive<any>({
  id: null,

  name: "",
  slug: "",

  category_id: null,

  blurb: "",

  price: 0,
  oldPrice: null,

  stock: 0,

  images: [],

  description: [],

  featured: false,
  refurbished: false,

  active: true,
});

/*
|--------------------------------------------------------------------------
| DESCRIPTION JSON
|--------------------------------------------------------------------------
*/

const descriptionJson = ref("[]");

/*
|--------------------------------------------------------------------------
| LOAD PRODUCT
|--------------------------------------------------------------------------
*/

const loadProduct = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    console.log("🔥 LOADING PRODUCT:", productId);

    const data = await useAdminFetch<any>(`/api/admin/products/${productId}`);

    console.log("🔥 PRODUCT RESPONSE:", data);

    Object.assign(product, data);

    /*
     * Make absolutely sure images is an array.
     */

    if (Array.isArray(data.images)) {
      product.images = [...data.images];
    } else if (typeof data.images === "string") {
      try {
        const parsed = JSON.parse(data.images);

        product.images = Array.isArray(parsed) ? parsed : [];
      } catch {
        product.images = [];
      }
    } else {
      product.images = [];
    }

    /*
     * Description
     */

    if (Array.isArray(data.description)) {
      product.description = data.description;
    } else if (typeof data.description === "string") {
      try {
        const parsed = JSON.parse(data.description);

        product.description = Array.isArray(parsed) ? parsed : [];
      } catch {
        product.description = [];
      }
    } else {
      product.description = [];
    }

    descriptionJson.value = JSON.stringify(product.description, null, 2);

    console.log("🔥 PRODUCT IMAGES:", product.images);

    console.log("🔥 DESCRIPTION:", product.description);
  } catch (error: any) {
    console.error("❌ LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load product.";
  } finally {
    loading.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| LOAD CATEGORIES
|--------------------------------------------------------------------------
*/

const loadCategories = async () => {
  try {
    const data = await useAdminFetch<any[]>("/api/admin/categories");

    categories.value = data || [];
  } catch (error) {
    console.error("CATEGORY LOAD ERROR:", error);
  }
};

/*
|--------------------------------------------------------------------------
| IMAGE FUNCTIONS
|--------------------------------------------------------------------------
*/

const addImage = () => {
  product.images.push("");
};

const removeImage = (index: number) => {
  product.images.splice(index, 1);
};

const imageError = (index: number) => {
  console.warn("Image failed to load:", product.images[index]);
};

/*
|--------------------------------------------------------------------------
| SAVE PRODUCT
|--------------------------------------------------------------------------
*/

const saveProduct = async () => {
  saving.value = true;
  errorMessage.value = "";

  try {
    /*
     * Convert description JSON back into an array.
     */

    try {
      const parsed = JSON.parse(descriptionJson.value);

      if (!Array.isArray(parsed)) {
        throw new Error("Description must be a JSON array.");
      }

      product.description = parsed;
    } catch (error) {
      errorMessage.value = "Description contains invalid JSON.";

      saving.value = false;

      return;
    }

    /*
     * Clean image array.
     */

    product.images = product.images
      .filter((image: any) => typeof image === "string" && image.trim() !== "")
      .map((image: string) => image.trim());

    console.log("🔥 SAVING IMAGES:", product.images);

    /*
     * Save
     */

    const updated = await useAdminFetch<any>(
      `/api/admin/products/${productId}`,
      {
        method: "PUT",

        body: {
          name: product.name,
          slug: product.slug,

          category_id: product.category_id,

          blurb: product.blurb,

          price: product.price,
          oldPrice: product.oldPrice,

          stock: product.stock,

          images: product.images,

          description: product.description,

          featured: product.featured,
          refurbished: product.refurbished,

          active: product.active,
        },
      },
    );

    console.log("✅ PRODUCT UPDATED:", updated);

    await navigateTo("/admin/products");
  } catch (error: any) {
    console.error("❌ SAVE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to save product.";
  } finally {
    saving.value = false;
  }
};

/*
|--------------------------------------------------------------------------
| INITIAL LOAD
|--------------------------------------------------------------------------
*/

await Promise.all([loadProduct(), loadCategories()]);
</script>
