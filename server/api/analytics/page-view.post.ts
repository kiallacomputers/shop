import { getAdminSupabase } from "~~/server/utils/adminAuth";

const cleanText = (value: unknown, max = 300) =>
  String(value ?? "").trim().slice(0, max);

const classifyPath = (path: string) => {
  const product = path.match(/^\/product\/([^/]+)/);
  if (product) return { pageType: "product", contentSlug: product[1] };

  const category = path.match(/^\/category\/([^/]+)/);
  if (category) return { pageType: "category", contentSlug: category[1] };

  if (path === "/") return { pageType: "home", contentSlug: null };
  if (path === "/shoppingcart") return { pageType: "cart", contentSlug: null };

  return { pageType: "page", contentSlug: null };
};

const deviceType = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
};

const isBot = (userAgent: string) =>
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|preview/i.test(
    userAgent,
  );


const countryFromRequest = (event: any) => {
  const normaliseCode = (value: unknown) => {
    const code = String(value ?? "").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  };

  const countryNameFromCode = (code: string | null) => {
    if (!code) return null;
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
    } catch {
      return code;
    }
  };

  const contextGeo =
    event?.context?.geo ||
    event?.context?.netlify?.geo ||
    event?.context?.clientContext?.geo ||
    null;

  let code =
    normaliseCode(contextGeo?.country?.code) ||
    normaliseCode(contextGeo?.country_code) ||
    normaliseCode(contextGeo?.countryCode);

  let name =
    cleanText(contextGeo?.country?.name || contextGeo?.country_name || contextGeo?.countryName, 100) ||
    null;

  const nfGeo = cleanText(getHeader(event, "x-nf-geo"), 2000);
  if ((!code || !name) && nfGeo) {
    try {
      const parsed = JSON.parse(nfGeo);
      code =
        code ||
        normaliseCode(parsed?.country?.code) ||
        normaliseCode(parsed?.country_code) ||
        normaliseCode(parsed?.countryCode);
      name =
        name ||
        cleanText(parsed?.country?.name || parsed?.country_name || parsed?.countryName, 100) ||
        null;
    } catch {
      // Ignore malformed geo metadata.
    }
  }

  code =
    code ||
    normaliseCode(getHeader(event, "x-country-code")) ||
    normaliseCode(getHeader(event, "cf-ipcountry"));

  if (!name && code) name = countryNameFromCode(code);

  return { countryCode: code, countryName: name };
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const sessionId = cleanText(body?.sessionId, 80);
  const path = cleanText(body?.path, 500);
  const title = cleanText(body?.title, 200);
  const userAgent = cleanText(getHeader(event, "user-agent"), 500);

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  ) {
    return { recorded: false };
  }

  if (
    !path.startsWith("/") ||
    path.startsWith("/admin") ||
    path.startsWith("/auth") ||
    path.startsWith("/account") ||
    path.startsWith("/checkout") ||
    path.startsWith("/api") ||
    isBot(userAgent)
  ) {
    return { recorded: false };
  }

  let referrerHost: string | null = null;
  const referrer = cleanText(body?.referrer, 1000);
  if (referrer) {
    try {
      const url = new URL(referrer);
      referrerHost = cleanText(url.hostname.replace(/^www\./i, ""), 200) || null;
    } catch {
      referrerHost = null;
    }
  }

  const { pageType, contentSlug } = classifyPath(path);
  const { countryCode, countryName } = countryFromRequest(event);
  const supabase = getAdminSupabase();

  const { error } = await supabase.from("site_analytics_events").insert({
    session_id: sessionId,
    path,
    page_title: title || null,
    page_type: pageType,
    content_slug: contentSlug,
    referrer_host: referrerHost,
    device_type: deviceType(userAgent),
    country_code: countryCode,
    country_name: countryName,
  });

  if (error) {
    // Do not expose database details to public visitors.
    console.error("ANALYTICS PAGE VIEW ERROR:", error);
    return { recorded: false };
  }

  return { recorded: true };
});
