import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: {
    position: "bottom-right",
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
    "localhost",
  ],
};

export default nextConfig;
