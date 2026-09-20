import { requireAdmin } from "~~/server/utils/adminAuth";

type PublishBody = {
  productId?: string | number;
  message?: string;
  productUrl?: string;
  imageUrl?: string;
};

const isKiallaProductUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "shop.kiallacomputers.com.au" &&
      url.pathname.startsWith("/product/")
    );
  } catch {
    return false;
  }
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody<PublishBody>(event);
  const message = String(body?.message || "").trim();
  const productUrl = String(body?.productUrl || "").trim();

  if (!body?.productId) {
    throw createError({ statusCode: 400, statusMessage: "A product is required." });
  }

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Facebook post text is required." });
  }

  if (!isKiallaProductUrl(productUrl)) {
    throw createError({ statusCode: 400, statusMessage: "A valid Kialla Computers product URL is required." });
  }

  const config = useRuntimeConfig();
  const pageId = String(config.facebookPageId || process.env.FACEBOOK_PAGE_ID || "").trim();
  const token = String(config.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "").trim();
  const graphVersion = String(config.facebookGraphVersion || process.env.FACEBOOK_GRAPH_VERSION || "v24.0").trim();

  if (!pageId || !token) {
    throw createError({
      statusCode: 503,
      statusMessage: "Facebook Page publishing is not configured. Add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in Netlify.",
    });
  }

  // Publish the product as a Page feed post with a link. Facebook scrapes the
  // product page's Open Graph metadata, which now points at the product image.
  const params = new URLSearchParams();
  params.set("message", message);
  params.set("link", productUrl);
  params.set("access_token", token);

  const response = await fetch(
    `https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(pageId)}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString(),
    },
  );

  const data = await response.json();

  if (!response.ok || data?.error || !data?.id) {
    console.error("FACEBOOK PAGE PUBLISH ERROR:", data?.error || data);

    throw createError({
      statusCode: response.status >= 400 ? response.status : 502,
      statusMessage:
        data?.error?.message ||
        "Facebook did not accept the Page post. Check the Page token and Meta app permissions.",
    });
  }

  return {
    ok: true,
    postId: String(data.id),
    pageId,
    message: "Product posted to Facebook successfully.",
  };
});
