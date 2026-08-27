import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  plugins: [react()],
  build: mode === 'single-html'
    ? {
        outDir: '.single-html-tmp',
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: false,
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          },
        },
      }
    : undefined,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
