<template>
  <div class="p-4 md:p-7">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-black">Abandoned Carts</h1>
        <p class="mt-1 text-sm text-slate-500">
          Carts become abandoned after 60 minutes without activity. Recovery emails are manual.
        </p>
      </div>
      <button class="admin-btn-secondary" @click="load">Refresh</button>
    </div>

    <div class="mb-5 grid gap-3 sm:grid-cols-4">
      <div v-for="s in stats" :key="s.label" class="rounded-xl border bg-white p-4">
        <div class="text-2xl font-black">{{ s.value }}</div>
        <div class="text-xs font-bold text-slate-500">{{ s.label }}</div>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ error }}
    </div>

    <div
      v-if="success"
      class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
    >
      {{ success }}
    </div>

    <div class="overflow-x-auto rounded-2xl border bg-white">
      <table class="w-full min-w-[1000px] text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th class="p-3">Customer</th>
            <th class="p-3">Products</th>
            <th class="p-3 text-right">Value</th>
            <th class="p-3">Last activity</th>
            <th class="p-3">Status</th>
            <th class="p-3">Recovery</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" class="border-t align-top">
            <td class="p-3">
              <b>{{ r.customer_name || "Customer" }}</b>
              <div class="text-xs text-slate-500">{{ r.customer_email }}</div>
            </td>

            <td class="p-3">
              <div v-for="i in (r.items || []).slice(0, 3)" :key="i.cartKey">
                {{ i.quantity }} × {{ i.name }}
                <span v-if="i.variantName"> – {{ i.variantName }}</span>
              </div>
              <div v-if="(r.items || []).length > 3" class="text-xs text-slate-500">
                + {{ r.items.length - 3 }} more
              </div>
            </td>

            <td class="p-3 text-right font-black">
              {{ money(r.cart_value) }}
            </td>

            <td class="p-3">{{ date(r.last_activity_at) }}</td>

            <td class="p-3">
              <span class="rounded-full border px-2 py-1 text-xs font-bold">
                {{ r.status }}
              </span>
            </td>

            <td class="p-3">
              <div v-if="r.recovery_email_sent_at">
                Sent {{ date(r.recovery_email_sent_at) }}
                <div class="text-xs text-slate-500">
                  {{ r.recovery_email_count }} email(s)
                </div>
              </div>
              <span v-else class="text-slate-400">Not sent</span>
            </td>

            <td class="p-3 text-right">
              <button
                v-if="!['converted', 'expired'].includes(r.status)"
                class="admin-btn-secondary"
                :disabled="sending === r.id"
                @click="send(r)"
              >
                {{ sending === r.id ? "Sending…" : "Send recovery" }}
              </button>
            </td>
          </tr>

          <tr v-if="!loading && !rows.length">
            <td colspan="7" class="p-8 text-center text-slate-500">
              No carts recorded yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const supabase = useSupabaseClient();
const dialog = useAppDialog();

const rows = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const success = ref("");
const sending = ref("");

async function headers() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function load() {
  loading.value = true;
  error.value = "";

  try {
    rows.value = await $fetch("/api/admin/abandoned-carts", {
      headers: await headers(),
    });
  } catch (e: any) {
    error.value =
      e?.data?.statusMessage || e?.message || "Unable to load carts";
  } finally {
    loading.value = false;
  }
}

function productSummary(r: any) {
  const items = Array.isArray(r.items) ? r.items : [];

  if (!items.length) return "No product details";

  const visible = items
    .slice(0, 4)
    .map((i: any) => {
      const variant = i.variantName ? ` – ${i.variantName}` : "";
      return `${Number(i.quantity || 1)} × ${i.name}${variant}`;
    })
    .join("\n");

  const extra =
    items.length > 4 ? `\n+ ${items.length - 4} more product(s)` : "";

  return visible + extra;
}

async function send(r: any) {
  success.value = "";
  error.value = "";

  const confirmed = await dialog.confirm(
    [
      "A recovery email will be sent with a secure link that restores this customer's cart.",
      "",
      `Customer: ${r.customer_name || "Customer"}`,
      `Email: ${r.customer_email || "No email address"}`,
      `Cart value: ${money(r.cart_value)}`,
      "",
      "Products:",
      productSummary(r),
      "",
      r.recovery_email_sent_at
        ? `A recovery email has already been sent ${Number(r.recovery_email_count || 0)} time(s).`
        : "No recovery email has been sent yet.",
    ].join("\n"),
    {
      title: "Send recovery email?",
      confirmText: "Send Recovery Email",
      cancelText: "Cancel",
    },
  );

  if (!confirmed) return;

  sending.value = r.id;

  try {
    await $fetch(`/api/admin/abandoned-carts/${r.id}/send-recovery`, {
      method: "POST",
      headers: await headers(),
    });

    success.value = `Recovery email sent to ${r.customer_email}.`;
    await dialog.alert(
      `The recovery email was sent successfully to ${r.customer_email}.`,
      "Recovery email sent",
    );
    await load();
  } catch (e: any) {
    const message =
      e?.data?.statusMessage ||
      e?.message ||
      "Unable to send recovery email";

    error.value = message;
    await dialog.alert(message, "Recovery email not sent");
  } finally {
    sending.value = "";
  }
}

const date = (v: any) =>
  v ? new Date(v).toLocaleString("en-AU") : "—";

const money = (v: any) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(v || 0));

const stats = computed(() => [
  {
    label: "Active",
    value: rows.value.filter((x) => x.status === "active").length,
  },
  {
    label: "Abandoned",
    value: rows.value.filter((x) => x.status === "abandoned").length,
  },
  {
    label: "Recovered",
    value: rows.value.filter((x) => x.status === "recovered").length,
  },
  {
    label: "Converted",
    value: rows.value.filter((x) => x.status === "converted").length,
  },
]);

onMounted(load);
</script>
