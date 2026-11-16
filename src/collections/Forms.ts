import { L, msg } from '@/i18n/admin'
import { withRowLabel } from '@/blocks'
import { patternValidator } from '@/fields/common'
import {
  APIError,
  type Block,
  type CollectionConfig,
  type Field,
  type PayloadRequest,
} from 'payload'

import { authenticated, canEditContent, fieldAuthenticated } from '@/access/roles'
import { submitFormEndpoint } from '@/endpoints/submitForm'
import { revalidateFormAfterChange } from '@/hooks/revalidate'

const NAME_PATTERN = /^[a-z][a-z0-9_]*$/

/** Field yang ada di setiap jenis pertanyaan. */
const baseFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'name',
        type: 'text',
        label: L('Kode field', 'Field code'),
        required: true,
        validate: patternValidator(
          NAME_PATTERN,
          'Huruf kecil, angka, garis bawah; diawali huruf',
          'Lowercase letters, numbers, underscores; must start with a letter',
        ),
        admin: {
          width: '40%',
          description: L(
            'Kunci data (mis. jumlah_karyawan). Jangan diubah setelah ada data masuk.',
            'Data key (e.g. jumlah_karyawan). Do not change once submissions exist.',
          ),
        },
      },
      {
        name: 'width',
        type: 'select',
        label: L('Lebar', 'Width'),
        defaultValue: 'full',
        options: [
          { label: L('Penuh', 'Full'), value: 'full' },
          { label: L('Setengah', 'Half'), value: 'half' },
        ],
        admin: { width: '30%' },
      },
      {
        name: 'required',
        type: 'checkbox',
        label: L('Wajib diisi', 'Required'),
        admin: { width: '30%', style: { alignSelf: 'center' } },
      },
    ],
  },
  {
    name: 'label',
    type: 'textarea',
    label: L('Pertanyaan / label', 'Question / label'),
    localized: true,
    required: true,
    admin: { rows: 2 },
  },
  { name: 'helpText', type: 'text', label: L('Teks bantuan', 'Help text'), localized: true },
  {
    type: 'collapsible',
    label: L('Tampilkan hanya jika…', 'Show only if…'),
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'showWhen',
        type: 'group',
        label: false,
        admin: {
          description: L(
            'Kosongkan bila pertanyaan selalu tampil. Contoh: field "minat_poc", operator "sama dengan salah satu", nilai "ya".',
            'Leave empty to always show. Example: field "minat_poc", condition "is one of", value "ya".',
          ),
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'field',
                type: 'text',
                label: L('Kode field acuan', 'Reference field code'),
                admin: { width: '35%' },
              },
              {
                name: 'operator',
                type: 'select',
                label: L('Kondisi', 'Condition'),
                defaultValue: 'in',
                options: [
                  { label: L('sama dengan salah satu', 'is one of'), value: 'in' },
                  { label: L('tidak sama dengan', 'is not'), value: 'notIn' },
                  { label: L('dicentang', 'is checked'), value: 'checked' },
                  { label: L('tidak dicentang', 'is not checked'), value: 'unchecked' },
                ],
                admin: { width: '30%' },
              },
              {
                name: 'values',
                type: 'text',
                label: L('Nilai', 'Value'),
                admin: {
                  width: '35%',
                  description: L('Pisahkan dengan koma', 'Separate with commas'),
                },
              },
            ],
          },
        ],
      },
    ],
  },
]

const placeholderField: Field = {
  name: 'placeholder',
  type: 'text',
  label: L('Placeholder', 'Placeholder'),
  localized: true,
}

const optionsField: Field = {
  name: 'options',
  type: 'array',
  label: L('Pilihan jawaban', 'Answer options'),
  minRows: 1,
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
          admin: { width: '50%' },
        },
        {
          name: 'value',
          type: 'text',
          label: L('Nilai', 'Value'),
          required: true,
          validate: patternValidator(
            /^[a-z0-9][a-z0-9_-]*$/,
            'Huruf kecil, angka, - atau _',
            'Lowercase letters, numbers, - or _',
          ),
          admin: { width: '30%' },
        },
        {
          name: 'score',
          type: 'number',
          label: L('Skor lead', 'Lead score'),
          defaultValue: 0,
          access: { read: fieldAuthenticated },
          admin: { width: '20%' },
        },
      ],
    },
  ],
}

const fieldBlock = (
  slug: string,
  interfaceName: string,
  label: [string, string, string],
  extra: Field[] = [],
): Block => ({
  slug,
  interfaceName,
  labels: { singular: L(label[0], label[1]), plural: L(label[0], label[2]) },
  fields: [...baseFields, ...extra],
})

const rawFieldBlocks: Block[] = [
  fieldBlock(
    'textInput',
    'FormTextInput',
    ['Teks singkat', 'Short text', 'Short text'],
    [placeholderField],
  ),
  fieldBlock(
    'textareaInput',
    'FormTextareaInput',
    ['Teks panjang', 'Long text', 'Long text'],
    [placeholderField],
  ),
  fieldBlock('emailInput', 'FormEmailInput', ['Email', 'Email', 'Email'], [placeholderField]),
  fieldBlock(
    'phoneInput',
    'FormPhoneInput',
    ['Nomor WhatsApp/telepon', 'WhatsApp/phone number', 'WhatsApp/phone numbers'],
    [placeholderField],
  ),
  fieldBlock(
    'singleChoice',
    'FormSingleChoice',
    ['Pilihan tunggal', 'Single choice', 'Single choice'],
    [optionsField],
  ),
  fieldBlock(
    'multiChoice',
    'FormMultiChoice',
    ['Pilihan ganda', 'Multiple choice', 'Multiple choice'],
    [
      {
        type: 'row',
        fields: [
          {
            name: 'maxSelections',
            type: 'number',
            label: L('Maksimal pilihan', 'Maximum selections'),
            min: 1,
            admin: { width: '30%' },
          },
          {
            name: 'allowOther',
            type: 'checkbox',
            label: L('Ada isian "Lainnya"', 'Has an "Other" field'),
            admin: { width: '30%', style: { alignSelf: 'center' } },
          },
          {
            name: 'otherLabel',
            type: 'text',
            label: L('Label "Lainnya"', '"Other" label'),
            localized: true,
            admin: { width: '40%' },
          },
        ],
      },
      optionsField,
    ],
  ),
  fieldBlock(
    'selectInput',
    'FormSelectInput',
    ['Dropdown', 'Dropdown', 'Dropdowns'],
    [placeholderField, optionsField],
  ),
  fieldBlock('consent', 'FormConsent', [
    'Persetujuan (checkbox)',
    'Consent (checkbox)',
    'Consent (checkbox)',
  ]),
]

export const formFieldBlocks: Block[] = rawFieldBlocks.map(withRowLabel)

type FieldLike = {
  name?: string
  blockType?: string
  options?: { value?: string }[]
  showWhen?: { field?: string | null }
}
type SectionLike = { key?: string; fields?: FieldLike[] }

/** Validasi struktur form: kode field unik, acuan kondisi valid, nilai opsi unik. */
function validateFormStructure(sections: SectionLike[] = [], req?: PayloadRequest) {
  const seen = new Set<string>()
  const errors: string[] = []
  for (const section of sections) {
    for (const field of section.fields ?? []) {
      if (!field.name) continue
      if (seen.has(field.name))
        errors.push(
          msg(
            req,
            `Kode field "${field.name}" dipakai lebih dari sekali.`,
            `Field code "${field.name}" is used more than once.`,
          ),
        )
      const ref = field.showWhen?.field
      if (ref && !seen.has(ref)) {
        errors.push(
          msg(
            req,
            `Kondisi pada "${field.name}" mengacu ke "${ref}" yang tidak ada (atau berada setelahnya).`,
            `The condition on "${field.name}" refers to "${ref}", which does not exist (or comes after it).`,
          ),
        )
      }
      seen.add(field.name)
      const values = (field.options ?? []).map((o) => o.value).filter(Boolean)
      if (new Set(values).size !== values.length)
        errors.push(
          msg(
            req,
            `Nilai pilihan pada "${field.name}" tidak unik.`,
            `Option values in "${field.name}" are not unique.`,
          ),
        )
    }
  }
  if (errors.length) throw new APIError(errors.join(' '), 400, null, true)
}

export const Forms: CollectionConfig = {
  slug: 'forms',
  labels: { singular: L('Formulir', 'Form'), plural: L('Formulir', 'Forms') },
  admin: {
    useAsTitle: 'title',
    group: L('Konten', 'Content'),
    defaultColumns: ['title', 'slug', 'version', 'updatedAt'],
  },
  access: {
    // Frontend membaca form via Local API; REST publik tidak perlu melihat skor/email notifikasi.
    read: authenticated,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  endpoints: [submitFormEndpoint],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (data?.sections) validateFormStructure(data.sections as SectionLike[], req)
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        data.version = ((originalDoc?.version as number | undefined) ?? 0) + 1
        return data
      },
    ],
    afterChange: [revalidateFormAfterChange],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: L('Isi formulir', 'Form content'),
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: L('Judul', 'Heading'),
                  localized: true,
                  required: true,
                  admin: { width: '60%' },
                },
                {
                  name: 'slug',
                  type: 'text',
                  label: L('Slug', 'Slug'),
                  required: true,
                  unique: true,
                  index: true,
                  admin: { width: '40%' },
                },
              ],
            },
            {
              name: 'intro',
              type: 'textarea',
              label: L('Pengantar', 'Intro'),
              localized: true,
              admin: { rows: 2 },
            },
            {
              name: 'estimatedTime',
              type: 'text',
              label: L('Estimasi waktu pengisian', 'Estimated completion time'),
              localized: true,
            },
            {
              name: 'sections',
              type: 'array',
              label: L('Langkah / bagian', 'Steps / sections'),
              labels: { singular: L('Bagian', 'Section'), plural: L('Bagian', 'Sections') },
              minRows: 1,
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'key',
                      type: 'text',
                      label: L('Kode', 'Code'),
                      required: true,
                      admin: { width: '20%' },
                    },
                    {
                      name: 'title',
                      type: 'text',
                      label: L('Judul bagian', 'Section title'),
                      localized: true,
                      required: true,
                      admin: { width: '80%' },
                    },
                  ],
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: L('Keterangan', 'Caption'),
                  localized: true,
                  admin: { rows: 2 },
                },
                {
                  name: 'fields',
                  type: 'blocks',
                  label: L('Pertanyaan', 'Questions'),
                  blocks: formFieldBlocks,
                  minRows: 1,
                },
              ],
            },
          ],
        },
        {
          label: L('Setelah dikirim', 'After submission'),
          fields: [
            {
              name: 'submitLabel',
              type: 'text',
              label: L('Label tombol kirim', 'Submit button label'),
              localized: true,
            },
            {
              name: 'successTitle',
              type: 'text',
              label: L('Judul pesan sukses', 'Success title'),
              localized: true,
            },
            {
              name: 'successMessage',
              type: 'textarea',
              label: L('Pesan sukses', 'Success message'),
              localized: true,
            },
            {
              name: 'privacyNote',
              type: 'textarea',
              label: L('Catatan privasi', 'Privacy note'),
              localized: true,
              admin: { rows: 3 },
            },
          ],
        },
        {
          label: L('Notifikasi & skor', 'Notifications & scoring'),
          fields: [
            {
              name: 'settings',
              type: 'group',
              label: false,
              access: { read: fieldAuthenticated },
              fields: [
                {
                  name: 'notifyEmails',
                  type: 'array',
                  label: L('Kirim notifikasi lead baru ke', 'Send new-lead notifications to'),
                  fields: [
                    { name: 'email', type: 'email', label: L('Email', 'Email'), required: true },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'autoReply',
                      type: 'checkbox',
                      label: L(
                        'Kirim email balasan otomatis ke responden',
                        'Send an auto-reply email to respondents',
                      ),
                      admin: { width: '50%' },
                    },
                    {
                      name: 'contactConsentField',
                      type: 'text',
                      label: L('Kode field persetujuan kontak', 'Contact consent field code'),
                      defaultValue: 'bersedia_dihubungi',
                      admin: {
                        width: '50%',
                        description: L(
                          'Lead tanpa persetujuan masuk tier "Survei".',
                          'Leads without consent get the "Survey" tier.',
                        ),
                      },
                    },
                  ],
                },
                {
                  name: 'autoReplySubject',
                  type: 'text',
                  label: L('Subjek balasan otomatis', 'Auto-reply subject'),
                  localized: true,
                },
                {
                  name: 'autoReplyBody',
                  type: 'textarea',
                  label: L('Isi balasan otomatis', 'Auto-reply body'),
                  localized: true,
                  admin: {
                    description: L(
                      'Gunakan {nama} untuk nama PIC.',
                      'Use {nama} for the contact name.',
                    ),
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'hotMin',
                      type: 'number',
                      label: L('Skor minimal Hot', 'Minimum Hot score'),
                      defaultValue: 17,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'warmMin',
                      type: 'number',
                      label: L('Skor minimal Warm', 'Minimum Warm score'),
                      defaultValue: 10,
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'version',
      type: 'number',
      label: L('Versi', 'Version'),
      defaultValue: 1,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: L('Naik otomatis setiap disimpan.', 'Increments automatically on every save.'),
      },
    },
  ],
}
