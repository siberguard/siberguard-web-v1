import { expect, test } from '@playwright/test'

import { login } from '../helpers/login'
import { cleanupTestData, seedTestUsers, testUsers } from '../helpers/seedUser'

const BASE = 'http://localhost:3000'

test.beforeAll(async () => {
  await seedTestUsers()
})
test.afterAll(async () => {
  await cleanupTestData()
})

test.describe('Admin & dashboard', () => {
  test('admin melihat ringkasan, analytics, dan analisis lead', async ({ page }) => {
    await login({ page, user: testUsers.admin })
    await expect(page.getByText('Pengunjung unik').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Kondisi sistem' })).toBeVisible()

    await page.goto(`${BASE}/admin/analytics?range=7d`)
    await expect(page.getByRole('heading', { name: 'Analytics pengunjung' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sumber kunjungan' })).toBeVisible()

    await page.goto(`${BASE}/admin/leads`)
    await expect(page.getByRole('heading', { name: 'Analisis lead' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ekspor CSV' })).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Ekspor CSV' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^leads-soc-merdeka-.*\.csv$/)
  })

  test('editor tidak dapat membuka data lead', async ({ page }) => {
    await login({ page, user: testUsers.editor })
    await expect(page.getByRole('heading', { name: 'Lead terbaru' })).toHaveCount(0)
    // Navigasi browser (cookie sesi editor ikut terkirim) tetap ditolak.
    const list = await page.goto(`${BASE}/api/form-submissions`)
    expect(list?.status()).toBe(403)
    const csv = await page.goto(`${BASE}/api/form-submissions/export`)
    expect(csv?.status()).toBe(403)
  })

  test('sidebar: bahasa default Indonesia, ganti ke English & tema', async ({ page }) => {
    await login({ page, user: testUsers.admin })
    const nav = page.locator('.smd-sidenav')
    await expect(nav.getByRole('link', { name: 'Ringkasan' })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Leads/ })).toBeVisible()

    await nav.getByRole('button', { name: 'EN' }).click()
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Visitor analytics' })).toBeVisible()

    await nav.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // kembalikan ke default agar test lain tidak terpengaruh
    await nav.getByRole('button', { name: 'ID' }).click()
    await expect(page.getByRole('heading', { name: 'Ringkasan' })).toBeVisible()
  })

  test('sidebar editor tidak menampilkan menu lead', async ({ page }) => {
    await login({ page, user: testUsers.editor })
    const nav = page.locator('.smd-sidenav')
    await expect(nav.getByRole('link', { name: 'Halaman' })).toBeVisible()
    await expect(nav.getByRole('link', { name: /^Leads/ })).toHaveCount(0)
  })

  test('REST publik tidak membuka formulir, lead, atau user', async ({ request }) => {
    for (const path of ['/api/forms', '/api/form-submissions', '/api/users']) {
      const res = await request.get(`${BASE}${path}`)
      expect(res.status(), path).toBe(403)
    }
  })
})
