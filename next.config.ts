import type { NextConfig } from "next";

const repo = "/captcha-shield";

const nextConfig: NextConfig = {
  output: "export",
  basePath: repo,
  assetPrefix: `${repo}/`,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  distDir: "docs",
};

export default nextConfig;
