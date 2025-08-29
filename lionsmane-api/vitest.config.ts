import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ...
    projects: [
      {
        test: {
          name: 'node',
          root: './src',
          environment: 'node',
          // setupFiles: ['./setup.node.ts'],
        },
      },
    ],
  },
});
