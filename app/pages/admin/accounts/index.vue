<template>
  <main class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- ========================================= -->
      <!-- HEADER -->
      <!-- ========================================= -->

      <div
        class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <NuxtLink
            to="/admin"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Admin Dashboard
          </NuxtLink>

          <h1 class="mt-3 text-3xl font-bold text-slate-900">
            Account Management
          </h1>

          <p class="mt-1 text-slate-500">
            Manage registered customer accounts and administrator access.
          </p>
        </div>

        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          @click="loadAccounts"
        >
          Refresh Accounts
        </button>
      </div>

      <!-- ========================================= -->
      <!-- SUMMARY -->
      <!-- ========================================= -->

      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm font-medium text-slate-500">
            Total Accounts
          </p>

          <p class="mt-2 text-3xl font-bold text-slate-900">
            {{ accounts.length }}
          </p>
        </div>

        <div
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm font-medium text-slate-500">
            Administrators
          </p>

          <p class="mt-2 text-3xl font-bold text-blue-600">
            {{ adminCount }}
          </p>
        </div>

        <div
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm font-medium text-slate-500">
            Customers
          </p>

          <p class="mt-2 text-3xl font-bold text-emerald-600">
            {{ customerCount }}
          </p>
        </div>
      </div>

      <!-- ========================================= -->
      <!-- FILTERS -->
      <!-- ========================================= -->

      <div
        class="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search Accounts
            </label>

            <input
              v-model="search"
              type="text"
              placeholder="Search name or email..."
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Account Type
            </label>

            <select
              v-model="roleFilter"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">
                All Accounts
              </option>

              <option value="admin">
                Administrators
              </option>

              <option value="customer">
                Customers
              </option>
            </select>
          </div>
        </div>

        <div
          class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"
        >
          <p class="text-sm text-slate-500">
            Showing
            <span class="font-semibold text-slate-800">
              {{ filteredAccounts.length }}
            </span>
            accounts
          </p>

          <button
            v-if="search || roleFilter"
            type="button"
            class="text-sm font-semibold text-blue-600 hover:text-blue-700"
            @click="clearFilters"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- ========================================= -->
      <!-- ERROR / SUCCESS -->
      <!-- ========================================= -->

      <div
        v-if="errorMessage"
        class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700"
      >
        {{ successMessage }}
      </div>

      <!-- ========================================= -->
      <!-- LOADING -->
      <!-- ========================================= -->

      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <p class="text-slate-500">
          Loading accounts...
        </p>
      </div>

      <!-- ========================================= -->
      <!-- EMPTY -->
      <!-- ========================================= -->

      <div
        v-else-if="filteredAccounts.length === 0"
        class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <h2 class="text-lg font-bold text-slate-800">
          No accounts found
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          No registered accounts match the current filters.
        </p>
      </div>

      <!-- ========================================= -->
      <!-- ACCOUNT TABLE -->
      <!-- ========================================= -->

      <div
        v-else
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[950px] table-fixed text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th
                  class="w-[25%] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Account
                </th>

                <th
                  class="w-[25%] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Email
                </th>

                <th
                  class="w-[15%] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Joined
                </th>

                <th
                  class="w-[15%] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Last Sign In
                </th>

                <th
                  class="w-[10%] px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Access
                </th>

                <th
                  class="w-[10%] px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="account in filteredAccounts"
                :key="account.id"
                class="border-b border-slate-100 hover:bg-slate-50"
              >
                <!-- Account -->
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600"
                    >
                      {{ initials(account) }}
                    </div>

                    <div class="min-w-0">
                      <p
                        class="truncate font-semibold text-slate-900"
                        :title="account.display_name || account.email"
                      >
                        {{
                          account.display_name ||
                          account.email ||
                          "User"
                        }}
                      </p>

                      <p
                        v-if="account.is_current_user"
                        class="mt-1 text-xs font-semibold text-blue-600"
                      >
                        Your account
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Email -->
                <td class="px-4 py-4">
                  <p
                    class="truncate text-slate-700"
                    :title="account.email"
                  >
                    {{ account.email || "No email" }}
                  </p>

                  <p class="mt-1 text-xs">
                    <span
                      v-if="account.email_confirmed_at"
                      class="font-semibold text-green-600"
                    >
                      Verified
                    </span>

                    <span
                      v-else
                      class="font-semibold text-amber-600"
                    >
                      Not verified
                    </span>
                  </p>
                </td>

                <!-- Joined -->
                <td class="px-4 py-4 text-slate-600">
                  {{ formatDate(account.created_at) }}
                </td>

                <!-- Sign in -->
                <td class="px-4 py-4 text-slate-600">
                  {{
                    account.last_sign_in_at
                      ? formatDate(account.last_sign_in_at)
                      : "Never"
                  }}
                </td>

                <!-- Access -->
                <td class="px-4 py-4 text-center">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
                    :class="
                      account.is_admin
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{
                      account.is_admin
                        ? "Admin"
                        : "User"
                    }}
                  </span>
                </td>

                <!-- Action -->
                <td class="px-4 py-4 text-right">
                  <button
                    v-if="!account.is_admin"
                    type="button"
                    :disabled="changingId === account.id"
                    class="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    @click="setAdmin(account, true)"
                  >
                    {{
                      changingId === account.id
                        ? "Saving..."
                        : "Make Admin"
                    }}
                  </button>

                  <button
                    v-else-if="!account.is_current_user"
                    type="button"
                    :disabled="changingId === account.id"
                    class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    @click="setAdmin(account, false)"
                  >
                    {{
                      changingId === account.id
                        ? "Saving..."
                        : "Remove Admin"
                    }}
                  </button>

                  <span
                    v-else
                    class="text-xs font-semibold text-slate-400"
                    title="You cannot remove your own administrator access."
                  >
                    Protected
                  </span>
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
definePageMeta({
  middleware: "admin",
});

type Account = {
  id: string;
  email: string;
  display_name: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_admin: boolean;
  admin_since: string | null;
  is_current_user: boolean;
};

const { adminFetch } = useAdminFetch();

const accounts = ref<Account[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const changingId = ref<string | null>(null);

const search = ref("");
const roleFilter = ref("");

const filteredAccounts = computed(() => {
  const term = search.value
    .trim()
    .toLowerCase();

  return accounts.value.filter(
    (account) => {
      if (term) {
        const haystack = [
          account.display_name,
          account.email,
          account.id,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) {
          return false;
        }
      }

      if (
        roleFilter.value === "admin" &&
        !account.is_admin
      ) {
        return false;
      }

      if (
        roleFilter.value === "customer" &&
        account.is_admin
      ) {
        return false;
      }

      return true;
    },
  );
});

const adminCount = computed(
  () =>
    accounts.value.filter(
      (account) => account.is_admin,
    ).length,
);

const customerCount = computed(
  () =>
    accounts.value.filter(
      (account) => !account.is_admin,
    ).length,
);

const clearFilters = () => {
  search.value = "";
  roleFilter.value = "";
};

const formatDate = (
  value?: string | null,
) => {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
};

const initials = (account: Account) => {
  const source =
    account.display_name ||
    account.email ||
    "U";

  const words = source
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return (
      words[0][0] + words[1][0]
    ).toUpperCase();
  }

  return source
    .slice(0, 2)
    .toUpperCase();
};

const loadAccounts = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    accounts.value =
      (await adminFetch<Account[]>(
        "/api/admin/accounts",
      )) || [];
  } catch (error: any) {
    console.error(
      "LOAD ACCOUNTS ERROR:",
      error,
    );

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load accounts.";
  } finally {
    loading.value = false;
  }
};

const setAdmin = async (
  account: Account,
  makeAdmin: boolean,
) => {
  const action = makeAdmin
    ? "grant administrator access to"
    : "remove administrator access from";

  const confirmed = window.confirm(
    `Are you sure you want to ${action} ${account.display_name || account.email}?`,
  );

  if (!confirmed) {
    return;
  }

  changingId.value = account.id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await adminFetch(
      `/api/admin/accounts/${account.id}`,
      {
        method: "PUT",
        body: {
          isAdmin: makeAdmin,
        },
      },
    );

    account.is_admin = makeAdmin;

    successMessage.value = makeAdmin
      ? `${account.display_name || account.email} is now an administrator.`
      : `Administrator access has been removed from ${account.display_name || account.email}.`;
  } catch (error: any) {
    console.error(
      "CHANGE ADMIN ACCESS ERROR:",
      error,
    );

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to change administrator access.";
  } finally {
    changingId.value = null;
  }
};

onMounted(loadAccounts);
</script>
