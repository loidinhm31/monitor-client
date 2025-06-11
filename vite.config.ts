import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, process.cwd(), "");
  const { VITE_BASE_URL, NODE_ENV } = localEnv;

  return {
    define: {
      global: {},
      "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
    },
    plugins: [react(), VitePWA({ registerType: "autoUpdate" })],
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
    },
    base: VITE_BASE_URL,
  };
});
