
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export type FreightCartItem = {
  id: number;
  quantity: number;
};

export type FreightRate = {
  code: string;
  name: string;
  price: number;
  free: boolean;
};

const AUSPOST_SERVICE_URL =
  "https://digitalapi.auspost.com.au/postage/parcel/domestic/service.json";

const validatePostcode = (value: unknown) => {
  const postcode = String(value ?? "").trim();

  if (!/^\d{4}$/.test(postcode)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please enter a valid 4-digit Australian postcode.",
    });
  }

  return postcode;
};

const positiveNumber = (
  value: unknown,
  label: string,
) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `${label} must be greater than 0.`,
    });
  }

  return number;
};

const normaliseItems = (
  input: unknown,
): FreightCartItem[] => {
  if (!Array.isArray(input) || input.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cart is empty.",
    });
  }

  const quantities = new Map<number, number>();

  for (const raw of input) {
    const id = Number((raw as any)?.id);
    const quantity = Number((raw as any)?.quantity);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid cart item.",
      });
    }

    quantities.set(
      id,
      (quantities.get(id) || 0) + quantity,
    );
  }

  return [...quantities.entries()].map(
    ([id, quantity]) => ({
      id,
      quantity,
    }),
  );
};

const extractAustraliaPostError = (
  data: any,
) => {
  const message =
    data?.error?.errorMessage ||
    data?.error?.message ||
    data?.errors?.error?.message ||
    data?.errors?.[0]?.message;

  return message
    ? String(message)
    : "Australia Post could not calculate delivery for this parcel.";
};

export const calculateFreightOptions = async ({
  items,
  postcode: destinationInput,
}: {
  items: unknown;
  postcode: unknown;
}) => {
  const destinationPostcode =
    validatePostcode(destinationInput);

  const cartItems = normaliseItems(items);
  const supabase = getAdminSupabase();

  // ========================================
  // FREIGHT SETTINGS
  // ========================================

  const {
    data: settings,
    error: settingsError,
  } = await supabase
    .from("freight_settings")
    .select("origin_postcode, enabled")
    .eq("id", 1)
    .single();

  if (settingsError || !settings) {
    console.error(
      "FREIGHT SETTINGS ERROR:",
      settingsError,
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        "Freight settings have not been configured.",
    });
  }

  if (settings.enabled === false) {
    return {
      postcode: destinationPostcode,
      originPostcode:
        String(settings.origin_postcode || ""),
      freeDelivery: true,
      package: null,
      rates: [
        {
          code: "FREE_DELIVERY",
          name: "Free Delivery",
          price: 0,
          free: true,
        },
      ] satisfies FreightRate[],
    };
  }

  const originPostcode =
    validatePostcode(settings.origin_postcode);

  // ========================================
  // FREE DELIVERY OVERRIDE
  // ========================================

  const {
    data: freePostcode,
    error: freeError,
  } = await supabase
    .from("free_delivery_postcodes")
    .select("id, postcode, description, flat_rate")
    .eq("postcode", destinationPostcode)
    .eq("active", true)
    .maybeSingle();

  if (freeError) {
    console.error(
      "FREE POSTCODE CHECK ERROR:",
      freeError,
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        "Unable to check free-delivery postcode.",
    });
  }

  if (freePostcode) {
    const flatRate = Number(
      freePostcode.flat_rate || 11,
    );

    if (![11, 16.5].includes(flatRate)) {
      throw createError({
        statusCode: 500,
        statusMessage:
          "Invalid local flat freight rate configured.",
      });
    }

    return {
      postcode: destinationPostcode,
      originPostcode,
      freeDelivery: false,
      localFlatRate: true,
      package: null,
      rates: [
        {
          code: `LOCAL_FLAT_${flatRate}`,
          name:
            freePostcode.description?.trim() ||
            "Local Flat Rate Delivery",
          price: flatRate,
          free: false,
        },
      ] satisfies FreightRate[],
    };
  }

  // ========================================
  // LOAD PRODUCT PARCEL DATA
  // ========================================

  const productIds = cartItems.map(
    (item) => item.id,
  );

  const {
    data: products,
    error: productError,
  } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      active,
      stock,
      weight_kg,
      length_cm,
      width_cm,
      height_cm
      `,
    )
    .in("id", productIds);

  if (productError) {
    console.error(
      "FREIGHT PRODUCT LOOKUP ERROR:",
      productError,
    );

    throw createError({
      statusCode: 500,
      statusMessage:
        productError.message ||
        "Unable to load product freight details.",
    });
  }

  if (
    !products ||
    products.length !== productIds.length
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "One or more products no longer exist.",
    });
  }

  // ========================================
  // BUILD ONE COMBINED PARCEL
  // ========================================
  //
  // Products are treated as boxes stacked by height:
  // - parcel length = longest product dimension
  // - parcel width  = widest product dimension
  // - parcel height = sum of item heights x quantity
  // - parcel weight = sum of item weights x quantity
  //
  // For unusually large orders you may prefer a future
  // multi-parcel/eParcel implementation.
  // ========================================

  let totalWeight = 0;
  let parcelLength = 0;
  let parcelWidth = 0;
  let parcelHeight = 0;

  for (const item of cartItems) {
    const product = products.find(
      (row: any) =>
        Number(row.id) === item.id,
    ) as any;

    if (!product) {
      continue;
    }

    if (product.active === false) {
      throw createError({
        statusCode: 400,
        statusMessage:
          `${product.name} is no longer available.`,
      });
    }

    if (
      item.quantity >
      Number(product.stock || 0)
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          `Not enough stock is available for ${product.name}.`,
      });
    }

    const weight = positiveNumber(
      product.weight_kg,
      `${product.name} weight`,
    );

    const dimensions = [
      positiveNumber(
        product.length_cm,
        `${product.name} length`,
      ),
      positiveNumber(
        product.width_cm,
        `${product.name} width`,
      ),
      positiveNumber(
        product.height_cm,
        `${product.name} height`,
      ),
    ].sort((a, b) => b - a);

    const [length, width, height] =
      dimensions;

    totalWeight += weight * item.quantity;
    parcelLength = Math.max(
      parcelLength,
      length,
    );
    parcelWidth = Math.max(
      parcelWidth,
      width,
    );
    parcelHeight +=
      height * item.quantity;
  }

  // Australia Post accepts decimals; keep values
  // concise to avoid floating-point noise.
  const packageDetails = {
    weight: Number(totalWeight.toFixed(3)),
    length: Number(parcelLength.toFixed(1)),
    width: Number(parcelWidth.toFixed(1)),
    height: Number(parcelHeight.toFixed(1)),
  };

  // ========================================
  // AUSTRALIA POST PAC API
  // ========================================

  const config = useRuntimeConfig();

  const apiKey =
    String(
      config.auspostApiKey ||
        process.env.AUSPOST_API_KEY ||
        "",
    ).trim();

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Australia Post API key is not configured.",
    });
  }

  const params = new URLSearchParams({
    from_postcode: originPostcode,
    to_postcode: destinationPostcode,
    length: String(packageDetails.length),
    width: String(packageDetails.width),
    height: String(packageDetails.height),
    weight: String(packageDetails.weight),
  });

  let response: Response;

  try {
    response = await fetch(
      `${AUSPOST_SERVICE_URL}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "AUTH-KEY": apiKey,
          Accept: "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "AUSTRALIA POST NETWORK ERROR:",
      error,
    );

    throw createError({
      statusCode: 502,
      statusMessage:
        "Unable to contact Australia Post.",
    });
  }

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error(
      "AUSTRALIA POST API ERROR:",
      response.status,
      data,
    );

    throw createError({
      statusCode: 502,
      statusMessage:
        extractAustraliaPostError(data),
    });
  }

  const rawServices =
    data?.services?.service ??
    data?.services ??
    [];

  const services = Array.isArray(
    rawServices,
  )
    ? rawServices
    : rawServices
      ? [rawServices]
      : [];

  let rates: FreightRate[] = services
    .map((service: any) => ({
      code: String(service?.code || ""),
      name: String(
        service?.name ||
          service?.code ||
          "Australia Post",
      ).trim(),
      price: Number(service?.price),
      free: false,
    }))
    .filter(
      (rate: FreightRate) =>
        rate.code &&
        Number.isFinite(rate.price) &&
        rate.price >= 0,
    );

  // Prefer the normal Parcel Post / Express Post
  // products when PAC returns additional services.
  const commonParcelRates = rates.filter(
    (rate) =>
      /AUS_PARCEL_(REGULAR|EXPRESS)/i.test(
        rate.code,
      ),
  );

  if (commonParcelRates.length) {
    rates = commonParcelRates;
  }

  rates.sort(
    (a, b) => a.price - b.price,
  );

  if (!rates.length) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Australia Post has no available parcel services for this order and postcode.",
    });
  }

  return {
    postcode: destinationPostcode,
    originPostcode,
    freeDelivery: false,
    package: packageDetails,
    rates,
  };
};
