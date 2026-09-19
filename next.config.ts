import type { NextConfig } from "next";

/**
 * The prototype has no backend, so it can be served as a static export for
 * GitHub Pages. GITHUB_PAGES=true switches that on; local `dev`, `build` and
 * `start` are unaffected.
 */
const isPagesBuild = process.env.GITHUB_PAGES === "true";
const repository = process.env.GITHUB_PAGES_BASE_PATH ?? "";

/**
 * Mock dates are offsets from "today". Resolving that anchor here pins it to
 * one value for the whole build and inlines it into the client bundle, so
 * prerendered HTML and hydration always agree. Restarting dev, or rebuilding,
 * moves it forward.
 */
const buildDate = new Date().toISOString().slice(0, 10);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDate,
  },
  ...(isPagesBuild
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath: repository,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
