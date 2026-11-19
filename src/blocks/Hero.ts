import { L } from '@/i18n/admin'
import type { Block } from 'payload'

import { blockSettings, linkGroup } from '@/fields/common'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: L('Hero', 'Hero'), plural: L('Hero', 'Heroes') },
  fields: [
    blockSettings({ anchorId: 'hero', background: 'default' }),
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
          'Harus persis sama dengan bagian dari judul, mis. "SiberGuard". Ditampilkan berwarna biru.',
          'Must match part of the heading exactly, e.g. "SiberGuard". Shown in blue.',
        ),
      },
    },
    {
      name: 'tagline',
      type: 'text',
      label: L('Tagline (opsional)', 'Tagline (optional)'),
      localized: true,
      admin: {
        description: L(
          'Tampil di bawah judul dengan aksen merah, mis. "Amankan Usaha, Majukan Nusantara."',
          'Shown under the heading with a red accent, e.g. "Amankan Usaha, Majukan Nusantara."',
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
      name: 'carousel',
      type: 'group',
      label: L('Carousel banner', 'Banner carousel'),
      admin: {
        description: L(
          'Banner bergilir di sisi kanan hero. Tiap slide boleh memakai gambar sendiri; bila gambar kosong, ilustrasi bawaan yang dipilih akan dipakai.',
          'Rotating banners on the right of the hero. Each slide may use its own image; without one, the chosen built-in illustration is shown.',
        ),
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: L('Tampilkan carousel', 'Show carousel'),
              defaultValue: true,
              admin: { width: '33%' },
            },
            {
              name: 'autoplay',
              type: 'checkbox',
              label: L('Berganti otomatis', 'Autoplay'),
              defaultValue: true,
              admin: { width: '33%' },
            },
            {
              name: 'interval',
              type: 'number',
              label: L('Durasi per slide (detik)', 'Seconds per slide'),
              defaultValue: 6,
              min: 3,
              max: 20,
              admin: { width: '33%', condition: (_, sibling) => sibling?.autoplay !== false },
            },
          ],
        },
        {
          name: 'slides',
          type: 'array',
          label: L('Slide', 'Slides'),
          labels: { singular: L('Slide', 'Slide'), plural: L('Slide', 'Slides') },
          maxRows: 6,
          admin: {
            initCollapsed: true,
            components: { RowLabel: '@/admin/components/BlockRowLabel#BlockRowLabel' },
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: L('Gambar banner (opsional)', 'Banner image (optional)'),
                  admin: {
                    width: '50%',
                    description: L(
                      'Rasio 16:10 (mis. 1600×1000 px), maks. ±4 MB. Bagian penting di tengah: tepi bisa terpotong di layar kecil.',
                      '16:10 ratio (e.g. 1600×1000 px), max ±4 MB. Keep key content centred: edges may be cropped on small screens.',
                    ),
                  },
                },
                {
                  name: 'visual',
                  type: 'select',
                  label: L('Ilustrasi bawaan', 'Built-in illustration'),
                  defaultValue: 'monitoring',
                  options: [
                    {
                      label: L('Pemantauan endpoint (radar)', 'Endpoint monitoring (radar)'),
                      value: 'monitoring',
                    },
                    {
                      label: L('Data di Indonesia (pusat data)', 'Data in Indonesia (data centre)'),
                      value: 'sovereignty',
                    },
                    {
                      label: L(
                        'Agen ringan (perangkat terhubung)',
                        'Lightweight agent (connected devices)',
                      ),
                      value: 'agent',
                    },
                    {
                      label: L(
                        'Respons insiden (alur tindakan)',
                        'Incident response (action flow)',
                      ),
                      value: 'response',
                    },
                    {
                      label: L('Laporan bulanan (dokumen)', 'Monthly report (document)'),
                      value: 'report',
                    },
                  ],
                  admin: {
                    width: '50%',
                    description: L('Dipakai bila gambar kosong.', 'Used when no image is set.'),
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'tag',
                  type: 'text',
                  label: L('Label kecil', 'Tag'),
                  localized: true,
                  admin: {
                    width: '35%',
                    description: L('Mis. "Laporan bulanan"', 'E.g. "Monthly report"'),
                  },
                },
                {
                  name: 'title',
                  type: 'text',
                  label: L('Judul slide', 'Slide title'),
                  localized: true,
                  admin: { width: '65%' },
                },
              ],
            },
            {
              name: 'text',
              type: 'textarea',
              label: L('Keterangan singkat', 'Short description'),
              localized: true,
              admin: { rows: 2 },
            },
            linkGroup('link', L('Tautan (opsional)', 'Link (optional)')),
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
