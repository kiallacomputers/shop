<template>
  <form
    class="space-y-8"
    @submit.prevent="saveProduct"
  >
    <!-- General -->

    <div class="bg-white border rounded-xl p-6">
      <h2 class="text-lg font-bold mb-4">
        General
      </h2>

      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1">
            Product Name
          </label>

          <input
            v-model="product.name"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label class="block mb-1">
            Slug
          </label>

          <input
            v-model="product.slug"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label class="block mb-1">
            Category
          </label>

          <select
            v-model="product.category_id"
            class="w-full border rounded-lg px-3 py-2"
          >
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-1">
            Stock
          </label>

          <input
            v-model.number="product.stock"
            type="number"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div class="mt-4">
        <label class="block mb-1">
          Blurb
        </label>

        <textarea
          v-model="product.blurb"
          rows="3"
          class="w-full border rounded-lg px-3 py-2"
        />
      </div>
    </div>

    <!-- Pricing -->

    <div class="bg-white border rounded-xl p-6">
      <h2 class="text-lg font-bold mb-4">
        Pricing
      </h2>

      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1">
            Price
          </label>

          <input
            v-model="product.price"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label class="block mb-1">
            Old Price
          </label>

          <input
            v-model="product.oldPrice"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </div>

    <!-- Flags -->

    <div class="bg-white border rounded-xl p-6">
      <h2 class="text-lg font-bold mb-4">
        Settings
      </h2>

      <div class="grid md:grid-cols-3 gap-4">
        <label class="flex items-center gap-2">
          <input
            v-model="product.featured"
            type="checkbox"
          />
          Featured
        </label>

        <label class="flex items-center gap-2">
          <input
            v-model="product.refurbished"
            type="checkbox"
          />
          Refurbished
        </label>

        <label class="flex items-center gap-2">
          <input
            v-model="product.active"
            type="checkbox"
          />
          Active
        </label>
      </div>
    </div>

    <!-- Images -->

    <ProductImages
      v-model="product.images"
    />

    <!-- Description -->

    <ProductDescription
      v-model="product.description"
    />

    <!-- Save -->

    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="px-4 py-2 border rounded-lg"
        @click="$emit('close')"
      >
        Cancel
      </button>

      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Save Product
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const emit =
  defineEmits([
    "saved",
    "close"
  ])

const props =
  defineProps({
    initialProduct: {
      type: Object,
      default: () => null
    }
  })

const { adminFetch } =
  useAdminFetch()

const categories =
  ref([])

const product = reactive({
  slug: "",
  name: "",
  category_id: null,

  blurb: "",

  images: [],

  price: "",
  oldPrice: "",

  reviews: 0,

  stock: 0,

  featured: false,
  refurbished: false,
  active: true,

  description: []
})

watch(
  () => product.name,
  (name) => {
    if (!name) return

    product.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }
)

const loadCategories =
  async () => {

    categories.value =
      await adminFetch(
        "/api/admin/categories"
      )
  }

const saveProduct =
  async () => {

    await adminFetch(
      "/api/admin/products",
      {
        method: "POST",

        body: {
          ...product
        }
      }
    )

    emit("saved")
  }

onMounted(
  loadCategories
)
</script>
