import { defineRouting } from 'next-intl/routing'

import { DEFAULT_LOCALE, LOCALES } from '@/lib/cms/paths'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Bahasa Indonesia di "/", Inggris di "/en".
  localePrefix: 'as-needed',
  // Bahasa default selalu Indonesia; tidak dialihkan otomatis berdasarkan browser.
  localeDetection: false,
  localeCookie: false,
  // Tag hreflang dibuat sendiri di metadata halaman.
  alternateLinks: false,
})
