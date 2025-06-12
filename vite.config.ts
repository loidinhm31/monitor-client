import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, process.cwd(), "");
  const { VITE_BASE_URL, NODE_ENV } = localEnv;

  return {
    define: {
    },
    plugins: [react(), VitePWA({ registerType: "autoUpdate" }), nodePolyfills({
      include: [
        "buffer",
      ],
    }),],
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
    },
    base: VITE_BASE_URL,
  };
});
