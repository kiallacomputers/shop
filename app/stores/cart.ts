import { defineStore } from "pinia";

interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  [key: string]: any;
}

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [] as CartItem[],
    notification: "" as string,
  }),

  getters: {
    // Number of different products in the cart
    cartCount: (state) => state.items.length,

    // Total number of items including quantities
    totalItems: (state) =>
      state.items.reduce((total, item) => total + Number(item.quantity), 0),
    // Cart total
    cartTotal: (state) =>
      state.items.reduce(
        (total, item) => total + Number(item.price) * Number(item.quantity),
        0,
      ),

    // Check whether a product is already in the cart
    hasItem: (state) => {
      return (id: number | string) =>
        state.items.some((item) => item.id === id);
    },
  },
  actions: {
    // ----------------------------------------
    //
    // ADD TO CART
    //
    // ----------------------------------------
    addToCart(product: CartItem) {
      const existingItem = this.items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.items.push({ ...product, quantity: 1 });
      }

      // Show notification
      this.notification = `${product.name} has been added to your cart.`;

      // Remove notification after 3 seconds
      setTimeout(() => {
        this.notification = "";
      }, 3000);
    },

    // ----------------------------------------
    //
    // REMOVE FROM CART
    //
    // ----------------------------------------
    removeFromCart(id: number | string) {
      this.items = this.items.filter((item) => item.id !== id);
    },

    // ----------------------------------------
    //
    // UPDATE QUANTITY
    //
    // ----------------------------------------
    updateQuantity(id: number | string, quantity: number) {
      const item = this.items.find((item) => item.id === id);
      if (!item) {
        return;
      }
      if (quantity <= 0) {
        this.removeFromCart(id);
        return;
      }
      item.quantity = quantity;
    },

    // ----------------------------------------
    //
    //    INCREASE QUANTITY
    //
    // ----------------------------------------
    increaseQuantity(id: number | string) {
      const item = this.items.find((item) => item.id === id);
      if (item) {
        item.quantity++;
      }
    },

    // ----------------------------------------
    //
    // DECREASE QUANTITY
    //
    // ----------------------------------------
    decreaseQuantity(id: number | string) {
      const item = this.items.find((item) => item.id === id);
      if (!item) {
        return;
      }
      if (item.quantity <= 1) {
        this.removeFromCart(id);
      } else {
        item.quantity--;
      }
    },

    // ----------------------------------------
    //
    // CLEAR CART
    //
    // ----------------------------------------
    clearCart() {
      this.items = [];
    },

    // ----------------------------------------
    //
    // CLEAR NOTIFICATION
    //
    // ----------------------------------------
    clearNotification() {
      this.notification = "";
    },
  },

  // Persist cart in localStorage
  persist: true,
});
