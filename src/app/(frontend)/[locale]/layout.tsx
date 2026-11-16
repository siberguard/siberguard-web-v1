import localFont from 'next/font/local'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Tracker } from '@/components/analytics/Tracker'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { ThemeProvider } from '@/components/ThemeProvider'
import { routing } from '@/i18n/routing'
import { getGlobal, getUiLabels } from '@/lib/cms/queries'

import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/site.css'
import '@/styles/blocks.css'
import '@/styles/form.css'

// Font di-host sendiri dari repo (OFL) — build tidak bergantung pada Google Fonts.
const jakarta = localFont({
  src: [{ path: '../../../fonts/PlusJakartaSans-latin.woff2', weight: '200 800', style: 'normal' }],
  variable: '--font-jakarta',
  display: 'swap',
})
const mono = localFont({
  src: [{ path: '../../../fonts/JetBrainsMono-latin.woff2', weight: '100 800', style: 'normal' }],
  variable: '--font-jetbrains',
  display: 'swap',
})

export function generateStaticParams() {
  // Build Docker tanpa database: halaman dirender saat request pertama lalu di-cache.
  if (process.env.SKIP_BUILD_PRERENDER === '1') return []
  return routing.locales.map((locale) => ({ locale }))
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1224' },
  ],
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [settings, labels, draft] = await Promise.all([
    getGlobal('site-settings', locale),
    getUiLabels(locale),
    draftMode(),
  ])
  const analytics = settings.analytics ?? {}

  return (
    <html lang={locale} suppressHydrationWarning className={`${jakarta.variable} ${mono.variable}`}>
      <body>
        <ThemeProvider defaultTheme={settings.defaultTheme ?? 'system'}>
          <NextIntlClientProvider>
            <a href="#main" className="skip-link">
              {labels.skipToContent}
            </a>
            {children}
            <Tracker
              locale={locale}
              enabled={analytics.enabled !== false && !draft.isEnabled}
              respectDoNotTrack={analytics.respectDoNotTrack !== false}
            />
            {draft.isEnabled && (
              <LivePreviewListener serverURL={process.env.NEXT_PUBLIC_SERVER_URL || ''} />
            )}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
