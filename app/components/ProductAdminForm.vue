<template>
  <main class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-7">
      <NuxtLink to="/admin/products" class="text-sm font-semibold text-blue-600 hover:text-blue-700">
        ← Manage Products
      </NuxtLink>
      <h1 class="text-3xl font-bold text-slate-900 mt-2">
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

          <label class="md:col-span-2">
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Short Description</span>
            <textarea v-model="form.blurb" rows="3" class="input" placeholder="Short description shown on product cards"></textarea>
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Pricing & Stock</h2>

        <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Price *</span>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-slate-500">$</span>
              <input v-model="form.price" required min="0" step="0.01" type="number" class="input pl-7" />
            </div>
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Old Price</span>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-slate-500">$</span>
              <input v-model="form.oldPrice" min="0" step="0.01" type="number" class="input pl-7" />
            </div>
          </label>

          <label>
            <span class="mb-1.5 block text-sm font-semibold text-slate-700">Stock *</span>
            <input v-model="form.stock" required min="0" step="1" type="number" class="input" />
          </label>
        </div>

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

        <div v-if="imageUrls.length" class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(image, index) in imageUrls"
            :key="`${image}-${index}`"
            class="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div class="aspect-square bg-slate-50">
              <img :src="image" :alt="`Product image ${index + 1}`" class="h-full w-full object-contain p-2" />
            </div>
            <div class="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
              <span class="truncate text-xs text-slate-500">Image {{ index + 1 }}</span>
              <button
                type="button"
                class="text-xs font-semibold text-red-600 hover:text-red-700"
                @click="removeImage(index)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Product Description JSON</h2>
        <p class="text-sm text-slate-500 mt-1">This uses the structured JSON format already displayed by your product page.</p>

        <textarea v-model="descriptionText" rows="16" class="input mt-5 font-mono text-sm"></textarea>
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
const descriptionText = ref("[]");

const form = reactive({
  name: "",
  slug: "",
  category_id: "",
  blurb: "",
  price: "0.00",
  oldPrice: "",
  stock: "0",
  active: true,
  featured: false,
  refurbished: false,
});

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

const removeImage = (index: number) => {
  imageUrls.value.splice(index, 1);
};

const loadForm = async () => {
  errorMessage.value = "";

  try {
    categories.value = await adminFetch("/api/admin/categories");

    if (props.mode === "edit") {
      const product: any = await adminFetch(`/api/admin/products/${props.productId}`);

      form.name = product.name || "";
      form.slug = product.slug || "";
      form.category_id = product.category_id == null ? "" : String(product.category_id);
      form.blurb = product.blurb || "";
      form.price = product.price == null ? "0.00" : String(product.price);
      form.oldPrice = product.oldPrice == null ? "" : String(product.oldPrice);
      form.stock = product.stock == null ? "0" : String(product.stock);
      form.active = product.active !== false;
      form.featured = product.featured === true;
      form.refurbished = product.refurbished === true;

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

      descriptionText.value = JSON.stringify(product.description ?? [], null, 2);
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
    let description: unknown = [];

    try {
      description = descriptionText.value.trim() ? JSON.parse(descriptionText.value) : [];
    } catch {
      throw new Error("Product Description JSON is not valid JSON.");
    }

    const payload = {
      ...form,
      category_id: form.category_id || null,
      price: Number(form.price),
      oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
      stock: Number(form.stock),
      images: imageUrls.value,
      description,
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
