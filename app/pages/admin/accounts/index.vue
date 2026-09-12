<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-[1500px] px-4 py-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <NuxtLink to="/admin" class="text-sm font-semibold text-blue-600 hover:text-blue-700 admin-page-backlink">
            ← Admin Dashboard
          </NuxtLink>
          <p class="mt-3 text-sm font-bold uppercase tracking-wide text-violet-600">Customer CRM</p>
          <h1 class="mt-1 text-3xl font-black text-slate-900">Account Management</h1>
          <p class="mt-1 max-w-3xl text-slate-500">
            Search, segment and manage customers by pricing level, tags, spending, orders and communication preferences.
          </p>
        </div>

        <button
          type="button"
          :disabled="loading"
          class="admin-btn-secondary"
          @click="loadAccounts"
        >
          {{ loading ? "Refreshing..." : "Refresh CRM" }}
        </button>
      </div>

      <section class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div class="stat-card">
          <p class="stat-label">Customers</p>
          <p class="stat-value">{{ accounts.length }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">CRM Spend</p>
          <p class="mt-2 text-2xl font-black text-emerald-700">{{ currency(totalCustomerSpend) }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">With Orders</p>
          <p class="stat-value">{{ customersWithOrders }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Open Quotes</p>
          <p class="stat-value text-blue-700">{{ openQuotes }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Marketing Opt-in</p>
          <p class="stat-value text-violet-700">{{ marketingOptIns }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Visible Results</p>
          <p class="stat-value text-slate-700">{{ filteredAccounts.length }}</p>
        </div>
      </section>

      <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-black text-slate-900">CRM Filters</h2>
            <p class="text-sm text-slate-500">Use several filters together to quickly find the customers you need.</p>
          </div>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="text-sm font-bold text-blue-600 hover:text-blue-700"
            @click="clearFilters"
          >
            Clear all filters
          </button>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label class="filter-field xl:col-span-2">
            <span>Search</span>
            <input
              v-model="search"
              type="search"
              placeholder="Name, business, email, phone, tag or customer ID..."
              class="filter-control"
            />
          </label>

          <label class="filter-field">
            <span>Pricing Level</span>
            <select v-model="pricingFilter" class="filter-control">
              <option value="">All pricing levels</option>
              <option v-for="level in pricingLevelOptions" :key="level.key" :value="level.key">
                {{ level.name }} ({{ level.markup_percent }}%)
              </option>
            </select>
          </label>

          <label class="filter-field">
            <span>Customer Tag</span>
            <select v-model="tagFilter" class="filter-control">
              <option value="">All tags</option>
              <option v-for="tag in tagOptions" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </label>

          <label class="filter-field">
            <span>Order History</span>
            <select v-model="orderFilter" class="filter-control">
              <option value="">Any order history</option>
              <option value="has-orders">Has orders</option>
              <option value="no-orders">No orders</option>
              <option value="recent-90">Ordered in last 90 days</option>
              <option value="inactive-180">No order in 180+ days</option>
            </select>
          </label>

          <label class="filter-field">
            <span>Spend</span>
            <select v-model="spendFilter" class="filter-control">
              <option value="">Any spend</option>
              <option value="0">$0</option>
              <option value="1-499">$1 – $499</option>
              <option value="500-999">$500 – $999</option>
              <option value="1000-2499">$1,000 – $2,499</option>
              <option value="2500+">$2,500+</option>
            </select>
          </label>

          <label class="filter-field">
            <span>Communication</span>
            <select v-model="marketingFilter" class="filter-control">
              <option value="">Any preference</option>
              <option value="marketing">Marketing opt-in</option>
              <option value="no-marketing">Marketing opt-out</option>
              <option value="back-stock">Back-in-stock enabled</option>
            </select>
          </label>

          <label class="filter-field">
            <span>Account Role</span>
            <select v-model="roleFilter" class="filter-control">
              <option value="">All accounts</option>
              <option value="superadmin">SuperAdmins</option>
              <option value="admin">Admins</option>
              <option value="user">Customers / Users</option>
            </select>
          </label>

          <label class="filter-field md:col-span-2 xl:col-span-1">
            <span>Sort By</span>
            <select v-model="sortBy" class="filter-control">
              <option value="name">Customer name A–Z</option>
              <option value="spend-desc">Highest spend</option>
              <option value="orders-desc">Most orders</option>
              <option value="last-order-desc">Most recent order</option>
              <option value="joined-desc">Newest account</option>
            </select>
          </label>
        </div>
      </section>

      <div v-if="errorMessage" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        {{ successMessage }}
      </div>

      <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Loading customer CRM...
      </div>

      <div v-else-if="!filteredAccounts.length" class="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p class="text-lg font-bold text-slate-800">No customers match these filters.</p>
        <button type="button" class="mt-3 text-sm font-bold text-blue-600" @click="clearFilters">Clear filters</button>
      </div>

      <div v-else class="admin-table-shell">
        <div class="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
          Showing <strong class="text-slate-900">{{ filteredAccounts.length }}</strong> of {{ accounts.length }} accounts
        </div>

        <div class="overflow-x-auto">
          <table class="admin-data-table admin-data-table-compact min-w-[1320px]">
            <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Customer</th>
                <th class="px-4 py-3">Contact</th>
                <th class="px-4 py-3">Orders / Spend</th>
                <th class="px-4 py-3">Last Activity</th>
                <th class="px-4 py-3">Pricing</th>
                <th class="px-4 py-3">CRM</th>
                <th class="px-4 py-3 text-center">Role</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="account in filteredAccounts" :key="account.id" class="border-b border-slate-100 align-top hover:bg-slate-50/70">
                <td class="px-4 py-4">
                  <p class="font-bold text-slate-900">{{ account.display_name || account.email || "Customer" }}</p>
                  <p v-if="account.business_name" class="mt-0.5 text-sm font-medium text-slate-600">{{ account.business_name }}</p>
                  <div v-if="account.tags.length" class="mt-2 flex max-w-[260px] flex-wrap gap-1">
                    <span v-for="tag in account.tags" :key="tag" class="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700">{{ tag }}</span>
                  </div>
                  <p v-if="account.is_current_user" class="mt-2 text-xs font-bold text-violet-600">Your account</p>
                </td>

                <td class="px-4 py-4">
                  <p class="max-w-[260px] truncate text-slate-700">{{ account.email }}</p>
                  <p v-if="account.phone" class="mt-1 text-slate-600">{{ account.phone }}</p>
                  <p class="mt-2 text-xs text-slate-400">Prefers {{ account.preferred_contact === 'phone' ? 'phone' : 'email' }}</p>
                </td>

                <td class="px-4 py-4">
                  <p class="font-black text-slate-900">{{ account.order_count }} order{{ account.order_count === 1 ? '' : 's' }}</p>
                  <p class="mt-1 text-lg font-black text-emerald-700">{{ currency(account.total_spent) }}</p>
                  <p class="mt-1 text-xs text-slate-400">{{ account.quote_count }} quote{{ account.quote_count === 1 ? '' : 's' }} · {{ account.wishlist_count }} wishlist</p>
                </td>

                <td class="px-4 py-4">
                  <template v-if="account.last_order_at">
                    <p class="font-semibold text-slate-700">{{ formatDate(account.last_order_at) }}</p>
                    <p class="mt-1 text-xs capitalize text-slate-500">Last order: {{ account.last_order_status || '—' }}</p>
                  </template>
                  <p v-else class="text-slate-400">No orders yet</p>
                  <p class="mt-2 text-xs text-slate-400">Joined {{ formatDate(account.created_at) }}</p>
                </td>

                <td class="px-4 py-4">
                  <select
                    :value="account.pricing_level_key"
                    :disabled="pricingChangingId === account.id"
                    class="w-full min-w-[155px] rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                    @change="changePricingLevel(account, $event)"
                  >
                    <option v-for="level in account.pricing_levels" :key="level.key" :value="level.key">
                      {{ level.name }} ({{ level.markup_percent }}%)
                    </option>
                  </select>
                </td>

                <td class="px-4 py-4">
                  <div class="flex flex-col gap-1.5 text-xs font-semibold">
                    <span :class="account.marketing_updates ? 'text-emerald-700' : 'text-slate-400'">
                      {{ account.marketing_updates ? '✓ Marketing' : '– Marketing' }}
                    </span>
                    <span :class="account.back_in_stock_updates ? 'text-emerald-700' : 'text-slate-400'">
                      {{ account.back_in_stock_updates ? '✓ Back in stock' : '– Back in stock' }}
                    </span>
                    <span v-if="account.open_quote_count" class="text-blue-700">{{ account.open_quote_count }} open quote{{ account.open_quote_count === 1 ? '' : 's' }}</span>
                  </div>
                </td>

                <td class="px-4 py-4 text-center">
                  <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold" :class="roleClass(account.role)">
                    {{ roleLabel(account.role) }}
                  </span>
                </td>

                <td class="px-4 py-4 text-right">
                  <div class="admin-row-actions min-w-[220px]">
                    <NuxtLink
                      :to="`/admin/accounts/${account.id}`"
                      class="admin-btn-primary !min-h-0 !px-3 !py-2 !text-xs"
                    >
                      Open
                    </NuxtLink>

                    <button
                      type="button"
                      :disabled="resettingId === account.id"
                      class="admin-btn-secondary !min-h-0 !px-3 !py-2 !text-xs"
                      @click="sendPasswordReset(account)"
                    >
                      {{ resettingId === account.id ? "Sending..." : "Reset Password" }}
                    </button>

                    <details v-if="!account.is_current_user" class="admin-role-details">
                      <summary>Role ▾</summary>
                      <div class="admin-role-menu">
                        <button
                          v-if="account.role !== 'admin'"
                          type="button"
                          :disabled="changingId === account.id"
                          class="text-blue-700 disabled:opacity-50"
                          @click="changeRole(account, 'admin')"
                        >Make Admin</button>
                        <button
                          v-if="account.role !== 'superadmin'"
                          type="button"
                          :disabled="changingId === account.id"
                          class="text-violet-700 disabled:opacity-50"
                          @click="changeRole(account, 'superadmin')"
                        >Make SuperAdmin</button>
                        <button
                          v-if="account.role"
                          type="button"
                          :disabled="changingId === account.id"
                          class="text-red-700 disabled:opacity-50"
                          @click="changeRole(account, 'user')"
                        >Remove Admin Role</button>
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["admin", "superadmin"] });

type Role = "superadmin" | "admin" | null;
type PricingLevel = { key: string; name: string; markup_percent: number };
type Account = {
  id: string;
  email: string;
  display_name: string;
  business_name: string;
  phone: string;
  preferred_contact: string;
  tags: string[];
  marketing_updates: boolean;
  order_updates: boolean;
  back_in_stock_updates: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  role: Role;
  is_admin: boolean;
  is_superadmin: boolean;
  admin_since: string | null;
  is_current_user: boolean;
  pricing_level_key: string;
  pricing_level_name: string;
  pricing_markup_percent: number;
  pricing_levels: PricingLevel[];
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
  last_order_status: string | null;
  wishlist_count: number;
  quote_count: number;
  open_quote_count: number;
  accepted_quote_count: number;
};

const { adminFetch } = useAdminFetch();
const accounts = ref<Account[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const changingId = ref<string | null>(null);
const resettingId = ref<string | null>(null);
const pricingChangingId = ref<string | null>(null);

const search = ref("");
const roleFilter = ref("");
const pricingFilter = ref("");
const tagFilter = ref("");
const orderFilter = ref("");
const spendFilter = ref("");
const marketingFilter = ref("");
const sortBy = ref("name");

const pricingLevelOptions = computed<PricingLevel[]>(() => accounts.value[0]?.pricing_levels || []);
const tagOptions = computed(() => {
  const tags = new Set<string>();
  for (const account of accounts.value) {
    for (const tag of account.tags || []) {
      const value = String(tag || "").trim();
      if (value) tags.add(value);
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
});

const hasActiveFilters = computed(() => Boolean(
  search.value || roleFilter.value || pricingFilter.value || tagFilter.value ||
  orderFilter.value || spendFilter.value || marketingFilter.value || sortBy.value !== "name",
));

const filteredAccounts = computed(() => {
  const term = search.value.trim().toLowerCase();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const rows = accounts.value.filter((account) => {
    if (term) {
      const haystack = [
        account.display_name,
        account.business_name,
        account.email,
        account.phone,
        account.id,
        ...(account.tags || []),
      ].join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (roleFilter.value === "superadmin" && account.role !== "superadmin") return false;
    if (roleFilter.value === "admin" && account.role !== "admin") return false;
    if (roleFilter.value === "user" && account.role !== null) return false;
    if (pricingFilter.value && account.pricing_level_key !== pricingFilter.value) return false;
    if (tagFilter.value && !(account.tags || []).includes(tagFilter.value)) return false;

    if (orderFilter.value === "has-orders" && account.order_count <= 0) return false;
    if (orderFilter.value === "no-orders" && account.order_count > 0) return false;
    if (orderFilter.value === "recent-90") {
      if (!account.last_order_at || now - new Date(account.last_order_at).getTime() > 90 * day) return false;
    }
    if (orderFilter.value === "inactive-180") {
      if (account.last_order_at && now - new Date(account.last_order_at).getTime() < 180 * day) return false;
    }

    if (spendFilter.value === "0" && account.total_spent !== 0) return false;
    if (spendFilter.value === "1-499" && !(account.total_spent >= 1 && account.total_spent < 500)) return false;
    if (spendFilter.value === "500-999" && !(account.total_spent >= 500 && account.total_spent < 1000)) return false;
    if (spendFilter.value === "1000-2499" && !(account.total_spent >= 1000 && account.total_spent < 2500)) return false;
    if (spendFilter.value === "2500+" && account.total_spent < 2500) return false;

    if (marketingFilter.value === "marketing" && !account.marketing_updates) return false;
    if (marketingFilter.value === "no-marketing" && account.marketing_updates) return false;
    if (marketingFilter.value === "back-stock" && !account.back_in_stock_updates) return false;

    return true;
  });

  return rows.sort((a, b) => {
    if (sortBy.value === "spend-desc") return b.total_spent - a.total_spent;
    if (sortBy.value === "orders-desc") return b.order_count - a.order_count;
    if (sortBy.value === "last-order-desc") {
      return (b.last_order_at ? new Date(b.last_order_at).getTime() : 0) - (a.last_order_at ? new Date(a.last_order_at).getTime() : 0);
    }
    if (sortBy.value === "joined-desc") {
      return (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0);
    }
    const nameA = a.display_name || a.business_name || a.email || "";
    const nameB = b.display_name || b.business_name || b.email || "";
    return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
  });
});

const totalCustomerSpend = computed(() => accounts.value.reduce((sum, account) => sum + Number(account.total_spent || 0), 0));
const customersWithOrders = computed(() => accounts.value.filter((account) => account.order_count > 0).length);
const openQuotes = computed(() => accounts.value.reduce((sum, account) => sum + Number(account.open_quote_count || 0), 0));
const marketingOptIns = computed(() => accounts.value.filter((account) => account.marketing_updates).length);

const currency = (value: unknown) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));
const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
  : "—";

const roleLabel = (role: Role) => role === "superadmin" ? "SuperAdmin" : role === "admin" ? "Admin" : "User";
const roleClass = (role: Role) => role === "superadmin"
  ? "bg-violet-100 text-violet-700"
  : role === "admin"
    ? "bg-blue-100 text-blue-700"
    : "bg-slate-100 text-slate-600";

function clearFilters() {
  search.value = "";
  roleFilter.value = "";
  pricingFilter.value = "";
  tagFilter.value = "";
  orderFilter.value = "";
  spendFilter.value = "";
  marketingFilter.value = "";
  sortBy.value = "name";
}

async function loadAccounts() {
  loading.value = true;
  errorMessage.value = "";
  try {
    accounts.value = (await adminFetch<Account[]>("/api/admin/accounts")) || [];
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to load customer CRM.";
  } finally {
    loading.value = false;
  }
}

async function changePricingLevel(account: Account, event: Event) {
  const pricingLevelKey = String((event.target as HTMLSelectElement)?.value || "");
  if (!pricingLevelKey || pricingLevelKey === account.pricing_level_key) return;

  pricingChangingId.value = account.id;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const result = await adminFetch<any>(`/api/admin/accounts/${account.id}/pricing`, {
      method: "PUT",
      body: { pricing_level_key: pricingLevelKey },
    });
    account.pricing_level_key = result.pricing_level_key;
    account.pricing_level_name = result.pricing_level_name;
    account.pricing_markup_percent = Number(result.markup_percent ?? result.pricing_markup_percent ?? 0);
    successMessage.value = `${account.display_name || account.email} pricing level changed to ${result.pricing_level_name}.`;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to change pricing level.";
    await loadAccounts();
  } finally {
    pricingChangingId.value = null;
  }
}

async function changeRole(account: Account, role: "user" | "admin" | "superadmin") {
  const label = role === "superadmin" ? "SuperAdmin" : role === "admin" ? "Admin" : "User";
  if (!window.confirm(`Change ${account.display_name || account.email} to ${label}?`)) return;

  changingId.value = account.id;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await adminFetch(`/api/admin/accounts/${account.id}`, { method: "PUT", body: { role } });
    account.role = role === "user" ? null : role;
    account.is_admin = role !== "user";
    account.is_superadmin = role === "superadmin";
    successMessage.value = `${account.display_name || account.email} is now ${label}.`;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to change account role.";
  } finally {
    changingId.value = null;
  }
}

async function sendPasswordReset(account: Account) {
  if (!account.email) {
    errorMessage.value = "This account does not have an email address.";
    return;
  }
  if (!window.confirm(`Send a password reset email to ${account.email}?`)) return;

  resettingId.value = account.id;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const result = await adminFetch<{ success: boolean; email: string }>(`/api/admin/accounts/${account.id}/password-reset`, { method: "POST" });
    successMessage.value = `Password reset email sent to ${result.email}.`;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || error?.message || "Unable to send password reset email.";
  } finally {
    resettingId.value = null;
  }
}

onMounted(loadAccounts);
</script>

<style scoped>
.stat-card { @apply rounded-xl border border-slate-200 bg-white p-5 shadow-sm; }
.stat-label { @apply text-xs font-bold uppercase tracking-wide text-slate-500; }
.stat-value { @apply mt-2 text-3xl font-black text-slate-900; }
.filter-field { @apply flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500; }
.filter-control { @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100; }
</style>
