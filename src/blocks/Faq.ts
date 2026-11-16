import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const Faq: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: { singular: L('FAQ', 'FAQ'), plural: L('FAQ', 'FAQs') },
  fields: [
    blockSettings({ anchorId: 'faq', background: 'muted' }),
    ...sectionIntro({ lead: false }),
    {
      name: 'items',
      type: 'array',
      label: L('Pertanyaan', 'Questions'),
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'question',
          type: 'text',
          label: L('Pertanyaan', 'Questions'),
          localized: true,
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          label: L('Jawaban', 'Answer'),
          localized: true,
          required: true,
          admin: { rows: 3 },
        },
        {
          name: 'open',
          type: 'checkbox',
          label: L('Terbuka saat halaman dimuat', 'Open on page load'),
        },
      ],
    },
  ],
}
