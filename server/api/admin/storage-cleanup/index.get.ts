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


const listAllFiles = async (supabase: any) => {
  const output: Array<{
    name: string;
    path: string;
    size: number | null;
    created_at: string | null;
    updated_at: string | null;
    mime_type: string | null;
  }> = [];

  const walk = async (folder = "", depth = 0) => {
    if (depth > 10) return;

    let offset = 0;
    const limit = 1000;

    while (true) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) throw error;

      const rows = data || [];

      for (const item of rows) {
        const path = folder ? `${folder}/${item.name}` : item.name;

        // Supabase returns folders without file metadata/id.
        const isFolder =
          !item.id &&
          !item.metadata &&
          !item.created_at &&
          !item.updated_at;

        if (isFolder) {
          // Advertisement banners also live in this bucket. They are not
          // product photography and must never be offered by this cleanup page.
          if (path === "ads" || path.startsWith("ads/")) continue;
          await walk(path, depth + 1);
          continue;
        }

        const mimeType =
          item.metadata?.mimetype ||
          item.metadata?.contentType ||
          null;

        const looksLikeImage =
          mimeType?.startsWith("image/") ||
          /\.(jpe?g|png|webp|gif|avif)$/i.test(item.name);

        if (!looksLikeImage) continue;

        output.push({
          name: item.name,
          path,
          size: Number(item.metadata?.size ?? 0) || null,
          created_at: item.created_at || null,
          updated_at: item.updated_at || null,
          mime_type: mimeType,
        });
      }

      if (rows.length < limit) break;
      offset += limit;
    }
  };

  await walk();
  return output;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const supabase = getAdminSupabase();

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,images");

  if (productError) {
    console.error("STORAGE CLEANUP PRODUCT LOOKUP ERROR:", productError);
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to inspect product image references.",
    });
  }

  const referenced = collectImageReferences(products || []);

  let files;
  try {
    files = await listAllFiles(supabase);
  } catch (error: any) {
    console.error("STORAGE CLEANUP BUCKET LIST ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Unable to list product storage.",
    });
  }

  const unused = files
    .filter((file) => !referenced.has(file.path))
    .map((file) => {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(file.path);
      return {
        ...file,
        url: data.publicUrl,
      };
    });

  const totalBytes = unused.reduce(
    (sum, file) => sum + Number(file.size || 0),
    0,
  );

  return {
    bucket: BUCKET,
    scanned_files: files.length,
    referenced_files: files.length - unused.length,
    unused_files: unused.length,
    unused_bytes: totalBytes,
    files: unused,
  };
});
