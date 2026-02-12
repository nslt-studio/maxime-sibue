import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'MaximeSibue',
      formats: ['iife'],
      fileName: () => 'main.js',
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
  },
});
