import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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
      titleSuffix: ' · SOC Merdeka Admin',
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
  db: mongooseAdapter({ url: process.env.DATABASE_URL || '' }),
  email: nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@socmerdeka.id',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'SOC Merdeka',
    skipVerify: process.env.NODE_ENV !== 'production',
    transportOptions: {
      host: process.env.SMTP_HOST || '127.0.0.1',
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    },
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ['pages'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${doc?.title ?? ''} · SOC Merdeka`,
    }),
  ],
  onInit: async (payload) => {
    await ensureAnalyticsCollections(payload)
  },
})
