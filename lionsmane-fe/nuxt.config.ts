/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/test-utils",
    "shadcn-nuxt",
    "nuxt-oidc-auth",
    "nuxt-api-party",
  ],

  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
  oidc: {
    defaultProvider: "keycloak",
    middleware: {
      globalMiddlewareEnabled: false,
    },
    providers: {
      keycloak: {
        baseUrl: "",
        clientId: "",
        clientSecret: "",
        redirectUri: "http://localhost:3000/auth/keycloak/callback",
      },
    },
  },
  apiParty: {
    endpoints: {
      lionsmane: {
        url: process.env.LIONSMANE_API_BASE_URL!,
      },
    },
  },
});
