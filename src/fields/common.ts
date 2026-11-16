import type { Field, GroupField, TextFieldSingleValidation } from 'payload'

const HREF_PATTERN = /^(#[a-z0-9-]+|\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/i

export const validateHref: TextFieldSingleValidation = (value) => {
  if (!value) return true
  return HREF_PATTERN.test(value) ? true : 'Gunakan #anchor, /path, https://…, mailto: atau tel:'
}

/** Tautan sederhana: label (per bahasa) + tujuan. */
export const linkFields = (opts: { required?: boolean } = {}): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
        required: opts.required,
        admin: { width: '50%' },
      },
      {
        name: 'href',
        type: 'text',
        label: 'Tujuan',
        required: opts.required,
        validate: validateHref,
        admin: {
          width: '50%',
          description: 'Contoh: #pendaftaran, /kuesioner, https://portal.socmerdeka.id',
        },
      },
    ],
  },
]

export const linkGroup = (
  name: string,
  label: string,
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
    label: 'Label kecil (opsional)',
    localized: true,
  },
  {
    name: 'heading',
    type: 'textarea',
    label: 'Judul',
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
          label: 'Paragraf pengantar',
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
  label: 'Pengaturan section',
  admin: { initCollapsed: true },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'anchorId',
          type: 'text',
          label: 'ID anchor',
          defaultValue: defaults.anchorId,
          validate: (value: string | null | undefined) =>
            !value || /^[a-z][a-z0-9-]*$/.test(value)
              ? true
              : 'Huruf kecil, angka, dan tanda hubung saja',
          admin: { width: '33%', description: 'Target tautan menu, mis. "layanan" → #layanan' },
        },
        {
          name: 'background',
          type: 'select',
          label: 'Latar',
          defaultValue: defaults.background ?? 'default',
          options: [
            { label: 'Standar', value: 'default' },
            { label: 'Abu lembut', value: 'muted' },
            { label: 'Navy gelap', value: 'ink' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'hidden',
          type: 'checkbox',
          label: 'Sembunyikan section ini',
          defaultValue: false,
          admin: { width: '33%', style: { alignSelf: 'center' } },
        },
      ],
    },
  ],
})
