import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const IMAGE_EXTENSIONS = /\\.(?:jpe?g|png|webp|gif|avif)$/i;
const cleanPath = (value: unknown) => String(value || "").replace(/\\\\/g, "/").split("/").filter((part) => part && part !== "." && part !== "..").join("/");

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const query = getQuery(event);
  const path = cleanPath(query.path);
  const search = String(query.search || "").trim().slice(0, 100);
  const limit = Math.min(100, Math.max(12, Number(query.limit || 60) || 60));
  const offset = Math.max(0, Number(query.offset || 0) || 0);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.storage.from("products").list(path, {
    limit: limit + 1, offset, sortBy: { column: "name", order: "asc" }, ...(search ? { search } : {}),
  });
  if (error) {
    console.error("ADMIN PRODUCT IMAGE LIBRARY ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Unable to read the products image bucket" });
  }
  const page = (data || []).slice(0, limit);
  const folders: Array<{ name: string; path: string }> = [];
  const files: Array<{ name: string; path: string; url: string; size: number | null }> = [];
  for (const item of page) {
    const itemPath = path ? `${path}/${item.name}` : item.name;
    if (!item.id) { folders.push({ name: item.name, path: itemPath }); continue; }
    if (!IMAGE_EXTENSIONS.test(item.name)) continue;
    const { data: publicData } = supabase.storage.from("products").getPublicUrl(itemPath);
    files.push({ name: item.name, path: itemPath, url: publicData.publicUrl, size: Number(item.metadata?.size || 0) || null });
  }
  return { path, folders, files, has_more: (data || []).length > limit, next_offset: offset + page.length };
});
