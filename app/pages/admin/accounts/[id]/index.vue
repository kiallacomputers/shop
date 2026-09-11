<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-8">
        <NuxtLink to="/admin/accounts" class="text-sm font-bold text-blue-600 hover:text-blue-700">← Account Management</NuxtLink>
        <div v-if="customer" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm font-bold uppercase tracking-wide text-violet-600">Customer Profile</p>
            <h1 class="mt-1 text-3xl font-black text-slate-900">{{ customer.profile.display_name || customer.account.display_name || customer.account.email }}</h1>
            <p class="mt-1 text-slate-500">{{ customer.account.email }}</p>
          </div>
          <span class="w-fit rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">{{ customer.pricingLevel.name }}</span>
        </div>
      </div>

      <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">Loading customer profile...</div>
      <div v-else-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{{ errorMessage }}</div>

      <template v-else-if="customer">
        <div v-if="successMessage" class="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{{ successMessage }}</div>

        <section class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div class="card"><p class="label">Orders</p><p class="value">{{ customer.stats.orders }}</p></div>
          <div class="card"><p class="label">Total Spent</p><p class="value text-2xl">{{ currency(customer.stats.totalSpent) }}</p></div>
          <div class="card"><p class="label">Wishlist</p><p class="value">{{ customer.stats.wishlist }}</p></div>
          <div class="card"><p class="label">Quotes</p><p class="value">{{ customer.stats.quotes }}</p></div>
          <div class="card"><p class="label">Last Order</p><p class="mt-2 font-bold text-slate-800">{{ customer.stats.lastOrderAt ? formatDate(customer.stats.lastOrderAt) : '—' }}</p></div>
        </section>

        <section class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="card">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-lg font-black text-slate-900">Customer Details</h2>
              <span class="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{{ customer.pricingLevel.name }}</span>
            </div>
            <label class="mt-5 block">
              <span class="field-label">Pricing Level</span>
              <select v-model="selectedPricingLevel" class="input" @change="changePricingLevel">
                <option v-for="level in customer.pricingLevels" :key="level.key" :value="level.key">
                  {{ level.name }} ({{ Number(level.markup_percent) }}%)
                </option>
              </select>
            </label>
            <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label><span class="field-label">Name</span><input v-model="form.display_name" class="input" /></label>
              <label><span class="field-label">Business</span><input v-model="form.business_name" class="input" /></label>
              <label><span class="field-label">Phone</span><input v-model="form.phone" class="input" /></label>
              <label><span class="field-label">Preferred Contact</span><select v-model="form.preferred_contact" class="input"><option value="email">Email</option><option value="phone">Phone</option></select></label>
            </div>
            <div class="mt-5 grid grid-cols-1 gap-2 text-sm">
              <label class="flex items-center gap-2"><input v-model="form.order_updates" type="checkbox" /> Order updates</label>
              <label class="flex items-center gap-2"><input v-model="form.back_in_stock_updates" type="checkbox" /> Back-in-stock notices</label>
              <label class="flex items-center gap-2"><input v-model="form.marketing_updates" type="checkbox" /> Specials/new product emails</label>
            </div>
          </div>

          <div class="card">
            <h2 class="text-lg font-black text-slate-900">Private CRM Notes</h2>
            <p class="mt-1 text-sm text-slate-500">Only SuperAdmins can see these notes and tags.</p>
            <label class="mt-5 block"><span class="field-label">Customer Tags</span><input v-model="tagsText" class="input" placeholder="Business, VIP, School" /></label>
            <label class="mt-4 block"><span class="field-label">Private Notes</span><textarea v-model="form.admin_notes" rows="7" class="input resize-y" placeholder="Internal customer notes..."></textarea></label>
            <div class="mt-5 text-right"><button type="button" :disabled="saving" class="rounded-lg bg-slate-900 px-5 py-2.5 font-bold text-white hover:bg-slate-700 disabled:opacity-50" @click="saveProfile">{{ saving ? 'Saving...' : 'Save Customer Profile' }}</button></div>
          </div>
        </section>

        <section class="mb-6 card">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-black text-slate-900">Customer Activity</h2>
              <p class="mt-1 text-sm text-slate-500">Orders, quotes, wishlist and stock notification activity in one timeline.</p>
            </div>
            <select v-model="timelineFilter" class="input w-full sm:w-48">
              <option value="all">All activity</option>
              <option value="order">Orders</option>
              <option value="quote">Quotes</option>
              <option value="wishlist">Wishlist</option>
              <option value="stock">Stock alerts</option>
              <option value="email">Emails</option>
              <option value="profile">Profile</option>
              <option value="pricing">Pricing</option>
            </select>
          </div>

          <div v-if="filteredTimeline.length" class="mt-6">
            <div v-for="(event, index) in filteredTimeline" :key="event.id" class="relative flex gap-4 pb-6 last:pb-0">
              <div v-if="index < filteredTimeline.length - 1" class="absolute left-[17px] top-9 h-[calc(100%-1rem)] w-px bg-slate-200"></div>
              <div class="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base" :class="timelineIconClass(event.type)">{{ timelineIcon(event.type) }}</div>
              <div class="min-w-0 flex-1 pt-0.5">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <NuxtLink v-if="event.href" :to="event.href" class="font-bold text-slate-900 hover:text-blue-600">{{ event.title }}</NuxtLink>
                    <p v-else class="font-bold text-slate-900">{{ event.title }}</p>
                    <p v-if="event.detail" class="mt-1 text-sm text-slate-600">{{ event.detail }}</p>
                  </div>
                  <time class="shrink-0 text-xs font-medium text-slate-400">{{ formatDateTime(event.at) }}</time>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="mt-4 text-sm text-slate-500">No activity matches this filter.</p>
        </section>

        <section class="mb-6 card">
          <h2 class="text-lg font-black text-slate-900">Delivery Addresses</h2>
          <div v-if="customer.addresses.length" class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="address in customer.addresses" :key="address.id" class="rounded-xl border border-slate-200 p-4">
              <div class="flex items-center gap-2"><p class="font-bold">{{ address.label || 'Address' }}</p><span v-if="address.is_primary" class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">Primary</span></div>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ address.full_name }}<br>{{ address.address_line_1 }}<template v-if="address.address_line_2"><br>{{ address.address_line_2 }}</template><br>{{ address.suburb }} {{ address.state }} {{ address.postcode }}<br><span v-if="address.phone">{{ address.phone }}</span></p>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">No saved delivery addresses.</p>
        </section>

        <section class="mb-6 card overflow-hidden">
          <h2 class="text-lg font-black text-slate-900">Order History</h2>
          <div v-if="customer.orders.length" class="mt-4 overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Order</th><th class="px-4 py-3">Date</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Tracking</th><th class="px-4 py-3 text-right">Total</th></tr></thead>
              <tbody class="divide-y divide-slate-100"><tr v-for="order in customer.orders" :key="order.id"><td class="px-4 py-3"><NuxtLink :to="`/admin/orders/${order.id}`" class="font-bold text-blue-600">#{{ order.id }}</NuxtLink></td><td class="px-4 py-3">{{ formatDate(order.created_at) }}</td><td class="px-4 py-3 capitalize">{{ order.status }}</td><td class="px-4 py-3">{{ order.tracking_number || '—' }}</td><td class="px-4 py-3 text-right font-bold">{{ currency(order.total) }}</td></tr></tbody>
            </table>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">No orders.</p>
        </section>

        <section class="mb-6 card">
          <h2 class="text-lg font-black text-slate-900">Wishlist</h2>
          <div v-if="customer.wishlist.length" class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <NuxtLink v-for="item in customer.wishlist" :key="item.id" :to="`/product/${item.slug}`" class="rounded-xl border border-slate-200 p-4 hover:border-blue-300">
              <p class="font-bold">{{ item.name }}</p><p class="mt-1 text-sm text-slate-500">{{ currency(item.price) }}</p>
            </NuxtLink>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">No saved products.</p>
        </section>

        <section class="card">
          <h2 class="text-lg font-black text-slate-900">Quote Requests</h2>
          <div v-if="customer.quotes.length" class="mt-4 space-y-4">
            <article v-for="quote in customer.quotes" :key="quote.id" class="rounded-xl border border-slate-200 p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p class="font-black">{{ quote.quote_number || `Quote #${quote.id}` }}</p><p class="text-xs text-slate-500">{{ formatDate(quote.created_at) }}</p><p v-if="quote.expires_at" class="mt-1 text-xs" :class="quoteExpired(quote) ? 'font-bold text-amber-700' : 'text-slate-500'">{{ quoteExpired(quote) ? 'Expired' : 'Valid until' }} {{ formatDate(quote.expires_at) }}</p></div>
                <select v-model="quote.status" class="input max-w-44"><option value="requested">Requested</option><option value="reviewing">Reviewing</option><option value="quoted">Quoted</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="closed">Closed</option></select>
              </div>
              <div class="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                <div v-for="item in quote.customer_quote_request_items || []" :key="item.id" class="grid grid-cols-1 gap-3 p-3 text-sm md:grid-cols-[1fr_150px_150px] md:items-center">
                  <span>{{ item.product_name }}<span v-if="item.variant_name"> — {{ item.variant_name }}</span> × {{ item.quantity }}</span>
                  <div class="md:text-right">
                    <p class="text-xs text-slate-500">Requested</p>
                    <p class="font-bold">{{ currency(Number(item.requested_price) * Number(item.quantity)) }}</p>
                  </div>
                  <label>
                    <span class="mb-1 block text-xs font-semibold text-slate-500">Quote Unit Price</span>
                    <input
                      v-model="item.quoted_price"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input"
                      :placeholder="Number(item.requested_price).toFixed(2)"
                    />
                  </label>
                </div>
              </div>
              <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label><span class="field-label">Quoted Total</span><input v-model="quote.quoted_total" type="number" min="0" step="0.01" class="input" /></label>
                <label><span class="field-label">Valid Until</span><input v-model="quote.expires_local" type="date" class="input" /></label>
                <label><span class="field-label">Admin Notes</span><textarea v-model="quote.admin_notes" rows="3" class="input"></textarea></label>
              </div>
              <div class="mt-4 flex flex-wrap justify-end gap-2">
                <a :href="`/api/admin/quotes/${quote.id}/pdf`" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Download PDF</a>
                <button v-if="quote.status === 'quoted'" class="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50" @click="resendQuote(quote)">Resend Quote</button>
                <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700" @click="saveQuote(quote)">Save Quote</button>
              </div>
            </article>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">No quote requests.</p>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["admin", "superadmin"] });

const route = useRoute();
const { adminFetch } = useAdminFetch();
const customer = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const form = reactive<any>({});
const tagsText = ref("");
const selectedPricingLevel = ref("standard");
const timelineFilter = ref("all");

const currency = (value: unknown) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));
const formatDate = (value: string) => value ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const formatDateTime = (value: string) => value ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";
const filteredTimeline = computed(() => {
  const events = customer.value?.timeline || [];
  return timelineFilter.value === "all" ? events : events.filter((event: any) => event.type === timelineFilter.value);
});
const timelineIcon = (type: string) => ({ order: "🛒", quote: "📄", wishlist: "♥", stock: "📦", email: "✉", profile: "👤", pricing: "$", account: "✓" }[type] || "•");
const timelineIconClass = (type: string) => ({
  order: "bg-blue-100 text-blue-700", quote: "bg-violet-100 text-violet-700", wishlist: "bg-rose-100 text-rose-700",
  stock: "bg-amber-100 text-amber-700", email: "bg-emerald-100 text-emerald-700", profile: "bg-slate-100 text-slate-700",
  pricing: "bg-cyan-100 text-cyan-700", account: "bg-green-100 text-green-700",
}[type] || "bg-slate-100 text-slate-700");

async function loadCustomer() {
  loading.value = true;
  errorMessage.value = "";
  try {
    customer.value = await adminFetch<any>(`/api/admin/accounts/${route.params.id}/profile`);
    customer.value.quotes = (customer.value.quotes || []).map((quote: any) => ({
      ...quote,
      expires_local: quote.expires_at ? new Date(quote.expires_at).toISOString().slice(0, 10) : "",
    }));
    Object.assign(form, customer.value.profile || {});
    tagsText.value = (customer.value.profile?.tags || []).join(", ");
    selectedPricingLevel.value = customer.value.pricingLevel?.key || "standard";
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to load customer.";
  } finally {
    loading.value = false;
  }
}

async function changePricingLevel() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const saved = await adminFetch<any>(`/api/admin/accounts/${route.params.id}/pricing`, {
      method: "PUT",
      body: { pricing_level_key: selectedPricingLevel.value },
    });
    customer.value.pricingLevel = {
      key: saved.pricing_level_key,
      name: saved.pricing_level_name,
      markup_percent: saved.pricing_markup_percent,
    };
    successMessage.value = `Pricing level changed to ${saved.pricing_level_name}.`;
  } catch (error: any) {
    selectedPricingLevel.value = customer.value.pricingLevel?.key || "standard";
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to change pricing level.";
  }
}

async function saveProfile() {
  saving.value = true;
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const saved = await adminFetch<any>(`/api/admin/accounts/${route.params.id}/profile`, {
      method: "PUT",
      body: { ...form, tags: tagsText.value },
    });
    customer.value.profile = saved;
    Object.assign(form, saved);
    tagsText.value = (saved.tags || []).join(", ");
    successMessage.value = "Customer profile saved.";
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to save customer profile.";
  } finally {
    saving.value = false;
  }
}

const quoteExpired = (quote: any) => Boolean(quote?.status === "quoted" && quote?.expires_at && new Date(quote.expires_at).getTime() < Date.now());

async function resendQuote(quote: any) {
  successMessage.value = ""; errorMessage.value = "";
  try {
    const result = await adminFetch<any>(`/api/admin/accounts/${route.params.id}/quotes/${quote.id}/resend`, { method: "POST" });
    quote.sent_at = result.sent_at;
    successMessage.value = `${quote.quote_number || `Quote #${quote.id}`} emailed again.`;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to resend quote.";
  }
}

async function saveQuote(quote: any) {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    const saved = await adminFetch<any>(`/api/admin/accounts/${route.params.id}/quotes/${quote.id}`, {
      method: "PUT",
      body: {
        status: quote.status,
        quoted_total: quote.quoted_total,
        admin_notes: quote.admin_notes,
        expires_at: quote.expires_local ? new Date(`${quote.expires_local}T23:59:59+10:00`).toISOString() : null,
        items: quote.customer_quote_request_items || [],
      },
    });
    Object.assign(quote, saved);
    quote.expires_local = saved.expires_at ? new Date(saved.expires_at).toISOString().slice(0, 10) : "";
    successMessage.value = `${quote.quote_number || `Quote #${quote.id}`} updated.`;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to update quote.";
  }
}

onMounted(loadCustomer);
</script>

<style scoped>
.card { @apply rounded-xl border border-slate-200 bg-white p-5 shadow-sm; }
.label { @apply text-xs font-bold uppercase tracking-wide text-slate-500; }
.value { @apply mt-2 text-3xl font-black text-slate-900; }
.field-label { @apply mb-1.5 block text-sm font-bold text-slate-700; }
.input { @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100; }
</style>
