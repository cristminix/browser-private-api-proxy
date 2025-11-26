import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
// @ts-ignore
import path from "node:path"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  plugins: [svelte()],
  define: {
    "process.env": {},
  },
  build: {
    emptyOutDir: false,
    outDir: path.resolve(__dirname, "dist/src/content-scripts/inject/dist"),
    lib: {
      formats: ["iife"],
      entry: path.resolve(__dirname, "src/content-scripts/content-inject.ts"),
      name: "browser-private-api-proxy",
    },
    rollupOptions: {
      output: {
        entryFileNames: "inject.js",
        assetFileNames: "inject.css",
        extend: true,
      },
    },
    minify: false,
    sourcemap: true,
  },
})
