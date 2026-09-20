import { getAdminSupabase } from "~~/server/utils/adminAuth";

const env = (name: string) => String(process.env[name] || "").trim();
const first = (...values: string[]) => values.find((value) => value.trim())?.trim() || "";

export const getMyPostSenderConfig = () => ({
  name: first(env("MYPOST_SENDER_NAME"), env("AUSPOST_SENDER_NAME"), "Kialla Computers"),
  businessName: first(env("MYPOST_SENDER_BUSINESS_NAME"), env("AUSPOST_SENDER_BUSINESS_NAME"), "Kialla Computers"),
  addressLine1: first(env("MYPOST_SENDER_ADDRESS_LINE_1"), env("AUSPOST_SENDER_ADDRESS_LINE_1")),
  addressLine2: first(env("MYPOST_SENDER_ADDRESS_LINE_2"), env("AUSPOST_SENDER_ADDRESS_LINE_2")),
  suburb: first(env("MYPOST_SENDER_SUBURB"), env("AUSPOST_SENDER_SUBURB")),
  state: first(env("MYPOST_SENDER_STATE"), env("AUSPOST_SENDER_STATE")).toUpperCase(),
  postcode: first(env("MYPOST_SENDER_POSTCODE"), env("AUSPOST_SENDER_POSTCODE")),
  phone: first(env("MYPOST_SENDER_PHONE"), env("AUSPOST_SENDER_PHONE")),
  email: first(env("MYPOST_SENDER_EMAIL"), env("AUSPOST_SENDER_EMAIL"), env("MICROSOFT_SENDER_EMAIL")),
});

export const requireMyPostSenderConfig = () => {
  const config = getMyPostSenderConfig();
  const required: Array<[string, string]> = [
    ["MYPOST_SENDER_NAME", config.name],
    ["MYPOST_SENDER_ADDRESS_LINE_1", config.addressLine1],
    ["MYPOST_SENDER_SUBURB", config.suburb],
    ["MYPOST_SENDER_STATE", config.state],
    ["MYPOST_SENDER_POSTCODE", config.postcode],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    throw createError({
      statusCode: 503,
      statusMessage: `MyPost Business export is not configured. Missing: ${missing.join(", ")}.`,
    });
  }
  return config;
};

const positiveNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

export async function calculateMyPostParcel(items: Array<{ product_id?: string | number | null; quantity?: string | number | null }>) {
  const productIds = [...new Set(items.map((item) => Number(item.product_id)).filter((id) => Number.isFinite(id) && id > 0))];
  if (!productIds.length) {
    throw createError({ statusCode: 400, statusMessage: "Order items do not contain product IDs for parcel sizing." });
  }

  const supabase = getAdminSupabase();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, weight_kg, length_cm, width_cm, height_cm")
    .in("id", productIds);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message || "Unable to load product parcel details." });
  }

  let weight = 0;
  let length = 0;
  let width = 0;
  let height = 0;

  for (const item of items) {
    const product = products?.find((entry: any) => Number(entry.id) === Number(item.product_id));
    if (!product) continue;

    const quantity = Math.max(1, Number(item.quantity || 1));
    const dimensions = [
      positiveNumber(product.length_cm),
      positiveNumber(product.width_cm),
      positiveNumber(product.height_cm),
    ].sort((a, b) => b - a);

    if (!positiveNumber(product.weight_kg) || dimensions.some((dimension) => !dimension)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${product.name || "A product"} is missing packed weight or dimensions. Update the product before exporting to MyPost Business.`,
      });
    }

    weight += positiveNumber(product.weight_kg) * quantity;
    length = Math.max(length, dimensions[0]);
    width = Math.max(width, dimensions[1]);
    height += dimensions[2] * quantity;
  }

  return {
    weight: Number(weight.toFixed(3)),
    length: Number(length.toFixed(1)),
    width: Number(width.toFixed(1)),
    height: Number(height.toFixed(1)),
  };
}

export const csvCell = (value: unknown) => {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
};
