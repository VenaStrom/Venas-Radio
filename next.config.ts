import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    position: "bottom-right",
  },
  crossOrigin: "anonymous",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.sr.se",
      },
      {
        protocol: "https",
        hostname: "static-cdn.sr.se"
      }
    ],
  },
  allowedDevOrigins: [
    "ts.net",
    "laptop",
  ],
};

export default nextConfig;
