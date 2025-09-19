import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    devtools(),
    tailwindcss(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  optimizeDeps: {
    exclude: ['better-auth'],
    include: ['vaul'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
