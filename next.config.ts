import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  crossOrigin: "anonymous",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.sr.se",
      },
      {
        protocol: "https",
        hostname: "static-cdn.sr.se",
      }
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    config.module.rules.push({
      // Ignore src/scripts
      test: /src\/scripts/,
      use: [{ loader: "ignore-loader" }],
    });
  },
  turbopack: {
    rules: {
      "src/scripts": {
        loaders: ["ignore-loader"],
      }
    },
  }
};

export default nextConfig;
