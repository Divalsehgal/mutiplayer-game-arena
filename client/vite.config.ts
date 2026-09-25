/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { lldDiagrams } from "./scripts/lld/vitePlugin";
import { lldSources } from "./scripts/lld/sources";

export default defineConfig({
  plugins: [react(), lldDiagrams(lldSources(__dirname))],
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
});

