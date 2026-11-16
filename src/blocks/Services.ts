import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, patternValidator, sectionIntro, SLUG_HINT } from '@/fields/common'

export const Services: Block = {
  slug: 'services',
  interfaceName: 'ServicesBlock',
  labels: {
    singular: L('Katalog layanan', 'Service catalogue'),
    plural: L('Katalog layanan', 'Service catalogues'),
  },
  fields: [
    blockSettings({ anchorId: 'layanan' }),
    ...sectionIntro(),
    {
      name: 'allLabel',
      type: 'text',
      label: L('Label filter "semua"', '"All" filter label'),
      localized: true,
      admin: {
        description: L(
          'Kosongkan untuk menyembunyikan filter kategori.',
          'Leave empty to hide the category filter.',
        ),
      },
    },
    {
      name: 'categories',
      type: 'array',
      label: L('Kategori', 'Categories'),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              type: 'text',
              label: L('Kode', 'Code'),
              required: true,
              validate: patternValidator(/^[a-z][a-z0-9-]*$/, ...SLUG_HINT),
              admin: { width: '30%', description: L('Mis. inti', 'E.g. inti') },
            },
            {
              name: 'label',
              type: 'text',
              label: L('Nama kategori', 'Category name'),
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
      label: L('Layanan', 'Services'),
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'category',
              type: 'text',
              label: L('Kode kategori', 'Category code'),
              admin: {
                width: '30%',
                description: L(
                  'Sama dengan kode di daftar kategori',
                  'Same as a code in the category list',
                ),
              },
            },
            {
              name: 'name',
              type: 'text',
              label: L('Nama layanan', 'Service name'),
              localized: true,
              required: true,
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
        {
          name: 'points',
          type: 'array',
          label: L('Poin', 'Points'),
          fields: [
            {
              name: 'text',
              type: 'text',
              label: L('Poin', 'Points'),
              localized: true,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
