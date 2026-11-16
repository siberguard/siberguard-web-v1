export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/** URL publik sebuah halaman. Bahasa Indonesia tanpa prefix; Inggris di bawah /en. */
export function pagePath(slug: string, locale: string): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  if (slug === 'home') return prefix || '/'
  return `${prefix}/${slug}`
}
