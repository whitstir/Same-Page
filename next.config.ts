import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo-name>, so the deploy workflow
// passes that path in. Locally it is empty and the site runs at /.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // static HTML in ./out, which is what GitHub Pages serves
  basePath,
  images: { unoptimized: true }, // no image server on GitHub Pages
  trailingSlash: true,
};

export default nextConfig;
