import { defineStore } from "pinia";

export const useCartStore = defineStore(
  "cart",
  () => {
    const items = ref<any[]>([]);
    const notification = ref("");

    const count = computed(() => {
      return items.value.reduce((total, item) => total + item.quantity, 0);
    });

    const total = computed(() => {
      return items.value.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0,
      );
    });

    function addToCart(product: any) {
      console.log("ADD TO CART:", product);

      const variantId = product.selectedVariant?.id ? Number(product.selectedVariant.id) : null;
      const cartKey = `${product.id}:${variantId ?? "base"}`;
      const existing = items.value.find((item) => item.cartKey === cartKey);

      if (existing) {
        existing.quantity++;
      } else {
        items.value.push({
          id: product.id,
          cartKey,
          variantId,
          variantName: product.selectedVariant?.name || null,
          productCode: product.selectedVariant?.product_code || product.product_code || null,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          image: product.images,
          quantity: 1,
        });
      }
      notification.value = `${product.name} has been added to your cart.`;

      setTimeout(() => {
        notification.value = "";
      }, 3000);

      console.log("CART ITEMS:", items.value);
    }

    function removeFromCart(key: string | number) {
      items.value = items.value.filter((item) => (item.cartKey || item.id) !== key);
    }

    function increase(key: string | number) {
      const item = items.value.find((item) => (item.cartKey || item.id) === key);

      if (item) {
        item.quantity++;
      }
    }

    function decrease(key: string | number) {
      const item = items.value.find((item) => (item.cartKey || item.id) === key);

      if (!item) return;

      item.quantity--;

      if (item.quantity <= 0) {
        removeFromCart(key);
      }
    }

    function setPrice(key: string | number, price: number) {
      const item = items.value.find((row) => (row.cartKey || row.id) === key);
      const numericPrice = Number(price);
      if (item && Number.isFinite(numericPrice) && numericPrice > 0) {
        item.price = numericPrice;
      }
    }

    function clearCart() {
      items.value = [];
    }

    return {
      items,
      notification,
      count,
      total,
      addToCart,
      removeFromCart,
      increase,
      decrease,
      setPrice,
      clearCart,
    };
  },
  {
    persist: {
      key: "shopping-cart",
    },
  },
);
