import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'
import { revalidateTag } from 'next/cache'

export const cacheTags = {
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  global: (slug: string) => `global:${slug}`,
  forms: 'forms',
  form: (id: string) => `form:${id}`,
}

/**
 * Tandai cache sebagai basi. `expire: 0` dipakai agar editor langsung melihat
 * perubahan di kunjungan berikutnya (bukan konten lama sambil revalidasi di latar).
 * Di luar konteks Next (mis. script seed via tsx) panggilan ini dilewati.
 */
export function revalidate(tags: string[]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch {
      // Tidak berjalan di dalam request Next.js (seed/CLI) — aman diabaikan.
    }
  }
}

export const revalidatePageAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  context,
}) => {
  if (context?.disableRevalidate) return doc
  const tags = [cacheTags.pages, cacheTags.page(doc.slug)]
  if (previousDoc?.slug && previousDoc.slug !== doc.slug)
    tags.push(cacheTags.page(previousDoc.slug))
  revalidate(tags)
  return doc
}

export const revalidatePageAfterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  if (!context?.disableRevalidate) revalidate([cacheTags.pages, cacheTags.page(doc?.slug)])
  return doc
}

export const revalidateFormAfterChange: CollectionAfterChangeHook = ({ doc, context }) => {
  if (!context?.disableRevalidate) revalidate([cacheTags.forms, cacheTags.form(String(doc.id))])
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc, global, context }) => {
  if (!context?.disableRevalidate) revalidate([cacheTags.global(global.slug)])
  return doc
}
