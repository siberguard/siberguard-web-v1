import { expect, test } from '@playwright/test'

import { BASE_URL as BASE, emailEnabled } from '../helpers/env'
import { adminApi, cleanupTestLeads } from '../helpers/seedUser'

test.afterAll(async () => {
  await cleanupTestLeads()
})

test.describe('Situs publik', () => {
  test('beranda bahasa Indonesia & Inggris', async ({ page }) => {
    // Ganti bahasa memasang ulang root layout di browser; tidak boleh ada error konsol
    // (mis. peringatan React tentang <script> tema atau hydration mismatch).
    const consoleErrors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    page.on('pageerror', (e) => consoleErrors.push(e.message))

    await page.goto(BASE)
    await expect(page).toHaveTitle(/SiberGuard/)
    await expect(page.locator('h1')).toContainText('Keamanan Siber untuk UMKM')
    await expect(page.locator('.hero__tagline')).toHaveText('Amankan Usaha, Majukan Nusantara.')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    // Urutan section mengikuti brief konten SiberGuard.
    const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id))
    expect(ids).toEqual([
      'hero',
      'mengapa',
      'layanan',
      'cara-kerja',
      'cakupan',
      'harga',
      'jam-layanan',
      'mulai',
      'program-pilot',
      'faq',
      'konsultasi',
    ])
    // Brief: layanan analis 8×5, jangan pernah menulis "SOC 24/7".
    await expect(page.locator('main')).not.toContainText('24/7')

    await page
      .getByRole('group', { name: 'Bahasa' })
      .first()
      .getByRole('button', { name: 'EN' })
      .click()
    await expect(page).toHaveURL(`${BASE}/en`)
    await expect(page.locator('h1')).toContainText('Cyber Security for SMEs')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    expect(consoleErrors).toEqual([])
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

    // Tema tetap gelap setelah ganti bahasa (root layout dipasang ulang di client).
    await page
      .getByRole('group', { name: 'Bahasa' })
      .first()
      .getByRole('button', { name: 'EN' })
      .click()
    await expect(page).toHaveURL(`${BASE}/en`)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('hero: carousel banner tanpa badge status & konsol simulasi', async ({ page }) => {
    await page.goto(BASE)
    const hero = page.locator('section#hero')
    await expect(hero.getByText('Segera hadir')).toHaveCount(0)
    await expect(hero.getByText('data simulasi')).toHaveCount(0)

    const carousel = hero.getByRole('region', { name: 'Sorotan SiberGuard' })
    await expect(carousel).toBeVisible()
    const active = carousel.locator('.slide.is-active')
    await expect(active).toHaveAttribute('aria-label', '1 dari 4')
    // Slide tidak aktif tidak bisa difokus/dibaca pembaca layar.
    await expect(carousel.locator('.slide[inert]')).toHaveCount(3)

    await carousel.getByRole('button', { name: 'Slide berikutnya' }).click()
    await expect(active).toHaveAttribute('aria-label', '2 dari 4')
    await carousel.getByRole('button', { name: 'Tampilkan slide 4' }).click()
    await expect(active).toHaveAttribute('aria-label', '4 dari 4')
    await page.keyboard.press('ArrowRight')
    await expect(active).toHaveAttribute('aria-label', '1 dari 4')

    // Tombol jeda selalu ada selama carousel berganti otomatis (WCAG 2.2.2).
    const pause = carousel.getByRole('button', { name: 'Jeda pergantian slide' })
    await pause.click()
    await expect(carousel.getByRole('button', { name: 'Lanjutkan pergantian slide' })).toBeVisible()
  })

  test('paket Basic tunggal, cakupan, dan jam layanan', async ({ page }) => {
    await page.goto(BASE)
    const plans = page.locator('#harga .plan')
    await expect(plans).toHaveCount(1)
    await expect(plans).toContainText('Rp300.000')
    await expect(plans).toContainText('Minimum 5 endpoint')
    await expect(page.locator('#cakupan .coverage__os li')).toHaveText([
      'Windows',
      'Linux',
      'macOS',
    ])
    await expect(page.locator('#cakupan .coverage__card--out')).toContainText('NetFlow')
    const sla = page.locator('#jam-layanan')
    await expect(sla.locator('.week li.is-on')).toHaveCount(5)
    await expect(sla.getByRole('row', { name: /Critical/ })).toContainText('1 jam')
  })

  test('formulir minat: konsultasi Paket Basic terkirim', async ({ page }) => {
    await page.goto(`${BASE}/#konsultasi`)
    const form = page.locator('#konsultasi')
    const opt = (text: string | RegExp) =>
      form.locator('label.option', { hasText: text }).first().click()
    const next = form.getByRole('button', { name: /Berikutnya/ })

    await next.click()
    await expect(form.locator('.wizard__summary li').first()).toBeVisible()

    await opt('Konsultasi Paket Basic')
    await form.getByLabel('Nama perusahaan').fill('[E2E] PT Uji Konsultasi')
    await form.getByLabel('Sektor usaha').fill('Ritel')
    await opt('5–10')
    await opt('Ditangani staf IT internal')
    await next.click()

    await form.getByLabel('Nama PIC dan jabatan').fill('Uji Otomatis, Pemilik')
    await form.getByLabel('Email bisnis').fill('e2e@contoh.co.id')
    await form.getByLabel('Nomor WhatsApp').fill('081234567890')
    await form.locator('label.option--consent').click()
    await page.waitForTimeout(4200) // melewati batas waktu isi minimum anti-spam
    await form.getByRole('button', { name: /Kirim Permintaan/ }).click()
    await expect(form.locator('.wizard__done')).toContainText('Terima kasih')

    // Lead tersimpan di database. Tanpa penyedia email (staging & CI) statusnya "skipped",
    // bukan error: email diproses setelah respons, jadi ditunggu sebentar.
    const api = await adminApi()
    const where = `where[companyName][equals]=${encodeURIComponent('[E2E] PT Uji Konsultasi')}`
    const status = expect.poll(
      async () => {
        const res = await api.get(`/api/form-submissions?${where}&sort=-createdAt&limit=1`)
        const doc = ((await res.json()) as { docs: Array<{ emailStatus?: string }> }).docs[0]
        return doc ? (doc.emailStatus ?? 'pending') : 'missing'
      },
      { timeout: 15_000 },
    )
    if (emailEnabled) await status.toMatch(/^(sent|failed|skipped)$/)
    else await status.toBe('skipped')
    await api.dispose()
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
