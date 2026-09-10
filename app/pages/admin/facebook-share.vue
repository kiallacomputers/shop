<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Admin Dashboard
          </NuxtLink>
          <h1 class="mt-3 text-3xl font-bold text-slate-900">Facebook Product Share</h1>
          <p class="mt-2 max-w-3xl text-slate-500">
            Choose a product, prepare the post text, then publish it directly to your connected Kialla Computers Facebook Page.
          </p>
        </div>
      </div>

      <div v-if="errorMessage" class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {{ errorMessage }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-bold text-slate-900">Build Facebook Post</h2>

          <div class="mt-5">
            <label class="mb-2 block text-sm font-semibold text-slate-700">Product</label>
            <select
              v-model="selectedProductId"
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select a product…</option>
              <option v-for="product in products" :key="String(product.id)" :value="String(product.id)">
                {{ product.name }} — {{ currency(product.price) }}
              </option>
            </select>
          </div>

          <template v-if="selectedProduct">
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700">Post style</label>
                <select
                  v-model="postStyle"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="standard">Standard product post</option>
                  <option value="short">Short and simple</option>
                  <option value="refurbished">Refurbished highlight</option>
                  <option value="backorder">Back order / availability</option>
                </select>
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700">Product link</label>
                <input
                  :value="productUrl"
                  readonly
                  class="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                />
              </div>
            </div>

            <div class="mt-5">
              <div class="mb-2 flex items-center justify-between gap-3">
                <label class="block text-sm font-semibold text-slate-700">Facebook post text</label>
                <button
                  type="button"
                  class="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  @click="resetMessage"
                >
                  Reset text
                </button>
              </div>

              <textarea
                v-model="message"
                rows="10"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              <p class="mt-2 text-xs text-slate-500">
                Facebook controls the final link preview image/title. Your product page needs to be publicly accessible for the preview to load.
              </p>
            </div>

            <div class="mt-5 rounded-xl border p-4"
              :class="facebookStatus?.configured ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-bold" :class="facebookStatus?.configured ? 'text-green-800' : 'text-amber-900'">
                    {{ facebookStatus?.configured ? `Connected: ${facebookStatus.pageName}` : "Facebook Page not connected" }}
                  </p>
                  <p class="mt-1 text-sm" :class="facebookStatus?.configured ? 'text-green-700' : 'text-amber-800'">
                    {{ facebookStatus?.message || "Checking Facebook Page connection…" }}
                  </p>
                </div>
                <button type="button" class="text-sm font-semibold text-blue-700 hover:underline" @click="loadFacebookStatus">
                  Check
                </button>
              </div>
            </div>

            <div v-if="publishSuccess" class="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
              {{ publishSuccess }}
            </div>

            <div class="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                :disabled="publishing || !facebookStatus?.configured"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                @click="publishToFacebook"
              >
                <span class="text-lg font-black">f</span>
                {{ publishing ? "Posting…" : "Post to Kialla Computers Page" }}
              </button>

              <button
                type="button"
                class="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                @click="copyPost"
              >
                {{ copied ? "Copied!" : "Copy Post Text" }}
              </button>

              <a
                :href="productUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Product
              </a>
            </div>

            <div class="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Direct publishing uses your Facebook Page access token on the server. The token is never sent to the browser. Facebook will build the link card from the product page, including the product image.
            </div>
          </template>

          <div v-else-if="loading" class="mt-6 rounded-xl bg-slate-50 p-8 text-center text-slate-500">
            Loading products…
          </div>

          <div v-else class="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Select a product to prepare a Facebook post.
          </div>
        </section>

        <aside>
          <div class="sticky top-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-4">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Preview</p>
              <h2 class="mt-1 font-bold text-slate-900">Facebook Post</h2>
            </div>

            <template v-if="selectedProduct">
              <div class="p-5">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                    KC
                  </div>
                  <div>
                    <p class="font-bold text-slate-900">Kialla Computers</p>
                    <p class="text-xs text-slate-500">Sponsored-style preview • Public</p>
                  </div>
                </div>

                <p class="mt-4 whitespace-pre-line text-sm leading-6 text-slate-800">{{ message }}</p>
              </div>

              <div class="border-y border-slate-200 bg-slate-100">
                <div class="flex aspect-[1.91/1] items-center justify-center overflow-hidden">
                  <img
                    v-if="firstImage(selectedProduct)"
                    :src="firstImage(selectedProduct)"
                    :alt="selectedProduct.name"
                    class="h-full w-full object-contain bg-white"
                  />
                  <div v-else class="text-sm text-slate-400">No product image</div>
                </div>
              </div>

              <div class="p-5">
                <p class="text-xs uppercase tracking-wide text-slate-500">shop.kiallacomputers.com.au</p>
                <h3 class="mt-1 text-lg font-bold text-slate-900">{{ selectedProduct.name }}</h3>
                <p class="mt-1 font-bold text-blue-700">{{ currency(selectedProduct.price) }}</p>
                <p v-if="selectedProduct.categories?.name" class="mt-1 text-sm text-slate-500">
                  {{ selectedProduct.categories.name }}
                </p>
              </div>
            </template>

            <div v-else class="p-10 text-center text-sm text-slate-400">
              Product preview will appear here.
            </div>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });

type Product = {
  id: string | number;
  name: string;
  slug?: string | null;
  product_code?: string | null;
  price?: number | string | null;
  stock?: number | string | null;
  active?: boolean | null;
  refurbished?: boolean | null;
  images?: string[] | string | null;
  categories?: { name?: string | null } | null;
};

const route = useRoute();
const { adminFetch } = useAdminFetch();

const products = ref<Product[]>([]);
const selectedProductId = ref("");
const loading = ref(true);
const errorMessage = ref("");
const postStyle = ref("standard");
const message = ref("");
const copied = ref(false);
const publishing = ref(false);
const publishSuccess = ref("");
const facebookStatus = ref<any>(null);

const selectedProduct = computed(() =>
  products.value.find((product) => String(product.id) === selectedProductId.value) || null,
);

const productUrl = computed(() => {
  const slug = selectedProduct.value?.slug;
  return slug ? `https://shop.kiallacomputers.com.au/product/${encodeURIComponent(slug)}` : "";
});

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));

const firstImage = (product: Product | null) => {
  if (!product?.images) return "";
  if (Array.isArray(product.images)) return product.images.find(Boolean) || "";
  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) return parsed.find(Boolean) || "";
    } catch {
      return product.images;
    }
  }
  return "";
};

const buildMessage = () => {
  const product = selectedProduct.value;
  if (!product) return "";

  const price = currency(product.price);
  const category = product.categories?.name ? `\n${product.categories.name}` : "";
  const code = product.product_code ? `\nProduct code: ${product.product_code}` : "";

  if (postStyle.value === "short") {
    return `${product.name}\n${price}${code}\n\nAvailable now from Kialla Computers.`;
  }

  if (postStyle.value === "refurbished") {
    return `♻️ Refurbished at Kialla Computers\n\n${product.name}\n${price}${code}${category}\n\nA great-value option that is ready for its next home. Check the full details and availability on our website.`;
  }

  if (postStyle.value === "backorder") {
    return `🛒 Available to order from Kialla Computers\n\n${product.name}\n${price}${code}${category}\n\nIf stock is currently unavailable, you can still place a back order. Most back-order items are normally due within 3–4 days.`;
  }

  return `🖥️ Available from Kialla Computers\n\n${product.name}\n${price}${code}${category}\n\nView the full product details, availability and specifications on our website.`;
};

const resetMessage = () => {
  message.value = buildMessage();
};

watch([selectedProductId, postStyle], resetMessage);

const copyPost = async () => {
  if (!message.value) return;
  try {
    await navigator.clipboard.writeText(`${message.value}\n\n${productUrl.value}`);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1800);
  } catch {
    copied.value = false;
  }
};

const loadFacebookStatus = async () => {
  try {
    facebookStatus.value = await adminFetch<any>("/api/admin/facebook/status");
  } catch (error: any) {
    facebookStatus.value = {
      configured: false,
      message: error?.data?.statusMessage || error?.message || "Unable to check Facebook Page connection.",
    };
  }
};

const publishToFacebook = async () => {
  if (!selectedProduct.value || !productUrl.value || publishing.value) return;

  publishing.value = true;
  publishSuccess.value = "";
  errorMessage.value = "";

  try {
    const result = await adminFetch<any>("/api/admin/facebook/publish", {
      method: "POST",
      body: {
        productId: selectedProduct.value.id,
        message: message.value,
        productUrl: productUrl.value,
        imageUrl: firstImage(selectedProduct.value),
      },
    });

    publishSuccess.value = result?.message || "Product posted to Facebook successfully.";
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Facebook could not publish the product.";
  } finally {
    publishing.value = false;
  }
};

const loadProducts = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await adminFetch<Product[]>("/api/admin/products");
    products.value = (data || [])
      .filter((product) => product.active !== false && product.slug)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const requested = String(route.query.product || "");
    if (requested && products.value.some((product) => String(product.id) === requested)) {
      selectedProductId.value = requested;
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to load products.";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadProducts(), loadFacebookStatus()]);
});
</script>
