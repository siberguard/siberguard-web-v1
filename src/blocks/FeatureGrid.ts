import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'
import { iconOptions } from '@/lib/icons'

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  labels: {
    singular: L('Daftar keunggulan', 'Feature list'),
    plural: L('Daftar keunggulan', 'Feature lists'),
  },
  fields: [
    blockSettings({ anchorId: 'tentang' }),
    ...sectionIntro(),
    {
      name: 'items',
      type: 'array',
      label: L('Keunggulan', 'Features'),
      minRows: 1,
      admin: {
        initCollapsed: true,
        components: { RowLabel: '@/admin/components/IconRowLabel#IconRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'icon',
              type: 'select',
              label: L('Ikon', 'Icon'),
              options: iconOptions,
              admin: {
                width: '30%',
                // Menampilkan bentuk ikon saat memilih, bukan hanya nama.
                components: { Field: '@/admin/components/IconSelectField#IconSelectField' },
              },
            },
            {
              name: 'title',
              type: 'text',
              label: L('Judul', 'Heading'),
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
      ],
    },
  ],
}
