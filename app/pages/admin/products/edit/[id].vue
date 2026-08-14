<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- ============================= -->
    <!-- HEADER -->
    <!-- ============================= -->

    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Edit Product</h1>

        <p class="text-gray-500 mt-1">
          Update product details, pricing, stock, images and description.
        </p>
      </div>

      <NuxtLink
        to="/admin/products"
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
      >
        ← Back to Products
      </NuxtLink>
    </div>

    <!-- ============================= -->
    <!-- LOADING -->
    <!-- ============================= -->

    <div v-if="loading" class="bg-white rounded-lg shadow p-10 text-center">
      <div class="text-gray-500">Loading product...</div>
    </div>

    <!-- ============================= -->
    <!-- ERROR -->
    <!-- ============================= -->

    <div
      v-else-if="errorMessage"
      class="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mb-6"
    >
      {{ errorMessage }}
    </div>

    <!-- ============================= -->
    <!-- FORM -->
    <!-- ============================= -->

    <form v-else @submit.prevent="saveProduct" class="space-y-8">
      <!-- ============================= -->
      <!-- BASIC INFORMATION -->
      <!-- ============================= -->

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-6">
          Product Information
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- NAME -->

          <div class="md:col-span-2">
            <label class="block font-semibold mb-2"> Product Name </label>

            <input
              v-model="form.name"
              type="text"
              class="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- SLUG -->

          <div>
            <label class="block font-semibold mb-2"> Slug </label>

            <input
              v-model="form.slug"
              type="text"
              class="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <!-- CATEGORY -->

          <div>
            <label class="block font-semibold mb-2"> Category </label>

            <select
              v-model="form.category_id"
              class="w-full border rounded-lg px-4 py-3 bg-white"
            >
              <option :value="null">Select Category</option>

              <template v-for="category in sortedCategories" :key="category.id">
                <!-- Main Category -->
                <option :value="category.id" class="font-bold">
                  {{ category.name }}
                </option>

                <!-- Sub Categories -->
                <option
                  v-for="child in category.children"
                  :key="child.id"
                  :value="child.id"
                >
                  &nbsp;&nbsp;&nbsp;└─ {{ child.name }}
                </option>
              </template>
            </select>
          </div>

          <!-- BLURB -->

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

      <!-- ============================= -->
      <!-- PRICE / STOCK -->
      <!-- ============================= -->

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-6">Price & Stock</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- PRICE -->

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

          <!-- OLD PRICE -->

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

          <!-- STOCK -->

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

      <!-- ============================= -->
      <!-- IMAGES -->
      <!-- ============================= -->

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-800">Product Images</h2>

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

        <!-- IMAGE LIST -->

        <div v-if="form.images.length > 0" class="space-y-4">
          <div
            v-for="(image, index) in form.images"
            :key="index"
            class="border rounded-lg p-4"
          >
            <div class="flex flex-col md:flex-row gap-4">
              <!-- PREVIEW -->

              <div
                class="w-full md:w-40 h-32 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="image"
                  :src="image"
                  :alt="form.name"
                  class="max-w-full max-h-full object-contain"
                />

                <span v-else class="text-gray-400 text-sm"> No Image </span>
              </div>

              <!-- URL -->

              <div class="flex-1">
                <label class="block text-sm font-semibold mb-2">
                  Image {{ index + 1 }}
                </label>

                <input
                  v-model="form.images[index]"
                  type="text"
                  placeholder="/images/products/example.png"
                  class="w-full border rounded-lg px-4 py-3"
                />

                <p class="text-xs text-gray-500 mt-2">
                  Example: /images/products/Intel_Ultra5.png
                </p>
              </div>

              <!-- REMOVE -->

              <div class="flex items-start">
                <button
                  type="button"
                  @click="removeImage(index)"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- NO IMAGES -->

        <div v-else class="border border-dashed rounded-lg p-8 text-center">
          <p class="text-gray-400 mb-3">No images have been added.</p>

          <button
            type="button"
            @click="addImage"
            class="text-blue-600 hover:text-blue-800"
          >
            + Add Image
          </button>
        </div>
      </div>

      <!-- ============================= -->
      <!-- PRODUCT OPTIONS -->
      <!-- ============================= -->

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-slate-800 mb-6">Product Options</h2>

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

      <!-- ============================= -->
      <!-- DESCRIPTION -->
      <!-- ============================= -->

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-800">
              Product Description
            </h2>

            <p class="text-sm text-gray-500 mt-1">
              Description is stored as a JSON array.
            </p>
          </div>

          <button
            type="button"
            @click="addDescriptionBlock"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Section
          </button>
        </div>

        <!-- DESCRIPTION BLOCKS -->

        <div v-if="form.description.length > 0" class="space-y-6">
          <div
            v-for="(block, index) in form.description"
            :key="index"
            class="border rounded-lg p-5 bg-gray-50"
          >
            <!-- BLOCK HEADER -->

            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-slate-700">
                Section {{ index + 1 }}
              </h3>

              <button
                type="button"
                @click="removeDescriptionBlock(index)"
                class="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>

            <!-- TYPE -->

            <div class="mb-4">
              <label class="block font-semibold mb-2"> Type </label>

              <select
                v-model="block.type"
                class="w-full border rounded-lg px-4 py-3 bg-white"
              >
                <option value="heading">Heading</option>

                <option value="paragraph">Paragraph</option>

                <option value="quote">Quote</option>

                <option value="warning">Warning</option>

                <option value="list">List</option>

                <option value="table">Table</option>
              </select>
            </div>

            <!-- TEXT -->

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
                rows="5"
                class="w-full border rounded-lg px-4 py-3 bg-white"
              ></textarea>
            </div>

            <!-- LIST -->

            <div v-if="block.type === 'list'" class="mt-4">
              <label class="block font-semibold mb-2"> List Style </label>

              <select
                v-model="block.style"
                class="w-full border rounded-lg px-4 py-3 mb-4 bg-white"
              >
                <option value="check">Check</option>

                <option value="bullet">Bullet</option>
              </select>

              <label class="block font-semibold mb-2"> Items </label>

              <div
                v-for="(item, itemIndex) in block.items || []"
                :key="itemIndex"
                class="flex gap-2 mb-2"
              >
                <input
                  v-model="block.items[itemIndex]"
                  type="text"
                  class="flex-1 border rounded-lg px-4 py-2 bg-white"
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
                @click="addListItem(block)"
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Item
              </button>
            </div>

            <!-- TABLE -->

            <div v-if="block.type === 'table'" class="mt-4">
              <label class="block font-semibold mb-2"> Table Headers </label>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <input
                  v-for="(header, headerIndex) in block.headers || []"
                  :key="headerIndex"
                  v-model="block.headers[headerIndex]"
                  type="text"
                  class="border rounded-lg px-4 py-2 bg-white"
                />
              </div>

              <label class="block font-semibold mb-2"> Table Rows </label>

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
                  class="flex-1 border rounded-lg px-4 py-2 bg-white"
                />

                <button
                  type="button"
                  @click="removeTableRow(block, rowIndex)"
                  class="px-3 text-red-600"
                >
                  ×
                </button>
              </div>

              <button
                type="button"
                @click="addTableRow(block)"
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>

        <!-- NO DESCRIPTION -->

        <div v-else class="border border-dashed rounded-lg p-8 text-center">
          <p class="text-gray-400 mb-3">No description sections.</p>

          <button
            type="button"
            @click="addDescriptionBlock"
            class="text-blue-600 hover:text-blue-800"
          >
            + Add Section
          </button>
        </div>
      </div>

      <!-- ============================= -->
      <!-- SAVE -->
      <!-- ============================= -->

      <div class="flex justify-end gap-4">
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

      <!-- ============================= -->
      <!-- SUCCESS -->
      <!-- ============================= -->

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
// ==================================================
// ADMIN AUTHENTICATION
// ==================================================

definePageMeta({
  middleware: "admin",
});

// ==================================================
// ADMIN FETCH
// ==================================================

const { adminFetch } = useAdminFetch();

const route = useRoute();

// ==================================================
// STATE
// ==================================================

const loading = ref(true);

const saving = ref(false);

const errorMessage = ref("");

const successMessage = ref("");

const categories = ref<any[]>([]);

const sortedCategories = computed(() => {
  const parents = categories.value
    .filter((category) => !category.parent_id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return parents.map((parent) => {
    const children = categories.value
      .filter((category) => category.parent_id === parent.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      ...parent,
      children,
    };
  });
});

// ==================================================
// FORM
// ==================================================

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

// ==================================================
// PRODUCT ID
// ==================================================

const productId = computed(() => {
  return route.params.id;
});

// ==================================================
// LOAD PRODUCT
// ==================================================

const loadProduct = async () => {
  console.log("🔥 EDIT PRODUCT ID:", productId.value);

  try {
    const response = await adminFetch(`/api/admin/products/${productId.value}`);

    console.log("🔥 EDIT PRODUCT RESPONSE:", response);

    if (!response) {
      throw new Error("Product was not returned by the server.");
    }

    // ==================================================
    // BASIC DATA
    // ==================================================

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

    // ==================================================
    // IMAGES
    // ==================================================

    console.log("🔥 DATABASE IMAGES:", response.images);

    if (Array.isArray(response.images)) {
      form.images = JSON.parse(JSON.stringify(response.images));
    } else {
      form.images = [];
    }

    console.log("🔥 FORM IMAGES:", form.images);

    // ==================================================
    // DESCRIPTION
    // ==================================================

    console.log("🔥 DATABASE DESCRIPTION:", response.description);

    if (Array.isArray(response.description)) {
      form.description = JSON.parse(JSON.stringify(response.description));
    } else {
      form.description = [];
    }

    console.log("🔥 FORM DESCRIPTION:", form.description);
  } catch (error: any) {
    console.error("🔥 LOAD PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to load product.";
  } finally {
    loading.value = false;
  }
};

// ==================================================
// LOAD CATEGORIES
// ==================================================

const loadCategories = async () => {
  console.log("🔥 LOADING CATEGORIES");

  try {
    const response = await adminFetch("/api/admin/categories");

    console.log("🔥 CATEGORIES RESPONSE:", response);

    categories.value = Array.isArray(response) ? response : [];
  } catch (error: any) {
    console.error("🔥 CATEGORY ERROR:", error);
  }
};

// ==================================================
// IMAGE FUNCTIONS
// ==================================================

const addImage = () => {
  form.images.push("");
};

const removeImage = (index: number) => {
  form.images.splice(index, 1);
};

// ==================================================
// DESCRIPTION FUNCTIONS
// ==================================================

const addDescriptionBlock = () => {
  form.description.push({
    type: "paragraph",

    text: "",
  });
};

const removeDescriptionBlock = (index: number) => {
  form.description.splice(index, 1);
};

// ==================================================
// LIST
// ==================================================

const addListItem = (block: any) => {
  if (!Array.isArray(block.items)) {
    block.items = [];
  }

  block.items.push("");
};

// ==================================================
// TABLE
// ==================================================

const addTableRow = (block: any) => {
  if (!Array.isArray(block.rows)) {
    block.rows = [];
  }

  const numberOfColumns =
    Array.isArray(block.headers) && block.headers.length > 0
      ? block.headers.length
      : 2;

  block.rows.push(Array(numberOfColumns).fill(""));
};

const removeTableRow = (block: any, index: number) => {
  if (Array.isArray(block.rows)) {
    block.rows.splice(index, 1);
  }
};

// ==================================================
// SAVE PRODUCT
// ==================================================

const saveProduct = async () => {
  console.log("🔥 SAVING PRODUCT:", productId.value);

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

      // Keep images as JSON array
      images: form.images,

      // Keep description as JSON array
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
    console.error("🔥 SAVE PRODUCT ERROR:", error);

    errorMessage.value =
      error?.data?.statusMessage || error?.message || "Unable to save product.";
  } finally {
    saving.value = false;
  }
};

// ==================================================
// LOAD EVERYTHING
// ==================================================

onMounted(async () => {
  console.log("🔥🔥 EDIT PRODUCT PAGE LOADED");

  await Promise.all([loadProduct(), loadCategories()]);
});
</script>
