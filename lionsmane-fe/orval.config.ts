import { defineConfig } from 'orval';

export default defineConfig({
  lionsmane: {
    input: {
      target: './v1.json',
    },
    output: {
      client: 'react-query',
      mock: true,
      mode: 'tags-split',
      schemas: 'src/api/model',
      target: 'src/api/petstore.ts',
    },
  },
  lionsmaneZod: {
    input: {
      target: './v1.json',
    },
    output: {
      client: 'zod',
      fileExtension: '.zod.ts',
      mode: 'tags-split',
      target: 'src/api/endpoints',
    },
  },
});
