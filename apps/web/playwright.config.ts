import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests/browser", timeout: 90_000, workers: 3, use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000" }, webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: "pnpm dev", port: 3000, reuseExistingServer: true } });
