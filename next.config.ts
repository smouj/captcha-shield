import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/captcha-shield",
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  distDir: "docs",
};

export default nextConfig;
