export const plainDescriptionText = (value: unknown) => {
  if (!value) return "";
  const blocks = Array.isArray(value) ? value : [];
  return blocks
    .flatMap((block: any) => {
      if (!block || typeof block !== "object") return [];
      if (["heading", "paragraph", "quote"].includes(String(block.type))) return [block.text];
      if (block.type === "list" && Array.isArray(block.items)) return block.items;
      if (block.type === "downloads" && Array.isArray(block.downloads)) return block.downloads.map((x: any) => x?.description);
      return [];
    })
    .map((x) => String(x || "").replace(/\*\*/g, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

export const seoDescription = (product: any, max = 155) => {
  const blurb = String(product?.blurb || "").replace(/\s+/g, " ").trim();
  const description = plainDescriptionText(product?.description);
  const fallback = `Shop ${product?.name || "this product"} from Kialla Computers with secure checkout and Australian delivery.`;
  const text = blurb || description || fallback;
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
};

export const seoTitle = (product: any) => `${String(product?.name || "Product").trim()} | Kialla Computers`;

export const firstProductImage = (value: unknown) => {
  if (Array.isArray(value)) return String(value.find(Boolean) || "").trim();
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return String(parsed.find(Boolean) || "").trim();
    } catch {
      return value.trim();
    }
  }
  return "";
};

export const xmlEscape = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");
