import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      "/api/sjc": {
        target: "https://sjc.com.vn/GoldPrice/Services/PriceService.ashx",
        changeOrigin: true,
        secure: false,
        configure: (
          proxy: { on: (arg0: string, arg1: (proxyReq: any, _req: any, res: any) => void) => void },
          _options: any,
        ) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            // Add proper headers to mimic browser request
            proxyReq.setHeader("Referer", "https://sjc.com.vn/bieu-do-gia-vang");
            proxyReq.setHeader("Origin", "https://sjc.com.vn");
            proxyReq.setHeader(
              "User-Agent",
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            );
          });
        },
      },
    },
  },
}));
