import { defineConfig } from "vitest/config";
import path from "path";

// Standalone test config: deliberately does NOT load vite.config.ts, which
// carries the Replit dev-server plugins. Tests cover the pure logic libs.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
