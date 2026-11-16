import type { Block } from 'payload'

import { blockSettings, linkGroup } from '@/fields/common'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Hero' },
  fields: [
    blockSettings({ anchorId: 'hero', background: 'ink' }),
    {
      name: 'statusText',
      type: 'text',
      label: 'Label status',
      localized: true,
      admin: {
        description:
          'Contoh: "Segera hadir · Program piloting dibuka". Kosongkan untuk menyembunyikan.',
      },
    },
    {
      name: 'heading',
      type: 'textarea',
      label: 'Judul utama',
      localized: true,
      required: true,
      admin: { rows: 2 },
    },
    {
      name: 'highlight',
      type: 'text',
      label: 'Kata yang ditonjolkan',
      localized: true,
      admin: {
        description:
          'Harus persis sama dengan bagian dari judul, mis. "berdaulat". Ditampilkan berwarna merah.',
      },
    },
    {
      name: 'lead',
      type: 'textarea',
      label: 'Paragraf pengantar',
      localized: true,
      admin: { rows: 3 },
    },
    {
      type: 'row',
      fields: [
        { ...linkGroup('primaryCta', 'Tombol utama'), admin: { width: '50%' } },
        { ...linkGroup('secondaryCta', 'Tombol kedua'), admin: { width: '50%' } },
      ],
    },
    {
      name: 'console',
      type: 'group',
      label: 'Konsol contoh antrean alert',
      admin: {
        description:
          'Panel ilustrasi di sisi kanan hero. Selalu diberi label simulasi agar tidak disangka data nyata.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Tampilkan konsol',
              defaultValue: true,
              admin: { width: '25%' },
            },
            {
              name: 'title',
              type: 'text',
              label: 'Judul konsol',
              localized: true,
              admin: { width: '40%' },
            },
            {
              name: 'badge',
              type: 'text',
              label: 'Label status konsol',
              localized: true,
              admin: { width: '35%' },
            },
          ],
        },
        {
          name: 'events',
          type: 'array',
          label: 'Event alert',
          labels: { singular: 'Event', plural: 'Event' },
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'severity',
                  type: 'select',
                  label: 'Tingkat',
                  required: true,
                  defaultValue: 'medium',
                  options: [
                    { label: 'HIGH', value: 'high' },
                    { label: 'MED', value: 'medium' },
                    { label: 'LOW', value: 'low' },
                  ],
                  admin: { width: '20%' },
                },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Deskripsi',
                  localized: true,
                  required: true,
                  admin: { width: '80%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'technique',
                  type: 'text',
                  label: 'Teknik ATT&CK',
                  admin: { width: '50%', description: 'Mis. T1110' },
                },
                {
                  name: 'host',
                  type: 'text',
                  label: 'Host',
                  admin: { width: '50%', description: 'Mis. srv-web-01' },
                },
              ],
            },
          ],
        },
        {
          name: 'metrics',
          type: 'array',
          label: 'Metrik bawah konsol',
          maxRows: 3,
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
                  admin: { width: '40%' },
                },
                {
                  name: 'value',
                  type: 'text',
                  label: 'Nilai awal',
                  localized: true,
                  required: true,
                  admin: { width: '30%' },
                },
                {
                  name: 'animate',
                  type: 'select',
                  label: 'Animasi',
                  defaultValue: 'none',
                  options: [
                    { label: 'Statis', value: 'none' },
                    { label: 'Berfluktuasi (±10%)', value: 'fluctuate' },
                    { label: 'Bertambah perlahan', value: 'increment' },
                  ],
                  admin: { width: '30%' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Statistik',
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              label: 'Angka',
              localized: true,
              required: true,
              admin: { width: '35%' },
            },
            {
              name: 'label',
              type: 'text',
              label: 'Keterangan',
              localized: true,
              required: true,
              admin: { width: '65%' },
            },
          ],
        },
      ],
    },
  ],
}
