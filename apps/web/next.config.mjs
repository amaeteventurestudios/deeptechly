import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.DEEPTECHLY_NEXT_DIST_DIR
    ? { distDir: process.env.DEEPTECHLY_NEXT_DIST_DIR }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    authInterrupts: true
  },
  turbopack: {
    root: projectRoot
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" }
      ]
    }];
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
