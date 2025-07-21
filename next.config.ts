import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
        hostname: "static-cdn.sr.se"
      }
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
