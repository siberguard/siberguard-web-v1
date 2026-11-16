import type { Block } from 'payload'

import { blockSettings, linkGroup, sectionIntro } from '@/fields/common'

export const Pricing: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  labels: { singular: 'Paket harga', plural: 'Paket harga' },
  fields: [
    blockSettings({ anchorId: 'paket' }),
    ...sectionIntro(),
    {
      name: 'plans',
      type: 'array',
      label: 'Paket',
      maxRows: 4,
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Nama paket',
              localized: true,
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'audience',
              type: 'text',
              label: 'Untuk siapa',
              localized: true,
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'price',
              type: 'text',
              label: 'Harga',
              localized: true,
              required: true,
              admin: { width: '40%', description: 'Mis. "Rp 1,5 jt" atau "Kustom"' },
            },
            {
              name: 'period',
              type: 'text',
              label: 'Periode',
              localized: true,
              admin: { width: '30%', description: 'Mis. "/ bulan"' },
            },
            {
              name: 'featured',
              type: 'checkbox',
              label: 'Paket unggulan',
              admin: { width: '30%', style: { alignSelf: 'center' } },
            },
          ],
        },
        { name: 'badge', type: 'text', label: 'Badge (paket unggulan)', localized: true },
        {
          name: 'features',
          type: 'array',
          label: 'Fitur',
          fields: [{ name: 'text', type: 'text', label: 'Fitur', localized: true, required: true }],
        },
        linkGroup('cta', 'Tombol'),
      ],
    },
    {
      name: 'addon',
      type: 'group',
      label: 'Add-on',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Label',
              localized: true,
              admin: { width: '30%' },
            },
            {
              name: 'title',
              type: 'text',
              label: 'Judul',
              localized: true,
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
        linkGroup('cta', 'Tombol'),
      ],
    },
    { name: 'disclaimer', type: 'text', label: 'Catatan harga', localized: true },
  ],
}
