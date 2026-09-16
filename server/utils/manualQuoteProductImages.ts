import { getAdminSupabase } from "~~/server/utils/adminAuth";

const firstImage = (images: unknown) => Array.isArray(images) ? String(images.find(Boolean) || "") : "";

export async function manualQuoteProductImageMap(items: any[]) {
  const ids = [...new Set((items || []).map((i:any)=>Number(i.product_id)).filter((id)=>Number.isInteger(id)&&id>0))];
  if (!ids.length) return new Map<number,string>();
  const { data } = await getAdminSupabase().from("products").select("id,images").in("id",ids);
  const result = new Map<number,string>();
  await Promise.all((data || []).map(async (p:any) => {
    const url = firstImage(p.images);
    if (!url || !/^https?:\/\//i.test(url)) return;
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const type = String(response.headers.get("content-type") || "").toLowerCase();
      // PDF helper embeds JPEG directly; skip other formats safely.
      if (!type.includes("jpeg") && !/\.jpe?g(?:\?|$)/i.test(url)) return;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 0 && bytes.length <= 5_000_000) result.set(Number(p.id), `data:image/jpeg;base64,${bytes.toString("base64")}`);
    } catch {}
  }));
  return result;
}
