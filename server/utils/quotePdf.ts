type QuotePdfItem = {
  product_name: string;
  variant_name?: string | null;
  product_code?: string | null;
  quantity: number;
  requested_price?: number | null;
  quoted_price?: number | null;
};

export type QuotePdfData = {
  id: string | number;
  quote_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_message?: string | null;
  quoted_total?: number | null;
  created_at?: string | null;
  expires_at?: string | null;
  items: QuotePdfItem[];
};

const money = (value: unknown) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));

const quoteNumber = (q: QuotePdfData) => q.quote_number || `KCQ-${String(q.id).padStart(6, "0")}`;

const pdfEscape = (value: unknown) =>
  String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replaceAll(/[^\x20-\x7E]/g, " ");

const fmtDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric", timeZone: "Australia/Melbourne" }).format(d);
};

function text(x: number, y: number, size: number, value: unknown, bold = false) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(value)}) Tj ET\n`;
}

export function createQuotePdf(q: QuotePdfData) {
  const width = 595;
  const height = 842;
  const left = 48;
  const pages: string[] = [];
  let stream = "";
  let y = 790;

  const newPage = () => {
    if (stream) pages.push(stream);
    stream = "";
    y = 790;
    stream += text(left, y, 18, "Kialla Computers", true); y -= 26;
    stream += text(left, y, 11, "QUOTE", true); y -= 24;
  };

  const ensure = (needed = 45) => { if (y < 70 + needed) newPage(); };
  newPage();

  stream += text(left, y, 14, quoteNumber(q), true); y -= 20;
  stream += text(left, y, 10, `Issued: ${fmtDate(q.created_at) || fmtDate(new Date().toISOString())}`); y -= 15;
  if (q.expires_at) { stream += text(left, y, 10, `Valid until: ${fmtDate(q.expires_at)}`); y -= 15; }
  y -= 10;
  stream += text(left, y, 10, `Customer: ${q.customer_name || "Customer"}`, true); y -= 15;
  if (q.customer_email) { stream += text(left, y, 10, q.customer_email); y -= 15; }
  y -= 14;

  stream += text(left, y, 10, "Product", true);
  stream += text(355, y, 10, "Qty", true);
  stream += text(405, y, 10, "Unit", true);
  stream += text(500, y, 10, "Total", true);
  y -= 18;

  for (const item of q.items || []) {
    ensure(42);
    const unit = Number(item.quoted_price ?? item.requested_price ?? 0);
    const qty = Math.max(1, Number(item.quantity || 1));
    let label = item.product_name || "Product";
    if (item.variant_name) label += ` - ${item.variant_name}`;
    stream += text(left, y, 9, label.slice(0, 55));
    stream += text(360, y, 9, qty);
    stream += text(405, y, 9, money(unit));
    stream += text(500, y, 9, money(unit * qty));
    y -= 14;
    if (item.product_code) { stream += text(left + 10, y, 8, `Code: ${item.product_code}`); y -= 13; }
    y -= 5;
  }

  ensure(65);
  const total = Number(q.quoted_total ?? (q.items || []).reduce((s, i) => s + Number(i.quoted_price ?? i.requested_price ?? 0) * Math.max(1, Number(i.quantity || 1)), 0));
  y -= 8;
  stream += text(390, y, 12, "Quoted Total:", true);
  stream += text(500, y, 12, money(total), true);
  y -= 30;
  if (q.customer_message) {
    stream += text(left, y, 9, "Customer request:", true); y -= 14;
    for (const line of String(q.customer_message).split(/\r?\n/).slice(0, 6)) {
      ensure(18); stream += text(left, y, 8, line.slice(0, 85)); y -= 12;
    }
  }
  ensure(50);
  y -= 14;
  stream += text(left, y, 8, "Prices are in AUD and include GST unless otherwise stated."); y -= 12;
  stream += text(left, y, 8, "This quote is subject to stock availability and is valid until the expiry date shown above.");

  if (stream) pages.push(stream);

  const objects: Array<Buffer | undefined> = new Array(5 + pages.length * 2);
  const pageNums: number[] = [];
  const contentNums: number[] = [];
  let next = 5;
  for (let i = 0; i < pages.length; i++) { pageNums.push(next++); contentNums.push(next++); }
  objects[1] = Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1");
  objects[2] = Buffer.from(`<< /Type /Pages /Kids [${pageNums.map(n => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`, "latin1");
  objects[3] = Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "latin1");
  objects[4] = Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "latin1");
  for (let i = 0; i < pages.length; i++) {
    const content = Buffer.from(pages[i], "latin1");
    objects[pageNums[i]] = Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNums[i]} 0 R >>`, "latin1");
    objects[contentNums[i]] = Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`, "latin1"), content, Buffer.from("endstream", "latin1")]);
  }
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  const offsets: number[] = [0];
  let len = chunks[0].length;
  for (let i = 1; i < objects.length; i++) {
    if (!objects[i]) continue;
    offsets[i] = len;
    const pre = Buffer.from(`${i} 0 obj\n`, "latin1");
    const post = Buffer.from("\nendobj\n", "latin1");
    chunks.push(pre, objects[i]!, post); len += pre.length + objects[i]!.length + post.length;
  }
  const xrefOffset = len;
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) xref += `${String(offsets[i] || 0).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

export function getQuoteFilename(q: QuotePdfData) {
  return `${quoteNumber(q)}.pdf`;
}
