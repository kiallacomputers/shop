export default defineNuxtPlugin(() => {
  const cart = useCartStore();
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  let timer: ReturnType<typeof setTimeout> | null = null;
  let syncing = false;
  let pending = false;

  async function sendCart() {
    if (syncing) {
      pending = true;
      return;
    }

    syncing = true;

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("ABANDONED CART: unable to read session", error);
        return;
      }

      const session = data.session;
      if (!session?.access_token) {
        console.info("ABANDONED CART: customer is not signed in yet");
        return;
      }

      const result = await $fetch("/api/cart/track", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          items: cart.items,
        },
      });

      console.info("ABANDONED CART: cart synced", result);
    } catch (error) {
      // Do not break normal shopping if recovery tracking has a problem,
      // but make the failure visible for diagnosis.
      console.error("ABANDONED CART: tracking failed", error);
    } finally {
      syncing = false;

      if (pending) {
        pending = false;
        scheduleSync(250);
      }
    }
  }

  function scheduleSync(delay = 700) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void sendCart();
    }, delay);
  }

  // Track every cart mutation.
  watch(
    () => cart.items,
    () => scheduleSync(),
    { deep: true, flush: "post" },
  );

  // Track as soon as Nuxt knows who the signed-in customer is.
  watch(
    () => user.value?.id,
    (id) => {
      if (id) scheduleSync(100);
    },
    { immediate: true },
  );

  // Supabase can establish the browser session after the Nuxt user ref has
  // already been initialised, so listen to auth events as well.
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (session?.user?.id && event !== "SIGNED_OUT") {
        scheduleSync(100);
      }
    },
  );

  onNuxtReady(() => {
    // Covers persisted carts that were already populated before this plugin's
    // watchers were attached.
    scheduleSync(100);
  });

  // Re-sync when the customer returns to the tab. This also makes recovery
  // tracking robust across browser sleep/session refresh.
  const onVisible = () => {
    if (document.visibilityState === "visible" && cart.items.length) {
      scheduleSync(100);
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      authListener.subscription.unsubscribe();
    });
  }
});
