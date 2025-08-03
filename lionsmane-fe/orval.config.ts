/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineConfig } from "orval";

export default defineConfig({
	lionsmaneZod: {
		output: {
			client: "zod",

			mode: "tags",

			target: "./app/utils/gen/zod",

			fileExtension: ".zod.ts",
		},

		input: {
			target: "./v1.json",
		},
	},
	// lionsmane: {
	//   output: {
	//     client: 'vue-query',
	//     httpClient: 'fetch',
	//
	//     mode: 'tags',
	//
	//     target: './utils/gen/endpoints',
	//
	//     schemas: './utils/gen/endpoints',
	//
	//     mock: true,
	//   },
	//
	//   input: {
	//     target: './v1.json',
	//   },
	// },
});
