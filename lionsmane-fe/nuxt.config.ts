/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
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
		"@nuxtjs/color-mode",
		"@nuxt/ui",
		"@peterbud/nuxt-query",
		"@pinia/nuxt",
	],

	css: ["~/assets/css/tailwind.css"],
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			include: [
				"vee-validate",
				"zod",
				"@vee-validate/zod",
				"class-variance-authority",
				"reka-ui",
				"clsx",
				"tailwind-merge",
				"@tanstack/vue-query",
				"lucide-vue-next",
				"@vueuse/core",
			],
		},
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
		componentDir: "./app/components/ui",
	},
	colorMode: {
		classSuffix: "",
		preference: "system",
	},

	nuxtQuery: {
		autoImports: ["useQuery", "useMutation", "useQueryClient"],

		devtools: true,

		// These are the same options as the QueryClient
		// from @tanstack/vue-query, will be passed
		// to the QueryClient constructor
		// More details: https://tanstack.com/query/v5/docs/reference/QueryClient
		// queryClientOptions: {
		//   defaultOptions: {
		//     queries: {},
		//   },
		// },
	},

	ssr: false,

	runtimeConfig: {
		public: {
			apiUrl: 'http://localhost:8181'
		}
	},
});