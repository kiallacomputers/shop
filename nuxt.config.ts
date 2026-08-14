// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/supabase",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    redirect: false,
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,

    stripeSecretKey: process.env.STRIPE_SECRET_KEY,

    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
});
