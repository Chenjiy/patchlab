import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import inject from "@rollup/plugin-inject";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  build: {
    rollupOptions: {
      plugins: [
        inject({
          URL: ["core-js-pure/web/url", "default"],
          URLSearchParams: ["core-js-pure/web/url-search-params", "default"],
          Headers: [resolve(__dirname, "src/polyfills/headers.ts"), "default"],
        }),
      ],
    },
  },
});
