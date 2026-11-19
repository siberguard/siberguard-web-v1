import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { cache } from 'react'
import { getPayload } from 'payload'

import { cacheTags } from '@/hooks/revalidate'
import { UI_LABEL_DEFAULTS, type UiLabelKey } from '@/globals/UiLabels'
import type { Footer, Header, Page, SiteSetting, UiLabel } from '@/payload-types'

import type { Locale } from './paths'

export const getPayloadClient = () => getPayload({ config })

/** Naikkan bila bentuk data yang di-query berubah, agar cache lama tidak terpakai. */
const CACHE_VERSION = 'v3'

/**
 * Jaring pengaman: data di-cache paling lama 5 menit. Perubahan dari CMS tetap tampil
 * seketika lewat revalidasi tag; ini untuk perubahan di luar CMS (seed, restore backup).
 */
export const SAFETY_REVALIDATE_SECONDS = 300

async function fetchPage(slug: string, locale: Locale, draft: boolean): Promise<Page | null> {
  const payload = await getPayloadClient()
  // overrideAccess: relasi form (tertutup untuk REST publik) perlu ikut terisi di server.
  // Keamanan tetap terjaga: hanya halaman terbit yang diambil di luar mode draft, dan
  // form diubah ke bentuk publik (tanpa skor/email) sebelum dikirim ke browser.
  const res = await payload.find({
    collection: 'pages',
    where: draft
      ? { slug: { equals: slug } }
      : { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    locale,
    fallbackLocale: 'id',
    depth: 1,
    limit: 1,
    draft,
    overrideAccess: true,
    pagination: false,
  })
  return res.docs[0] ?? null
}

/**
 * Halaman dari CMS. Versi terbit di-cache dan dibersihkan otomatis saat
 * editor menyimpan (tag `page:<slug>`/`forms`). Mode draft selalu membaca langsung.
 */
export const getPage = cache(async (slug: string, locale: Locale): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()
  if (draft) return fetchPage(slug, locale, true)
  const cached = await unstable_cache(
    () => fetchPage(slug, locale, false),
    [CACHE_VERSION, 'page', slug, locale],
    {
      tags: [cacheTags.pages, cacheTags.page(slug), cacheTags.forms],
      revalidate: SAFETY_REVALIDATE_SECONDS,
    },
  )()
  // Hasil "tidak ditemukan" tidak dipercaya dari cache: halaman bisa saja baru dibuat.
  return cached ?? fetchPage(slug, locale, false)
})

export const getPageSlugs = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      depth: 0,
      pagination: false,
      select: { slug: true, updatedAt: true },
    })
    return res.docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }))
  },
  [CACHE_VERSION, 'page-slugs'],
  { tags: [cacheTags.pages], revalidate: SAFETY_REVALIDATE_SECONDS },
)

type GlobalMap = {
  header: Header
  footer: Footer
  'site-settings': SiteSetting
  'ui-labels': UiLabel
}

export const getGlobal = cache(
  <K extends keyof GlobalMap>(slug: K, locale: Locale): Promise<GlobalMap[K]> =>
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        return (await payload.findGlobal({
          slug,
          locale,
          fallbackLocale: 'id',
          depth: 1,
        })) as GlobalMap[K]
      },
      [CACHE_VERSION, 'global', slug, locale],
      { tags: [cacheTags.global(slug)], revalidate: SAFETY_REVALIDATE_SECONDS },
    )(),
)

export type UiLabels = Record<UiLabelKey, string>

/** Teks antarmuka: isi dari CMS bila ada, selain itu default dari kode. */
export async function getUiLabels(locale: Locale): Promise<UiLabels> {
  const doc = await getGlobal('ui-labels', locale)
  const out = {} as UiLabels
  for (const key of Object.keys(UI_LABEL_DEFAULTS) as UiLabelKey[]) {
    const v = (doc as unknown as Record<string, string | null | undefined>)[key]
    out[key] = v?.trim() ? v : UI_LABEL_DEFAULTS[key][locale]
  }
  return out
}
