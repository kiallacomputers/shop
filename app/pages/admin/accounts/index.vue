<template>
  <main class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
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

          <h1
            class="mt-3 text-3xl font-bold text-slate-900"
          >
            Account Management
          </h1>

          <p class="mt-1 text-slate-500">
            SuperAdmin-only user and administrator management.
          </p>
        </div>

        <button
          type="button"
          :disabled="loading"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          @click="loadAccounts"
        >
          Refresh Accounts
        </button>
      </div>

      <div
        class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm text-slate-500">
            Total Accounts
          </p>
          <p
            class="mt-2 text-3xl font-bold text-slate-900"
          >
            {{ accounts.length }}
          </p>
        </div>

        <div
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm text-slate-500">
            SuperAdmins
          </p>
          <p
            class="mt-2 text-3xl font-bold text-violet-600"
          >
            {{ superAdminCount }}
          </p>
        </div>

        <div
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm text-slate-500">
            Admins
          </p>
          <p
            class="mt-2 text-3xl font-bold text-blue-600"
          >
            {{ adminCount }}
          </p>
        </div>
      </div>

      <div
        class="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div
          class="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            v-model="search"
            type="text"
            placeholder="Search name or email..."
            class="rounded-lg border border-slate-300 px-4 py-2.5"
          />

          <select
            v-model="roleFilter"
            class="rounded-lg border border-slate-300 px-4 py-2.5"
          >
            <option value="">
              All Accounts
            </option>
            <option value="superadmin">
              SuperAdmins
            </option>
            <option value="admin">
              Admins
            </option>
            <option value="user">
              Users
            </option>
          </select>
        </div>
      </div>

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

      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white p-10 text-center"
      >
        Loading accounts...
      </div>

      <div
        v-else
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table
            class="w-full min-w-[950px] table-fixed text-left text-sm"
          >
            <thead
              class="border-b border-slate-200 bg-slate-50"
            >
              <tr>
                <th
                  class="w-[27%] px-4 py-3"
                >
                  Account
                </th>
                <th
                  class="w-[27%] px-4 py-3"
                >
                  Email
                </th>
                <th
                  class="w-[16%] px-4 py-3"
                >
                  Joined
                </th>
                <th
                  class="w-[12%] px-4 py-3 text-center"
                >
                  Role
                </th>
                <th
                  class="w-[18%] px-4 py-3 text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="account in filteredAccounts"
                :key="account.id"
                class="border-b border-slate-100 hover:bg-slate-50"
              >
                <td class="px-4 py-4">
                  <p
                    class="truncate font-semibold text-slate-900"
                  >
                    {{
                      account.display_name ||
                      account.email ||
                      "User"
                    }}
                  </p>

                  <p
                    v-if="account.is_current_user"
                    class="mt-1 text-xs font-semibold text-violet-600"
                  >
                    Your account
                  </p>
                </td>

                <td class="px-4 py-4">
                  <p
                    class="truncate text-slate-700"
                  >
                    {{ account.email }}
                  </p>
                </td>

                <td
                  class="px-4 py-4 text-slate-600"
                >
                  {{
                    formatDate(
                      account.created_at,
                    )
                  }}
                </td>

                <td
                  class="px-4 py-4 text-center"
                >
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
                    :class="
                      roleClass(account.role)
                    "
                  >
                    {{
                      roleLabel(
                        account.role,
                      )
                    }}
                  </span>
                </td>

                <td
                  class="px-4 py-4 text-right"
                >
                  <div
                    v-if="account.is_current_user"
                    class="text-xs font-semibold text-slate-400"
                  >
                    Protected
                  </div>

                  <div
                    v-else
                    class="flex justify-end gap-2"
                  >
                    <button
                      v-if="account.role !== 'admin'"
                      type="button"
                      :disabled="changingId === account.id"
                      class="rounded-lg border border-blue-200 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                      @click="changeRole(account, 'admin')"
                    >
                      Make Admin
                    </button>

                    <button
                      v-if="account.role !== 'superadmin'"
                      type="button"
                      :disabled="changingId === account.id"
                      class="rounded-lg border border-violet-200 px-2.5 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                      @click="changeRole(account, 'superadmin')"
                    >
                      Make SuperAdmin
                    </button>

                    <button
                      v-if="account.role"
                      type="button"
                      :disabled="changingId === account.id"
                      class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      @click="changeRole(account, 'user')"
                    >
                      Demote
                    </button>
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
definePageMeta({
  middleware: [
    "admin",
    "superadmin",
  ],
});

type Role =
  | "superadmin"
  | "admin"
  | null;

type Account = {
  id: string;
  email: string;
  display_name: string;
  created_at: string | null;
  last_sign_in_at:
    | string
    | null;
  email_confirmed_at:
    | string
    | null;
  role: Role;
  is_admin: boolean;
  is_superadmin: boolean;
  admin_since:
    | string
    | null;
  is_current_user: boolean;
};

const { adminFetch } =
  useAdminFetch();

const accounts =
  ref<Account[]>([]);

const loading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");
const changingId =
  ref<string | null>(null);

const search = ref("");
const roleFilter = ref("");

const filteredAccounts =
  computed(() => {
    const term =
      search.value
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

          if (
            !haystack.includes(
              term,
            )
          ) {
            return false;
          }
        }

        if (
          roleFilter.value ===
            "superadmin" &&
          account.role !==
            "superadmin"
        ) {
          return false;
        }

        if (
          roleFilter.value ===
            "admin" &&
          account.role !==
            "admin"
        ) {
          return false;
        }

        if (
          roleFilter.value ===
            "user" &&
          account.role !== null
        ) {
          return false;
        }

        return true;
      },
    );
  });

const superAdminCount =
  computed(
    () =>
      accounts.value.filter(
        (account) =>
          account.role ===
          "superadmin",
      ).length,
  );

const adminCount =
  computed(
    () =>
      accounts.value.filter(
        (account) =>
          account.role ===
          "admin",
      ).length,
  );

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

const roleLabel = (
  role: Role,
) => {
  if (role === "superadmin") {
    return "SuperAdmin";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
};

const roleClass = (
  role: Role,
) => {
  if (role === "superadmin") {
    return "bg-violet-100 text-violet-700";
  }

  if (role === "admin") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
};

const loadAccounts =
  async () => {
    loading.value = true;
    errorMessage.value = "";

    try {
      accounts.value =
        (await adminFetch<
          Account[]
        >(
          "/api/admin/accounts",
        )) || [];
    } catch (error: any) {
      errorMessage.value =
        error?.data
          ?.statusMessage ||
        error?.statusMessage ||
        error?.message ||
        "Unable to load accounts.";
    } finally {
      loading.value = false;
    }
  };

const changeRole = async (
  account: Account,
  role:
    | "user"
    | "admin"
    | "superadmin",
) => {
  const label =
    role === "superadmin"
      ? "SuperAdmin"
      : role === "admin"
        ? "Admin"
        : "User";

  if (
    !window.confirm(
      `Change ${account.display_name || account.email} to ${label}?`,
    )
  ) {
    return;
  }

  changingId.value =
    account.id;

  errorMessage.value = "";
  successMessage.value = "";

  try {
    await adminFetch(
      `/api/admin/accounts/${account.id}`,
      {
        method: "PUT",
        body: {
          role,
        },
      },
    );

    account.role =
      role === "user"
        ? null
        : role;

    account.is_admin =
      role !== "user";

    account.is_superadmin =
      role === "superadmin";

    successMessage.value =
      `${account.display_name || account.email} is now ${label}.`;
  } catch (error: any) {
    errorMessage.value =
      error?.data
        ?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to change account role.";
  } finally {
    changingId.value = null;
  }
};

onMounted(loadAccounts);
</script>
