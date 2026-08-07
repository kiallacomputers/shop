import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [] as any[],
  }),

  getters: {
    count: (state) =>
      state.items.reduce((total, item) => total + item.quantity, 0),

    total: (state) =>
      state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
  },

  actions: {
    addToCart(product: any) {
      const existing = this.items.find((item) => item.id === product.id);

      if (existing) {
        existing.quantity++;
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images,
          quantity: 1,
        });
      }
    },

    removeFromCart(id: number) {
      this.items = this.items.filter((item) => item.id !== id);
    },

    increase(id: number) {
      const item = this.items.find((item) => item.id === id);

      if (item) {
        item.quantity++;
      }
    },

    decrease(id: number) {
      const item = this.items.find((item) => item.id === id);

      if (!item) return;

      item.quantity--;

      if (item.quantity <= 0) {
        this.removeFromCart(id);
      }
    },

    clearCart() {
      this.items = [];
    },
  },

  // ⭐ Saves cart to browser storage
  persist: {
    key: "shopping-cart",
  },
});
