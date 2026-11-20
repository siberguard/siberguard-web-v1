import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { id } from '@payloadcms/translations/languages/id'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { FormSubmissions } from './collections/FormSubmissions'
import { Forms } from './collections/Forms'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { analyticsSummaryEndpoint } from './endpoints/analyticsSummary'
import { collectEndpoint } from './endpoints/collect'
import { healthEndpoint } from './endpoints/health'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { SiteSettings } from './globals/SiteSettings'
import { UiLabels } from './globals/UiLabels'
import { ensureAnalyticsCollections } from './lib/analytics/storage'
import { buildEmailAdapter } from './lib/email/adapter'
import { cloudinaryStorage } from './lib/storage/cloudinary'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  serverURL,
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · SiberGuard Admin',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/brand/icon.svg' }],
    },
    dateFormat: 'd MMM yyyy, HH:mm',
    components: {
      graphics: {
        Logo: '@/admin/components/Brand#AdminLogo',
        Icon: '@/admin/components/Brand#AdminIcon',
      },
      Nav: '@/admin/components/Nav#Nav',
      views: {
        dashboard: { Component: '@/admin/views/Overview#OverviewView' },
        analytics: { Component: '@/admin/views/Analytics#AnalyticsView', path: '/analytics' },
        leads: { Component: '@/admin/views/Leads#LeadsView', path: '/leads' },
      },
    },
    livePreview: {
      breakpoints: [
        { label: 'Ponsel', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 834, height: 1112 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  i18n: {
    supportedLanguages: { id, en },
    fallbackLanguage: 'id',
  },
  localization: {
    locales: [
      { code: 'id', label: 'Bahasa Indonesia' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'id',
    fallback: true,
  },
  collections: [Pages, Forms, FormSubmissions, Media, Users],
  globals: [Header, Footer, SiteSettings, UiLabels],
  endpoints: [collectEndpoint, analyticsSummaryEndpoint, healthEndpoint],
  editor: lexicalEditor(),
  graphQL: { disable: true },
  csrf: [serverURL],
  cors: [serverURL],
  upload: { limits: { fileSize: 10 * 1024 * 1024 } },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
    // Serverless (Vercel): setiap instance fungsi membuka pool sendiri; batasi agar
    // kuota koneksi MongoDB Atlas (mis. 500 di tier gratis) tidak cepat habis.
    connectOptions: process.env.VERCEL ? { maxPoolSize: 10 } : undefined,
    // Skrip seed/demo (package.json) menunggu semua koleksi & index selesai dibuat sebelum
    // menulis. Di database baru yang jauh (mis. Atlas), pembuatannya di latar belakang
    // bentrok dengan transaksi pertama: "WriteConflict … due to catalog changes".
    // Tidak dipakai saat aplikasi berjalan agar cold start tetap cepat.
    ensureIndexes: process.env.PAYLOAD_ENSURE_INDEXES === 'true',
  }),
  // Resend (staging/Vercel), SMTP (VPS), atau tidak ada — lihat src/lib/email/adapter.ts
  email: buildEmailAdapter(),
  sharp,
  plugins: [
    // Vercel tidak punya disk permanen: di staging media disimpan di Cloudinary bila
    // CLOUDINARY_URL terisi. Tanpa itu (VPS/Docker, development, CI) media tetap di `media/`.
    // File tetap disajikan lewat /api/media/file/… sehingga CSP & next/image tidak berubah.
    cloudinaryStorage({
      collections: { media: true },
      folder: process.env.CLOUDINARY_FOLDER,
      url: process.env.CLOUDINARY_URL,
    }),
    seoPlugin({
      collections: ['pages'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${doc?.title ?? ''} · SiberGuard`,
    }),
  ],
  onInit: async (payload) => {
    // Kegagalan setup analytics tidak boleh menjatuhkan CMS & website.
    try {
      await ensureAnalyticsCollections(payload)
    } catch (err) {
      payload.logger.error({ err }, '[analytics] gagal menyiapkan collection')
    }
  },
})
