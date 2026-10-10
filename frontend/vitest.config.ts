import { defineConfig } from "vitest/config";
import path from "path";

// Unit tests only — Playwright specs in tests/e2e run via `yarn test:e2e`.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
