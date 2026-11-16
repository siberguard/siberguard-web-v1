import type { Block } from 'payload'

import { blockSettings, linkGroup, sectionIntro } from '@/fields/common'

export const RichText: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Teks', plural: 'Teks' },
  fields: [
    blockSettings(),
    { name: 'content', type: 'richText', label: 'Isi', localized: true, required: true },
  ],
}

export const CtaBanner: Block = {
  slug: 'ctaBanner',
  interfaceName: 'CtaBannerBlock',
  labels: { singular: 'Ajakan (CTA)', plural: 'Ajakan (CTA)' },
  fields: [
    blockSettings({ background: 'muted' }),
    ...sectionIntro(),
    {
      type: 'row',
      fields: [
        { ...linkGroup('primaryCta', 'Tombol utama'), admin: { width: '50%' } },
        { ...linkGroup('secondaryCta', 'Tombol kedua'), admin: { width: '50%' } },
      ],
    },
  ],
}

/** Gambar + teks: untuk screenshot portal, foto tim, atau ruang SOC. */
export const MediaSplit: Block = {
  slug: 'mediaSplit',
  interfaceName: 'MediaSplitBlock',
  labels: { singular: 'Gambar + teks', plural: 'Gambar + teks' },
  fields: [
    blockSettings(),
    ...sectionIntro(),
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Gambar', required: true },
    {
      name: 'imagePosition',
      type: 'select',
      label: 'Posisi gambar',
      defaultValue: 'right',
      options: [
        { label: 'Kanan', value: 'right' },
        { label: 'Kiri', value: 'left' },
      ],
    },
    {
      name: 'points',
      type: 'array',
      label: 'Poin',
      fields: [{ name: 'text', type: 'text', label: 'Poin', localized: true, required: true }],
    },
  ],
}

/** Deretan logo sertifikasi, mitra, atau regulasi yang diacu. */
export const LogoStrip: Block = {
  slug: 'logoStrip',
  interfaceName: 'LogoStripBlock',
  labels: { singular: 'Deretan logo', plural: 'Deretan logo' },
  fields: [
    blockSettings(),
    { name: 'heading', type: 'text', label: 'Judul kecil', localized: true },
    {
      name: 'logos',
      type: 'array',
      label: 'Logo',
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo',
              required: true,
              admin: { width: '40%' },
            },
            { name: 'name', type: 'text', label: 'Nama', required: true, admin: { width: '30%' } },
            { name: 'url', type: 'text', label: 'Tautan (opsional)', admin: { width: '30%' } },
          ],
        },
      ],
    },
  ],
}
