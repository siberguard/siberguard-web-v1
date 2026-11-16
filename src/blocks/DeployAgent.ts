import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const DeployAgent: Block = {
  slug: 'deployAgent',
  interfaceName: 'DeployAgentBlock',
  labels: { singular: 'Panduan pasang agen', plural: 'Panduan pasang agen' },
  fields: [
    blockSettings({ anchorId: 'deploy-agent', background: 'ink' }),
    ...sectionIntro(),
    {
      name: 'steps',
      type: 'array',
      label: 'Langkah',
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'Judul', localized: true, required: true },
        {
          name: 'description',
          type: 'textarea',
          label: 'Deskripsi',
          localized: true,
          admin: { rows: 2 },
        },
      ],
    },
    {
      name: 'platforms',
      type: 'array',
      label: 'Sistem operasi',
      labels: { singular: 'Sistem operasi', plural: 'Sistem operasi' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nama tab',
          required: true,
          admin: { description: 'Mis. Linux, Windows, macOS' },
        },
        {
          name: 'commands',
          type: 'array',
          label: 'Perintah',
          fields: [
            { name: 'label', type: 'text', label: 'Keterangan', localized: true, required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'prompt',
                  type: 'text',
                  label: 'Prompt',
                  defaultValue: '$',
                  admin: { width: '20%', description: '$ atau PS>' },
                },
                {
                  name: 'code',
                  type: 'textarea',
                  label: 'Perintah (yang disalin)',
                  required: true,
                  admin: {
                    width: '80%',
                    rows: 3,
                    description: 'Ganti baris dengan "\\" di akhir baris bila perlu.',
                  },
                },
              ],
            },
            {
              name: 'output',
              type: 'text',
              label: 'Contoh output (tidak ikut disalin)',
              admin: { description: 'Mis. "# Active: active (running)"' },
            },
          ],
        },
        {
          name: 'requirements',
          type: 'array',
          label: 'Persyaratan',
          maxRows: 4,
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: 'Label',
                  localized: true,
                  required: true,
                  admin: { width: '35%' },
                },
                {
                  name: 'value',
                  type: 'text',
                  label: 'Nilai',
                  localized: true,
                  required: true,
                  admin: { width: '65%' },
                },
              ],
            },
          ],
        },
      ],
    },
    { name: 'note', type: 'text', label: 'Catatan kaki', localized: true },
  ],
}
