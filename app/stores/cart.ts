import { defineStore } from "pinia";

export const useCartStore = defineStore(
  "cart",
  () => {
    const items = ref<any[]>([]);

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

      const existing = items.value.find((item) => item.id === product.id);

      if (existing) {
        existing.quantity++;
      } else {
        items.value.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          image: product.images,
          quantity: 1,
        });
      }
      this.notification = `${product.name} has been added to your cart.`;

      setTimeout(() => {
        this.notification = "";
      }, 3000);

      console.log("CART ITEMS:", items.value);
    }

    function removeFromCart(id: number) {
      items.value = items.value.filter((item) => item.id !== id);
    }

    function increase(id: number) {
      const item = items.value.find((item) => item.id === id);

      if (item) {
        item.quantity++;
      }
    }

    function decrease(id: number) {
      const item = items.value.find((item) => item.id === id);

      if (!item) return;

      item.quantity--;

      if (item.quantity <= 0) {
        removeFromCart(id);
      }
    }

    function clearCart() {
      items.value = [];
    }

    return {
      items,
      count,
      total,
      addToCart,
      removeFromCart,
      increase,
      decrease,
      clearCart,
    };
  },
  {
    persist: {
      key: "shopping-cart",
    },
  },
);
