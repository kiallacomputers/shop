import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";


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

  // Product descriptions are JSON content blocks. Image blocks store their
  // image URL in fields such as `url`, so recursively inspect every string in
  // the description rather than only the main product gallery.
  const scanDescription = (value: unknown) => {
    if (value == null) return;

    if (typeof value === "string") {
      add(value);

      // Some older rows may contain the description as a JSON string.
      const trimmed = value.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          scanDescription(JSON.parse(trimmed));
        } catch {
          // Normal description text is not JSON; nothing else to inspect.
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(scanDescription);
      return;
    }

    if (typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(scanDescription);
    }
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

    // Protect images embedded in Product Description Builder blocks.
    scanDescription(product?.description);

    // Be defensive if an older product row has a single-image field.
    add(product?.image_url);
    add(product?.image);
  }

  return references;
};

// Scan one folder/page per request to stay below Netlify function time limits.
const PAGE_SIZE = 100;
const scanPage = async (supabase: any, folder: string, offset: number) => {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" },
  });
  if (error) throw error;
  const files: any[] = [];
  const folders: string[] = [];
  for (const item of data || []) {
    const path = folder ? `${folder}/${item.name}` : item.name;
    const isFolder = !item.id && !item.metadata && !item.created_at && !item.updated_at;
    if (isFolder) {
      if (path !== "ads" && !path.startsWith("ads/")) folders.push(path);
      continue;
    }
    const mimeType = item.metadata?.mimetype || item.metadata?.contentType || null;
    if (!(mimeType?.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif)$/i.test(item.name))) continue;
    files.push({name:item.name,path,size:Number(item.metadata?.size??0)||null,
      created_at:item.created_at||null,updated_at:item.updated_at||null,mime_type:mimeType});
  }
  return {files,folders,hasMore:(data||[]).length===PAGE_SIZE};
};

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const supabase = getAdminSupabase();

  const query = getQuery(event);
  const folder = typeof query.folder === "string" ? query.folder : "";
  const offset = Math.max(0, Math.floor(Number(query.offset || 0)) || 0);
  if (offset > 1000000 || folder.startsWith("/") || folder.includes("..") || folder === "ads" || folder.startsWith("ads/")) {
    throw createError({statusCode:400,statusMessage:"Invalid scan position"});
  }

  // Only the current page's file references need comparison, but all products
  // must be read to ensure we never flag an image that is in use.
  const { data: products, error: productError } = await supabase
    .from("products").select("id,images,description");
  if (productError) throw createError({statusCode:500,statusMessage:"Unable to read product images"});
  const { data: variants, error: variantError } = await supabase
    .from("product_variants").select("id,images");
  // Variants may be absent or have no images column after migration.
  const ignoreVariantError = variantError && ["42P01","42703","PGRST205","PGRST204"].includes(variantError.code);
  if (variantError && !ignoreVariantError) {
    throw createError({statusCode:500,statusMessage:"Unable to read legacy variant images"});
  }
  const referenced = collectImageReferences([...(products||[]),...(!variantError?(variants||[]):[])]);
  let page;
  try { page = await scanPage(supabase,folder,offset); }
  catch (error:any) {
    console.error("STORAGE CLEANUP LIST ERROR:",error);
    throw createError({statusCode:500,statusMessage:error?.message||"Storage scan failed"});
  }
  const unused = page.files.filter(file=>!referenced.has(file.path)).map(file=>({
    ...file,url:supabase.storage.from(BUCKET).getPublicUrl(file.path).data.publicUrl
  }));
  return {bucket:BUCKET,scanned_files:page.files.length,
    referenced_files:page.files.length-unused.length,unused_files:unused.length,
    unused_bytes:unused.reduce((sum,file)=>sum+Number(file.size||0),0),files:unused,
    folders:page.folders,has_more:page.hasMore,next_offset:offset+100};
});
