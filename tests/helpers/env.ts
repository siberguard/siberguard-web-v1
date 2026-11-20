import 'dotenv/config'

/**
 * URL aplikasi yang diuji. Lokal: `pnpm dev` di port 3000. CI: hasil `pnpm build`
 * yang dijalankan `pnpm start` (lihat playwright.config.ts & .github/workflows/ci.yml).
 */
export const BASE_URL = (process.env.E2E_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** Sama dengan src/lib/email/adapter.ts: email aktif bila Resend atau SMTP dikonfigurasi. */
export const emailEnabled = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST)
