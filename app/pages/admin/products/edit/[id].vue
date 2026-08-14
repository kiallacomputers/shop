<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Edit Product</h1>

        <p class="text-gray-500 mt-1">
          Update product information, pricing, stock and images.
        </p>
      </div>

      <NuxtLink
        to="/admin/products"
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
      >
        ← Back to Products
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-10 text-center">
      <p class="text-gray-500">Loading product...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- Product Form -->
    <form v-else @submit.prevent="saveProduct" class="space-y-8">
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-6">Product Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
          <div class="md:col-span-2">
            <label class="block font-semibold mb-2"> Product Name </label>

            <input
              v-model="form.name"
              type="text"
              class="w-full border rounded-lg px-4 py-3"
              required
            />
          </div>

          <!-- Slug -->
          <div>
            <label class="block font-semibold mb-2"> Slug </label>

            <input
              v-model="form.slug"
              type="text"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block font-semibold mb-2"> Category </label>

            <select
              v-model="form.category_id"
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

          <!-- Blurb -->
          <div class="md:col-span-2">
            <label class="block font-semibold mb-2"> Short Description </label>

            <textarea
              v-model="form.blurb"
              rows="4"
              class="w-full border rounded-lg px-4 py-3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Pricing & Stock -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-6">Pricing & Stock</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Price -->
          <div>
            <label class="block font-semibold mb-2"> Price </label>

            <input
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- Old Price -->
          <div>
            <label class="block font-semibold mb-2"> Old Price </label>

            <input
              v-model.number="form.oldPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- Stock -->
          <div>
            <label class="block font-semibold mb-2"> Stock </label>

            <input
              v-model.number="form.stock"
              type="number"
              min="0"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>
        </div>
      </div>

      <!-- Product Images -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold">Product Images</h2>

            <p class="text-sm text-gray-500 mt-1">
              Images are stored as a JSON array.
            </p>
          </div>

          <button
            type="button"
            @click="addImage"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Image
          </button>
        </div>

        <!-- Images -->
        <div v-if="form.images.length" class="space-y-4">
          <div
            v-for="(image, index) in form.images"
            :key="index"
            class="flex gap-4 items-center"
          >
            <!-- Preview -->
            <div
              class="w-24 h-24 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
            >
              <img
                v-if="image"
                :src="image"
                class="w-full h-full object-contain"
              />

              <span v-else class="text-xs text-gray-400"> No Image </span>
            </div>

            <!-- URL -->
            <input
              v-model="form.images[index]"
              type="text"
              placeholder="/images/products/example.png"
              class="flex-1 border rounded-lg px-4 py-3"
            />

            <!-- Remove -->
            <button
              type="button"
              @click="removeImage(index)"
              class="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Remove
            </button>
          </div>
        </div>

        <!-- No Images -->
        <div
          v-else
          class="border border-dashed rounded-lg p-8 text-center text-gray-400"
        >
          No product images.

          <button type="button" @click="addImage" class="text-blue-600 ml-2">
            Add one
          </button>
        </div>
      </div>

      <!-- Product Options -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-6">Product Options</h2>

        <div class="flex flex-wrap gap-8">
          <label class="flex items-center gap-3">
            <input v-model="form.active" type="checkbox" class="w-5 h-5" />

            <span> Active </span>
          </label>

          <label class="flex items-center gap-3">
            <input v-model="form.featured" type="checkbox" class="w-5 h-5" />

            <span> Featured </span>
          </label>

          <label class="flex items-center gap-3">
            <input v-model="form.refurbished" type="checkbox" class="w-5 h-5" />

            <span> Refurbished </span>
          </label>
        </div>
      </div>

      <!-- Description JSON -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold">Product Description</h2>

            <p class="text-sm text-gray-500 mt-1">Stored as a JSON array.</p>
          </div>

          <button
            type="button"
            @click="addDescriptionBlock"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Section
          </button>
        </div>

        <div v-if="form.description.length" class="space-y-6">
          <div
            v-for="(block, index) in form.description"
            :key="index"
            class="border rounded-lg p-5 bg-gray-50"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-semibold">Section {{ index + 1 }}</h3>

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
              <label class="block font-semibold mb-2"> Type </label>

              <select
                v-model="block.type"
                class="w-full border rounded-lg px-4 py-3"
              >
                <option value="heading">Heading</option>

                <option value="paragraph">Paragraph</option>

                <option value="quote">Quote</option>

                <option value="warning">Warning</option>

                <option value="list">List</option>

                <option value="table">Table</option>
              </select>
            </div>

            <!-- Text -->
            <div
              v-if="
                block.type === 'heading' ||
                block.type === 'paragraph' ||
                block.type === 'quote' ||
                block.type === 'warning'
              "
            >
              <label class="block font-semibold mb-2"> Text </label>

              <textarea
                v-model="block.text"
                rows="4"
                class="w-full border rounded-lg px-4 py-3"
              ></textarea>
            </div>

            <!-- List -->
            <div v-if="block.type === 'list'">
              <label class="block font-semibold mb-2"> List Items </label>

              <div
                v-for="(item, itemIndex) in block.items || []"
                :key="itemIndex"
                class="flex gap-2 mb-2"
              >
                <input
                  v-model="block.items[itemIndex]"
                  type="text"
                  class="flex-1 border rounded-lg px-4 py-2"
                />

                <button
                  type="button"
                  @click="block.items.splice(itemIndex, 1)"
                  class="text-red-600 px-3"
                >
                  ×
                </button>
              </div>

              <button
                type="button"
                @click="
                  block.items = block.items || [];
                  block.items.push('');
                "
                class="text-blue-600 text-sm"
              >
                + Add Item
              </button>
            </div>

            <!-- Table -->
            <div v-if="block.type === 'table'">
              <div class="mb-4">
                <label class="block font-semibold mb-2"> Headers </label>

                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-for="(header, headerIndex) in block.headers || []"
                    :key="headerIndex"
                    v-model="block.headers[headerIndex]"
                    type="text"
                    class="border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <label class="block font-semibold mb-2"> Rows </label>

              <div
                v-for="(row, rowIndex) in block.rows || []"
                :key="rowIndex"
                class="flex gap-2 mb-2"
              >
                <input
                  v-for="(cell, cellIndex) in row"
                  :key="cellIndex"
                  v-model="row[cellIndex]"
                  type="text"
                  class="flex-1 border rounded-lg px-3 py-2"
                />

                <button
                  type="button"
                  @click="block.rows.splice(rowIndex, 1)"
                  class="text-red-600 px-3"
                >
                  ×
                </button>
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

        <div
          v-else
          class="border border-dashed rounded-lg p-8 text-center text-gray-400"
        >
          No description sections.

          <button
            type="button"
            @click="addDescriptionBlock"
            class="text-blue-600 ml-2"
          >
            Add one
          </button>
        </div>
      </div>

      <!-- Save -->
      <div class="flex items-center justify-end gap-4">
        <NuxtLink
          to="/admin/products"
          class="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          Cancel
        </NuxtLink>

        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
        >
          {{ saving ? "Saving..." : "Save Product" }}
        </button>
      </div>

      <!-- Save Message -->
      <div
        v-if="successMessage"
        class="bg-green-100 border border-green-300 text-green-700 rounded-lg p-4"
      >
        {{ successMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

console.log("🔥🔥🔥 EDIT PRODUCT PAGE LOADING");

const route = useRoute();

const { adminFetch } = useAdminFetch();

// --------------------------------------------------
// STATE
// --------------------------------------------------

const loading = ref(true);
const saving = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const categories = ref<any[]>([]);

// --------------------------------------------------
// FORM
// --------------------------------------------------

const form = reactive<any>({
  id: null,

  name: "",

  slug: "",

  category_id: null,

  blurb: "",

  price: 0,

  oldPrice: null,

  stock: 0,

  featured: false,

  refurbished: false,

  active: true,

  images: [],

  description: [],
});

// --------------------------------------------------
// PRODUCT ID
// --------------------------------------------------

const productId = computed(() => {
  return route.params.id;
});

// --------------------------------------------------
// LOAD PRODUCT
// --------------------------------------------------

const loadProduct = async () => {
  console.log("🔥🔥🔥 LOAD PRODUCT", productId.value);

  try {
    const response = await adminFetch(`/api/admin/products/${productId.value}`);

    console.log("🔥🔥🔥 PRODUCT RESPONSE:", response);

    if (!response) {
      throw new Error("Product not found");
    }

    // ---------------------------------------------
    // BASIC FIELDS
    // ---------------------------------------------

    form.id = response.id;

    form.name = response.name || "";

    form.slug = response.slug || "";

    form.category_id = response.category_id ?? null;

    form.blurb = response.blurb || "";

    form.price = Number(response.price) || 0;

    form.oldPrice =
      response.oldPrice !== null && response.oldPrice !== undefined
        ? Number(response.oldPrice)
        : null;

    form.stock = Number(response.stock) || 0;

    form.featured = response.featured === true;

    form.refurbished = response.refurbished === true;

    form.active = response.active !== false;

    // ---------------------------------------------
    // IMAGES
    // ---------------------------------------------

    console.log("🔥 PRODUCT IMAGES FROM DATABASE:", response.images);

    if (Array.isArray(response.images)) {
      form.images = [...response.images];
    } else {
      form.images = [];
    }

    console.log("🔥 IMAGES STORED IN FORM:", form.images);

    // ---------------------------------------------
    // DESCRIPTION
    // ---------------------------------------------

    console.log("🔥 PRODUCT DESCRIPTION:", response.description);

    if (Array.isArray(response.description)) {
      form.description = JSON.parse(JSON.stringify(response.description));
    } else {
      form.description = [];
    }

    console.log("🔥 DESCRIPTION STORED:", form.description);
  } catch (error: any) {
    console.error("🔥🔥🔥 LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to load product";
  } finally {
    loading.value = false;
  }
};

// --------------------------------------------------
// LOAD CATEGORIES
// --------------------------------------------------

const loadCategories = async () => {
  console.log("🔥🔥🔥 LOAD CATEGORIES");

  try {
    const response = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES:", response);

    categories.value = response || [];
  } catch (error) {
    console.error("🔥 CATEGORY LOAD ERROR:", error);
  }
};

// --------------------------------------------------
// ADD IMAGE
// --------------------------------------------------

const addImage = () => {
  form.images.push("");
};

// --------------------------------------------------
// REMOVE IMAGE
// --------------------------------------------------

const removeImage = (index: number) => {
  form.images.splice(index, 1);
};

// --------------------------------------------------
// ADD DESCRIPTION BLOCK
// --------------------------------------------------

const addDescriptionBlock = () => {
  form.description.push({
    type: "paragraph",

    text: "",
  });
};

// --------------------------------------------------
// REMOVE DESCRIPTION BLOCK
// --------------------------------------------------

const removeDescriptionBlock = (index: number) => {
  form.description.splice(index, 1);
};

// --------------------------------------------------
// ADD TABLE ROW
// --------------------------------------------------

const addTableRow = (block: any) => {
  if (!block.rows) {
    block.rows = [];
  }

  const columnCount = block.headers?.length || 2;

  block.rows.push(Array(columnCount).fill(""));
};

// --------------------------------------------------
// SAVE PRODUCT
// --------------------------------------------------

const saveProduct = async () => {
  console.log("🔥🔥🔥 SAVE PRODUCT");

  saving.value = true;

  errorMessage.value = "";
  successMessage.value = "";

  try {
    const payload = {
      name: form.name,

      slug: form.slug,

      category_id: form.category_id,

      blurb: form.blurb,

      price: form.price,

      oldPrice: form.oldPrice,

      stock: form.stock,

      featured: form.featured,

      refurbished: form.refurbished,

      active: form.active,

      images: form.images,

      description: form.description,
    };

    console.log("🔥 UPDATE PAYLOAD:", payload);

    const response = await adminFetch(
      `/api/admin/products/${productId.value}`,
      {
        method: "PUT",

        body: payload,
      },
    );

    console.log("🔥 UPDATE RESPONSE:", response);

    successMessage.value = "Product updated successfully.";
  } catch (error: any) {
    console.error("🔥🔥🔥 SAVE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to save product";
  } finally {
    saving.value = false;
  }
};

// --------------------------------------------------
// LOAD
// --------------------------------------------------

onMounted(async () => {
  console.log("🔥🔥🔥 EDIT PRODUCT MOUNTED");

  await Promise.all([loadProduct(), loadCategories()]);
});
</script>
