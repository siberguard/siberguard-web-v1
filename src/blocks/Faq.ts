import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const Faq: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: { singular: 'FAQ', plural: 'FAQ' },
  fields: [
    blockSettings({ anchorId: 'faq', background: 'muted' }),
    ...sectionIntro({ lead: false }),
    {
      name: 'items',
      type: 'array',
      label: 'Pertanyaan',
      admin: { initCollapsed: true },
      fields: [
        { name: 'question', type: 'text', label: 'Pertanyaan', localized: true, required: true },
        {
          name: 'answer',
          type: 'textarea',
          label: 'Jawaban',
          localized: true,
          required: true,
          admin: { rows: 3 },
        },
        { name: 'open', type: 'checkbox', label: 'Terbuka saat halaman dimuat' },
      ],
    },
  ],
}
