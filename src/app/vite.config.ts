import "dotenv/config";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const {
  DEV_HOST,
  DEV_ORIGINS,
} = process.env;
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
      },
    },
    allowedHosts: ["localhost", ...!!DEV_ORIGINS ? DEV_ORIGINS.split(",") : []],
    host: DEV_HOST || "localhost",
  },
  resolve: {
    tsconfigPaths: true,
  },
});
