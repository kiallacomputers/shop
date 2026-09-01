type InvoiceItem = {
  product_name: string;
  quantity: number;
  price: number;
};

type InvoiceAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type InvoiceData = {
  id: string | number;
  customer_name?: string | null;
  customer_email?: string | null;
  total: number;
  shipping_method?: string | null;
  shipping_cost?: number | null;
  shipping_address?: InvoiceAddress | null;
  items: InvoiceItem[];
  paid_at?: Date | string | null;
};

const money = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value || 0));

const safePdfText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const invoiceNumber = (order: InvoiceData) => {
  const date = order.paid_at ? new Date(order.paid_at) : new Date();
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  const numeric = String(order.id).replace(/\D/g, "");
  const suffix = numeric ? numeric.padStart(6, "0") : String(order.id);
  return `KC-${year}-${suffix}`;
};

const wrap = (text: string, maxChars: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

function buildPageContent(lines: string[]) {
  return lines.join("\n");
}

export function buildInvoicePdf(order: InvoiceData): Buffer {
  const pageWidth = 595;
  const pageHeight = 842;
  const left = 48;
  const right = 547;
  const top = 794;
  const bottom = 48;
  const lineHeight = 15;

  const pages: string[][] = [[]];
  let pageIndex = 0;
  let y = top;

  const page = () => pages[pageIndex];
  const cmd = (value: string) => page().push(value);
  const setFont = (font: "F1" | "F2", size: number) => cmd(`/${font} ${size} Tf`);
  const text = (x: number, yy: number, value: unknown) =>
    cmd(`BT 1 0 0 1 ${x} ${yy} Tm (${safePdfText(value)}) Tj ET`);
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    cmd(`${x1} ${y1} m ${x2} ${y2} l S`);

  const ensure = (needed: number) => {
    if (y - needed >= bottom) return;
    pageIndex += 1;
    pages.push([]);
    y = top;
    setFont("F2", 14);
    text(left, y, `Kialla Computers - Invoice ${invoiceNumber(order)} (continued)`);
    y -= 26;
    line(left, y, right, y);
    y -= 20;
  };

  setFont("F2", 24);
  text(left, y, "KIALLA COMPUTERS");
  setFont("F1", 10);
  text(405, y + 4, "TAX / SALES INVOICE");
  y -= 34;
  line(left, y, right, y);
  y -= 24;

  setFont("F2", 11);
  text(left, y, `Invoice: ${invoiceNumber(order)}`);
  setFont("F1", 10);
  const paidDate = order.paid_at ? new Date(order.paid_at) : new Date();
  const dateText = Number.isNaN(paidDate.getTime())
    ? new Date().toLocaleDateString("en-AU")
    : paidDate.toLocaleDateString("en-AU");
  text(360, y, `Date: ${dateText}`);
  y -= 18;
  text(left, y, `Order: #${order.id}`);
  y -= 28;

  setFont("F2", 11);
  text(left, y, "DELIVER TO");
  y -= 18;
  setFont("F1", 10);

  const address = order.shipping_address || {};
  const addressLines = [
    address.name || order.customer_name || "Customer",
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(" "),
    address.country,
    order.customer_email,
  ].filter((value): value is string => Boolean(value && String(value).trim()));

  for (const value of addressLines) {
    ensure(lineHeight);
    text(left, y, value);
    y -= lineHeight;
  }

  y -= 10;
  setFont("F2", 11);
  text(left, y, "DELIVERY");
  y -= 18;
  setFont("F1", 10);
  text(left, y, order.shipping_method || "Delivery");
  if (Number(order.shipping_cost || 0) > 0) {
    text(390, y, money(order.shipping_cost));
  }
  y -= 28;

  ensure(60);
  setFont("F2", 10);
  text(left, y, "ITEM");
  text(360, y, "QTY");
  text(405, y, "UNIT");
  text(490, y, "TOTAL");
  y -= 8;
  line(left, y, right, y);
  y -= 18;
  setFont("F1", 9);

  for (const item of order.items) {
    const qty = Number(item.quantity || 0);
    const unit = Number(item.price || 0);
    const subtotal = qty * unit;
    const nameLines = wrap(String(item.product_name || "Product"), 52);
    const rowHeight = Math.max(18, nameLines.length * 12 + 4);
    const previousPage = pageIndex;
    ensure(rowHeight + 22);

    if (pageIndex !== previousPage) {
      setFont("F2", 10);
      text(left, y, "ITEM");
      text(360, y, "QTY");
      text(405, y, "UNIT");
      text(490, y, "TOTAL");
      y -= 8;
      line(left, y, right, y);
      y -= 18;
    }

    setFont("F1", 9);
    nameLines.forEach((name, index) => text(left, y - index * 12, name));
    text(368, y, qty);
    text(405, y, money(unit));
    text(485, y, money(subtotal));
    y -= rowHeight;
    line(left, y, right, y);
    y -= 10;
  }

  ensure(80);
  y -= 8;
  setFont("F2", 12);
  text(400, y, "TOTAL");
  text(485, y, money(order.total));
  y -= 32;
  setFont("F1", 9);
  text(left, y, "Thank you for purchasing from Kialla Computers.");
  y -= 14;
  text(left, y, "Please retain this invoice for your records and warranty purposes.");

  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];

  // Objects 1-4 are catalog, pages root and two fonts.
  let nextObject = 5;
  for (let i = 0; i < pages.length; i += 1) {
    pageObjectNumbers.push(nextObject++);
    contentObjectNumbers.push(nextObject++);
  }

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  for (let i = 0; i < pages.length; i += 1) {
    const pageObj = pageObjectNumbers[i];
    const contentObj = contentObjectNumbers[i];
    const stream = buildPageContent(pages[i]);
    objects[pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`;
    objects[contentObj] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
  }

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [0];
  const maxObject = objects.length - 1;

  for (let i = 1; i <= maxObject; i += 1) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${maxObject + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= maxObject; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

export function getInvoiceFilename(order: InvoiceData) {
  return `${invoiceNumber(order)}.pdf`;
}
