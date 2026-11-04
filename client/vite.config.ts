/// <reference types="vitest" />
import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const PUBLIC_PATHS = [
  { path: "/", changefreq: "weekly" },
  { path: "/sudoku", changefreq: "daily" },
];

// robots.txt and sitemap.xml need absolute URLs, so they're built from VITE_SITE_URL.
function seoFiles(siteUrl: string): Plugin {
  return {
    name: "seo-files",
    apply: "build",
    generateBundle() {
      if (!siteUrl) {
        this.warn("VITE_SITE_URL is not set; skipping robots.txt and sitemap.xml");
        return;
      }
      const urls = PUBLIC_PATHS.map(
        (p) => `  <url><loc>${siteUrl}${p.path}</loc><changefreq>${p.changefreq}</changefreq></url>`,
      ).join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\nDisallow: /room/\nDisallow: /game/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const siteUrl = (loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL || "").replace(/\/+$/, "");

  return {
    plugins: [react(), seoFiles(siteUrl)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/vite-env.d.ts", "src/main.tsx"],
      },
    },
  };
});
