import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const ProcessFlow: Block = {
  slug: 'processFlow',
  interfaceName: 'ProcessFlowBlock',
  labels: { singular: L('Alur proses', 'Process flow'), plural: L('Alur proses', 'Process flows') },
  fields: [
    blockSettings({ anchorId: 'alur', background: 'muted' }),
    ...sectionIntro(),
    {
      name: 'steps',
      type: 'array',
      label: L('Langkah', 'Steps'),
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
              label: L('Judul', 'Heading'),
              localized: true,
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'tag',
              type: 'text',
              label: L('Label teknis', 'Technical tag'),
              localized: true,
              admin: {
                width: '50%',
                description: L('Mis. "TLS 1.3 · mTLS"', 'E.g. "TLS 1.3 · mTLS"'),
              },
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
