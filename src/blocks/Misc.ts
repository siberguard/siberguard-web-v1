import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, linkGroup, sectionIntro } from '@/fields/common'

export const RichText: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: L('Teks', 'Text'), plural: L('Teks', 'Text blocks') },
  fields: [
    blockSettings(),
    {
      name: 'content',
      type: 'richText',
      label: L('Isi', 'Content'),
      localized: true,
      required: true,
    },
  ],
}

export const CtaBanner: Block = {
  slug: 'ctaBanner',
  interfaceName: 'CtaBannerBlock',
  labels: {
    singular: L('Ajakan (CTA)', 'Call to action'),
    plural: L('Ajakan (CTA)', 'Calls to action'),
  },
  fields: [
    blockSettings({ background: 'muted' }),
    ...sectionIntro(),
    {
      type: 'row',
      fields: [
        {
          ...linkGroup('primaryCta', L('Tombol utama', 'Primary button')),
          admin: { width: '50%' },
        },
        {
          ...linkGroup('secondaryCta', L('Tombol kedua', 'Secondary button')),
          admin: { width: '50%' },
        },
      ],
    },
  ],
}

/** Gambar + teks: untuk screenshot portal, foto tim, atau ruang SOC. */
export const MediaSplit: Block = {
  slug: 'mediaSplit',
  interfaceName: 'MediaSplitBlock',
  labels: {
    singular: L('Gambar + teks', 'Image + text'),
    plural: L('Gambar + teks', 'Image + text blocks'),
  },
  fields: [
    blockSettings(),
    ...sectionIntro(),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: L('Gambar', 'Image'),
      required: true,
    },
    {
      name: 'imagePosition',
      type: 'select',
      label: L('Posisi gambar', 'Image position'),
      defaultValue: 'right',
      options: [
        { label: L('Kanan', 'Right'), value: 'right' },
        { label: L('Kiri', 'Left'), value: 'left' },
      ],
    },
    {
      name: 'points',
      type: 'array',
      label: L('Poin', 'Points'),
      fields: [
        { name: 'text', type: 'text', label: L('Poin', 'Points'), localized: true, required: true },
      ],
    },
  ],
}

/** Deretan logo sertifikasi, mitra, atau regulasi yang diacu. */
export const LogoStrip: Block = {
  slug: 'logoStrip',
  interfaceName: 'LogoStripBlock',
  labels: { singular: L('Deretan logo', 'Logo strip'), plural: L('Deretan logo', 'Logo strips') },
  fields: [
    blockSettings(),
    { name: 'heading', type: 'text', label: L('Judul kecil', 'Small heading'), localized: true },
    {
      name: 'logos',
      type: 'array',
      label: L('Logo', 'Logo'),
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: L('Logo', 'Logo'),
              required: true,
              admin: { width: '40%' },
            },
            {
              name: 'name',
              type: 'text',
              label: L('Nama', 'Name'),
              required: true,
              admin: { width: '30%' },
            },
            {
              name: 'url',
              type: 'text',
              label: L('Tautan (opsional)', 'Link (optional)'),
              admin: { width: '30%' },
            },
          ],
        },
      ],
    },
  ],
}
