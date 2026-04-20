import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/captcha-shield",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  distDir: "docs",
};

export default nextConfig;
