import { defineConfig, devices } from "@playwright/test";
// E2E_PORT lets the tests run beside a dev server that already uses port 3000.
const origin = `http://127.0.0.1:${process.env.E2E_PORT || 3000}`;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 45000,
  use: { baseURL: origin, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${process.env.E2E_PORT || 3000}`,
    url: origin,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // Browser tests read the catalog from the Supabase project in .env.local (seed.sql data).
    // They only browse and use the local bag; they never create accounts or orders.
    env: { APP_URL: origin },
  },
});
