import { expect, test } from '@playwright/test'

import { ICONS } from '../../src/lib/icons'
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

    await nav.getByRole('group', { name: 'Bahasa admin' }).getByRole('button', { name: 'EN' }).click()
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Visitor analytics' })).toBeVisible()

    await nav.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // kembalikan ke default agar test lain tidak terpengaruh
    await nav.getByRole('group', { name: 'Admin language' }).getByRole('button', { name: 'ID' }).click()
    await expect(page.getByRole('heading', { name: 'Ringkasan' })).toBeVisible()
  })

  test('sidebar: ciutkan ke rail (tetap setelah reload) & header atas bersih', async ({ page }) => {
    await login({ page, user: testUsers.admin })
    // Header atas tidak lagi memuat logo, profil, atau pemilih bahasa konten.
    await expect(page.locator('.step-nav__home')).toBeHidden()
    await expect(page.locator('.app-header__account')).toBeHidden()
    await expect(page.locator('.app-header__localizer')).toBeHidden()

    // Tunggu hidrasi selesai agar tombol sudah interaktif.
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.nav--nav-hydrated')).toHaveCount(1)
    await page.getByRole('button', { name: 'Ciutkan sidebar' }).click()
    const rail = page.locator('.smd-sidenav--collapsed')
    await expect(rail).toHaveCount(1)
    await expect(rail.locator('.smd-sidenav__mark-logo')).toBeVisible()
    await expect(rail.getByText('Analytics pengunjung')).toBeHidden()

    await page.reload()
    await expect(page.locator('.smd-sidenav--collapsed')).toHaveCount(1)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Buka sidebar' }).click()
    await expect(page.locator('.smd-sidenav--collapsed')).toHaveCount(0)
    await expect(page.locator('.smd-sidenav').getByText('Analytics pengunjung')).toBeVisible()
  })

  test('sidebar: bahasa konten mengganti versi konten yang diedit', async ({ page }) => {
    await login({ page, user: testUsers.admin })
    await page.goto(`${BASE}/admin/globals/footer`)
    const group = page.getByRole('group', { name: 'Bahasa konten' })
    await group.getByRole('button', { name: 'EN' }).click()
    await expect(page).toHaveURL(/locale=en/)
    await expect(group.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    await group.getByRole('button', { name: 'ID' }).click()
    await expect(page).toHaveURL(/locale=id/)
  })

  test('pemilih ikon menampilkan pratinjau ikon & bisa dicari', async ({ page }) => {
    await login({ page, user: testUsers.admin })
    const res = await page.request.get(`${BASE}/api/pages?where[slug][equals]=home&limit=1&depth=0`)
    const home = (await res.json()).docs[0]
    await page.goto(`${BASE}/admin/collections/pages/${home.id}`)

    // Buka (bila tertutup) section "Keunggulan" lalu item pertamanya.
    const openIfClosed = async (header: ReturnType<typeof page.locator>) => {
      const toggle = header.locator('.collapsible__toggle').first()
      if (await toggle.evaluate((el) => el.classList.contains('collapsible__toggle--collapsed')))
        await toggle.click({ force: true })
    }
    const section = page
      .locator('.collapsible__toggle-wrap')
      .filter({ has: page.locator('.smd-rowlabel__type', { hasText: /^Keunggulan$/ }) })
      .first()
    await openIfClosed(section)
    // Label baris item ikut menampilkan ikon terpilih.
    const item = page
      .locator('.collapsible__toggle-wrap')
      .filter({ has: page.locator('.smd-rowlabel__icon svg') })
      .first()
    await expect(item).toBeVisible()
    await openIfClosed(item)

    const field = page.locator('.smd-iconselect').first()
    await expect(field.locator('.smd-iconselect__preview svg')).toBeVisible()
    await field.locator('.rs__control').click()
    const options = page.locator('.smd-iconselect__option')
    await expect(options).toHaveCount(Object.keys(ICONS).length)
    await expect(options.first().locator('svg')).toBeVisible()

    await page.keyboard.type('Gembok')
    await expect(options).toHaveCount(1)
    await page.keyboard.press('Enter')
    await expect(field.locator('.smd-iconselect__value-label')).toHaveText('Gembok')
    // Tidak disimpan: data seed tetap utuh.
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
