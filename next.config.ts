import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: {
    position: "top-left",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.sr.se", },
      { protocol: "https", hostname: "static-cdn.sr.se" },
      { protocol: "https", hostname: "www.sverigesradio.se" },
    ],
  },
  allowedDevOrigins: [
    "ts.net",
    "laptop",
    "laptop.lan",
    "laptop.local",
    "localhost",
  ],
};

export default nextConfig;
