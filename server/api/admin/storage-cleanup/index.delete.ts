import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";


const BUCKET = "products";

const decodeStoragePath = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Public/signed Supabase storage URL.
  const markers = [
    "/storage/v1/object/public/products/",
    "/storage/v1/object/sign/products/",
    "/storage/v1/object/authenticated/products/",
  ];

  for (const marker of markers) {
    const index = trimmed.indexOf(marker);
    if (index >= 0) {
      const raw = trimmed.slice(index + marker.length).split("?")[0];
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }

  // Allow a stored bucket-relative path as well.
  if (!trimmed.includes("://") && !trimmed.startsWith("/")) {
    return trimmed.replace(/^products\//, "");
  }

  return null;
};

const collectImageReferences = (products: any[]) => {
  const references = new Set<string>();

  const add = (value: unknown) => {
    const path = decodeStoragePath(value);
    if (path) references.add(path);
  };

  for (const product of products || []) {
    const images = product?.images;

    if (Array.isArray(images)) {
      images.forEach(add);
    } else if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) parsed.forEach(add);
        else add(images);
      } catch {
        add(images);
      }
    }

    // Be defensive if an older product row has a single-image field.
    add(product?.image_url);
    add(product?.image);
  }

  return references;
};


export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody<{ paths?: unknown }>(event);
  const requested = Array.isArray(body?.paths)
    ? body.paths
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const paths = [...new Set(requested)];

  if (!paths.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Select at least one image to delete.",
    });
  }

  if (paths.length > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: "A maximum of 100 images can be deleted at once.",
    });
  }

  if (paths.some((path) =>
    path === "ads" ||
    path.startsWith("ads/") ||
    path.includes("..") ||
    path.startsWith("/")
  )) {
    throw createError({
      statusCode: 400,
      statusMessage: "One or more storage paths are not eligible for cleanup.",
    });
  }

  const supabase = getAdminSupabase();

  // Re-read products immediately before deletion. This is the safety check:
  // if an image was attached to a product after the page loaded, deletion stops.
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,images");

  if (productError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to re-check product image references.",
    });
  }

  const referenced = collectImageReferences(products || []);
  const nowUsed = paths.filter((path) => referenced.has(path));

  if (nowUsed.length) {
    throw createError({
      statusCode: 409,
      statusMessage:
        `Deletion stopped because ${nowUsed.length} selected image` +
        `${nowUsed.length === 1 ? " is" : "s are"} now used by a product. Refresh and review the list again.`,
    });
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .remove(paths);

  if (error) {
    console.error("STORAGE CLEANUP DELETE ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Unable to delete selected images.",
    });
  }

  return {
    deleted: data?.length || paths.length,
    paths,
  };
});
