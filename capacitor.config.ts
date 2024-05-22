import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.starter",
  appName: "monitor-client",
  webDir: "dist",
  server: {
    androidScheme: "http",
    cleartext: true
  }
};

export default config;
