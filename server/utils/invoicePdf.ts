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

const COMPANY_LOGO_JPEG_BASE64 = "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";
const COMPANY_LOGO_WIDTH = 180;
const COMPANY_LOGO_HEIGHT = 180;

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
  const year = Number.isNaN(date.getTime())
    ? new Date().getFullYear()
    : date.getFullYear();
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
  const drawLogo = (x: number, yy: number, width: number, height: number) =>
    cmd(`q ${width} 0 0 ${height} ${x} ${yy} cm /Im1 Do Q`);

  const ensure = (needed: number) => {
    if (y - needed >= bottom) return;
    pageIndex += 1;
    pages.push([]);
    y = top;
    drawLogo(left, y - 42, 42, 42);
    setFont("F2", 14);
    text(left + 52, y - 16, `Kialla Computers - Invoice ${invoiceNumber(order)} (continued)`);
    y -= 54;
    line(left, y, right, y);
    y -= 20;
  };

  drawLogo(left, y - 64, 64, 64);
  setFont("F2", 22);
  text(left + 78, y - 18, "KIALLA COMPUTERS");
  setFont("F1", 10);
  text(left + 78, y - 37, "Computer Sales, Service & ICT Solutions");
  setFont("F2", 10);
  text(425, y - 4, "SALES INVOICE");
  y -= 78;
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

  ensure(125);
  y -= 8;
  const deliveryCost = Number(order.shipping_cost || 0);
  const orderTotal = Number(order.total || 0);
  const merchandiseSubtotal = Math.max(0, orderTotal - deliveryCost);
  const gstIncluded = orderTotal / 11;

  setFont("F1", 10);
  text(400, y, "Subtotal");
  text(485, y, money(merchandiseSubtotal));
  y -= 18;
  text(400, y, "Delivery");
  text(485, y, money(deliveryCost));
  y -= 18;
  text(400, y, "GST included (10%)");
  text(485, y, money(gstIncluded));
  y -= 22;
  line(395, y + 8, right, y + 8);
  setFont("F2", 12);
  text(400, y, "TOTAL");
  text(485, y, money(orderTotal));
  y -= 32;
  setFont("F1", 9);
  text(left, y, "Thank you for purchasing from Kialla Computers.");
  y -= 14;
  text(left, y, "Please retain this invoice for your records and warranty purposes.");

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
  objects[3] = Buffer.from(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "latin1",
  );
  objects[4] = Buffer.from(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "latin1",
  );

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
    const pageObj = pageObjectNumbers[i];
    const contentObj = contentObjectNumbers[i];
    const stream = Buffer.from(buildPageContent(pages[i]), "latin1");

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
  let xref = `xref\n0 ${maxObject + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i <= maxObject; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "latin1"));

  return Buffer.concat(chunks);
}

export function getInvoiceFilename(order: InvoiceData) {
  return `${invoiceNumber(order)}.pdf`;
}
