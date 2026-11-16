import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, linkGroup } from '@/fields/common'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: L('Hero', 'Hero'), plural: L('Hero', 'Heroes') },
  fields: [
    blockSettings({ anchorId: 'hero', background: 'ink' }),
    {
      name: 'statusText',
      type: 'text',
      label: L('Label status', 'Status label'),
      localized: true,
      admin: {
        description: L(
          'Contoh: "Segera hadir · Program piloting dibuka". Kosongkan untuk menyembunyikan.',
          'E.g. "Coming soon · Pilot programme open". Leave empty to hide.',
        ),
      },
    },
    {
      name: 'heading',
      type: 'textarea',
      label: L('Judul utama', 'Main heading'),
      localized: true,
      required: true,
      admin: { rows: 2 },
    },
    {
      name: 'highlight',
      type: 'text',
      label: L('Kata yang ditonjolkan', 'Highlighted words'),
      localized: true,
      admin: {
        description: L(
          'Harus persis sama dengan bagian dari judul, mis. "berdaulat". Ditampilkan berwarna merah.',
          'Must match part of the heading exactly, e.g. "Sovereign". Shown in red.',
        ),
      },
    },
    {
      name: 'lead',
      type: 'textarea',
      label: L('Paragraf pengantar', 'Intro paragraph'),
      localized: true,
      admin: { rows: 3 },
    },
    {
      type: 'row',
      fields: [
        {
          ...linkGroup('primaryCta', L('Tombol utama', 'Primary button')),
          admin: { width: '50%' },
        },
        {
          ...linkGroup('secondaryCta', L('Tombol kedua', 'Secondary button')),
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'console',
      type: 'group',
      label: L('Konsol contoh antrean alert', 'Sample alert queue console'),
      admin: {
        description: L(
          'Panel ilustrasi di sisi kanan hero. Selalu diberi label simulasi agar tidak disangka data nyata.',
          'Illustration panel on the right of the hero. Always labelled as simulated so it is not mistaken for real data.',
        ),
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: L('Tampilkan konsol', 'Show console'),
              defaultValue: true,
              admin: { width: '25%' },
            },
            {
              name: 'title',
              type: 'text',
              label: L('Judul konsol', 'Console title'),
              localized: true,
              admin: { width: '40%' },
            },
            {
              name: 'badge',
              type: 'text',
              label: L('Label status konsol', 'Console status label'),
              localized: true,
              admin: { width: '35%' },
            },
          ],
        },
        {
          name: 'events',
          type: 'array',
          label: L('Event alert', 'Alert events'),
          labels: { singular: L('Event', 'Event'), plural: L('Event', 'Events') },
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'severity',
                  type: 'select',
                  label: L('Tingkat', 'Severity'),
                  required: true,
                  defaultValue: 'medium',
                  options: [
                    { label: L('HIGH', 'HIGH'), value: 'high' },
                    { label: L('MED', 'MED'), value: 'medium' },
                    { label: L('LOW', 'LOW'), value: 'low' },
                  ],
                  admin: { width: '20%' },
                },
                {
                  name: 'title',
                  type: 'text',
                  label: L('Deskripsi', 'Description'),
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
                  label: L('Teknik ATT&CK', 'ATT&CK technique'),
                  admin: { width: '50%', description: L('Mis. T1110', 'E.g. T1110') },
                },
                {
                  name: 'host',
                  type: 'text',
                  label: L('Host', 'Host'),
                  admin: { width: '50%', description: L('Mis. srv-web-01', 'E.g. srv-web-01') },
                },
              ],
            },
          ],
        },
        {
          name: 'metrics',
          type: 'array',
          label: L('Metrik bawah konsol', 'Console metrics'),
          maxRows: 3,
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
                  admin: { width: '40%' },
                },
                {
                  name: 'value',
                  type: 'text',
                  label: L('Nilai awal', 'Initial value'),
                  localized: true,
                  required: true,
                  admin: { width: '30%' },
                },
                {
                  name: 'animate',
                  type: 'select',
                  label: L('Animasi', 'Animation'),
                  defaultValue: 'none',
                  options: [
                    { label: L('Statis', 'Static'), value: 'none' },
                    { label: L('Berfluktuasi (±10%)', 'Fluctuating (±10%)'), value: 'fluctuate' },
                    { label: L('Bertambah perlahan', 'Slowly increasing'), value: 'increment' },
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
      label: L('Statistik', 'Stats'),
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              label: L('Angka', 'Value'),
              localized: true,
              required: true,
              admin: { width: '35%' },
            },
            {
              name: 'label',
              type: 'text',
              label: L('Keterangan', 'Caption'),
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
