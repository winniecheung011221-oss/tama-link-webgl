import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "next/image": fileURLToPath(new URL("./src/StaticImage.tsx", import.meta.url)),
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  publicDir: "public",
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  },
});
