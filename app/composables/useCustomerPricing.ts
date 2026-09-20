type PricingQuoteItem = {
  productId: string | number;
  variantId?: string | number | null;
};

type PricingQuoteResponse = {
  pricingLevel: { key: string; name: string };
  products: Record<string, number>;
  variants: Record<string, number>;
};

export const useCustomerPricing = () => {
  const supabase = useSupabaseClient();
  const pricingLevelName = useState<string>("customer-pricing-level-name", () => "Standard");

  const quote = async (items: PricingQuoteItem[]) => {
    if (!import.meta.client || !items.length) {
      return { pricingLevel: { key: "standard", name: pricingLevelName.value }, products: {}, variants: {} } as PricingQuoteResponse;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const result = await $fetch<PricingQuoteResponse>("/api/pricing/quote", {
      method: "POST",
      headers,
      body: { items },
    });

    pricingLevelName.value = result?.pricingLevel?.name || "Standard";
    return result;
  };

  const applyToProducts = async (products: any[]) => {
    if (!import.meta.client || !Array.isArray(products) || !products.length) return products;

    const items: PricingQuoteItem[] = [];
    for (const product of products) {
      items.push({ productId: product.id });
      for (const variant of product.product_variants || []) {
        items.push({ productId: product.id, variantId: variant.id });
      }
    }

    const result = await quote(items);

    for (const product of products) {
      const productPrice = result.products[String(product.id)];
      if (Number.isFinite(productPrice)) product.customer_price = productPrice;

      for (const variant of product.product_variants || []) {
        const variantPrice = result.variants[String(variant.id)];
        if (Number.isFinite(variantPrice)) variant.customer_price = variantPrice;
      }
    }

    return products;
  };

  return { quote, applyToProducts, pricingLevelName };
};
