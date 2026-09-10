<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-3">
            <NuxtLink
              to="/admin"
              class="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Admin Dashboard
            </NuxtLink>
          </div>

          <p class="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Administration
          </p>
          <h1 class="mt-1 text-3xl font-bold text-slate-900">Traffic Analytics</h1>
          <p class="mt-2 max-w-2xl text-slate-500">
            See which pages, products and categories visitors are viewing. Tracking is anonymous and does not store names, email addresses or raw IP addresses.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="option in ranges"
            :key="option"
            type="button"
            class="rounded-lg px-3.5 py-2 text-sm font-semibold transition"
            :class="days === option ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
            @click="changeRange(option)"
          >
            {{ option === 1 ? "24 Hours" : `${option} Days` }}
          </button>

          <button
            type="button"
            :disabled="loading"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            @click="loadAnalytics"
          >
            {{ loading ? "Loading..." : "Refresh" }}
          </button>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="loading && !analytics"
        class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <div v-for="item in 5" :key="item" class="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>

      <template v-else-if="analytics">
        <div
          v-if="analytics.truncated"
          class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          This view reached the 50,000 page-view safety limit. Shorten the date range for exact figures.
        </div>

        <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Page Views</p>
            <p class="mt-2 text-3xl font-black text-slate-900">{{ number(analytics.stats.pageViews) }}</p>
            <p class="mt-1 text-xs text-slate-400">Selected period</p>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Visitor Sessions</p>
            <p class="mt-2 text-3xl font-black text-slate-900">{{ number(analytics.stats.sessions) }}</p>
            <p class="mt-1 text-xs text-slate-400">Anonymous 30-minute sessions</p>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Views Today</p>
            <p class="mt-2 text-3xl font-black text-slate-900">{{ number(analytics.stats.viewsToday) }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ number(analytics.stats.sessionsToday) }} sessions today</p>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Pages / Session</p>
            <p class="mt-2 text-3xl font-black text-slate-900">{{ analytics.stats.pagesPerSession.toFixed(2) }}</p>
            <p class="mt-1 text-xs text-slate-400">Average browsing depth</p>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Top Page</p>
            <p class="mt-2 truncate text-lg font-black text-slate-900">
              {{ analytics.topPages[0]?.title || "No traffic yet" }}
            </p>
            <p class="mt-1 text-xs text-slate-400">
              {{ number(analytics.topPages[0]?.views || 0) }} views
            </p>
          </article>
        </section>

        <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Traffic Over Time</h2>
              <p class="text-sm text-slate-500">Page views and anonymous visitor sessions</p>
            </div>
            <div class="text-xs text-slate-400">
              Times shown in Melbourne time
            </div>
          </div>

          <div v-if="analytics.timeline.length" class="mt-6 overflow-x-auto">
            <div class="flex min-w-[720px] items-end gap-2 border-b border-slate-200 pb-2" style="height: 240px">
              <div
                v-for="point in analytics.timeline"
                :key="point.date"
                class="group flex min-w-0 flex-1 flex-col items-center justify-end"
                style="height: 100%"
              >
                <div class="mb-2 hidden text-center text-[10px] font-semibold text-slate-500 group-hover:block">
                  {{ point.views }} views / {{ point.sessions }} sessions
                </div>
                <div
                  class="w-full max-w-10 rounded-t-md bg-blue-500 transition hover:bg-blue-600"
                  :style="{ height: `${barHeight(point.views)}%`, minHeight: point.views ? '4px' : '0px' }"
                  :title="`${point.label}: ${point.views} views, ${point.sessions} sessions`"
                />
                <p class="mt-2 whitespace-nowrap text-[10px] text-slate-500">{{ point.label }}</p>
              </div>
            </div>
          </div>

          <p v-else class="mt-6 rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
            No traffic has been recorded for this period yet.
          </p>
        </section>

        <section class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-4">
              <h2 class="font-bold text-slate-900">Most Viewed Pages</h2>
              <p class="mt-1 text-sm text-slate-500">Where visitors are spending their time</p>
            </div>

            <div v-if="analytics.topPages.length" class="divide-y divide-slate-100">
              <div v-for="(page, index) in analytics.topPages" :key="page.path" class="flex items-center gap-4 px-5 py-3.5">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {{ index + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-slate-900">{{ page.title }}</p>
                  <p class="truncate text-xs text-slate-400">{{ page.path }}</p>
                </div>
                <span class="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {{ number(page.views) }}
                </span>
              </div>
            </div>
            <p v-else class="p-8 text-center text-sm text-slate-500">No page views yet.</p>
          </div>

          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-4">
              <h2 class="font-bold text-slate-900">Most Viewed Products</h2>
              <p class="mt-1 text-sm text-slate-500">Products receiving the most attention</p>
            </div>

            <div v-if="analytics.topProducts.length" class="divide-y divide-slate-100">
              <div v-for="(product, index) in analytics.topProducts" :key="product.slug" class="flex items-center gap-4 px-5 py-3.5">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-700">
                  {{ index + 1 }}
                </span>
                <NuxtLink :to="`/product/${product.slug}`" target="_blank" class="min-w-0 flex-1 hover:text-blue-600">
                  <p class="truncate font-semibold">{{ product.title }}</p>
                  <p class="truncate text-xs text-slate-400">/product/{{ product.slug }}</p>
                </NuxtLink>
                <span class="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                  {{ number(product.views) }}
                </span>
              </div>
            </div>
            <p v-else class="p-8 text-center text-sm text-slate-500">No product views yet.</p>
          </div>

          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-4">
              <h2 class="font-bold text-slate-900">Popular Categories</h2>
              <p class="mt-1 text-sm text-slate-500">Category pages being browsed most</p>
            </div>

            <div v-if="analytics.topCategories.length" class="divide-y divide-slate-100">
              <div v-for="category in analytics.topCategories" :key="category.slug" class="flex items-center gap-3 px-5 py-3.5">
                <NuxtLink :to="`/category/${category.slug}`" target="_blank" class="min-w-0 flex-1 truncate font-semibold text-slate-900 hover:text-blue-600">
                  {{ category.title }}
                </NuxtLink>
                <span class="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                  {{ number(category.views) }}
                </span>
              </div>
            </div>
            <p v-else class="p-8 text-center text-sm text-slate-500">No category views yet.</p>
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 px-5 py-4">
                <h2 class="font-bold text-slate-900">Traffic Sources</h2>
                <p class="mt-1 text-xs text-slate-500">External referrers</p>
              </div>
              <div v-if="analytics.referrers.length" class="divide-y divide-slate-100">
                <div v-for="source in analytics.referrers" :key="source.label" class="flex items-center justify-between gap-3 px-5 py-3">
                  <span class="min-w-0 truncate text-sm font-semibold text-slate-700">{{ source.label }}</span>
                  <span class="text-xs font-bold text-slate-500">{{ number(source.views) }}</span>
                </div>
              </div>
              <p v-else class="p-6 text-center text-sm text-slate-500">Mostly direct traffic so far.</p>
            </div>

            <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 px-5 py-4">
                <h2 class="font-bold text-slate-900">Devices</h2>
                <p class="mt-1 text-xs text-slate-500">Desktop, mobile and tablet</p>
              </div>
              <div v-if="analytics.devices.length" class="divide-y divide-slate-100">
                <div v-for="device in analytics.devices" :key="device.label" class="px-5 py-3">
                  <div class="flex items-center justify-between gap-3">
                    <span class="capitalize text-sm font-semibold text-slate-700">{{ device.label }}</span>
                    <span class="text-xs font-bold text-slate-500">{{ number(device.views) }}</span>
                  </div>
                  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full rounded-full bg-slate-600" :style="{ width: `${devicePercent(device.views)}%` }" />
                  </div>
                </div>
              </div>
              <p v-else class="p-6 text-center text-sm text-slate-500">No device data yet.</p>
            </div>
          </div>
        </section>

        <section class="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="font-bold text-slate-900">Recent Visitor Activity</h2>
            <p class="mt-1 text-sm text-slate-500">Anonymous page activity only — no customer identity is recorded</p>
          </div>

          <div v-if="analytics.recent.length" class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-5 py-3">Page</th>
                  <th class="px-5 py-3">Type</th>
                  <th class="px-5 py-3">Device</th>
                  <th class="px-5 py-3">Source</th>
                  <th class="px-5 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="event in analytics.recent" :key="event.id">
                  <td class="max-w-sm px-5 py-3">
                    <p class="truncate font-semibold text-slate-900">{{ event.title }}</p>
                    <p class="truncate text-xs text-slate-400">{{ event.path }}</p>
                  </td>
                  <td class="px-5 py-3 capitalize text-slate-600">{{ event.pageType }}</td>
                  <td class="px-5 py-3 capitalize text-slate-600">{{ event.device }}</td>
                  <td class="px-5 py-3 text-slate-600">{{ event.referrer || "Direct / Internal" }}</td>
                  <td class="whitespace-nowrap px-5 py-3 text-right text-slate-500">{{ dateTime(event.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="p-8 text-center text-sm text-slate-500">No recent traffic yet.</p>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

type AnalyticsData = {
  rangeDays: number;
  truncated: boolean;
  stats: {
    pageViews: number;
    sessions: number;
    viewsToday: number;
    sessionsToday: number;
    pagesPerSession: number;
  };
  timeline: Array<{ date: string; label: string; views: number; sessions: number }>;
  topPages: Array<{ path: string; title: string; views: number }>;
  topProducts: Array<{ slug: string; title: string; views: number }>;
  topCategories: Array<{ slug: string; title: string; views: number }>;
  referrers: Array<{ label: string; views: number }>;
  devices: Array<{ label: string; views: number }>;
  recent: Array<{
    id: number;
    path: string;
    title: string;
    pageType: string;
    referrer: string | null;
    device: string;
    createdAt: string;
  }>;
};

const ranges = [1, 7, 30, 90];
const days = ref(30);
const analytics = ref<AnalyticsData | null>(null);
const loading = ref(true);
const errorMessage = ref("");
const { adminFetch } = useAdminFetch();

const number = (value: unknown) =>
  new Intl.NumberFormat("en-AU").format(Number(value || 0));

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const maxTimelineViews = computed(() =>
  Math.max(1, ...(analytics.value?.timeline.map((point) => point.views) || [1])),
);

const totalDeviceViews = computed(() =>
  (analytics.value?.devices || []).reduce((sum, item) => sum + Number(item.views || 0), 0),
);

const barHeight = (views: number) =>
  Math.max(2, Math.round((Number(views || 0) / maxTimelineViews.value) * 88));

const devicePercent = (views: number) =>
  totalDeviceViews.value
    ? Math.round((Number(views || 0) / totalDeviceViews.value) * 100)
    : 0;

async function loadAnalytics() {
  loading.value = true;
  errorMessage.value = "";

  try {
    analytics.value = await adminFetch<AnalyticsData>(
      `/api/admin/analytics?days=${days.value}`,
    );
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      error?.message ||
      "Unable to load traffic analytics.";
  } finally {
    loading.value = false;
  }
}

async function changeRange(value: number) {
  days.value = value;
  await loadAnalytics();
}

onMounted(loadAnalytics);
</script>
