import type { NextConfig } from "next";

/**
 * CAPTCHA Shield v4.0 "Fortress" — Next.js Configuration
 *
 * Dual-mode configuration:
 *   - Local dev:  Standard Next.js dev server at / (no basePath)
 *   - GitHub Pages build:  Static export with basePath /captcha-shield → docs/
 *
 * Controlled via GITHUB_PAGES=1 environment variable.
 * The CI/CD pipeline sets this automatically for production builds.
 */

const isGitHubPages = process.env.GITHUB_PAGES === "1";
const repo = "/captcha-shield";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: repo,
        assetPrefix: `${repo}/`,
        distDir: "docs",
      }
    : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
