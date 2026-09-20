export default defineEventHandler((event) => {
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /account/",
    "Disallow: /auth/",
    "Disallow: /cart",
    "Disallow: /checkout/",
    "Disallow: /search",
    "",
    "Sitemap: https://shop.kiallacomputers.com.au/sitemap.xml",
    ""
  ].join("\n");
});
