<script setup lang="ts">

const supabase = useSupabaseClient()

const emit = defineEmits<{
  close: []
  saved: []
}>()


// ============================================================
// STATE
// ============================================================

const loading = ref(false)

const errorMessage = ref("")

const categories = ref<any[]>([])

const loadingCategories = ref(true)


// ============================================================
// PRODUCT
// ============================================================

const product = ref({
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: 0,
  category_id: "",
  images: "",
  featured: false,
  active: true,
})


// ============================================================
// LOAD CATEGORIES
// ============================================================

const loadCategories = async () => {

  loadingCategories.value = true

  try {

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", {
        ascending: true,
      })

    if (error) {
      throw error
    }

    categories.value = data || []

  } catch (error: any) {

    console.error(
      "🔥 CATEGORY LOAD ERROR:",
      error
    )

    errorMessage.value =
      error?.message ||
      "Unable to load categories."

  } finally {

    loadingCategories.value = false

  }

}


// ============================================================
// SLUG
// ============================================================

const createSlug = (
  value: string
) => {

  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

}


// ============================================================
// AUTOMATIC SLUG
// ============================================================

watch(
  () => product.value.name,
  (value) => {

    product.value.slug =
      createSlug(value)

  }
)


// ============================================================
// ADD PRODUCT
// ============================================================

const addProduct = async () => {

  loading.value = true

  errorMessage.value = ""

  try {

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!product.value.name.trim()) {

      throw new Error(
        "Please enter a product name."
      )

    }


    if (!product.value.category_id) {

      throw new Error(
        "Please select a category."
      )

    }


    if (
      product.value.price === "" ||
      Number(product.value.price) < 0
    ) {

      throw new Error(
        "Please enter a valid price."
      )

    }


    if (
      Number(product.value.stock) < 0
    ) {

      throw new Error(
        "Please enter a valid stock quantity."
      )

    }


    // --------------------------------------------------------
    // INSERT
    // --------------------------------------------------------

    const { error } = await supabase
      .from("products")
      .insert({
        name:
          product.value.name.trim(),

        slug:
          product.value.slug.trim(),

        description:
          product.value.description.trim() ||
          null,

        price:
          Number(product.value.price),

        stock:
          Number(product.value.stock),

        category_id:
          product.value.category_id,

        images:
          product.value.images.trim() ||
          null,

        featured:
          product.value.featured,

        active:
          product.value.active,
      })


    if (error) {
      throw error
    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    emit("saved")

  } catch (error: any) {

    console.error(
      "🔥 ADD PRODUCT ERROR:",
      error
    )

    errorMessage.value =
      error?.message ||
      "Unable to add product."

  } finally {

    loading.value = false

  }

}


// ============================================================
// CLOSE
// ============================================================

const close = () => {

  if (loading.value) {
    return
  }

  emit("close")

}


// ============================================================
// LOAD
// ============================================================

onMounted(async () => {

  await loadCategories()

})

</script>


<template>

  <form
    @submit.prevent="addProduct"
    class="space-y-6"
  >

    <!-- ====================================================== -->
    <!-- ERROR -->
    <!-- ====================================================== -->

    <div
      v-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4"
    >

      <div class="flex items-start gap-3">

        <span class="text-lg">
          ⚠️
        </span>

        <div>

          <p class="font-semibold">
            Unable to add product
          </p>

          <p class="text-sm mt-1">
            {{ errorMessage }}
          </p>

        </div>

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- PRODUCT INFORMATION -->
    <!-- ====================================================== -->

    <div
      class="bg-white border border-gray-200 rounded-xl p-6"
    >

      <h3
        class="text-lg font-bold text-slate-800 mb-5"
      >
        Product Information
      </h3>


      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-5"
      >

        <!-- NAME -->

        <div class="md:col-span-2">

          <label
            for="product-name"
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Product Name
          </label>

          <input
            id="product-name"
            v-model="product.name"
            type="text"
            required
            placeholder="e.g. MacBook Air M2"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>


        <!-- SLUG -->

        <div>

          <label
            for="product-slug"
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Slug
          </label>

          <input
            id="product-slug"
            v-model="product.slug"
            type="text"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>


        <!-- CATEGORY -->

        <div>

          <label
            for="product-category"
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Category
          </label>

          <select
            id="product-category"
            v-model="product.category_id"
            required
            :disabled="loadingCategories"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">
              {{
                loadingCategories
                  ? "Loading categories..."
                  : "Select a category"
              }}
            </option>

            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>

          </select>

        </div>


        <!-- DESCRIPTION -->

        <div class="md:col-span-2">

          <label
            for="product-description"
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Description
          </label>

          <textarea
            id="product-description"
            v-model="product.description"
            rows="7"
            placeholder="Enter the product description..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>

        </div>

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- PRICE & STOCK -->
    <!-- ====================================================== -->

    <div
      class="bg-white border border-gray-200 rounded-xl p-6"
    >

      <h3
        class="text-lg font-bold text-slate-800 mb-5"
      >
        Pricing & Stock
      </h3>


      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-5"
      >

        <!-- PRICE -->

        <div>

          <label
            for="product-price"
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Price
          </label>

          <div class="relative">

            <span
              class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              $
            </span>

            <input
              id="product-price"
              v-model="product.price"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>


        <!-- STOCK -->

        <div>

          <label
            for="product-stock"
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Stock Quantity
          </label>

          <input
            id="product-stock"
            v-model="product.stock"
            type="number"
            min="0"
            step="1"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- IMAGE -->
    <!-- ====================================================== -->

    <div
      class="bg-white border border-gray-200 rounded-xl p-6"
    >

      <h3
        class="text-lg font-bold text-slate-800 mb-5"
      >
        Product Image
      </h3>


      <label
        for="product-image"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        Image URL
      </label>

      <input
        id="product-image"
        v-model="product.images"
        type="text"
        placeholder="https://example.com/product-image.jpg"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />


      <!-- PREVIEW -->

      <div
        v-if="product.images"
        class="mt-5"
      >

        <p
          class="text-sm font-semibold text-gray-700 mb-2"
        >
          Preview
        </p>

        <div
          class="w-full h-56 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
        >

          <img
            :src="product.images"
            :alt="product.name || 'Product image'"
            class="max-w-full max-h-full object-contain p-4"
          />

        </div>

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- SETTINGS -->
    <!-- ====================================================== -->

    <div
      class="bg-white border border-gray-200 rounded-xl p-6"
    >

      <h3
        class="text-lg font-bold text-slate-800 mb-5"
      >
        Store Settings
      </h3>


      <div class="space-y-5">

        <!-- FEATURED -->

        <label
          class="flex items-start gap-3 cursor-pointer"
        >

          <input
            v-model="product.featured"
            type="checkbox"
            class="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />

          <div>

            <p class="font-semibold text-gray-700">
              Featured Product
            </p>

            <p class="text-sm text-gray-500 mt-1">
              Display this product in your featured products section.
            </p>

          </div>

        </label>


        <!-- ACTIVE -->

        <label
          class="flex items-start gap-3 cursor-pointer"
        >

          <input
            v-model="product.active"
            type="checkbox"
            class="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />

          <div>

            <p class="font-semibold text-gray-700">
              Active Product
            </p>

            <p class="text-sm text-gray-500 mt-1">
              Make this product visible in the store.
            </p>

          </div>

        </label>

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- BUTTONS -->
    <!-- ====================================================== -->

    <div
      class="flex justify-end gap-3 pt-2 pb-2"
    >

      <button
        type="button"
        @click="close"
        :disabled="loading"
        class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-slate-700 font-semibold rounded-lg transition"
      >
        Cancel
      </button>


      <button
        type="submit"
        :disabled="loading"
        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
      >

        {{ loading ? "Adding Product..." : "Add Product" }}

      </button>

    </div>

  </form>

</template>
