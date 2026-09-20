import { requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const config = useRuntimeConfig();
  const pageId = String(config.facebookPageId || process.env.FACEBOOK_PAGE_ID || "").trim();
  const token = String(config.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "").trim();
  const graphVersion = String(config.facebookGraphVersion || process.env.FACEBOOK_GRAPH_VERSION || "v24.0").trim();

  if (!pageId || !token) {
    return {
      configured: false,
      pageId: pageId || null,
      pageName: null,
      graphVersion,
      message: "Facebook Page publishing is not configured.",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(pageId)}?fields=id,name&access_token=${encodeURIComponent(token)}`,
    );
    const data = await response.json();

    if (!response.ok || data?.error) {
      console.error("FACEBOOK STATUS ERROR:", data?.error || data);
      return {
        configured: false,
        pageId,
        pageName: null,
        graphVersion,
        message: data?.error?.message || "Facebook Page connection could not be verified.",
      };
    }

    return {
      configured: true,
      pageId: data.id || pageId,
      pageName: data.name || "Facebook Page",
      graphVersion,
      message: "Facebook Page connection is ready.",
    };
  } catch (error: any) {
    console.error("FACEBOOK STATUS REQUEST ERROR:", error);
    return {
      configured: false,
      pageId,
      pageName: null,
      graphVersion,
      message: error?.message || "Facebook Page connection could not be verified.",
    };
  }
});
