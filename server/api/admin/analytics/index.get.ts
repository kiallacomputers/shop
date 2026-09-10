import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

type AnalyticsEvent = {
  id: number;
  session_id: string;
  path: string;
  page_title: string | null;
  page_type: string;
  content_slug: string | null;
  referrer_host: string | null;
  device_type: string;
  country_code: string | null;
  country_name: string | null;
  created_at: string;
};

const validRanges = new Set([1, 7, 30, 90]);

const countBy = (
  events: AnalyticsEvent[],
  getter: (event: AnalyticsEvent) => string | null | undefined,
) => {
  const counts = new Map<string, number>();

  for (const event of events) {
    const value = String(getter(event) || "").trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, views]) => ({ label, views }))
    .sort((a, b) => b.views - a.views || a.label.localeCompare(b.label));
};

const melbourneDay = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const part = (type: string) =>
    parts.find((entry) => entry.type === type)?.value || "";

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const dayLabel = (isoDay: string) => {
  const date = new Date(`${isoDay}T12:00:00+10:00`);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "Australia/Melbourne",
  }).format(date);
};

const pageLabel = (event: AnalyticsEvent) => {
  if (event.page_type === "home") return "Home";
  if (event.page_type === "cart") return "Shopping Cart";
  if (event.page_title) {
    return event.page_title.replace(/\s*\|\s*Kialla Computers.*$/i, "").trim();
  }
  return event.path;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const requestedDays = Number(getQuery(event).days || 30);
  const days = validRanges.has(requestedDays) ? requestedDays : 30;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = getAdminSupabase();

  const all: AnalyticsEvent[] = [];
  const pageSize = 1000;
  const maxRows = 50000;

  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await supabase
      .from("site_analytics_events")
      .select(
        "id,session_id,path,page_title,page_type,content_slug,referrer_host,device_type,country_code,country_name,created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("ADMIN ANALYTICS LOAD ERROR:", error);
      throw createError({
        statusCode: 500,
        statusMessage: error.message || "Unable to load traffic analytics.",
      });
    }

    const rows = (data || []) as AnalyticsEvent[];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }

  const productSlugs = [...new Set(all.filter((row) => row.page_type === "product").map((row) => row.content_slug).filter(Boolean))] as string[];
  const categorySlugs = [...new Set(all.filter((row) => row.page_type === "category").map((row) => row.content_slug).filter(Boolean))] as string[];

  const productNames = new Map<string, string>();
  const categoryNames = new Map<string, string>();

  if (productSlugs.length) {
    const { data, error } = await supabase
      .from("products")
      .select("slug,name")
      .in("slug", productSlugs);

    if (error) {
      console.warn("ADMIN ANALYTICS PRODUCT NAME LOOKUP ERROR:", error);
    } else {
      for (const row of data || []) {
        if (row?.slug && row?.name) productNames.set(String(row.slug), String(row.name));
      }
    }
  }

  if (categorySlugs.length) {
    const { data, error } = await supabase
      .from("categories")
      .select("slug,name")
      .in("slug", categorySlugs);

    if (error) {
      console.warn("ADMIN ANALYTICS CATEGORY NAME LOOKUP ERROR:", error);
    } else {
      for (const row of data || []) {
        if (row?.slug && row?.name) categoryNames.set(String(row.slug), String(row.name));
      }
    }
  }

  const resolvedPageLabel = (row: AnalyticsEvent) => {
    if (row.page_type === "product" && row.content_slug) {
      return productNames.get(row.content_slug) || pageLabel(row);
    }
    if (row.page_type === "category" && row.content_slug) {
      return categoryNames.get(row.content_slug) || pageLabel(row);
    }
    return pageLabel(row);
  };

  const sessions = new Set(all.map((row) => row.session_id)).size;
  const todayKey = melbourneDay(new Date());
  const todayEvents = all.filter((row) => melbourneDay(row.created_at) === todayKey);
  const todaySessions = new Set(todayEvents.map((row) => row.session_id)).size;

  const timelineMap = new Map<string, { views: number; sessions: Set<string> }>();
  for (const row of all) {
    const key = melbourneDay(row.created_at);
    const current = timelineMap.get(key) || { views: 0, sessions: new Set<string>() };
    current.views += 1;
    current.sessions.add(row.session_id);
    timelineMap.set(key, current);
  }

  const timeline = [...timelineMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      label: dayLabel(date),
      views: value.views,
      sessions: value.sessions.size,
    }));

  const topPages = countBy(all, (row) => row.path)
    .slice(0, 15)
    .map((entry) => {
      const sample = all.find((row) => row.path === entry.label);
      return {
        path: entry.label,
        title: sample ? resolvedPageLabel(sample) : entry.label,
        views: entry.views,
      };
    });

  const topProducts = countBy(
    all.filter((row) => row.page_type === "product"),
    (row) => row.content_slug,
  )
    .slice(0, 10)
    .map((entry) => {
      const sample = all.find(
        (row) => row.page_type === "product" && row.content_slug === entry.label,
      );
      return {
        slug: entry.label,
        title: sample ? resolvedPageLabel(sample) : entry.label,
        views: entry.views,
      };
    });

  const topCategories = countBy(
    all.filter((row) => row.page_type === "category"),
    (row) => row.content_slug,
  )
    .slice(0, 10)
    .map((entry) => {
      const sample = all.find(
        (row) => row.page_type === "category" && row.content_slug === entry.label,
      );
      return {
        slug: entry.label,
        title: sample ? resolvedPageLabel(sample) : entry.label,
        views: entry.views,
      };
    });

  const referrers = countBy(all, (row) => row.referrer_host)
    .filter((row) => !/kiallacomputers\.com\.au$/i.test(row.label))
    .slice(0, 10);

  const devices = countBy(all, (row) => row.device_type);

  const countries = countBy(
    all,
    (row) => row.country_name || row.country_code || "Unknown",
  ).slice(0, 20);

  return {
    rangeDays: days,
    truncated: all.length >= maxRows,
    stats: {
      pageViews: all.length,
      sessions,
      viewsToday: todayEvents.length,
      sessionsToday: todaySessions,
      pagesPerSession: sessions ? Number((all.length / sessions).toFixed(2)) : 0,
    },
    timeline,
    topPages,
    topProducts,
    topCategories,
    referrers,
    devices,
    countries,
    recent: all.slice(0, 40).map((row) => ({
      id: row.id,
      path: row.path,
      title: resolvedPageLabel(row),
      pageType: row.page_type,
      referrer: row.referrer_host,
      device: row.device_type,
      country: row.country_name || row.country_code || null,
      countryCode: row.country_code,
      createdAt: row.created_at,
    })),
  };
});
