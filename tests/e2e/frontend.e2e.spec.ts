import { expect, test } from '@playwright/test'

import { cleanupTestLeads } from '../helpers/seedUser'

const BASE = 'http://localhost:3000'

test.afterAll(async () => {
  await cleanupTestLeads()
})

test.describe('Situs publik', () => {
  test('beranda bahasa Indonesia & Inggris', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/SOC Merdeka/)
    await expect(page.locator('h1')).toContainText('Keamanan siber')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    for (const id of [
      'hero',
      'tentang',
      'alur',
      'layanan',
      'deploy-agent',
      'paket',
      'faq',
      'pendaftaran',
    ]) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1)
    }

    await page
      .getByRole('group', { name: 'Bahasa' })
      .first()
      .getByRole('button', { name: 'EN' })
      .click()
    await expect(page).toHaveURL(`${BASE}/en`)
    await expect(page.locator('h1')).toContainText('Sovereign cyber security')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('tema gelap tersimpan setelah dimuat ulang', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(BASE)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page
      .getByRole('button', { name: /Ganti tema/ })
      .first()
      .click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('filter layanan & tab OS deploy agent', async ({ page }) => {
    await page.goto(BASE)
    await page.getByRole('button', { name: 'Intelijen', exact: true }).click()
    await expect(page.locator('.service')).toHaveCount(2)
    await page.getByRole('tab', { name: 'Windows' }).click()
    await expect(page.locator('.term__box pre').first()).toContainText('Install-MerdekaAgent')
  })

  test('menu ponsel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)
    const nav = page.locator('#site-nav')
    await expect(nav).toBeHidden()
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(nav).toBeVisible()
    await nav.getByRole('link', { name: 'Layanan' }).click()
    await expect(nav).toBeHidden()
  })

  test('kuesioner: pertanyaan bersyarat, validasi, dan pengiriman', async ({ page }) => {
    await page.goto(`${BASE}/kuesioner`)
    const next = page.getByRole('button', { name: /Berikutnya/ })
    const opt = (text: string | RegExp, scope = page.locator('body')) =>
      scope.locator('label.option', { hasText: text }).first().click()

    await next.click()
    await expect(page.locator('.wizard__summary li')).toHaveCount(5)

    await page.getByLabel('Nama perusahaan').fill('[E2E] PT Uji Otomatis')
    await page.getByLabel('Bidang usaha').fill('Logistik')
    const groups = page.locator('fieldset.field--choice')
    await opt('25–50', groups.nth(0))
    await opt('Tidak tahu', groups.nth(1))
    await opt('Vendor IT eksternal', groups.nth(2))
    await next.click()

    await opt('Sangat tertarik')
    for (const l of ['Monitoring keamanan (SOC)', 'Backup & perlindungan data', 'Bantuan insiden'])
      await opt(l)
    await expect(
      page.locator('label.option', { hasText: 'Lainnya' }).locator('input'),
    ).toBeDisabled()
    await next.click()

    await opt('Pengambil keputusan utama')
    await opt('Anggaran rutin')
    await next.click()

    await expect(page.getByText('kapan perusahaan dapat mulai')).toHaveCount(0)
    await opt('Ya, berminat')
    await expect(page.getByText('kapan perusahaan dapat mulai')).toHaveCount(1)
    await opt('Dalam 1 bulan')
    await opt(/^Ya$/, page.locator('fieldset', { hasText: 'mempertimbangkan berlangganan' }))
    await opt('Perlu persetujuan manajemen')
    await next.click()

    await expect(page.getByLabel('Nomor WhatsApp')).toHaveCount(0)
    await page.locator('label.option--consent').click()
    await page.getByLabel('Nama PIC dan jabatan').fill('Uji Otomatis, Manajer')
    await page.getByLabel('Nomor WhatsApp').fill('081234567890')
    await page.getByLabel('Email perusahaan').fill('e2e@contoh.co.id')
    await page.waitForTimeout(4200) // melewati batas waktu isi minimum anti-spam
    await page.getByRole('button', { name: /Kirim Kuesioner/ }).click()
    await expect(page.locator('.wizard__done')).toContainText('Terima kasih')
  })
})
