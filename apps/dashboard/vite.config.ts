import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "src/pages",
      routeFileIgnorePattern: "_components",
      autoCodeSplitting: true,
      routeToken: "_layout",
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
