import { L, msg } from '@/i18n/admin'
import type { Field, GroupField, TextFieldSingleValidation } from 'payload'

/** Validator pola teks dengan pesan dua bahasa (mengikuti bahasa admin). */
export const patternValidator =
  (pattern: RegExp, id: string, en: string): TextFieldSingleValidation =>
  (value, { req }) =>
    !value || pattern.test(value) ? true : msg(req, id, en)

export const SLUG_HINT = [
  'Huruf kecil, angka, dan tanda hubung saja',
  'Lowercase letters, numbers and hyphens only',
] as const

const HREF_PATTERN = /^(#[a-z0-9-]+|\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/i

export const validateHref = patternValidator(
  HREF_PATTERN,
  'Gunakan #anchor, /path, https://…, mailto: atau tel:',
  'Use #anchor, /path, https://…, mailto: or tel:',
)

/** Tautan sederhana: label (per bahasa) + tujuan. */
export const linkFields = (opts: { required?: boolean } = {}): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'label',
        type: 'text',
        label: L('Label', 'Label'),
        localized: true,
        required: opts.required,
        admin: { width: '50%' },
      },
      {
        name: 'href',
        type: 'text',
        label: L('Tujuan', 'Destination'),
        required: opts.required,
        validate: validateHref,
        admin: {
          width: '50%',
          description: L(
            'Contoh: #konsultasi, /kuesioner, https://contoh.co.id',
            'E.g. #konsultasi, /kuesioner, https://example.com',

          ),
        },
      },
    ],
  },
]

export const linkGroup = (
  name: string,
  label: Record<string, string>,
  opts: { required?: boolean } = {},
): GroupField => ({
  name,
  type: 'group',
  label,
  fields: linkFields(opts),
})

/**
 * Judul section standar. `eyebrow` opsional; desain hanya menampilkannya bila diisi
 * agar tidak setiap section berlabel kecil huruf kapital.
 */
export const sectionIntro = (opts: { lead?: boolean } = { lead: true }): Field[] => [
  {
    name: 'eyebrow',
    type: 'text',
    label: L('Label kecil (opsional)', 'Eyebrow (optional)'),
    localized: true,
  },
  {
    name: 'heading',
    type: 'textarea',
    label: L('Judul', 'Heading'),
    localized: true,
    required: true,
    admin: { rows: 2 },
  },
  ...(opts.lead === false
    ? []
    : ([
        {
          name: 'lead',
          type: 'textarea',
          label: L('Paragraf pengantar', 'Intro paragraph'),
          localized: true,
          admin: { rows: 3 },
        },
      ] as Field[])),
]

/** Pengaturan yang ada di setiap block: anchor, latar, sembunyikan. */
export const blockSettings = (
  defaults: { anchorId?: string; background?: string } = {},
): Field => ({
  type: 'collapsible',
  label: L('Pengaturan section', 'Section settings'),
  admin: { initCollapsed: true },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'anchorId',
          type: 'text',
          label: L('ID anchor', 'Anchor ID'),
          defaultValue: defaults.anchorId,
          validate: patternValidator(/^[a-z][a-z0-9-]*$/, ...SLUG_HINT),
          admin: {
            width: '33%',
            description: L(
              'Target tautan menu, mis. "layanan" → #layanan',
              'Menu link target, e.g. "layanan" → #layanan',
            ),
          },
        },
        {
          name: 'background',
          type: 'select',
          label: L('Latar', 'Background'),
          defaultValue: defaults.background ?? 'default',
          options: [
            { label: L('Standar', 'Default'), value: 'default' },
            { label: L('Abu lembut', 'Soft grey'), value: 'muted' },
            { label: L('Biru gelap', 'Deep blue'), value: 'ink' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'hidden',
          type: 'checkbox',
          label: L('Sembunyikan section ini', 'Hide this section'),
          defaultValue: false,
          admin: { width: '33%', style: { alignSelf: 'center' } },
        },
      ],
    },
  ],
})
