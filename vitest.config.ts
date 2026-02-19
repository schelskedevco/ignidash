import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/convex': resolve(__dirname, './convex'),
    },
  },
  test: {
    server: { deps: { inline: ['convex-test'] } },
  },
});
