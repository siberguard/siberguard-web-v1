import type { CollectionConfig, Config, PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
  destroy: vi.fn(),
  upload: vi.fn(),
  uploadStream: vi.fn(),
}))

// Unggah & hapus di-mock (tanpa jaringan); pembuat URL memakai SDK asli.
vi.mock('cloudinary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('cloudinary')>()
  return {
    ...actual,
    v2: {
      ...actual.v2,
      config: actual.v2.config,
      url: actual.v2.url,
      uploader: { destroy: sdk.destroy, upload: sdk.upload, upload_stream: sdk.uploadStream },
    },
  }
})

const {
  cloudinaryPublicId,
  cloudinaryStorage,
  contentTypeFor,
  createCloudinaryAdapter,
  parseCloudinaryUrl,
} = await import('@/lib/storage/cloudinary')

const credentials = { apiKey: '123', apiSecret: 'rahasia', cloudName: 'demo' }
const media = { slug: 'media', fields: [], upload: {} } as unknown as CollectionConfig

function request(headers: Record<string, string> = {}) {
  return {
    headers: new Headers(headers),
    payload: { logger: { error: vi.fn() } },
  } as unknown as PayloadRequest
}

function adapter(fetchImpl?: typeof fetch) {
  return createCloudinaryAdapter({
    cacheControlMaxAge: 3600,
    credentials,
    fetch: fetchImpl,
    folder: 'soc-merdeka-staging',
  })({ collection: media })
}

beforeEach(() => {
  sdk.destroy.mockReset().mockResolvedValue({ result: 'ok' })
  sdk.upload.mockReset().mockResolvedValue({ public_id: 'x' })
  sdk.uploadStream.mockReset().mockImplementation((_opts, cb) => ({
    end: (buffer: Buffer) => cb(undefined, { bytes: buffer.length, public_id: _opts.public_id }),
  }))
})

describe('konfigurasi Cloudinary', () => {
  it('membaca CLOUDINARY_URL', () => {
    expect(parseCloudinaryUrl('cloudinary://123:ra%2Fhasia@demo')).toEqual({
      apiKey: '123',
      apiSecret: 'ra/hasia',
      cloudName: 'demo',
    })
    expect(parseCloudinaryUrl('')).toBeNull()
    expect(parseCloudinaryUrl(undefined)).toBeNull()
    expect(() => parseCloudinaryUrl('https://demo.example.com')).toThrow(/CLOUDINARY_URL/)
    expect(() => parseCloudinaryUrl('cloudinary://demo')).toThrow(/CLOUDINARY_URL/)
  })

  it('public ID = folder + nama file lengkap dengan ekstensi', () => {
    expect(cloudinaryPublicId('/soc-merdeka-staging/', 'hero.png')).toBe(
      'soc-merdeka-staging/hero.png',
    )
    expect(cloudinaryPublicId('', 'logo.svg')).toBe('logo.svg')
  })

  it('Content-Type dari ekstensi file (aset raw)', () => {
    expect(contentTypeFor('hero.webp', 'application/octet-stream')).toBe('image/webp')
    expect(contentTypeFor('logo.SVG', null)).toBe('image/svg+xml')
    expect(contentTypeFor('data.bin', 'application/octet-stream')).toBe('application/octet-stream')
    expect(contentTypeFor('notes.txt', 'text/plain')).toBe('text/plain')
  })
})

describe('adaptor Cloudinary', () => {
  it('mengunggah buffer sebagai aset raw di folder staging', async () => {
    const data = { filename: 'hero.png' }
    const out = await adapter().handleUpload({
      clientUploadContext: undefined,
      collection: media,
      data,
      file: {
        buffer: Buffer.from('png'),
        filename: 'hero.png',
        filesize: 3,
        mimeType: 'image/png',
      },
      req: request(),
      storageFilePath: 'hero.png',
    })
    expect(out).toBe(data)
    expect(sdk.uploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        overwrite: true,
        public_id: 'soc-merdeka-staging/hero.png',
        resource_type: 'raw',
      }),
      expect.any(Function),
    )
  })

  it('file sementara diunggah lewat path', async () => {
    await adapter().handleUpload({
      clientUploadContext: undefined,
      collection: media,
      data: {},
      file: {
        buffer: Buffer.alloc(0),
        filename: 'besar.jpg',
        filesize: 9,
        mimeType: 'image/jpeg',
        tempFilePath: '/tmp/upload-123',
      },
      req: request(),
      storageFilePath: 'besar.jpg',
    })
    expect(sdk.upload).toHaveBeenCalledWith(
      '/tmp/upload-123',
      expect.objectContaining({ public_id: 'soc-merdeka-staging/besar.jpg' }),
    )
    expect(sdk.uploadStream).not.toHaveBeenCalled()
  })

  it('gagal unggah diteruskan sebagai error', async () => {
    sdk.uploadStream.mockImplementation((_opts, cb) => ({
      end: () => cb(new Error('quota exceeded')),
    }))
    await expect(
      adapter().handleUpload({
        clientUploadContext: undefined,
        collection: media,
        data: {},
        file: { buffer: Buffer.from('x'), filename: 'a.png', filesize: 1, mimeType: 'image/png' },
        req: request(),
        storageFilePath: 'a.png',
      }),
    ).rejects.toThrow('quota exceeded')
  })

  it('menghapus aset (termasuk invalidasi CDN)', async () => {
    await adapter().handleDelete({
      collection: media,
      doc: { id: 1 } as never,
      filename: 'hero-640x360.webp',
      req: request(),
      storageFilePath: 'hero-640x360.webp',
    })
    expect(sdk.destroy).toHaveBeenCalledWith('soc-merdeka-staging/hero-640x360.webp', {
      invalidate: true,
      resource_type: 'raw',
    })
  })

  it('URL pengiriman Cloudinary untuk aset raw', async () => {
    const url = await adapter().generateURL!({ collection: media, data: {}, filename: 'hero.png' })
    expect(url).toBe('https://res.cloudinary.com/demo/raw/upload/v1/soc-merdeka-staging/hero.png')
  })
})

describe('penyajian file lewat /api/media/file', () => {
  const fetchReturning = (res: Response) => vi.fn(async (..._args: Parameters<typeof fetch>) => res)

  it('mengalirkan file dengan Content-Type gambar & cache', async () => {
    const fetchImpl = fetchReturning(
      new Response('png-bytes', {
        headers: { 'content-type': 'application/octet-stream', etag: '"abc"' },
      }),
    )
    const res = await adapter(fetchImpl).staticHandler(request(), {
      doc: { id: 1 },
      params: { collection: 'media', filename: 'hero.png' },
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo/raw/upload/v1/soc-merdeka-staging/hero.png',
      expect.anything(),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600')
    expect(res.headers.get('etag')).toBe('"abc"')
    expect(await res.text()).toBe('png-bytes')
  })

  it('SVG diberi Content-Security-Policy', async () => {
    const res = await adapter(fetchReturning(new Response('<svg/>'))).staticHandler(request(), {
      doc: { id: 1 },
      params: { collection: 'media', filename: 'logo.svg' },
    })
    expect(res.headers.get('content-type')).toBe('image/svg+xml')
    expect(res.headers.get('content-security-policy')).toBeTruthy()
  })

  it('304 bila ETag cocok, 404 bila file tidak ada, 502 bila Cloudinary error', async () => {
    const notModified = fetchReturning(
      new Response(null, { headers: { etag: '"abc"' }, status: 304 }),
    )
    const r304 = await adapter(notModified).staticHandler(request({ 'if-none-match': '"abc"' }), {
      doc: { id: 1 },
      params: { collection: 'media', filename: 'hero.png' },
    })
    expect(r304.status).toBe(304)
    expect(notModified.mock.calls[0][1]).toEqual({ headers: { 'If-None-Match': '"abc"' } })

    const r404 = await adapter(fetchReturning(new Response(null, { status: 404 }))).staticHandler(
      request(),
      { doc: { id: 1 }, params: { collection: 'media', filename: 'hilang.png' } },
    )
    expect(r404.status).toBe(404)

    const r502 = await adapter(fetchReturning(new Response('err', { status: 500 }))).staticHandler(
      request(),
      { doc: { id: 1 }, params: { collection: 'media', filename: 'hero.png' } },
    )
    expect(r502.status).toBe(502)
  })
})

describe('plugin cloudinaryStorage', () => {
  const base = { collections: [media, { slug: 'pages', fields: [] }] } as unknown as Config

  it('tanpa CLOUDINARY_URL konfigurasi tidak berubah (media tetap di disk)', async () => {
    expect(await cloudinaryStorage({ collections: { media: true } })(base)).toBe(base)
    expect(
      await cloudinaryStorage({
        collections: { media: true },
        enabled: false,
        url: 'cloudinary://1:2@demo',
      })(base),
    ).toBe(base)
  })

  it('dengan CLOUDINARY_URL media tidak lagi ditulis ke disk lokal', async () => {
    const out = await cloudinaryStorage({
      collections: { media: true },
      folder: 'soc-merdeka-staging',
      url: 'cloudinary://1:2@demo',
    })(base)
    const mediaOut = out.collections?.find((c) => c.slug === 'media')
    const pagesOut = out.collections?.find((c) => c.slug === 'pages')
    expect(mediaOut?.upload).toMatchObject({ disableLocalStorage: true })
    expect(pagesOut?.upload).toBeUndefined()
  })
})
