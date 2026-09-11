import {
  COMPANY_LOGO_HEIGHT,
  COMPANY_LOGO_JPEG_BASE64,
  COMPANY_LOGO_WIDTH,
} from "./invoicePdf";

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

const safePdfText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const fmtDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  }).format(d);
};

const wrap = (value: unknown, maxChars: number) => {
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

const business = () => ({
  name: String(process.env.BUSINESS_NAME || "Kialla Computers").trim(),
  tagline: String(process.env.BUSINESS_TAGLINE || "Computer Sales, Service & ICT Solutions").trim(),
  location: String(process.env.BUSINESS_ADDRESS || "Kialla, Victoria, Australia").trim(),
  website: String(process.env.BUSINESS_WEBSITE || "shop.kiallacomputers.com.au").trim(),
  email: String(process.env.BUSINESS_EMAIL || process.env.MICROSOFT_SENDER_EMAIL || "").trim(),
  phone: String(process.env.BUSINESS_PHONE || "").trim(),
  abn: String(process.env.BUSINESS_ABN || "").trim(),
});

export function createQuotePdf(q: QuotePdfData) {
  const pageWidth = 595;
  const pageHeight = 842;
  const left = 48;
  const right = 547;
  const top = 794;
  const bottom = 48;
  const info = business();

  const pages: string[][] = [[]];
  let pageIndex = 0;
  let y = top;
  const page = () => pages[pageIndex];
  const cmd = (value: string) => page().push(value);
  const setFont = (font: "F1" | "F2", size: number) => cmd(`/${font} ${size} Tf`);
  const text = (x: number, yy: number, value: unknown) =>
    cmd(`BT 1 0 0 1 ${x} ${yy} Tm (${safePdfText(value)}) Tj ET`);
  const line = (x1: number, y1: number, x2: number, y2: number) => cmd(`${x1} ${y1} m ${x2} ${y2} l S`);
  const drawLogo = (x: number, yy: number, width: number, height: number) =>
    cmd(`q ${width} 0 0 ${height} ${x} ${yy} cm /Im1 Do Q`);

  const header = (continued = false) => {
    drawLogo(left, y - 64, 64, 64);
    setFont("F2", continued ? 15 : 22);
    text(left + 78, y - 18, info.name.toUpperCase());
    setFont("F1", 9);
    text(left + 78, y - 36, info.tagline);
    text(left + 78, y - 51, info.location);

    setFont("F2", 11);
    text(390, y - 4, continued ? "QUOTE - CONTINUED" : "FORMAL QUOTATION");
    setFont("F1", 8);
    text(390, y - 20, `Quote: ${quoteNumber(q)}`);
    text(390, y - 32, `Issued: ${fmtDate(q.created_at) || fmtDate(new Date().toISOString())}`);
    if (q.expires_at) text(390, y - 44, `Valid Until: ${fmtDate(q.expires_at)}`);
    if (info.website) text(390, y - 58, info.website);
    if (info.email) text(390, y - 70, info.email);

    y -= 92;
    line(left, y, right, y);
    y -= 22;
  };

  const ensure = (needed: number) => {
    if (y - needed >= bottom) return;
    pageIndex += 1;
    pages.push([]);
    y = top;
    header(true);
  };

  header(false);

  setFont("F2", 10);
  text(left, y, "PREPARED FOR");
  y -= 17;
  setFont("F1", 10);
  text(left, y, q.customer_name || "Customer");
  y -= 14;
  if (q.customer_email) {
    text(left, y, q.customer_email);
    y -= 14;
  }
  y -= 16;

  setFont("F2", 9);
  text(left, y, "DESCRIPTION");
  text(352, y, "QTY");
  text(402, y, "UNIT PRICE");
  text(500, y, "TOTAL");
  y -= 8;
  line(left, y, right, y);
  y -= 18;

  for (const item of q.items || []) {
    const unit = Number(item.quoted_price ?? item.requested_price ?? 0);
    const qty = Math.max(1, Number(item.quantity || 1));
    let label = item.product_name || "Product";
    if (item.variant_name) label += ` - ${item.variant_name}`;
    const labelLines = wrap(label, 52);
    const rowHeight = Math.max(20, labelLines.length * 12 + (item.product_code ? 13 : 0) + 6);
    ensure(rowHeight + 18);

    setFont("F1", 9);
    labelLines.forEach((l, i) => text(left, y - i * 12, l));
    text(360, y, qty);
    text(402, y, money(unit));
    text(492, y, money(unit * qty));
    y -= labelLines.length * 12;
    if (item.product_code) {
      setFont("F1", 8);
      text(left + 8, y, `Product Code: ${item.product_code}`);
      y -= 13;
    }
    y -= 5;
    line(left, y, right, y);
    y -= 10;
  }

  ensure(125);
  const calculated = (q.items || []).reduce(
    (sum, item) => sum + Number(item.quoted_price ?? item.requested_price ?? 0) * Math.max(1, Number(item.quantity || 1)),
    0,
  );
  const total = Number(q.quoted_total ?? calculated);
  const gstIncluded = total / 11;
  const exGst = total - gstIncluded;

  setFont("F1", 10);
  text(397, y, "Subtotal ex GST");
  text(487, y, money(exGst));
  y -= 18;
  text(397, y, "GST (10%)");
  text(487, y, money(gstIncluded));
  y -= 16;
  line(392, y, right, y);
  y -= 18;
  setFont("F2", 12);
  text(397, y, "QUOTE TOTAL");
  text(487, y, money(total));
  y -= 30;

  if (q.customer_message) {
    ensure(70);
    setFont("F2", 9);
    text(left, y, "CUSTOMER REQUEST / NOTES");
    y -= 16;
    setFont("F1", 8);
    for (const l of wrap(q.customer_message, 92).slice(0, 8)) {
      ensure(14);
      text(left, y, l);
      y -= 12;
    }
    y -= 8;
  }

  ensure(90);
  setFont("F2", 9);
  text(left, y, "TERMS & CONDITIONS");
  y -= 16;
  setFont("F1", 8);
  const terms = [
    "All prices are in Australian dollars (AUD) and include GST unless otherwise stated.",
    `This quotation is valid for 7 days from the issue date shown above. Valid until ${fmtDate(q.expires_at) || "7 days after issue"}.`,
    "Pricing and supply are subject to product availability at the time the quote is accepted.",
    "Acceptance and payment of this quotation confirms approval to supply the quoted goods or services.",
  ];
  for (const term of terms) {
    for (const l of wrap(term, 98)) {
      text(left, y, l);
      y -= 11;
    }
  }

  y -= 12;
  line(left, y, right, y);
  y -= 15;
  setFont("F2", 8);
  text(left, y, "Thank you for the opportunity to provide this quotation.");
  setFont("F1", 8);
  text(360, y, `${info.name} | ${info.website}`);

  const objects: Array<Buffer | undefined> = [];
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];
  let nextObject = 6;
  for (let i = 0; i < pages.length; i += 1) {
    pageObjectNumbers.push(nextObject++);
    contentObjectNumbers.push(nextObject++);
  }

  objects[1] = Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1");
  objects[2] = Buffer.from(
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "latin1",
  );
  objects[3] = Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "latin1");
  objects[4] = Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "latin1");

  const logoBytes = Buffer.from(COMPANY_LOGO_JPEG_BASE64, "base64");
  objects[5] = Buffer.concat([
    Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width ${COMPANY_LOGO_WIDTH} /Height ${COMPANY_LOGO_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n`,
      "latin1",
    ),
    logoBytes,
    Buffer.from("\nendstream", "latin1"),
  ]);

  for (let i = 0; i < pages.length; i += 1) {
    const stream = Buffer.from(pages[i].join("\n"), "latin1");
    const pageObj = pageObjectNumbers[i];
    const contentObj = contentObjectNumbers[i];
    objects[pageObj] = Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents ${contentObj} 0 R >>`,
      "latin1",
    );
    objects[contentObj] = Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, "latin1"),
      stream,
      Buffer.from("\nendstream", "latin1"),
    ]);
  }

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  const offsets: number[] = [0];
  const maxObject = objects.length - 1;
  let currentLength = chunks[0].length;
  for (let i = 1; i <= maxObject; i += 1) {
    const body = objects[i];
    if (!body) throw new Error(`Missing PDF object ${i}`);
    offsets[i] = currentLength;
    const prefix = Buffer.from(`${i} 0 obj\n`, "latin1");
    const suffix = Buffer.from("\nendobj\n", "latin1");
    chunks.push(prefix, body, suffix);
    currentLength += prefix.length + body.length + suffix.length;
  }
  const xrefOffset = currentLength;
  let xref = `xref\n0 ${maxObject + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObject; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

export function getQuoteFilename(q: QuotePdfData) {
  return `${quoteNumber(q)}.pdf`;
}
