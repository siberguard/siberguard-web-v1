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
      name: 'layout',
      type: 'select',
      label: L('Tata letak', 'Layout'),
      defaultValue: 'horizontal',
      options: [
        { label: L('Garis waktu mendatar', 'Horizontal timeline'), value: 'horizontal' },
        {
          label: L('Daftar bernomor (judul di kiri)', 'Numbered list (heading on the left)'),
          value: 'vertical',
        },
      ],
      admin: {
        description: L(
          'Pakai tata letak berbeda bila ada dua alur di satu halaman.',
          'Use a different layout when a page has two flows.',
        ),
      },
    },
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
                description: L('Opsional, mis. "Analis L1"', 'Optional, e.g. "L1 analyst"'),
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
