import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, sectionIntro } from '@/fields/common'
import { iconOptions } from '@/lib/icons'

const iconField = {
  name: 'icon',
  type: 'select',
  label: L('Ikon', 'Icon'),
  options: iconOptions,
  admin: {
    width: '30%',
    components: { Field: '@/admin/components/IconSelectField#IconSelectField' },
  },
} as const

/** "Mengapa": tantangan yang umum dialami UMKM, dipasangkan dengan manfaat layanan. */
export const Challenges: Block = {
  slug: 'challenges',
  interfaceName: 'ChallengesBlock',
  labels: {
    singular: L('Tantangan & manfaat', 'Challenges & benefits'),
    plural: L('Tantangan & manfaat', 'Challenges & benefits'),
  },
  fields: [
    blockSettings({ anchorId: 'mengapa' }),
    ...sectionIntro(),
    {
      type: 'row',
      fields: [
        {
          name: 'challengeLabel',
          type: 'text',
          label: L('Judul kolom tantangan', 'Challenge column heading'),
          localized: true,
          admin: { width: '50%', description: L('Mis. "Tantangan"', 'E.g. "Challenge"') },
        },
        {
          name: 'benefitLabel',
          type: 'text',
          label: L('Judul kolom manfaat', 'Benefit column heading'),
          localized: true,
          admin: { width: '50%', description: L('Mis. "Manfaat bagi UMKM"', 'E.g. "Benefit"') },
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: L('Pasangan tantangan → manfaat', 'Challenge → benefit pairs'),
      minRows: 1,
      maxRows: 8,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'challenge',
          type: 'text',
          label: L('Tantangan', 'Challenge'),
          localized: true,
          required: true,
        },
        {
          name: 'benefit',
          type: 'textarea',
          label: L('Manfaat', 'Benefit'),
          localized: true,
          required: true,
          admin: { rows: 2 },
        },
      ],
    },
  ],
}

/** Cakupan layanan: perangkat yang dipantau dan batasan paket (apa yang tidak termasuk). */
export const Coverage: Block = {
  slug: 'coverage',
  interfaceName: 'CoverageBlock',
  labels: {
    singular: L('Cakupan & batasan', 'Scope & limits'),
    plural: L('Cakupan & batasan', 'Scope & limits'),
  },
  fields: [
    blockSettings({ anchorId: 'cakupan' }),
    ...sectionIntro(),
    {
      name: 'included',
      type: 'group',
      label: L('Yang dipantau', 'What is monitored'),
      fields: [
        { name: 'title', type: 'text', label: L('Judul', 'Heading'), localized: true },
        {
          name: 'platforms',
          type: 'array',
          label: L('Sistem operasi', 'Operating systems'),
          admin: { description: L('Mis. Windows, Linux, macOS', 'E.g. Windows, Linux, macOS') },
          fields: [{ name: 'name', type: 'text', label: L('Nama', 'Name'), required: true }],
        },
        {
          name: 'items',
          type: 'array',
          label: L('Jenis perangkat', 'Device types'),
          admin: {
            initCollapsed: true,
            components: { RowLabel: '@/admin/components/IconRowLabel#IconRowLabel' },
          },
          fields: [
            {
              type: 'row',
              fields: [
                iconField,
                {
                  name: 'title',
                  type: 'text',
                  label: L('Perangkat', 'Device'),
                  localized: true,
                  required: true,
                  admin: { width: '70%' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'excluded',
      type: 'group',
      label: L('Di luar cakupan', 'Out of scope'),
      fields: [
        { name: 'title', type: 'text', label: L('Judul', 'Heading'), localized: true },
        {
          name: 'items',
          type: 'array',
          label: L('Tidak termasuk', 'Not included'),
          fields: [
            {
              name: 'text',
              type: 'text',
              label: L('Item', 'Item'),
              localized: true,
              required: true,
            },
          ],
        },
        {
          name: 'note',
          type: 'textarea',
          label: L('Catatan batasan', 'Limitation note'),
          localized: true,
          admin: { rows: 2 },
        },
      ],
    },
  ],
}

/** Jam layanan analis + target respons per prioritas alert. */
export const ServiceLevel: Block = {
  slug: 'serviceLevel',
  interfaceName: 'ServiceLevelBlock',
  labels: {
    singular: L('Jam layanan & prioritas', 'Service hours & priorities'),
    plural: L('Jam layanan & prioritas', 'Service hours & priorities'),
  },
  fields: [
    blockSettings({ anchorId: 'jam-layanan', background: 'muted' }),
    ...sectionIntro(),
    {
      name: 'hours',
      type: 'group',
      label: L('Jam layanan', 'Service hours'),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              label: L('Angka utama', 'Headline value'),
              localized: true,
              admin: { width: '25%', description: L('Mis. "8×5"', 'E.g. "8×5"') },
            },
            {
              name: 'label',
              type: 'text',
              label: L('Keterangan', 'Caption'),
              localized: true,
              admin: {
                width: '75%',
                description: L(
                  'Mis. "Monitoring analis SOC L1"',
                  'E.g. "SOC L1 analyst monitoring"',
                ),
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'days',
              type: 'text',
              label: L('Hari', 'Days'),
              localized: true,
              admin: { width: '50%', description: L('Mis. "Senin–Jumat"', 'E.g. "Monday–Friday"') },
            },
            {
              name: 'time',
              type: 'text',
              label: L('Jam', 'Time'),
              localized: true,
              admin: {
                width: '50%',
                description: L('Mis. "08.00–17.00 WIB"', 'E.g. "08:00–17:00 WIB"'),
              },
            },
          ],
        },
        {
          name: 'activeDays',
          type: 'select',
          hasMany: true,
          label: L('Hari aktif (untuk penanda minggu)', 'Active days (for the week strip)'),
          defaultValue: ['1', '2', '3', '4', '5'],
          options: [
            { label: L('Senin', 'Monday'), value: '1' },
            { label: L('Selasa', 'Tuesday'), value: '2' },
            { label: L('Rabu', 'Wednesday'), value: '3' },
            { label: L('Kamis', 'Thursday'), value: '4' },
            { label: L('Jumat', 'Friday'), value: '5' },
            { label: L('Sabtu', 'Saturday'), value: '6' },
            { label: L('Minggu', 'Sunday'), value: '7' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'priorityLabel',
          type: 'text',
          label: L('Judul kolom prioritas', 'Priority column heading'),
          localized: true,
          admin: { width: '50%' },
        },
        {
          name: 'targetLabel',
          type: 'text',
          label: L('Judul kolom target', 'Target column heading'),
          localized: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'priorities',
      type: 'array',
      label: L('Prioritas alert', 'Alert priorities'),
      maxRows: 5,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'level',
              type: 'select',
              label: L('Tingkat', 'Level'),
              defaultValue: 'medium',
              options: [
                { label: L('Critical (merah)', 'Critical (red)'), value: 'critical' },
                { label: L('High (oranye)', 'High (orange)'), value: 'high' },
                { label: L('Medium (kuning)', 'Medium (amber)'), value: 'medium' },
                { label: L('Low (biru)', 'Low (blue)'), value: 'low' },
              ],
              admin: { width: '30%' },
            },
            {
              name: 'label',
              type: 'text',
              label: L('Label', 'Label'),
              localized: true,
              required: true,
              admin: { width: '35%' },
            },
            {
              name: 'target',
              type: 'text',
              label: L('Target respons', 'Response target'),
              localized: true,
              required: true,
              admin: { width: '35%', description: L('Mis. "1 jam"', 'E.g. "1 hour"') },
            },
          ],
        },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      label: L('Catatan', 'Note'),
      localized: true,
      admin: { rows: 2 },
    },
  ],
}
