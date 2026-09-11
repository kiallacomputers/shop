// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  app: {
    head: {
      title: "Kialla Computers",
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      ],
    },
  },
  css: ["~/assets/css/main.css"],
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

    facebookPageId: process.env.FACEBOOK_PAGE_ID,
    facebookPageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    facebookGraphVersion: process.env.FACEBOOK_GRAPH_VERSION || "v24.0",

    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://shop.kiallacomputers.com.au",
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
});
