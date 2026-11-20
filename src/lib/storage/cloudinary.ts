import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type {
  Adapter,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import {
  buildStoragePathData,
  getStorageFilePath,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'
import { isXmlMimeType, UPLOAD_CONTENT_SECURITY_POLICY } from 'payload/internal'

/**
 * Penyimpanan media di Cloudinary (staging di Vercel, yang tidak punya disk permanen).
 *
 * - Aktif hanya bila `CLOUDINARY_URL` terisi; tanpa itu (development, CI, VPS) media
 *   tetap di folder lokal `media/` seperti biasa.
 * - File disimpan sebagai aset `raw` (byte-identik, seperti object storage biasa):
 *   public ID = `<folder>/<nama file>` termasuk ekstensinya, sehingga tiap ukuran
 *   gambar buatan Payload jadi aset terpisah dan nama berbeda ekstensi tidak bentrok.
 * - File tetap disajikan lewat `/api/media/file/<nama>` (staticHandler mengambilnya
 *   dari Cloudinary): URL gambar sama dengan production, jadi CSP & next/image tidak
 *   perlu diubah dan hak akses koleksi tetap berlaku.
 */

export type CloudinaryCredentials = { apiKey: string; apiSecret: string; cloudName: string }

/** `cloudinary://<api_key>:<api_secret>@<cloud_name>` (format dari dashboard Cloudinary). */
export function parseCloudinaryUrl(value: string | undefined): CloudinaryCredentials | null {
  if (!value?.trim()) return null
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error(
      'CLOUDINARY_URL tidak valid: gunakan cloudinary://<api_key>:<api_secret>@<cloud_name>',
    )
  }
  if (url.protocol !== 'cloudinary:' || !url.username || !url.password || !url.hostname) {
    throw new Error(
      'CLOUDINARY_URL tidak valid: gunakan cloudinary://<api_key>:<api_secret>@<cloud_name>',
    )
  }
  return {
    apiKey: decodeURIComponent(url.username),
    apiSecret: decodeURIComponent(url.password),
    cloudName: url.hostname,
  }
}

/** Folder Cloudinary tanpa garis miring di awal/akhir. */
export function normalizeFolder(folder: string | undefined): string {
  return (folder ?? '').trim().replace(/^\/+|\/+$/g, '')
}

export function cloudinaryPublicId(folder: string, storageFilePath: string): string {
  return [normalizeFolder(folder), storageFilePath.replace(/^\/+/, '')].filter(Boolean).join('/')
}

const MIME_BY_EXT: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

/** Aset raw tidak selalu membawa Content-Type gambar; ekstensi file yang menentukan. */
export function contentTypeFor(filename: string, upstream?: string | null): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (MIME_BY_EXT[ext]) return MIME_BY_EXT[ext]
  if (upstream && !upstream.startsWith('application/octet-stream')) return upstream
  return 'application/octet-stream'
}

type AdapterArgs = {
  cacheControlMaxAge: number
  credentials: CloudinaryCredentials
  /** Untuk pengujian. */
  fetch?: typeof fetch
  folder: string
}

const RESOURCE_TYPE = 'raw' as const

export function createCloudinaryAdapter({
  cacheControlMaxAge,
  credentials,
  fetch: fetchImpl = fetch,
  folder,
}: AdapterArgs): Adapter {
  cloudinary.config({
    // tanpa parameter pelacakan SDK (?_a=...) di URL
    analytics: false,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    cloud_name: credentials.cloudName,
    secure: true,
  })

  const deliveryUrl = (publicId: string) =>
    cloudinary.url(publicId, { resource_type: RESOURCE_TYPE, secure: true, type: 'upload' })

  const upload = (publicId: string, file: { buffer: Buffer; tempFilePath?: string }) => {
    const options: UploadApiOptions = {
      invalidate: true,
      overwrite: true,
      public_id: publicId,
      resource_type: RESOURCE_TYPE,
      unique_filename: false,
      use_filename: false,
    }
    // Unggahan besar bisa berupa file sementara (upload.useTempFiles), bukan buffer.
    if (file.tempFilePath) return cloudinary.uploader.upload(file.tempFilePath, options)
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (err, res) => {
        if (err || !res) reject(err ?? new Error(`Unggah ke Cloudinary gagal: ${publicId}`))
        else resolve(res)
      })
      stream.end(file.buffer)
    })
  }

  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'cloudinary',
    generateURL: ({ filename, prefix: docPrefix }) =>
      deliveryUrl(
        cloudinaryPublicId(
          folder,
          buildStoragePathData({ collectionPrefix: prefix, docPrefix, filename }).storageFilePath,
        ),
      ),
    handleUpload: async ({ data, file, storageFilePath }) => {
      await upload(cloudinaryPublicId(folder, storageFilePath), file)
      return data
    },
    handleDelete: async ({ storageFilePath }) => {
      // "not found" bukan error: file mungkin sudah terhapus sebelumnya.
      await cloudinary.uploader.destroy(cloudinaryPublicId(folder, storageFilePath), {
        invalidate: true,
        resource_type: RESOURCE_TYPE,
      })
    },
    staticHandler: async (req, { doc, headers: incomingHeaders, params }) => {
      try {
        const storageFilePath = await getStorageFilePath({
          clientUploadContext: params.clientUploadContext,
          collection,
          collectionPrefix: prefix,
          doc,
          filename: params.filename,
          req,
        })
        const ifNoneMatch = req.headers.get('if-none-match')
        const upstream = await fetchImpl(deliveryUrl(cloudinaryPublicId(folder, storageFilePath)), {
          headers: ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : undefined,
        })
        if (upstream.status === 404) {
          return new Response(null, { status: 404, statusText: 'Not Found' })
        }
        if (upstream.status !== 304 && (!upstream.ok || !upstream.body)) {
          req.payload.logger.error({
            msg: `Cloudinary mengembalikan ${upstream.status} untuk ${storageFilePath}`,
          })
          return new Response(null, { status: 502, statusText: 'Bad Gateway' })
        }

        let headers = new Headers(incomingHeaders)
        const contentType = contentTypeFor(params.filename, upstream.headers.get('content-type'))
        headers.set('Content-Type', contentType)
        headers.set('Cache-Control', `public, max-age=${cacheControlMaxAge}`)
        for (const name of ['etag', 'last-modified', 'content-length']) {
          const value = upstream.headers.get(name)
          if (value) headers.set(name, value)
        }
        // SVG/XML dari domain sendiri: cegah skrip di dalam file ikut berjalan.
        if (isXmlMimeType(contentType)) {
          headers.set('Content-Security-Policy', UPLOAD_CONTENT_SECURITY_POLICY)
        }
        const uploadConfig = collection.upload
        if (
          uploadConfig &&
          typeof uploadConfig === 'object' &&
          typeof uploadConfig.modifyResponseHeaders === 'function'
        ) {
          headers = uploadConfig.modifyResponseHeaders({ headers }) || headers
        }
        if (upstream.status === 304) {
          headers.delete('content-length')
          return new Response(null, { headers, status: 304 })
        }
        return new Response(upstream.body, { headers, status: 200 })
      } catch (err) {
        req.payload.logger.error({ err, msg: 'Gagal mengambil file dari Cloudinary' })
        return new Response('Internal Server Error', { status: 500 })
      }
    },
  })
}

export type CloudinaryStorageOptions = {
  /** Default 1 hari: staging sering mengganti konten. */
  cacheControlMaxAge?: number
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>
  /** Default: aktif bila `url` terisi. */
  enabled?: boolean
  /** Folder di Cloudinary, mis. `soc-merdeka-staging`. */
  folder?: string
  /** Isi `CLOUDINARY_URL`. */
  url?: string
}

export const cloudinaryStorage =
  (options: CloudinaryStorageOptions): Plugin =>
  (incomingConfig: Config): Config | Promise<Config> => {
    const credentials = parseCloudinaryUrl(options.url)
    if (options.enabled === false || !credentials) return incomingConfig

    const adapter = createCloudinaryAdapter({
      cacheControlMaxAge: options.cacheControlMaxAge ?? 60 * 60 * 24,
      credentials,
      folder: normalizeFolder(options.folder) || 'soc-merdeka',
    })
    const collections = Object.fromEntries(
      Object.entries(options.collections).map(([slug, opts]) => [
        slug,
        { ...(opts === true ? {} : opts), adapter },
      ]),
    ) as Record<UploadCollectionSlug, CollectionOptions>

    // Media tidak ditulis ke disk lokal (Vercel hanya punya filesystem sementara).
    const config: Config = {
      ...incomingConfig,
      collections: (incomingConfig.collections ?? []).map((collection) =>
        collections[collection.slug as UploadCollectionSlug]
          ? {
              ...collection,
              upload: {
                ...(typeof collection.upload === 'object' ? collection.upload : {}),
                disableLocalStorage: true,
              },
            }
          : collection,
      ),
    }
    return cloudStoragePlugin({ collections })(config)
  }
