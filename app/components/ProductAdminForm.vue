<template>
  <main class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-7">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
          ← Admin Dashboard
        </NuxtLink>
        <NuxtLink to="/admin/products" class="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Manage Products
        </NuxtLink>
      </div>
      <h1 class="text-3xl font-bold text-slate-900 mt-3">
        {{ mode === "create" ? "Add Product" : "Edit Product" }}
      </h1>
      <p class="text-slate-500 mt-1">
        {{ mode === "create" ? "Create a new product for your online store." : "Update the product details, pricing and stock." }}
      </p>
    </div>

    <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
      Loading product...
    </div>

    <form v-else class="space-y-6" @submit.prevent="saveProduct">
      <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <div v-if="mode === 'edit'" class="flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ saving ? "Saving..." : "Save Changes" }}
        </button>
      </div>

      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Product Details</h2>

        <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <label class="md:col-span-2">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Product Name *</span>
            <input v-model="form.name" required type="text" class="input" @input="autoSlug" />
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Slug *</span>
            <input v-model="form.slug" required type="text" class="input" />
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Category</span>
            <select v-model="form.category_id" class="input">
              <option value="">Uncategorised</option>
              <option v-for="category in categories" :key="category.id" :value="String(category.id)">
                {{ category.name }}
              </option>
            </select>
          </label>


          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Product Code / SKU {{ form.has_variants ? "(optional base code)" : "*" }}</span>
            <input v-model="form.product_code" :required="!form.has_variants" type="text" class="input uppercase" placeholder="e.g. KC-1001" />
          </label>

          <label class="flex items-end pb-2">
            <span class="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input v-model="form.has_variants" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
              This product has variants / options
            </span>
          </label>

          <label class="md:col-span-2">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Short Description</span>
            <textarea v-model="form.blurb" rows="3" class="input" placeholder="Short description shown on product cards"></textarea>
          </label>
        </div>
      </section>

      <section v-if="form.has_variants" class="rounded-xl border border-cyan-200 bg-cyan-50 p-5 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Product Variants</h2>
            <p class="mt-1 text-sm text-slate-600">Each colour or option gets its own product code, price and stock level.</p>
          </div>
          <NuxtLink v-if="mode === 'edit' && productId" :to="`/admin/products/${productId}/variants`" class="rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-800">Manage Variants</NuxtLink>
          <span v-else class="text-sm font-semibold text-cyan-800">Create the product first, then add its variants.</span>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Pricing & Stock</h2>

        <p class="mt-1 text-sm text-slate-500">
          Enter your supplier buy price excluding GST. The Standard pricing level is used automatically for the public Sell Price, while RRP keeps its own product-specific markup. Final prices include GST and are rounded to the nearest dollar.
        </p>

        <p v-if="form.has_variants" class="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          This is a variant product. The base price is used for catalogue display/fallback only; each variant has its own sell price, RRP, product code and stock level in Manage Variants.
        </p>

        <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Buy Price ex GST *</span>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-slate-500">$</span>
              <input v-model="form.buy_price_ex_gst" required min="0" step="0.01" type="number" class="input !pl-6" />
            </div>
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">RRP Markup % *</span>
            <div class="relative">
              <input v-model="form.rrp_markup_percent" required min="0" step="0.01" type="number" class="input pr-9" />
              <span class="absolute right-3 top-2.5 text-slate-500">%</span>
            </div>
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Stock *</span>
            <input v-model="form.stock" required min="0" step="1" type="number" class="input" />
          </label>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-blue-700">Standard Sell Price</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ currency(calculatedSellPrice) }}</p>
            <p class="mt-1 text-xs text-slate-600">{{ standardPricingLevelName }} markup {{ standardMarkupPercent }}% · GST inclusive · rounded to nearest dollar · {{ currency(calculatedSellPriceExGst) }} ex GST before rounding</p>
          </div>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-600">Calculated RRP</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ currency(calculatedRrpPrice) }}</p>
            <p class="mt-1 text-xs text-slate-600">GST inclusive · rounded to nearest dollar · {{ currency(calculatedRrpPriceExGst) }} ex GST before rounding</p>
          </div>
        </div>

        <p v-if="rrpBelowSell" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          RRP is currently lower than the Sell Price. Increase the RRP markup percentage if you want the RRP shown as a higher comparison price.
        </p>

        <div class="mt-5 flex flex-wrap gap-5">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Active
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input v-model="form.featured" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Featured
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input v-model="form.refurbished" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Refurbished
          </label>
        </div>
      </section>


      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Related Products</h2>
            <p class="mt-1 text-sm text-slate-500">Choose up to four products to show first in <strong>You May Also Like</strong>. Any empty spots are filled automatically from the same category, then the same main category.</p>
          </div>
          <span class="text-sm font-semibold text-slate-500">{{ relatedProductIds.length }}/4 selected</span>
        </div>

        <div v-if="selectedRelatedProducts.length" class="mt-5 grid gap-3 sm:grid-cols-2">
          <div v-for="item in selectedRelatedProducts" :key="item.id" class="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-blue-100 bg-white">
              <img v-if="firstProductImage(item)" :src="firstProductImage(item)" :alt="item.name" class="h-full w-full object-contain p-1" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-slate-900">{{ item.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ item.product_code || item.slug }}</p>
            </div>
            <button type="button" class="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50" @click="removeRelatedProduct(Number(item.id))">Remove</button>
          </div>
        </div>

        <div class="mt-5">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Search products</span>
            <input v-model="relatedSearch" type="search" class="input" placeholder="Search by product name, code or category..." />
          </label>
        </div>

        <div v-if="relatedSearch.trim()" class="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          <button
            v-for="item in relatedSearchResults"
            :key="item.id"
            type="button"
            class="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="relatedProductIds.length >= 4"
            @click="addRelatedProduct(Number(item.id))"
          >
            <div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <img v-if="firstProductImage(item)" :src="firstProductImage(item)" :alt="item.name" class="h-full w-full object-contain p-1" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900">{{ item.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ item.product_code || 'No product code' }}<span v-if="item.categories?.name"> · {{ item.categories.name }}</span></p>
            </div>
            <span class="text-xs font-bold text-blue-600">Add</span>
          </button>
          <p v-if="!relatedSearchResults.length" class="px-4 py-4 text-sm text-slate-500">No matching products available.</p>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Freight Measurements</h2>
        <p class="mt-1 text-sm text-slate-500">
          Used to calculate Australia Post parcel rates. Enter the packed weight and dimensions for one unit.
        </p>

        <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">
              Weight (kg) *
            </span>
            <input
              v-model="form.weight_kg"
              required
              min="0.001"
              step="0.001"
              type="number"
              class="input"
            />
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">
              Length (cm) *
            </span>
            <input
              v-model="form.length_cm"
              required
              min="0.1"
              step="0.1"
              type="number"
              class="input"
            />
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">
              Width (cm) *
            </span>
            <input
              v-model="form.width_cm"
              required
              min="0.1"
              step="0.1"
              type="number"
              class="input"
            />
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">
              Height (cm) *
            </span>
            <input
              v-model="form.height_cm"
              required
              min="0.1"
              step="0.1"
              type="number"
              class="input"
            />
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Product Images</h2>
            <p class="text-sm text-slate-500 mt-1">Select one or more images. They are uploaded to the Supabase Storage bucket <strong>products</strong>.</p>
          </div>
          <span v-if="imageUrls.length" class="text-sm font-semibold text-slate-600">{{ imageUrls.length }} image{{ imageUrls.length === 1 ? "" : "s" }}</span>
        </div>

        <div class="mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            class="hidden"
            @change="handleImageSelection"
          />

          <div class="text-sm text-slate-600">
            <p class="font-semibold text-slate-800">Choose product images</p>
            <p class="mt-1">JPG, PNG, WEBP or GIF. You can select multiple files at once.</p>
          </div>

          <button
            type="button"
            :disabled="uploadingImages"
            class="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            @click="fileInput?.click()"
          >
            {{ uploadingImages ? "Uploading..." : "Select Images" }}
          </button>
        </div>

        <div v-if="uploadError" class="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ uploadError }}
        </div>

        <div v-if="uploadingImages" class="mt-4">
          <div class="mb-1 flex items-center justify-between text-sm text-slate-600">
            <span>Uploading images...</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-200">
            <div class="h-full bg-blue-600 transition-all" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
        </div>

        <div v-if="imageUrls.length" class="mt-5">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm text-slate-600">
              Drag images to rearrange them, or use the arrow buttons. <strong>Image 1 is the main product image.</strong>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            <div
              v-for="(image, index) in imageUrls"
              :key="`${image}-${index}`"
              draggable="true"
              class="group relative overflow-hidden rounded-xl border bg-white transition"
              :class="draggedImageIndex === index
                ? 'border-blue-500 opacity-50 ring-2 ring-blue-200'
                : dragOverImageIndex === index
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200'"
              @dragstart="startImageDrag(index, $event)"
              @dragover.prevent="dragOverImage(index)"
              @drop.prevent="dropImage(index)"
              @dragend="endImageDrag"
            >
              <div class="absolute left-2 top-2 z-10 flex items-center gap-1">
                <span
                  v-if="index === 0"
                  class="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow"
                >
                  Main
                </span>
                <span class="cursor-move rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-slate-600 shadow" title="Drag to rearrange">
                  ⋮⋮
                </span>
              </div>

              <div class="aspect-square bg-slate-50">
                <img :src="image" :alt="`Product image ${index + 1}`" class="h-full w-full object-contain p-2" draggable="false" />
              </div>

              <div class="border-t border-slate-200 px-3 py-2">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <span class="truncate text-xs font-semibold text-slate-600">
                    Image {{ index + 1 }}<span v-if="index === 0"> · Main</span>
                  </span>
                  <button
                    type="button"
                    class="text-xs font-semibold text-red-600 hover:text-red-700"
                    @click="removeImage(index)"
                  >
                    Remove
                  </button>
                </div>

                <div class="flex gap-2">
                  <button
                    type="button"
                    :disabled="index === 0"
                    class="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Move image left"
                    title="Move earlier"
                    @click="moveImage(index, index - 1)"
                  >
                    ← Earlier
                  </button>
                  <button
                    type="button"
                    :disabled="index === imageUrls.length - 1"
                    class="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Move image right"
                    title="Move later"
                    @click="moveImage(index, index + 1)"
                  >
                    Later →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Product Description</h2>
        <p class="text-sm text-slate-500 mt-1">Build the product page using headings, paragraphs, lists, tables and callout blocks. The JSON is generated automatically.</p>

        <div class="mt-5">
          <ProductDescriptionBuilder v-model="descriptionBlocks" />
        </div>
      </section>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <NuxtLink to="/admin/products" class="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Cancel
        </NuxtLink>
        <button type="submit" :disabled="saving" class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {{ saving ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes" }}
        </button>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
const props = defineProps<{
  mode: "create" | "edit";
  productId?: string;
}>();

const { adminFetch } = useAdminFetch();
const router = useRouter();

const categories = ref<Array<{ id: string | number; name: string }>>([]);
const loading = ref(props.mode === "edit");
const saving = ref(false);
const errorMessage = ref("");
const slugTouched = ref(props.mode === "edit");
const imageUrls = ref<string[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadingImages = ref(false);
const uploadProgress = ref(0);
const uploadError = ref("");
const draggedImageIndex = ref<number | null>(null);
const dragOverImageIndex = ref<number | null>(null);
const descriptionBlocks = ref<any[]>([]);
const standardMarkupPercent = ref(20);
const standardPricingLevelName = ref("Standard");
const allProducts = ref<any[]>([]);
const relatedProductIds = ref<number[]>([]);
const relatedSearch = ref("");

const form = reactive({
  name: "",
  slug: "",
  category_id: "",
  blurb: "",
  product_code: "",
  has_variants: false,
  buy_price_ex_gst: "",
  rrp_markup_percent: "",
  stock: "0",
  weight_kg: "1.000",
  length_cm: "30.0",
  width_cm: "20.0",
  height_cm: "10.0",
  active: true,
  featured: false,
  refurbished: false,
});


const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundToNearestFive = (value: number) => {
  if (value <= 0) return 0;
  return Math.max(1, Math.round(value));
};
const numeric = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculatedSellPriceExGst = computed(() =>
  roundMoney(numeric(form.buy_price_ex_gst) * (1 + standardMarkupPercent.value / 100)),
);
const calculatedSellPrice = computed(() => roundToNearestFive(calculatedSellPriceExGst.value * 1.1));
const calculatedRrpPriceExGst = computed(() =>
  roundMoney(numeric(form.buy_price_ex_gst) * (1 + numeric(form.rrp_markup_percent) / 100)),
);
const calculatedRrpPrice = computed(() => roundToNearestFive(calculatedRrpPriceExGst.value * 1.1));
const rrpBelowSell = computed(() => calculatedRrpPrice.value > 0 && calculatedRrpPrice.value < calculatedSellPrice.value);
const currency = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value || 0);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const autoSlug = () => {
  if (!slugTouched.value || props.mode === "create") {
    form.slug = slugify(form.name);
  }
};

watch(() => form.slug, (value, oldValue) => {
  if (oldValue && value !== slugify(form.name)) slugTouched.value = true;
});

const currentProductId = computed(() => Number(props.productId || 0));
const selectableProducts = computed(() => allProducts.value.filter((item) => Number(item.id) !== currentProductId.value));
const selectedRelatedProducts = computed(() => relatedProductIds.value
  .map((id) => selectableProducts.value.find((item) => Number(item.id) === Number(id)))
  .filter(Boolean));
const relatedSearchResults = computed(() => {
  const term = relatedSearch.value.trim().toLowerCase();
  if (!term) return [];
  return selectableProducts.value
    .filter((item) => !relatedProductIds.value.includes(Number(item.id)))
    .filter((item) => [item.name, item.product_code, item.slug, item.categories?.name]
      .some((value) => String(value || "").toLowerCase().includes(term)))
    .slice(0, 20);
});
const firstProductImage = (item: any) => {
  const source = item?.images;
  if (Array.isArray(source)) return source.find(Boolean) || "";
  if (typeof source === "string") {
    try {
      const parsed = JSON.parse(source);
      return Array.isArray(parsed) ? parsed.find(Boolean) || "" : "";
    } catch {
      return source.trim();
    }
  }
  return "";
};
const addRelatedProduct = (id: number) => {
  if (!Number.isInteger(id) || id <= 0 || relatedProductIds.value.includes(id) || relatedProductIds.value.length >= 4) return;
  relatedProductIds.value.push(id);
  relatedSearch.value = "";
};
const removeRelatedProduct = (id: number) => {
  relatedProductIds.value = relatedProductIds.value.filter((item) => item !== id);
};

const handleImageSelection = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);

  if (!files.length) return;

  uploadError.value = "";
  uploadingImages.value = true;
  uploadProgress.value = 0;

  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const formData = new FormData();
      formData.append("file", file);

      const result = await adminFetch<{ url: string; path: string }>(
        "/api/admin/products/upload-image",
        {
          method: "POST",
          body: formData,
        },
      );

      imageUrls.value.push(result.url);
      uploadProgress.value = Math.round(((index + 1) / files.length) * 100);
    }
  } catch (error: any) {
    uploadError.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to upload image.";
  } finally {
    uploadingImages.value = false;
    if (input) input.value = "";
  }
};

const moveImage = (fromIndex: number, toIndex: number) => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= imageUrls.value.length ||
    toIndex >= imageUrls.value.length
  ) return;

  const [image] = imageUrls.value.splice(fromIndex, 1);
  imageUrls.value.splice(toIndex, 0, image);
};

const startImageDrag = (index: number, event: DragEvent) => {
  draggedImageIndex.value = index;
  dragOverImageIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
};

const dragOverImage = (index: number) => {
  if (draggedImageIndex.value !== null) dragOverImageIndex.value = index;
};

const dropImage = (toIndex: number) => {
  const fromIndex = draggedImageIndex.value;
  if (fromIndex !== null) moveImage(fromIndex, toIndex);
  draggedImageIndex.value = null;
  dragOverImageIndex.value = null;
};

const endImageDrag = () => {
  draggedImageIndex.value = null;
  dragOverImageIndex.value = null;
};

const removeImage = (index: number) => {
  imageUrls.value.splice(index, 1);
};

const loadForm = async () => {
  errorMessage.value = "";

  try {
    const [categoryRows, standardPricing, productRows] = await Promise.all([
      adminFetch("/api/admin/categories"),
      adminFetch<{ key: string; name: string; markup_percent: number }>("/api/admin/pricing/standard"),
      adminFetch("/api/admin/products"),
    ]);
    categories.value = categoryRows as Array<{ id: string | number; name: string }>;
    allProducts.value = Array.isArray(productRows) ? productRows as any[] : [];
    standardPricingLevelName.value = standardPricing?.name || "Standard";
    const loadedStandardMarkup = Number(standardPricing?.markup_percent);
    standardMarkupPercent.value = Number.isFinite(loadedStandardMarkup) ? loadedStandardMarkup : 20;

    if (props.mode === "edit") {
      const product: any = await adminFetch(`/api/admin/products/${props.productId}`);

      form.name = product.name || "";
      form.slug = product.slug || "";
      form.category_id = product.category_id == null ? "" : String(product.category_id);
      form.blurb = product.blurb || "";
      form.product_code = product.product_code || "";
      form.has_variants = product.has_variants === true;
      form.buy_price_ex_gst = product.buy_price_ex_gst == null ? "" : String(product.buy_price_ex_gst);
      form.rrp_markup_percent = product.rrp_markup_percent == null ? "" : String(product.rrp_markup_percent);
      form.stock = product.stock == null ? "0" : String(product.stock);
      form.weight_kg = product.weight_kg == null ? "1.000" : String(product.weight_kg);
      form.length_cm = product.length_cm == null ? "30.0" : String(product.length_cm);
      form.width_cm = product.width_cm == null ? "20.0" : String(product.width_cm);
      form.height_cm = product.height_cm == null ? "10.0" : String(product.height_cm);
      form.active = product.active !== false;
      form.featured = product.featured === true;
      form.refurbished = product.refurbished === true;
      relatedProductIds.value = Array.isArray(product.related_product_ids)
        ? product.related_product_ids.map((id: any) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0).slice(0, 4)
        : [];

      let images: string[] = [];
      if (Array.isArray(product.images)) images = product.images;
      else if (typeof product.images === "string") {
        try {
          const parsed = JSON.parse(product.images);
          images = Array.isArray(parsed) ? parsed : [];
        } catch {
          images = product.images.trim() ? [product.images.trim()] : [];
        }
      }
      imageUrls.value = images;

      let description = product.description ?? [];
      if (typeof description === "string") {
        try { description = JSON.parse(description); } catch { description = []; }
      }
      descriptionBlocks.value = Array.isArray(description) ? description : [];
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Unable to load product details.";
  } finally {
    loading.value = false;
  }
};

const saveProduct = async () => {
  errorMessage.value = "";
  saving.value = true;

  try {
    const description = descriptionBlocks.value;

    const payload = {
      ...form,
      category_id: form.category_id || null,
      buy_price_ex_gst: Number(form.buy_price_ex_gst),
      rrp_markup_percent: Number(form.rrp_markup_percent),
      stock: Number(form.stock),
      weight_kg: Number(form.weight_kg),
      length_cm: Number(form.length_cm),
      width_cm: Number(form.width_cm),
      height_cm: Number(form.height_cm),
      images: imageUrls.value,
      description,
      related_product_ids: relatedProductIds.value,
    };

    if (props.mode === "create") {
      await adminFetch("/api/admin/products", {
        method: "POST",
        body: payload,
      });
    } else {
      await adminFetch(`/api/admin/products/${props.productId}`, {
        method: "PUT",
        body: payload,
      });
    }

    await router.push("/admin/products");
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to save product.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    saving.value = false;
  }
};

onMounted(loadForm);
</script>

<style scoped>
.input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0.625rem 0.75rem;
  color: rgb(15 23 42);
  outline: none;
}

.input:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(219 234 254);
}
</style>
