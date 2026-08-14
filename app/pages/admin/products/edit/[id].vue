<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Edit Product</h1>

        <p class="text-gray-500 mt-1">
          Update product details, images, stock and description.
        </p>
      </div>

      <NuxtLink
        to="/admin/products"
        class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
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
      v-if="errorMessage"
      class="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4"
    >
      {{ errorMessage }}
    </div>

    <!-- Product Form -->
    <form
      v-if="!loading && product"
      @submit.prevent="saveProduct"
      class="space-y-8"
    >
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-6">
          Product Information
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
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

          <!-- Slug -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Slug
            </label>

            <input
              v-model="product.slug"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>

            <select
              v-model="product.category_id"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white"
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

          <!-- Price -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Price
            </label>

            <input
              v-model.number="product.price"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>

          <!-- Old Price -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Old Price
            </label>

            <input
              v-model.number="product.oldPrice"
              type="number"
              min="0"
              step="0.01"
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>

          <!-- Stock -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Stock
            </label>

            <input
              v-model.number="product.stock"
              type="number"
              min="0"
              step="1"
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>

          <!-- Blurb -->
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Short Description
            </label>

            <textarea
              v-model="product.blurb"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Images -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-6">Product Images</h2>

        <!-- Existing Images -->
        <div
          v-if="images.length > 0"
          class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div
            v-for="(image, index) in images"
            :key="`${image}-${index}`"
            class="relative border rounded-lg p-2 bg-gray-50"
          >
            <img
              :src="image"
              :alt="`${product.name} image ${index + 1}`"
              class="w-full h-40 object-contain rounded"
              @error="handleImageError"
            />

            <button
              type="button"
              @click="removeImage(index)"
              class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700"
            >
              ×
            </button>

            <p class="text-xs text-gray-500 mt-2 break-all">
              {{ image }}
            </p>
          </div>
        </div>

        <!-- No Images -->
        <div
          v-else
          class="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 mb-6"
        >
          No product images.
        </div>

        <!-- Add Image -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Add Image Path
          </label>

          <div class="flex flex-col md:flex-row gap-3">
            <input
              v-model="newImage"
              type="text"
              placeholder="/images/products/example.png"
              class="flex-1 border border-gray-300 rounded-lg px-4 py-3"
              @keyup.enter.prevent="addImage"
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
      </div>

      <!-- Options -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-6">Product Options</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Active -->
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="product.active" type="checkbox" class="w-5 h-5" />

            <span class="font-medium"> Active </span>
          </label>

          <!-- Featured -->
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="product.featured" type="checkbox" class="w-5 h-5" />

            <span class="font-medium"> Featured </span>
          </label>

          <!-- Refurbished -->
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="product.refurbished"
              type="checkbox"
              class="w-5 h-5"
            />

            <span class="font-medium"> Refurbished </span>
          </label>
        </div>
      </div>

      <!-- Description -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-800">
              Product Description
            </h2>

            <p class="text-sm text-gray-500 mt-1">Stored as a JSON array.</p>
          </div>

          <button
            type="button"
            @click="addDescriptionBlock"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Block
          </button>
        </div>

        <div
          v-if="description.length === 0"
          class="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400"
        >
          No description blocks.
        </div>

        <div
          v-for="(block, index) in description"
          :key="index"
          class="border border-gray-200 rounded-lg p-5 mb-4"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="font-semibold text-gray-700">Block {{ index + 1 }}</div>

            <button
              type="button"
              @click="removeDescriptionBlock(index)"
              class="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>

          <!-- Type -->
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Type
            </label>

            <select
              v-model="block.type"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white"
            >
              <option value="heading">Heading</option>

              <option value="paragraph">Paragraph</option>

              <option value="quote">Quote</option>

              <option value="warning">Warning</option>

              <option value="list">List</option>

              <option value="table">Table</option>
            </select>
          </div>

          <!-- Heading / Paragraph / Quote / Warning -->
          <div
            v-if="
              ['heading', 'paragraph', 'quote', 'warning'].includes(block.type)
            "
          >
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Text
            </label>

            <textarea
              v-model="block.text"
              rows="4"
              class="w-full border border-gray-300 rounded-lg px-4 py-3"
            ></textarea>
          </div>

          <!-- List -->
          <div v-if="block.type === 'list'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              List Style
            </label>

            <select
              v-model="block.style"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
            >
              <option value="check">Check</option>

              <option value="bullet">Bullet</option>

              <option value="number">Number</option>
            </select>

            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Items
            </label>

            <div
              v-for="(_, itemIndex) in block.items"
              :key="itemIndex"
              class="flex gap-2 mb-2"
            >
              <input
                v-model="block.items[itemIndex]"
                type="text"
                class="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                placeholder="List item"
              />

              <button
                type="button"
                @click="block.items.splice(itemIndex, 1)"
                class="px-3 text-red-600"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              @click="block.items.push('')"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Item
            </button>
          </div>

          <!-- Table -->
          <div v-if="block.type === 'table'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Headers
            </label>

            <div class="grid grid-cols-2 gap-3 mb-4">
              <input
                v-for="(_, headerIndex) in block.headers"
                :key="headerIndex"
                v-model="block.headers[headerIndex]"
                type="text"
                class="border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Header"
              />
            </div>

            <button
              type="button"
              @click="block.headers.push('')"
              class="text-blue-600 text-sm mb-5"
            >
              + Add Header
            </button>

            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Rows
            </label>

            <div
              v-for="(_, rowIndex) in block.rows"
              :key="rowIndex"
              class="mb-3"
            >
              <div class="flex gap-2">
                <input
                  v-for="(_, columnIndex) in block.rows[rowIndex]"
                  :key="columnIndex"
                  v-model="block.rows[rowIndex][columnIndex]"
                  type="text"
                  class="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Value"
                />

                <button
                  type="button"
                  @click="block.rows.splice(rowIndex, 1)"
                  class="px-3 text-red-600"
                >
                  ×
                </button>
              </div>
            </div>

            <button
              type="button"
              @click="addTableRow(block)"
              class="text-blue-600 text-sm"
            >
              + Add Row
            </button>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex flex-col md:flex-row justify-end gap-3">
        <NuxtLink
          to="/admin/products"
          class="px-6 py-3 rounded-lg border border-gray-300 text-center hover:bg-gray-50"
        >
          Cancel
        </NuxtLink>

        <button
          type="submit"
          :disabled="saving"
          class="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? "Saving..." : "Save Product" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const route = useRoute();

const adminFetch = useAdminFetch();

const loading = ref(true);
const saving = ref(false);

const errorMessage = ref("");

const product = ref<any>(null);

const categories = ref<any[]>([]);

const images = ref<string[]>([]);

const newImage = ref("");

const description = ref<any[]>([]);

/* ----------------------------------------
   LOAD PRODUCT
---------------------------------------- */

const loadProduct = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await adminFetch<any>(
      `/api/admin/products/${route.params.id}`,
    );

    console.log("🔥 EDIT PRODUCT:", data);

    console.log("🔥 PRODUCT IMAGES:", data?.images);

    console.log("🔥 PRODUCT DESCRIPTION:", data?.description);

    product.value = {
      ...data,

      category_id:
        data.category_id !== null && data.category_id !== undefined
          ? Number(data.category_id)
          : null,
    };

    /*
     * IMPORTANT:
     * Database column is `images`
     */
    images.value = Array.isArray(data.images) ? [...data.images] : [];

    /*
     * IMPORTANT:
     * Description is also a JSON array
     */
    description.value = Array.isArray(data.description)
      ? JSON.parse(JSON.stringify(data.description))
      : [];
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to load product.";
  } finally {
    loading.value = false;
  }
};

/* ----------------------------------------
   LOAD CATEGORIES
---------------------------------------- */

const loadCategories = async () => {
  try {
    const data = await adminFetch<any[]>("/api/admin/categories");

    categories.value = data || [];
  } catch (error) {
    console.error("🔥 LOAD CATEGORIES ERROR:", error);
  }
};

/* ----------------------------------------
   ADD IMAGE
---------------------------------------- */

const addImage = () => {
  const image = newImage.value.trim();

  if (!image) {
    return;
  }

  if (!images.value.includes(image)) {
    images.value.push(image);
  }

  newImage.value = "";
};

/* ----------------------------------------
   REMOVE IMAGE
---------------------------------------- */

const removeImage = (index: number) => {
  images.value.splice(index, 1);
};

/* ----------------------------------------
   IMAGE ERROR
---------------------------------------- */

const handleImageError = (event: Event) => {
  console.error(
    "🔥 IMAGE FAILED TO LOAD:",
    (event.target as HTMLImageElement)?.src,
  );
};

/* ----------------------------------------
   ADD DESCRIPTION BLOCK
---------------------------------------- */

const addDescriptionBlock = () => {
  description.value.push({
    type: "paragraph",
    text: "",
  });
};

/* ----------------------------------------
   REMOVE DESCRIPTION BLOCK
---------------------------------------- */

const removeDescriptionBlock = (index: number) => {
  description.value.splice(index, 1);
};

/* ----------------------------------------
   ADD TABLE ROW
---------------------------------------- */

const addTableRow = (block: any) => {
  const columnCount = Array.isArray(block.headers) ? block.headers.length : 2;

  block.rows.push(Array(columnCount).fill(""));
};

/* ----------------------------------------
   NORMALISE DESCRIPTION
---------------------------------------- */

const normaliseDescription = () => {
  return description.value.map((block: any) => {
    if (block.type === "list") {
      return {
        type: "list",

        style: block.style || "check",

        items: Array.isArray(block.items) ? block.items : [],
      };
    }

    if (block.type === "table") {
      return {
        type: "table",

        headers: Array.isArray(block.headers) ? block.headers : [],

        rows: Array.isArray(block.rows) ? block.rows : [],
      };
    }

    return {
      type: block.type || "paragraph",

      text: block.text || "",
    };
  });
};

/* ----------------------------------------
   SAVE PRODUCT
---------------------------------------- */

const saveProduct = async () => {
  saving.value = true;
  errorMessage.value = "";

  try {
    const body = {
      name: product.value.name?.trim() || "",

      slug: product.value.slug?.trim() || "",

      blurb: product.value.blurb || "",

      price: Number(product.value.price) || 0,

      oldPrice:
        product.value.oldPrice !== null &&
        product.value.oldPrice !== undefined &&
        product.value.oldPrice !== ""
          ? Number(product.value.oldPrice)
          : null,

      stock: Math.max(0, Math.floor(Number(product.value.stock) || 0)),

      category_id:
        product.value.category_id !== null &&
        product.value.category_id !== undefined &&
        product.value.category_id !== ""
          ? Number(product.value.category_id)
          : null,

      /*
       * IMPORTANT:
       * Send `images`, not `image`
       */
      images: [...images.value],

      /*
       * JSON description array
       */
      description: normaliseDescription(),

      active: Boolean(product.value.active),

      featured: Boolean(product.value.featured),

      refurbished: Boolean(product.value.refurbished),
    };

    console.log("🔥 SAVING PRODUCT:", body);

    const result = await adminFetch(`/api/admin/products/${route.params.id}`, {
      method: "PUT",

      body,
    });

    console.log("🔥 PRODUCT UPDATED:", result);

    await navigateTo("/admin/products");
  } catch (error: any) {
    console.error("🔥 SAVE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.message || error?.message || "Unable to save product.";
  } finally {
    saving.value = false;
  }
};

/* ----------------------------------------
   START
---------------------------------------- */

await Promise.all([loadProduct(), loadCategories()]);
</script>
