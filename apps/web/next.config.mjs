import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    authInterrupts: true
  },
  turbopack: {
    root: projectRoot
  },
  async rewrites() {
    return [
      {
        source: "/article/:slug.md",
        destination: "/api/markdown/article/:slug"
      },
      {
        source: "/startup/:slug.md",
        destination: "/api/markdown/startup/:slug"
      },
      {
        source: "/dossier/:slug.md",
        destination: "/api/markdown/dossier/:slug"
      },
      {
        source: "/patent/:slug.md",
        destination: "/api/markdown/patent/:slug"
      },
      {
        source: "/aperture/signals/:slug.md",
        destination: "/api/markdown/aperture/signals/:slug"
      },
      {
        source: "/aperture/problems/:slug.md",
        destination: "/api/markdown/aperture/problems/:slug"
      },
      {
        source: "/aperture/opportunities/:slug.md",
        destination: "/api/markdown/aperture/opportunities/:slug"
      }
    ];
  }
};

export default nextConfig;
