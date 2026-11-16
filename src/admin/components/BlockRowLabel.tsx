'use client'

import { useRowLabel, useTranslation } from '@payloadcms/ui'

type RowData = {
  blockType?: string
  heading?: string | null
  label?: string | null
  title?: string | null
  name?: string | null
  anchorId?: string | null
  hidden?: boolean | null
  required?: boolean | null
}

const TYPE: Record<string, [string, string]> = {
  hero: ['Hero', 'Hero'],
  featureGrid: ['Keunggulan', 'Features'],
  processFlow: ['Alur proses', 'Process flow'],
  services: ['Layanan', 'Services'],
  deployAgent: ['Pasang agen', 'Agent install'],
  pricing: ['Paket harga', 'Pricing'],
  faq: ['FAQ', 'FAQ'],
  formSection: ['Formulir', 'Form'],
  mediaSplit: ['Gambar + teks', 'Image + text'],
  logoStrip: ['Deretan logo', 'Logo strip'],
  ctaBanner: ['Ajakan (CTA)', 'Call to action'],
  richText: ['Teks', 'Text'],
  textInput: ['Teks singkat', 'Short text'],
  textareaInput: ['Teks panjang', 'Long text'],
  emailInput: ['Email', 'Email'],
  phoneInput: ['WhatsApp', 'WhatsApp'],
  singleChoice: ['Pilihan tunggal', 'Single choice'],
  multiChoice: ['Pilihan ganda', 'Multiple choice'],
  selectInput: ['Dropdown', 'Dropdown'],
  consent: ['Persetujuan', 'Consent'],
}

const clip = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/**
 * Label baris block di editor: nomor, jenis, judul/pertanyaan, anchor atau kode field,
 * dan penanda bila section disembunyikan — menggantikan "Tanpa Judul".
 */
export const BlockRowLabel = () => {
  const { data, rowNumber } = useRowLabel<RowData>()
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const type = data?.blockType ? (TYPE[data.blockType]?.[en ? 1 : 0] ?? data.blockType) : ''
  const title = (data?.heading || data?.label || data?.title || '').replace(/\s+/g, ' ').trim()
  const code = data?.anchorId ? `#${data.anchorId}` : data?.name || ''

  return (
    <span className="smd-rowlabel">
      <span className="smd-rowlabel__num">{String((rowNumber ?? 0) + 1).padStart(2, '0')}</span>
      <span className="smd-rowlabel__type">{type}</span>
      {title && <span className="smd-rowlabel__title">{clip(title)}</span>}
      {code && <code className="smd-rowlabel__code">{code}</code>}
      {data?.required && <span className="smd-rowlabel__flag">{en ? 'required' : 'wajib'}</span>}
      {data?.hidden && (
        <span className="smd-rowlabel__flag smd-rowlabel__flag--hidden">
          {en ? 'hidden' : 'disembunyikan'}
        </span>
      )}
    </span>
  )
}
