import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'
import { iconOptions } from '@/lib/icons'

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  labels: { singular: 'Daftar keunggulan', plural: 'Daftar keunggulan' },
  fields: [
    blockSettings({ anchorId: 'tentang' }),
    ...sectionIntro(),
    {
      name: 'items',
      type: 'array',
      label: 'Keunggulan',
      minRows: 1,
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'icon',
              type: 'select',
              label: 'Ikon',
              options: iconOptions,
              admin: { width: '30%' },
            },
            {
              name: 'title',
              type: 'text',
              label: 'Judul',
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
      ],
    },
  ],
}
