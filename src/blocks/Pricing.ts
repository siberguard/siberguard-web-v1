import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, linkGroup, sectionIntro } from '@/fields/common'

export const Pricing: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  labels: {
    singular: L('Paket harga', 'Pricing plans'),
    plural: L('Paket harga', 'Pricing plans'),
  },
  fields: [
    blockSettings({ anchorId: 'paket' }),
    ...sectionIntro(),
    {
      name: 'plans',
      type: 'array',
      label: L('Paket', 'Plans'),
      maxRows: 4,
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: L('Nama paket', 'Plan name'),
              localized: true,
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'audience',
              type: 'text',
              label: L('Untuk siapa', 'Audience'),
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
              label: L('Harga', 'Price'),
              localized: true,
              required: true,
              admin: {
                width: '40%',
                description: L('Mis. "Rp300.000" atau "Kustom"', 'E.g. "IDR 300,000" or "Custom"'),
              },
            },
            {
              name: 'period',
              type: 'text',
              label: L('Periode', 'Period'),
              localized: true,
              admin: { width: '30%', description: L('Mis. "/ bulan"', 'E.g. "/ month"') },
            },
            {
              name: 'featured',
              type: 'checkbox',
              label: L('Paket unggulan', 'Featured plan'),
              admin: { width: '30%', style: { alignSelf: 'center' } },
            },
          ],
        },
        {
          name: 'priceNote',
          type: 'text',
          label: L('Keterangan harga', 'Price note'),
          localized: true,
          admin: {
            description: L(
              'Mis. "Minimum 5 endpoint • Biaya minimum Rp1.500.000 per bulan"',
              'E.g. "Minimum 5 endpoints • Minimum fee IDR 1,500,000 per month"',
            ),
          },
        },
        {
          name: 'badge',
          type: 'text',
          label: L('Badge (paket unggulan)', 'Badge (featured plan)'),
          localized: true,
        },

        {
          name: 'features',
          type: 'array',
          label: L('Fitur', 'Features'),
          fields: [
            {
              name: 'text',
              type: 'text',
              label: L('Fitur', 'Features'),
              localized: true,
              required: true,
            },
          ],
        },
        linkGroup('cta', L('Tombol', 'Button')),
      ],
    },
    {
      name: 'addon',
      type: 'group',
      label: L('Add-on', 'Add-on'),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              label: L('Label', 'Label'),
              localized: true,
              admin: { width: '30%' },
            },
            {
              name: 'title',
              type: 'text',
              label: L('Judul', 'Heading'),
              localized: true,
              admin: { width: '70%' },
            },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          label: L('Deskripsi', 'Description'),
          localized: true,
          admin: { rows: 2 },
        },
        linkGroup('cta', L('Tombol', 'Button')),
      ],
    },
    {
      name: 'disclaimer',
      type: 'text',
      label: L('Catatan harga', 'Pricing note'),
      localized: true,
    },
  ],
}
