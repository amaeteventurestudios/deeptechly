import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

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
      }
    ];
  }
};

export default nextConfig;
