import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

const IMAGE_EXTENSIONS = /\.(?:jpe?g|png|webp|gif|avif)$/i;
const cleanPath = (value: unknown) =>
  String(value || "").replace(/\\/g, "/").split("/").filter((part) => part && part !== "." && part !== "..").join("/");

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const q = getQuery(event);
  const requestedPath = cleanPath(q.path);
  const search = String(q.search || "").trim().toLowerCase().slice(0, 100);
  const limit = Math.min(100, Math.max(12, Number(q.limit || 60) || 60));
  const offset = Math.max(0, Number(q.offset || 0) || 0);
  const supabase = getAdminSupabase();
  const bucket = supabase.storage.from("products");

  async function listFolder(path: string) {
    const { data, error } = await bucket.list(path, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    return data || [];
  }

  try {
    // Browse the requested folder normally.
    if (requestedPath) {
      const rows = await listFolder(requestedPath);
      const folders: Array<{ name: string; path: string }> = [];
      const allFiles: Array<{ name: string; path: string; url: string; size: number | null }> = [];
      for (const item of rows) {
        const itemPath = `${requestedPath}/${item.name}`;
        if (!item.id) {
          if (!search || item.name.toLowerCase().includes(search)) folders.push({ name: item.name, path: itemPath });
          continue;
        }
        if (!IMAGE_EXTENSIONS.test(item.name)) continue;
        if (search && !item.name.toLowerCase().includes(search)) continue;
        const { data } = bucket.getPublicUrl(itemPath);
        allFiles.push({ name: item.name, path: itemPath, url: data.publicUrl, size: Number(item.metadata?.size || 0) || null });
      }
      return {
        path: requestedPath,
        folders,
        files: allFiles.slice(offset, offset + limit),
        has_more: offset + limit < allFiles.length,
        next_offset: offset + limit,
      };
    }

    // Root view: recursively discover images. Leader imports are commonly stored
    // below folders, so a root-only list can legitimately contain zero image files.
    const rootRows = await listFolder("");
    const folders = rootRows.filter((x: any) => !x.id).map((x: any) => ({ name: x.name, path: x.name }));
    const files: Array<{ name: string; path: string; url: string; size: number | null }> = [];

    const addFile = (name: string, path: string, metadata: any) => {
      if (!IMAGE_EXTENSIONS.test(name)) return;
      if (search && !`${path}/${name}`.toLowerCase().includes(search)) return;
      const objectPath = path ? `${path}/${name}` : name;
      const { data } = bucket.getPublicUrl(objectPath);
      files.push({ name, path: objectPath, url: data.publicUrl, size: Number(metadata?.size || 0) || null });
    };

    for (const item of rootRows) if (item.id) addFile(item.name, "", item.metadata);

    // Scan root folders so the library opens with actual thumbnails even when
    // all objects are under imported/<product>/... or other folders.
    const queue = folders.map((f) => f.path);
    let scannedFolders = 0;
    while (queue.length && scannedFolders < 250 && files.length < offset + limit + 100) {
      const folder = queue.shift()!;
      scannedFolders++;
      const rows = await listFolder(folder);
      for (const item of rows) {
        const childPath = `${folder}/${item.name}`;
        if (!item.id) queue.push(childPath);
        else addFile(item.name, folder, item.metadata);
      }
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    return {
      path: "",
      folders,
      files: files.slice(offset, offset + limit),
      has_more: files.length > offset + limit || queue.length > 0,
      next_offset: offset + limit,
    };
  } catch (error: any) {
    console.error("ADMIN PRODUCT IMAGE LIBRARY ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ? `Unable to read products image bucket: ${error.message}` : "Unable to read the products image bucket",
    });
  }
});
