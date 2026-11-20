import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * Lokal: `pnpm test:e2e` memakai (atau menyalakan) `pnpm dev` di port 3000.
 * CI (`CI=true`): menguji hasil `pnpm build` lewat `pnpm start`, sama seperti yang
 * dijalankan di server. URL bisa diganti lewat `E2E_BASE_URL`.
 * Lihat https://playwright.dev/docs/test-configuration.
 */
const isCI = !!process.env.CI
const baseURL = (process.env.E2E_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export default defineConfig({
  testDir: './tests/e2e',
  /* Gagal di CI bila ada test.only yang tertinggal. */
  forbidOnly: isCI,
  /* Ulangi hanya di CI (mis. jaringan runner lambat); trace disimpan saat pengulangan. */
  retries: isCI ? 2 : 0,
  /* Satu worker di CI: test berbagi satu database. */
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: isCI ? 'pnpm start' : 'pnpm dev',
    reuseExistingServer: !isCI,
    timeout: 180_000,
    url: baseURL,
  },
})
