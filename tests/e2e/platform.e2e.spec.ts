import { expect, test } from '@playwright/test'
import sharp from 'sharp'

import { BASE_URL as BASE } from '../helpers/env'
import { adminApi } from '../helpers/seedUser'

/**
 * Infrastruktur yang dipakai semua lingkungan: health check untuk uptime monitor,
 * dan media (unggah → tampil → hapus) lewat storage yang aktif — disk lokal di
 * development/CI, Cloudinary di staging.
 */
test.describe('Platform', () => {
  test('health check: aplikasi & database siap', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
    expect(res.headers()['cache-control']).toContain('no-store')
    expect(await res.json()).toMatchObject({ status: 'ok', db: 'ok' })
  })

  test('media: unggah gambar, tampil lewat /api/media/file, lalu terhapus', async ({ request }) => {
    const png = await sharp({
      create: { width: 640, height: 360, channels: 3, background: '#1d5fe0' },
    })
      .png()
      .toBuffer()
    const api = await adminApi()
    const created = await api.post('/api/media', {
      multipart: {
        file: { name: `e2e-media-${Date.now()}.png`, mimeType: 'image/png', buffer: png },
        _payload: JSON.stringify({ alt: '[E2E] gambar uji' }),
      },
    })
    expect(created.status(), await created.text()).toBe(201)
    const { doc } = (await created.json()) as {
      doc: { id: string; url: string; sizes?: { thumbnail?: { url?: string } } }
    }

    // URL dokumen absolut (serverURL) atau relatif; yang penting jalurnya lewat Payload.
    const fileUrl = (url: string) => new URL(url, BASE)
    try {
      expect(fileUrl(doc.url).pathname).toMatch(/^\/api\/media\/file\//)
      const original = await request.get(fileUrl(doc.url).href)
      expect(original.status()).toBe(200)
      expect(original.headers()['content-type']).toBe('image/png')
      expect((await original.body()).subarray(1, 4).toString()).toBe('PNG')

      // Ukuran turunan (webp) ikut tersimpan di storage yang sama.
      const thumb = doc.sizes?.thumbnail?.url
      expect(thumb).toBeTruthy()
      const thumbRes = await request.get(fileUrl(thumb!).href)
      expect(thumbRes.status()).toBe(200)
      expect(thumbRes.headers()['content-type']).toBe('image/webp')
    } finally {
      const removed = await api.delete(`/api/media/${doc.id}`)
      expect(removed.status()).toBe(200)
    }

    // Setelah dihapus file tidak lagi disajikan. Adaptor Cloudinary menjawab 404; storage
    // disk bawaan Payload menjawab 500 ("missing on the disk") — keduanya bukan 200.
    expect((await request.get(fileUrl(doc.url).href)).status()).toBeGreaterThanOrEqual(400)
    await api.dispose()
  })
})
