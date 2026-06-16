import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  /* Static export for GitHub Pages deployment */
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
