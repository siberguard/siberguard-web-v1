import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'

export const DeployAgent: Block = {
  slug: 'deployAgent',
  interfaceName: 'DeployAgentBlock',
  labels: {
    singular: L('Panduan pasang agen', 'Agent install guide'),
    plural: L('Panduan pasang agen', 'Agent install guides'),
  },
  fields: [
    blockSettings({ anchorId: 'deploy-agent', background: 'ink' }),
    ...sectionIntro(),
    {
      name: 'steps',
      type: 'array',
      label: L('Langkah', 'Steps'),
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: L('Judul', 'Heading'),
          localized: true,
          required: true,
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
    {
      name: 'platforms',
      type: 'array',
      label: L('Sistem operasi', 'Operating systems'),
      labels: {
        singular: L('Sistem operasi', 'Operating systems'),
        plural: L('Sistem operasi', 'Operating systems'),
      },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: L('Nama tab', 'Tab name'),
          required: true,
          admin: { description: L('Mis. Linux, Windows, macOS', 'E.g. Linux, Windows, macOS') },
        },
        {
          name: 'commands',
          type: 'array',
          label: L('Perintah', 'Commands'),
          fields: [
            {
              name: 'label',
              type: 'text',
              label: L('Keterangan', 'Caption'),
              localized: true,
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'prompt',
                  type: 'text',
                  label: L('Prompt', 'Prompt'),
                  defaultValue: '$',
                  admin: { width: '20%', description: L('$ atau PS>', '$ or PS>') },
                },
                {
                  name: 'code',
                  type: 'textarea',
                  label: L('Perintah (yang disalin)', 'Command (copied)'),
                  required: true,
                  admin: {
                    width: '80%',
                    rows: 3,
                    description: L(
                      'Ganti baris dengan "\\" di akhir baris bila perlu.',
                      'Break lines with "\\" at the end of a line if needed.',
                    ),
                  },
                },
              ],
            },
            {
              name: 'output',
              type: 'text',
              label: L('Contoh output (tidak ikut disalin)', 'Sample output (not copied)'),
              admin: {
                description: L(
                  'Mis. "# Active: active (running)"',
                  'E.g. "# Active: active (running)"',
                ),
              },
            },
          ],
        },
        {
          name: 'requirements',
          type: 'array',
          label: L('Persyaratan', 'Requirements'),
          maxRows: 4,
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: L('Label', 'Label'),
                  localized: true,
                  required: true,
                  admin: { width: '35%' },
                },
                {
                  name: 'value',
                  type: 'text',
                  label: L('Nilai', 'Value'),
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
    { name: 'note', type: 'text', label: L('Catatan kaki', 'Footnote'), localized: true },
  ],
}
