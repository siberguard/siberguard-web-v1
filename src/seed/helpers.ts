/**
 * Utilitas seed: konten ditulis sekali dengan teks dua bahasa `t(id, en)`,
 * lalu dipecah per locale. Struktur (array/blocks) sama untuk kedua bahasa.
 */
export type L = { __l: true; id: string; en: string }
export const t = (id: string, en: string): L => ({ __l: true, id, en })

const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && (v as L).__l === true

/** Ganti setiap `t(id, en)` dengan teks untuk satu locale. */
export function resolve<T>(tree: T, locale: 'id' | 'en'): T {
  if (isL(tree)) return tree[locale] as T
  if (Array.isArray(tree)) return tree.map((v) => resolve(v, locale)) as T
  if (tree && typeof tree === 'object' && !(tree instanceof Date)) {
    return Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, resolve(v, locale)])) as T
  }
  return tree
}

/**
 * Salin `id` baris array/block dari dokumen yang sudah dibuat ke data locale lain,
 * agar update bahasa Inggris mengisi baris yang sama (bukan membuat baris baru).
 */
export function withRowIds<T>(data: T, created: unknown): T {
  if (Array.isArray(data) && Array.isArray(created)) {
    return data.map((item, i) => {
      const row = created[i] as Record<string, unknown> | undefined
      const merged = withRowIds(item, row)
      return row && typeof merged === 'object' && merged && row.id
        ? { ...merged, id: row.id }
        : merged
    }) as T
  }
  if (data && typeof data === 'object' && created && typeof created === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        withRowIds(v, (created as Record<string, unknown>)[k]),
      ]),
    ) as T
  }
  return data
}

/** Rich text Lexical sederhana dari daftar heading/paragraf/butir. */
type Node = { h?: string; p?: string; ul?: string[] }

const text = (s: string) => ({
  type: 'text',
  text: s,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})
const base = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

export function lexical(nodes: Node[]) {
  return {
    root: {
      type: 'root',
      ...base,
      children: nodes.map((n) => {
        if (n.h) return { type: 'heading', tag: 'h2', ...base, children: [text(n.h)] }
        if (n.ul)
          return {
            type: 'list',
            listType: 'bullet',
            tag: 'ul',
            start: 1,
            ...base,
            children: n.ul.map((li, i) => ({
              type: 'listitem',
              value: i + 1,
              ...base,
              children: [text(li)],
            })),
          }
        return {
          type: 'paragraph',
          textFormat: 0,
          textStyle: '',
          ...base,
          children: [text(n.p ?? '')],
        }
      }),
    },
  }
}
