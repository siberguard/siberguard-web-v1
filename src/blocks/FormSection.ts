import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const FormSection: Block = {
  slug: 'formSection',
  interfaceName: 'FormSectionBlock',
  labels: { singular: 'Formulir', plural: 'Formulir' },
  fields: [
    blockSettings({ anchorId: 'pendaftaran', background: 'ink' }),
    ...sectionIntro(),
    {
      name: 'checklist',
      type: 'array',
      label: 'Daftar manfaat',
      fields: [{ name: 'text', type: 'text', label: 'Manfaat', localized: true, required: true }],
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      label: 'Formulir',
      required: true,
    },
    {
      name: 'layout',
      type: 'select',
      label: 'Tata letak',
      defaultValue: 'split',
      options: [
        { label: 'Dua kolom (teks + formulir)', value: 'split' },
        { label: 'Formulir lebar penuh', value: 'full' },
      ],
    },
  ],
}
