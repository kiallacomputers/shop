import { createClient } from "@supabase/supabase-js";

type AnalyticsEvent = {
  session_id: string;
  path: string;
  page_title: string | null;
  page_type: string;
  content_slug: string | null;
  referrer_host: string | null;
  device_type: string;
  created_at: string;
};

type RankedItem = {
  label: string;
  views: number;
};

const esc = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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

const pageLabel = (event: AnalyticsEvent) => {
  if (event.page_type === "home") return "Home";
  if (event.page_type === "cart") return "Shopping Cart";
  if (event.page_title) {
    return event.page_title.replace(/\s*\|\s*Kialla Computers.*$/i, "").trim();
  }
  return event.path;
};

const productLabel = (events: AnalyticsEvent[], slug: string) => {
  const sample = events.find(
    (row) => row.page_type === "product" && row.content_slug === slug,
  );
  return sample ? pageLabel(sample) : slug;
};

const categoryLabel = (events: AnalyticsEvent[], slug: string) => {
  const sample = events.find(
    (row) => row.page_type === "category" && row.content_slug === slug,
  );
  return sample ? pageLabel(sample) : slug;
};

const percentChange = (current: number, previous: number) => {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const changeText = (current: number, previous: number) => {
  const change = percentChange(current, previous);
  if (change === 0) return "No change from previous week";
  return `${change > 0 ? "↑" : "↓"} ${Math.abs(change)}% from previous week`;
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

const formatDay = (day: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${day}T12:00:00+10:00`));

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);

const rankedRows = (items: Array<{ label: string; views: number }>, empty: string) => {
  if (!items.length) {
    return `<tr><td colspan="2" style="padding:16px;color:#64748b;text-align:center">${esc(empty)}</td></tr>`;
  }

  return items
    .map(
      (item, index) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a">
          <strong>${index + 1}.</strong> ${esc(item.label)}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0369a1">${item.views.toLocaleString("en-AU")}</td>
      </tr>`,
    )
    .join("");
};

const sendGraphMail = async (to: string, subject: string, html: string) => {
  const tenantId = String(process.env.MICROSOFT_TENANT_ID || "").trim();
  const clientId = String(process.env.MICROSOFT_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.MICROSOFT_CLIENT_SECRET || "").trim();
  const senderEmail = String(process.env.MICROSOFT_SENDER_EMAIL || "").trim();
  const senderName = String(process.env.MICROSOFT_SENDER_NAME || "Kialla Computers").trim();

  const missing = [
    !tenantId && "MICROSOFT_TENANT_ID",
    !clientId && "MICROSOFT_CLIENT_ID",
    !clientSecret && "MICROSOFT_CLIENT_SECRET",
    !senderEmail && "MICROSOFT_SENDER_EMAIL",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Microsoft Graph email is not configured. Missing: ${missing.join(", ")}`);
  }

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    },
  );

  if (!tokenResponse.ok) {
    throw new Error(`Microsoft Graph token request failed (${tokenResponse.status}).`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) throw new Error("Microsoft Graph did not return an access token.");

  const graphResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: to } }],
          from: { emailAddress: { address: senderEmail, name: senderName } },
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!graphResponse.ok) {
    throw new Error(`Microsoft Graph sendMail failed (${graphResponse.status}).`);
  }
};

const loadEvents = async (fromIso: string, toIso: string) => {
  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
  const supabaseSecretKey = String(process.env.SUPABASE_SECRET_KEY || "").trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const all: AnalyticsEvent[] = [];
  const pageSize = 1000;
  const maxRows = 50000;

  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await supabase
      .from("site_analytics_events")
      .select("session_id,path,page_title,page_type,content_slug,referrer_host,device_type,created_at")
      .gte("created_at", fromIso)
      .lt("created_at", toIso)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message || "Unable to load analytics events.");

    const rows = (data || []) as AnalyticsEvent[];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }

  return all;
};

export async function sendWeeklyAnalyticsReport(options?: { recipient?: string }) {
  const recipient = String(
    options?.recipient || process.env.WEEKLY_ANALYTICS_EMAIL || "",
  ).trim();

  if (!recipient) {
    throw new Error("WEEKLY_ANALYTICS_EMAIL is not configured.");
  }

  const end = new Date();
  const currentStart = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);

  const all = await loadEvents(previousStart.toISOString(), end.toISOString());
  const current = all.filter((row) => new Date(row.created_at) >= currentStart);
  const previous = all.filter((row) => new Date(row.created_at) < currentStart);

  const currentSessions = new Set(current.map((row) => row.session_id)).size;
  const previousSessions = new Set(previous.map((row) => row.session_id)).size;
  const pagesPerSession = currentSessions ? current.length / currentSessions : 0;
  const previousPagesPerSession = previousSessions ? previous.length / previousSessions : 0;

  const productCounts = countBy(
    current.filter((row) => row.page_type === "product"),
    (row) => row.content_slug,
  )
    .slice(0, 15)
    .map((item) => ({ label: productLabel(current, item.label), views: item.views }));

  const categoryCounts = countBy(
    current.filter((row) => row.page_type === "category"),
    (row) => row.content_slug,
  )
    .slice(0, 10)
    .map((item) => ({ label: categoryLabel(current, item.label), views: item.views }));

  const topPages = countBy(current, (row) => row.path)
    .slice(0, 10)
    .map((item) => {
      const sample = current.find((row) => row.path === item.label);
      return { label: sample ? pageLabel(sample) : item.label, views: item.views };
    });

  const referrers = countBy(current, (row) => row.referrer_host)
    .filter((item) => !/kiallacomputers\.com\.au$/i.test(item.label))
    .slice(0, 8);

  const devices = countBy(current, (row) => row.device_type).slice(0, 5);

  const days = new Map<string, { views: number; sessions: Set<string> }>();
  for (const event of current) {
    const key = melbourneDay(event.created_at);
    const row = days.get(key) || { views: 0, sessions: new Set<string>() };
    row.views += 1;
    row.sessions.add(event.session_id);
    days.set(key, row);
  }

  const dailyRows = [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([day, row]) => `<tr>
        <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0">${esc(formatDay(day))}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${row.views.toLocaleString("en-AU")}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${row.sessions.size.toLocaleString("en-AU")}</td>
      </tr>`,
    )
    .join("");

  const siteUrl = String(process.env.URL || "https://shop.kiallacomputers.com.au").replace(/\/$/, "");
  const reportRange = `${formatDate(currentStart)} – ${formatDate(end)}`;

  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:760px;margin:0 auto;padding:24px">
    <div style="background:#0b1f3a;border-radius:16px 16px 0 0;padding:24px;color:white">
      <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7dd3fc">Kialla Computers</div>
      <h1 style="margin:8px 0 4px;font-size:28px">Weekly Traffic Report</h1>
      <div style="color:#cbd5e1">${esc(reportRange)}</div>
    </div>

    <div style="background:#ffffff;padding:22px">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:8px">
        <tr>
          <td style="width:33%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px">
            <div style="font-size:12px;color:#64748b">PAGE VIEWS</div>
            <div style="font-size:28px;font-weight:800;margin-top:5px">${current.length.toLocaleString("en-AU")}</div>
            <div style="font-size:12px;color:#64748b">${esc(changeText(current.length, previous.length))}</div>
          </td>
          <td style="width:33%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px">
            <div style="font-size:12px;color:#64748b">VISITOR SESSIONS</div>
            <div style="font-size:28px;font-weight:800;margin-top:5px">${currentSessions.toLocaleString("en-AU")}</div>
            <div style="font-size:12px;color:#64748b">${esc(changeText(currentSessions, previousSessions))}</div>
          </td>
          <td style="width:33%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px">
            <div style="font-size:12px;color:#64748b">PAGES / SESSION</div>
            <div style="font-size:28px;font-weight:800;margin-top:5px">${pagesPerSession.toFixed(2)}</div>
            <div style="font-size:12px;color:#64748b">${esc(changeText(Math.round(pagesPerSession * 100), Math.round(previousPagesPerSession * 100)))}</div>
          </td>
        </tr>
      </table>

      <h2 style="margin:24px 0 8px;font-size:19px">Products Viewed</h2>
      <p style="margin:0 0 10px;color:#64748b;font-size:13px">Your most viewed products during the last seven days.</p>
      <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f8fafc"><th style="padding:10px 12px;text-align:left">Product</th><th style="padding:10px 12px;text-align:right">Views</th></tr></thead>
        <tbody>${rankedRows(productCounts, "No product views recorded this week.")}</tbody>
      </table>

      <h2 style="margin:24px 0 8px;font-size:19px">Traffic by Day</h2>
      <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0">
        <thead><tr style="background:#f8fafc"><th style="padding:10px 12px;text-align:left">Day</th><th style="padding:10px 12px;text-align:right">Views</th><th style="padding:10px 12px;text-align:right">Sessions</th></tr></thead>
        <tbody>${dailyRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#64748b">No traffic recorded this week.</td></tr>'}</tbody>
      </table>

      <h2 style="margin:24px 0 8px;font-size:19px">Most Viewed Pages</h2>
      <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0"><tbody>${rankedRows(topPages, "No page views recorded this week.")}</tbody></table>

      <h2 style="margin:24px 0 8px;font-size:19px">Popular Categories</h2>
      <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0"><tbody>${rankedRows(categoryCounts, "No category views recorded this week.")}</tbody></table>

      <div style="display:flex;gap:16px;margin-top:24px">
        <div style="flex:1">
          <h2 style="margin:0 0 8px;font-size:19px">Traffic Sources</h2>
          <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0"><tbody>${rankedRows(referrers, "Mostly direct traffic.")}</tbody></table>
        </div>
        <div style="flex:1">
          <h2 style="margin:0 0 8px;font-size:19px">Devices</h2>
          <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0"><tbody>${rankedRows(devices.map((item) => ({ label: item.label[0]?.toUpperCase() + item.label.slice(1), views: item.views })), "No device data.")}</tbody></table>
        </div>
      </div>

      <div style="margin-top:28px;text-align:center">
        <a href="${esc(siteUrl)}/admin/analytics" style="display:inline-block;background:#2367d1;color:white;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:700">Open Traffic Analytics</a>
      </div>
    </div>

    <div style="background:#e2e8f0;border-radius:0 0 16px 16px;padding:14px 22px;text-align:center;font-size:11px;color:#64748b">
      Anonymous website analytics report generated automatically by Kialla Computers. No customer names, email addresses or raw IP addresses are included.
    </div>
  </div>
</body>
</html>`;

  await sendGraphMail(
    recipient,
    `Kialla Computers Weekly Traffic Report — ${reportRange}`,
    html,
  );

  return {
    sent: true,
    recipient,
    range: reportRange,
    pageViews: current.length,
    sessions: currentSessions,
    productsViewed: productCounts.length,
  };
}
