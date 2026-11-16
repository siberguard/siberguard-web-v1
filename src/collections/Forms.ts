import { APIError, type Block, type CollectionConfig, type Field } from 'payload'

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
        label: 'Kode field',
        required: true,
        validate: (v: string | null | undefined) =>
          !v || NAME_PATTERN.test(v) ? true : 'Huruf kecil, angka, garis bawah; diawali huruf',
        admin: {
          width: '40%',
          description: 'Kunci data (mis. jumlah_karyawan). Jangan diubah setelah ada data masuk.',
        },
      },
      {
        name: 'width',
        type: 'select',
        label: 'Lebar',
        defaultValue: 'full',
        options: [
          { label: 'Penuh', value: 'full' },
          { label: 'Setengah', value: 'half' },
        ],
        admin: { width: '30%' },
      },
      {
        name: 'required',
        type: 'checkbox',
        label: 'Wajib diisi',
        admin: { width: '30%', style: { alignSelf: 'center' } },
      },
    ],
  },
  {
    name: 'label',
    type: 'textarea',
    label: 'Pertanyaan / label',
    localized: true,
    required: true,
    admin: { rows: 2 },
  },
  { name: 'helpText', type: 'text', label: 'Teks bantuan', localized: true },
  {
    type: 'collapsible',
    label: 'Tampilkan hanya jika…',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'showWhen',
        type: 'group',
        label: false,
        admin: {
          description:
            'Kosongkan bila pertanyaan selalu tampil. Contoh: field "minat_poc", operator "sama dengan salah satu", nilai "ya".',
        },
        fields: [
          {
            type: 'row',
            fields: [
              { name: 'field', type: 'text', label: 'Kode field acuan', admin: { width: '35%' } },
              {
                name: 'operator',
                type: 'select',
                label: 'Kondisi',
                defaultValue: 'in',
                options: [
                  { label: 'sama dengan salah satu', value: 'in' },
                  { label: 'tidak sama dengan', value: 'notIn' },
                  { label: 'dicentang', value: 'checked' },
                  { label: 'tidak dicentang', value: 'unchecked' },
                ],
                admin: { width: '30%' },
              },
              {
                name: 'values',
                type: 'text',
                label: 'Nilai',
                admin: { width: '35%', description: 'Pisahkan dengan koma' },
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
  label: 'Placeholder',
  localized: true,
}

const optionsField: Field = {
  name: 'options',
  type: 'array',
  label: 'Pilihan jawaban',
  minRows: 1,
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
          admin: { width: '50%' },
        },
        {
          name: 'value',
          type: 'text',
          label: 'Nilai',
          required: true,
          validate: (v: string | null | undefined) =>
            !v || /^[a-z0-9][a-z0-9_-]*$/.test(v) ? true : 'Huruf kecil, angka, - atau _',
          admin: { width: '30%' },
        },
        {
          name: 'score',
          type: 'number',
          label: 'Skor lead',
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
  label: string,
  extra: Field[] = [],
): Block => ({
  slug,
  interfaceName,
  labels: { singular: label, plural: label },
  fields: [...baseFields, ...extra],
})

export const formFieldBlocks: Block[] = [
  fieldBlock('textInput', 'FormTextInput', 'Teks singkat', [placeholderField]),
  fieldBlock('textareaInput', 'FormTextareaInput', 'Teks panjang', [placeholderField]),
  fieldBlock('emailInput', 'FormEmailInput', 'Email', [placeholderField]),
  fieldBlock('phoneInput', 'FormPhoneInput', 'Nomor WhatsApp/telepon', [placeholderField]),
  fieldBlock('singleChoice', 'FormSingleChoice', 'Pilihan tunggal', [optionsField]),
  fieldBlock('multiChoice', 'FormMultiChoice', 'Pilihan ganda', [
    {
      type: 'row',
      fields: [
        {
          name: 'maxSelections',
          type: 'number',
          label: 'Maksimal pilihan',
          min: 1,
          admin: { width: '30%' },
        },
        {
          name: 'allowOther',
          type: 'checkbox',
          label: 'Ada isian "Lainnya"',
          admin: { width: '30%', style: { alignSelf: 'center' } },
        },
        {
          name: 'otherLabel',
          type: 'text',
          label: 'Label "Lainnya"',
          localized: true,
          admin: { width: '40%' },
        },
      ],
    },
    optionsField,
  ]),
  fieldBlock('selectInput', 'FormSelectInput', 'Dropdown', [placeholderField, optionsField]),
  fieldBlock('consent', 'FormConsent', 'Persetujuan (checkbox)'),
]

type FieldLike = {
  name?: string
  blockType?: string
  options?: { value?: string }[]
  showWhen?: { field?: string | null }
}
type SectionLike = { key?: string; fields?: FieldLike[] }

/** Validasi struktur form: kode field unik, acuan kondisi valid, nilai opsi unik. */
function validateFormStructure(sections: SectionLike[] = []) {
  const seen = new Set<string>()
  const errors: string[] = []
  for (const section of sections) {
    for (const field of section.fields ?? []) {
      if (!field.name) continue
      if (seen.has(field.name)) errors.push(`Kode field "${field.name}" dipakai lebih dari sekali.`)
      const ref = field.showWhen?.field
      if (ref && !seen.has(ref)) {
        errors.push(
          `Kondisi pada "${field.name}" mengacu ke "${ref}" yang tidak ada (atau berada setelahnya).`,
        )
      }
      seen.add(field.name)
      const values = (field.options ?? []).map((o) => o.value).filter(Boolean)
      if (new Set(values).size !== values.length)
        errors.push(`Nilai pilihan pada "${field.name}" tidak unik.`)
    }
  }
  if (errors.length) throw new APIError(errors.join(' '), 400, null, true)
}

export const Forms: CollectionConfig = {
  slug: 'forms',
  labels: { singular: 'Formulir', plural: 'Formulir' },
  admin: {
    useAsTitle: 'title',
    group: 'Konten',
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
      ({ data }) => {
        if (data?.sections) validateFormStructure(data.sections as SectionLike[])
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
          label: 'Isi formulir',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Judul',
                  localized: true,
                  required: true,
                  admin: { width: '60%' },
                },
                {
                  name: 'slug',
                  type: 'text',
                  label: 'Slug',
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
              label: 'Pengantar',
              localized: true,
              admin: { rows: 2 },
            },
            {
              name: 'estimatedTime',
              type: 'text',
              label: 'Estimasi waktu pengisian',
              localized: true,
            },
            {
              name: 'sections',
              type: 'array',
              label: 'Langkah / bagian',
              labels: { singular: 'Bagian', plural: 'Bagian' },
              minRows: 1,
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'key',
                      type: 'text',
                      label: 'Kode',
                      required: true,
                      admin: { width: '20%' },
                    },
                    {
                      name: 'title',
                      type: 'text',
                      label: 'Judul bagian',
                      localized: true,
                      required: true,
                      admin: { width: '80%' },
                    },
                  ],
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Keterangan',
                  localized: true,
                  admin: { rows: 2 },
                },
                {
                  name: 'fields',
                  type: 'blocks',
                  label: 'Pertanyaan',
                  blocks: formFieldBlocks,
                  minRows: 1,
                },
              ],
            },
          ],
        },
        {
          label: 'Setelah dikirim',
          fields: [
            { name: 'submitLabel', type: 'text', label: 'Label tombol kirim', localized: true },
            { name: 'successTitle', type: 'text', label: 'Judul pesan sukses', localized: true },
            { name: 'successMessage', type: 'textarea', label: 'Pesan sukses', localized: true },
            {
              name: 'privacyNote',
              type: 'textarea',
              label: 'Catatan privasi',
              localized: true,
              admin: { rows: 3 },
            },
          ],
        },
        {
          label: 'Notifikasi & skor',
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
                  label: 'Kirim notifikasi lead baru ke',
                  fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'autoReply',
                      type: 'checkbox',
                      label: 'Kirim email balasan otomatis ke responden',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'contactConsentField',
                      type: 'text',
                      label: 'Kode field persetujuan kontak',
                      defaultValue: 'bersedia_dihubungi',
                      admin: {
                        width: '50%',
                        description: 'Lead tanpa persetujuan masuk tier "Survei".',
                      },
                    },
                  ],
                },
                {
                  name: 'autoReplySubject',
                  type: 'text',
                  label: 'Subjek balasan otomatis',
                  localized: true,
                },
                {
                  name: 'autoReplyBody',
                  type: 'textarea',
                  label: 'Isi balasan otomatis',
                  localized: true,
                  admin: { description: 'Gunakan {nama} untuk nama PIC.' },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'hotMin',
                      type: 'number',
                      label: 'Skor minimal Hot',
                      defaultValue: 17,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'warmMin',
                      type: 'number',
                      label: 'Skor minimal Warm',
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
      label: 'Versi',
      defaultValue: 1,
      admin: { readOnly: true, position: 'sidebar', description: 'Naik otomatis setiap disimpan.' },
    },
  ],
}
