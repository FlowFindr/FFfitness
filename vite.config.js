import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const entry = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Two pages: the app at /, the marketing landing page at /landing.html.
    rollupOptions: {
      input: {
        main: entry("./index.html"),
        landing: entry("./landing.html"),
      },
    },
  },
});
