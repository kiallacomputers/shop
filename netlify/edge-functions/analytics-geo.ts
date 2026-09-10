/**
 * Adds Netlify's GeoIP country to the analytics request before it reaches
 * the Nuxt/Nitro API route. We intentionally pass country only — no IP,
 * coordinates, city, postcode or other precise location data.
 */
export default async (request: Request, context: any) => {
  const headers = new Headers(request.headers);

  const countryCode = String(context?.geo?.country?.code || "")
    .trim()
    .toUpperCase();
  const countryName = String(context?.geo?.country?.name || "").trim();

  if (/^[A-Z]{2}$/.test(countryCode)) {
    headers.set("x-kc-country-code", countryCode);
  }

  if (countryName) {
    headers.set("x-kc-country-name", countryName.slice(0, 100));
  }

  return context.next(new Request(request, { headers }));
};

export const config = {
  path: "/api/analytics/page-view",
};
