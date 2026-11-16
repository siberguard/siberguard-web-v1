import { request, type APIRequestContext } from '@playwright/test'
import 'dotenv/config'

const BASE = 'http://localhost:3000'
type Role = 'admin' | 'editor' | 'sales' | 'viewer'

export const testUsers: Record<
  'admin' | 'editor',
  { email: string; password: string; name: string; role: Role }
> = {
  admin: {
    email: 'e2e-admin@socmerdeka.test',
    password: 'E2e-Admin!2026',
    name: 'E2E Admin',
    role: 'admin',
  },
  editor: {
    email: 'e2e-editor@socmerdeka.test',
    password: 'E2e-Editor!2026',
    name: 'E2E Editor',
    role: 'editor',
  },
}

/** Sesi REST sebagai admin seed (SEED_ADMIN_EMAIL/PASSWORD di .env). */
async function adminApi(): Promise<APIRequestContext> {
  const login = await request.newContext({ baseURL: BASE })
  const res = await login.post('/api/users/login', {
    data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
  })
  if (!res.ok())
    throw new Error(`Login admin seed gagal (${res.status()}). Jalankan "pnpm seed" dulu.`)
  const { token } = (await res.json()) as { token: string }
  await login.dispose()
  // Token di header (bukan cookie): cookie tanpa Origin diabaikan oleh proteksi CSRF Payload.
  return request.newContext({ baseURL: BASE, extraHTTPHeaders: { Authorization: `JWT ${token}` } })
}

const emailsQuery = () =>
  Object.values(testUsers)
    .map((u, i) => `where[or][${i}][email][equals]=${encodeURIComponent(u.email)}`)
    .join('&')

export async function seedTestUsers(): Promise<void> {
  const api = await adminApi()
  await api.delete(`/api/users?${emailsQuery()}`)
  for (const user of Object.values(testUsers)) {
    const res = await api.post('/api/users', { data: user })
    if (!res.ok()) throw new Error(`Gagal membuat ${user.email}: ${await res.text()}`)
  }
  await api.dispose()
}

/** Hapus user uji dan lead yang dibuat oleh e2e ("[E2E]" di nama perusahaan). */
export async function cleanupTestData(): Promise<void> {
  const api = await adminApi()
  await api.delete(`/api/users?${emailsQuery()}`)
  await api.delete(`/api/form-submissions?where[companyName][like]=${encodeURIComponent('[E2E]')}`)
  await api.dispose()
}
