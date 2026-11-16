import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const Services: Block = {
  slug: 'services',
  interfaceName: 'ServicesBlock',
  labels: { singular: 'Katalog layanan', plural: 'Katalog layanan' },
  fields: [
    blockSettings({ anchorId: 'layanan' }),
    ...sectionIntro(),
    {
      name: 'allLabel',
      type: 'text',
      label: 'Label filter "semua"',
      localized: true,
      admin: { description: 'Kosongkan untuk menyembunyikan filter kategori.' },
    },
    {
      name: 'categories',
      type: 'array',
      label: 'Kategori',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              type: 'text',
              label: 'Kode',
              required: true,
              validate: (v: string | null | undefined) =>
                !v || /^[a-z][a-z0-9-]*$/.test(v) ? true : 'Huruf kecil, angka, tanda hubung',
              admin: { width: '30%', description: 'Mis. inti' },
            },
            {
              name: 'label',
              type: 'text',
              label: 'Nama kategori',
              localized: true,
              required: true,
              admin: { width: '70%' },
            },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Layanan',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'category',
              type: 'text',
              label: 'Kode kategori',
              admin: { width: '30%', description: 'Sama dengan kode di daftar kategori' },
            },
            {
              name: 'name',
              type: 'text',
              label: 'Nama layanan',
              localized: true,
              required: true,
              admin: { width: '70%' },
            },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Deskripsi',
          localized: true,
          admin: { rows: 2 },
        },
        {
          name: 'points',
          type: 'array',
          label: 'Poin',
          fields: [{ name: 'text', type: 'text', label: 'Poin', localized: true, required: true }],
        },
      ],
    },
  ],
}
