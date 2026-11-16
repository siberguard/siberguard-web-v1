import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const ProcessFlow: Block = {
  slug: 'processFlow',
  interfaceName: 'ProcessFlowBlock',
  labels: { singular: 'Alur proses', plural: 'Alur proses' },
  fields: [
    blockSettings({ anchorId: 'alur', background: 'muted' }),
    ...sectionIntro(),
    {
      name: 'steps',
      type: 'array',
      label: 'Langkah',
      minRows: 2,
      maxRows: 6,
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Judul',
              localized: true,
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'tag',
              type: 'text',
              label: 'Label teknis',
              localized: true,
              admin: { width: '50%', description: 'Mis. "TLS 1.3 · mTLS"' },
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
