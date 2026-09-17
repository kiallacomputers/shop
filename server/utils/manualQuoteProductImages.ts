import { getAdminSupabase } from "~~/server/utils/adminAuth";
import sharp from "sharp";

const firstImage = (images: unknown) => {
  if (!Array.isArray(images)) return "";

  return String(images.find(Boolean) || "");
};

export async function manualQuoteProductImageMap(items: any[]) {
  const ids = [
    ...new Set(
      (items || [])
        .map((i: any) => Number(i.product_id))
        .filter(
          (id) => Number.isInteger(id) && id > 0,
        ),
    ),
  ];

  if (!ids.length) {
    return new Map<number, string>();
  }

  const { data, error } = await getAdminSupabase()
    .from("products")
    .select("id,images")
    .in("id", ids);

  if (error) {
    console.error(
      "Failed to load product images:",
      error.message,
    );

    return new Map<number, string>();
  }

  const result = new Map<number, string>();

  await Promise.all(
    (data || []).map(async (p: any) => {
      const url = firstImage(p.images);

      if (!url || !/^https?:\/\//i.test(url)) {
        return;
      }

      try {
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(
            `Product ${p.id} image failed: ${response.status}`,
          );

          return;
        }

        const bytes = Buffer.from(
          await response.arrayBuffer(),
        );

        if (!bytes.length || bytes.length > 10_000_000) {
          return;
        }

        // Convert JPEG, PNG, WebP, etc. to JPEG.
        const jpeg = await sharp(bytes)
          .jpeg({
            quality: 85,
            mozjpeg: true,
          })
          .toBuffer();

        if (!jpeg.length) {
          return;
        }

        result.set(
          Number(p.id),
          `data:image/jpeg;base64,${jpeg.toString("base64")}`,
        );
      } catch (error) {
        console.error(
          `Failed to convert image for product ${p.id}:`,
          error,
        );
      }
    }),
  );

  return result;
}
