import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const FormSection: Block = {
  slug: 'formSection',
  interfaceName: 'FormSectionBlock',
  labels: { singular: L('Formulir', 'Form'), plural: L('Formulir', 'Forms') },
  fields: [
    blockSettings({ anchorId: 'pendaftaran', background: 'ink' }),
    ...sectionIntro(),
    {
      name: 'checklist',
      type: 'array',
      label: L('Daftar manfaat', 'Benefits'),
      fields: [
        {
          name: 'text',
          type: 'text',
          label: L('Manfaat', 'Benefit'),
          localized: true,
          required: true,
        },
      ],
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      label: L('Formulir', 'Form'),
      required: true,
    },
    {
      name: 'layout',
      type: 'select',
      label: L('Tata letak', 'Layout'),
      defaultValue: 'split',
      options: [
        { label: L('Dua kolom (teks + formulir)', 'Two columns (text + form)'), value: 'split' },
        { label: L('Formulir lebar penuh', 'Full-width form'), value: 'full' },
      ],
    },
  ],
}
