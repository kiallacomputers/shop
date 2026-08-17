<script setup lang="ts">

// ============================================================
// ADMIN API
// ============================================================

const { adminFetch } = useAdminFetch()

const supabase = useSupabaseClient()


// ============================================================
// EVENTS
// ============================================================

const emit = defineEmits<{
  close: []
  saved: []
}>()


// ============================================================
// STATE
// ============================================================

const loading = ref(false)

const loadingCategories = ref(true)

const uploadingImages = ref(false)

const errorMessage = ref("")

const categories = ref<any[]>([])


// ============================================================
// PRODUCT
// ============================================================

const product = ref({
  name: "",
  slug: "",
  price: "",
  stock: 0,
  category_id: "",
  images: [] as string[],
  featured: false,
  active: true,

  description: [] as any[],
})


// ============================================================
// IMAGE FILES
// ============================================================

const imageInput = ref<HTMLInputElement | null>(null)


// ============================================================
// LOAD CATEGORIES
// ============================================================

const loadCategories = async () => {

  loadingCategories.value = true

  errorMessage.value = ""

  try {

    console.log("🔥 LOADING ADMIN CATEGORIES")

    const response =
      await adminFetch("/api/admin/categories")

    console.log(
      "🔥 CATEGORY RESPONSE:",
      response
    )

    if (Array.isArray(response)) {

      categories.value = response

    } else if (
      response &&
      Array.isArray(response.categories)
    ) {

      categories.value =
        response.categories

    } else {

      categories.value = []

    }

    console.log(
      `🔥 ${categories.value.length} categories loaded`
    )

  } catch (error: any) {

    console.error(
      "🔥 CATEGORY LOAD ERROR:",
      error
    )

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to load categories."

  } finally {

    loadingCategories.value = false

  }

}


// ============================================================
// CREATE SLUG
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
// AUTO SLUG
// ============================================================

watch(
  () => product.value.name,
  (value) => {

    product.value.slug =
      createSlug(value)

  }
)


// ============================================================
// IMAGE UPLOAD
// ============================================================

const openImagePicker = () => {

  imageInput.value?.click()

}


// ============================================================
// HANDLE IMAGE FILES
// ============================================================

const handleImageUpload = async (
  event: Event
) => {

  const target =
    event.target as HTMLInputElement

  if (!target.files?.length) {

    return

  }

  uploadingImages.value = true

  errorMessage.value = ""


  try {

    const files =
      Array.from(target.files)


    for (const file of files) {

      // ------------------------------------------------------
      // Validate image
      // ------------------------------------------------------

      if (
        !file.type.startsWith("image/")
      ) {

        continue

      }


      // ------------------------------------------------------
      // Create unique filename
      // ------------------------------------------------------

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg"


      const cleanName =
        file.name
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            "")


      const fileName =
        `${cleanName}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${extension}`


      // ------------------------------------------------------
      // Upload to Supabase
      //
      // Bucket:
      // products
      //
      // Folder:
      // products/
      // ------------------------------------------------------

      console.log(
        "🔥 UPLOADING IMAGE:",
        fileName
      )


      const {
        error: uploadError
      } = await supabase.storage
        .from("products")
        .upload(
          `products/${fileName}`,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          }
        )


      if (uploadError) {

        throw uploadError

      }


      // ------------------------------------------------------
      // Get public URL
      // ------------------------------------------------------

      const {
        data: publicUrlData
      } = supabase.storage
        .from("products")
        .getPublicUrl(
          `products/${fileName}`
        )


      if (
        publicUrlData?.publicUrl
      ) {

        product.value.images.push(
          publicUrlData.publicUrl
        )

      }

    }

  } catch (error: any) {

    console.error(
      "🔥 IMAGE UPLOAD ERROR:",
      error
    )

    errorMessage.value =
      error?.message ||
      "Unable to upload image."

  } finally {

    uploadingImages.value = false

    // Reset input so the same file can
    // be selected again if required.

    if (imageInput.value) {

      imageInput.value.value = ""

    }

  }

}


// ============================================================
// REMOVE IMAGE
// ============================================================

const removeImage = (
  index: number
) => {

  product.value.images.splice(
    index,
    1
  )

}


// ============================================================
// DESCRIPTION BLOCKS
// ============================================================

const addHeading = () => {

  product.value.description.push({
    type: "heading",
    text: "",
  })

}


const addParagraph = () => {

  product.value.description.push({
    type: "paragraph",
    text: "",
  })

}


const addTable = () => {

  product.value.description.push({
    type: "table",

    headers: [
      " ",
      " ",
    ],

    rows: [
      [
        "",
        "",
      ],
    ],
  })

}


// ============================================================
// REMOVE DESCRIPTION BLOCK
// ============================================================

const removeDescriptionBlock = (
  index: number
) => {

  product.value.description.splice(
    index,
    1
  )

}


// ============================================================
// MOVE DESCRIPTION BLOCK UP
// ============================================================

const moveBlockUp = (
  index: number
) => {

  if (index <= 0) {

    return

  }

  const blocks =
    product.value.description

  const current =
    blocks[index]

  blocks.splice(
    index,
    1
  )

  blocks.splice(
    index - 1,
    0,
    current
  )

}


// ============================================================
// MOVE DESCRIPTION BLOCK DOWN
// ============================================================

const moveBlockDown = (
  index: number
) => {

  const blocks =
    product.value.description

  if (
    index >=
    blocks.length - 1
  ) {

    return

  }

  const current =
    blocks[index]

  blocks.splice(
    index,
    1
  )

  blocks.splice(
    index + 1,
    0,
    current
  )

}


// ============================================================
// TABLE ROW
// ============================================================

const addTableRow = (
  block: any
) => {

  if (
    !Array.isArray(block.rows)
  ) {

    block.rows = []

  }

  block.rows.push(
    block.headers.map(
      () => ""
    )
  )

}


const removeTableRow = (
  block: any,
  rowIndex: number
) => {

  if (
    block.rows.length <= 1
  ) {

    return

  }

  block.rows.splice(
    rowIndex,
    1
  )

}


// ============================================================
// TABLE COLUMN
// ============================================================

const addTableColumn = (
  block: any
) => {

  if (
    !Array.isArray(block.headers)
  ) {

    block.headers = []

  }

  block.headers.push("")


  if (
    !Array.isArray(block.rows)
  ) {

    block.rows = []

  }

  block.rows.forEach(
    (row: string[]) => {

      row.push("")

    }
  )

}


const removeTableColumn = (
  block: any,
  columnIndex: number
) => {

  if (
    block.headers.length <= 1
  ) {

    return

  }

  block.headers.splice(
    columnIndex,
    1
  )


  block.rows.forEach(
    (row: string[]) => {

      row.splice(
        columnIndex,
        1
      )

    }
  )

}


// ============================================================
// ADD PRODUCT
// ============================================================

const addProduct = async () => {

  loading.value = true

  errorMessage.value = ""


  try {

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !product.value.name.trim()
    ) {

      throw new Error(
        "Please enter a product name."
      )

    }


    if (
      !product.value.category_id
    ) {

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


    // ========================================================
    // PRODUCT DATA
    // ========================================================

    const productData = {

      name:
        product.value.name.trim(),

      slug:
        product.value.slug.trim(),

      description:
        product.value.description,

      price:
        Number(product.value.price),

      stock:
        Number(product.value.stock),

      category_id:
        product.value.category_id,

      images:
        product.value.images,

      featured:
        product.value.featured,

      active:
        product.value.active,

    }


    console.log(
      "🔥 ADDING PRODUCT:",
      productData
    )


    // ========================================================
    // CREATE PRODUCT
    // ========================================================

    const response =
      await adminFetch(
        "/api/admin/products",
        {
          method: "POST",

          body: productData,
        }
      )


    console.log(
      "🔥 PRODUCT CREATED:",
      response
    )


    // ========================================================
    // SUCCESS
    // ========================================================

    emit("saved")

  } catch (error: any) {

    console.error(
      "🔥 ADD PRODUCT ERROR:",
      error
    )

    errorMessage.value =
      error?.data?.statusMessage ||
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
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Product Name
          </label>

          <input
            v-model="product.name"
            type="text"
            required
            placeholder="e.g. HP EliteOne 800 G2"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>


        <!-- SLUG -->

        <div>

          <label
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Slug
          </label>

          <input
            v-model="product.slug"
            type="text"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>


        <!-- CATEGORY -->

        <div>

          <label
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Category
          </label>

          <select
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

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- PRICING & STOCK -->
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
            class="block text-sm font-semibold text-gray-700 mb-2"
          >
            Stock Quantity
          </label>

          <input
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
    <!-- IMAGES -->
    <!-- ====================================================== -->

    <div
      class="bg-white border border-gray-200 rounded-xl p-6"
    >

      <div
        class="flex items-center justify-between mb-5"
      >

        <div>

          <h3
            class="text-lg font-bold text-slate-800"
          >
            Product Images
          </h3>

          <p
            class="text-sm text-gray-500 mt-1"
          >
            Upload one or more images for this product.
          </p>

        </div>


        <button
          type="button"
          @click="openImagePicker"
          :disabled="uploadingImages"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
        >
          {{
            uploadingImages
              ? "Uploading..."
              : "Upload Images"
          }}
        </button>

      </div>


      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleImageUpload"
      />


      <!-- IMAGE PREVIEW -->

      <div
        v-if="product.images.length"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      >

        <div
          v-for="(image, index) in product.images"
          :key="image"
          class="relative group bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
        >

          <div
            class="aspect-square flex items-center justify-center"
          >

            <img
              :src="image"
              :alt="`${product.name} image ${index + 1}`"
              class="w-full h-full object-contain p-2"
            />

          </div>


          <!-- IMAGE NUMBER -->

          <span
            class="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
          >
            {{ index + 1 }}
          </span>


          <!-- REMOVE -->

          <button
            type="button"
            @click="removeImage(index)"
            class="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
            title="Remove image"
          >
            ✕
          </button>

        </div>

      </div>


      <!-- NO IMAGES -->

      <div
        v-else
        class="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center"
      >

        <div class="text-4xl mb-3">
          🖼️
        </div>

        <p
          class="font-semibold text-gray-600"
        >
          No product images uploaded
        </p>

        <p
          class="text-sm text-gray-400 mt-1"
        >
          Click Upload Images to select product images.
        </p>

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- DESCRIPTION -->
    <!-- ====================================================== -->

    <div
      class="bg-white border border-gray-200 rounded-xl p-6"
    >

      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5"
      >

        <div>

          <h3
            class="text-lg font-bold text-slate-800"
          >
            Product Description
          </h3>

          <p
            class="text-sm text-gray-500 mt-1"
          >
            Build the product description using headings, paragraphs and tables.
          </p>

        </div>


        <!-- ADD BLOCK -->

        <div class="flex flex-wrap gap-2">

          <button
            type="button"
            @click="addHeading"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg"
          >
            + Heading
          </button>

          <button
            type="button"
            @click="addParagraph"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg"
          >
            + Paragraph
          </button>

          <button
            type="button"
            @click="addTable"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg"
          >
            + Table
          </button>

        </div>

      </div>


      <!-- EMPTY DESCRIPTION -->

      <div
        v-if="product.description.length === 0"
        class="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center"
      >

        <div class="text-4xl mb-3">
          📝
        </div>

        <p
          class="font-semibold text-gray-600"
        >
          No description blocks
        </p>

        <p
          class="text-sm text-gray-400 mt-1"
        >
          Add a heading, paragraph or table above.
        </p>

      </div>


      <!-- DESCRIPTION BLOCKS -->

      <div
        v-else
        class="space-y-5"
      >

        <div
          v-for="(block, index) in product.description"
          :key="index"
          class="border border-gray-200 rounded-xl overflow-hidden"
        >

          <!-- BLOCK HEADER -->

          <div
            class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200"
          >

            <div
              class="flex items-center gap-3"
            >

              <span
                class="text-xs font-bold uppercase text-gray-500"
              >
                {{ block.type }}
              </span>

              <span
                class="text-xs text-gray-400"
              >
                Block {{ index + 1 }}
              </span>

            </div>


            <div
              class="flex items-center gap-1"
            >

              <button
                type="button"
                @click="moveBlockUp(index)"
                :disabled="index === 0"
                class="w-8 h-8 rounded hover:bg-gray-200 disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>

              <button
                type="button"
                @click="moveBlockDown(index)"
                :disabled="index === product.description.length - 1"
                class="w-8 h-8 rounded hover:bg-gray-200 disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>

              <button
                type="button"
                @click="removeDescriptionBlock(index)"
                class="w-8 h-8 rounded hover:bg-red-100 text-red-600"
                title="Remove"
              >
                ✕
              </button>

            </div>

          </div>


          <!-- HEADING -->

          <div
            v-if="block.type === 'heading'"
            class="p-4"
          >

            <label
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Heading
            </label>

            <input
              v-model="block.text"
              type="text"
              placeholder="e.g. Product Description"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          <!-- PARAGRAPH -->

          <div
            v-else-if="block.type === 'paragraph'"
            class="p-4"
          >

            <label
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Paragraph
            </label>

            <textarea
              v-model="block.text"
              rows="5"
              placeholder="Enter product description..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>

          </div>


          <!-- TABLE -->

          <div
            v-else-if="block.type === 'table'"
            class="p-4"
          >

            <div
              class="flex items-center justify-between mb-4"
            >

              <h4
                class="font-semibold text-gray-700"
              >
                Table
              </h4>

              <div
                class="flex gap-2"
              >

                <button
                  type="button"
                  @click="addTableColumn(block)"
                  class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  + Column
                </button>

                <button
                  type="button"
                  @click="addTableRow(block)"
                  class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  + Row
                </button>

              </div>

            </div>


            <!-- TABLE EDITOR -->

            <div
              class="overflow-x-auto border border-gray-200 rounded-lg"
            >

              <table class="w-full">

                <thead>

                  <tr>

                    <th
                      v-for="(header, columnIndex) in block.headers"
                      :key="columnIndex"
                      class="border-b border-gray-200 bg-gray-50 p-2"
                    >

                      <div
                        class="flex items-center gap-2"
                      >

                        <input
                          v-model="block.headers[columnIndex]"
                          type="text"
                          placeholder="Header"
                          class="min-w-0 flex-1 px-2 py-2 border border-gray-300 rounded text-sm"
                        />

                        <button
                          type="button"
                          @click="removeTableColumn(block, columnIndex)"
                          :disabled="block.headers.length <= 1"
                          class="text-red-500 hover:text-red-700 disabled:opacity-30"
                        >
                          ✕
                        </button>

                      </div>

                    </th>

                  </tr>

                </thead>


                <tbody>

                  <tr
                    v-for="(row, rowIndex) in block.rows"
                    :key="rowIndex"
                  >

                    <td
                      v-for="(cell, columnIndex) in row"
                      :key="columnIndex"
                      class="border-t border-gray-200 p-2"
                    >

                      <input
                        v-model="row[columnIndex]"
                        type="text"
                        placeholder="Value"
                        class="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                      />

                    </td>


                    <td
                      v-if="block.rows.length > 1"
                      class="border-t border-gray-200 p-2 w-10"
                    >

                      <button
                        type="button"
                        @click="removeTableRow(block, rowIndex)"
                        class="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

    </div>


    <!-- ====================================================== -->
    <!-- STORE SETTINGS -->
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
        :disabled="loading || uploadingImages"
        class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-slate-700 font-semibold rounded-lg transition"
      >
        Cancel
      </button>


      <button
        type="submit"
        :disabled="loading || uploadingImages"
        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
      >

        {{
          loading
            ? "Adding Product..."
            : "Add Product"
        }}

      </button>

    </div>

  </form>

</template>
