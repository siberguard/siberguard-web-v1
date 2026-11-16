import type { GlobalConfig } from 'payload'

import { canEditContent } from '@/access/roles'
import { linkFields } from '@/fields/common'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: { group: 'Tampilan situs' },
  access: { read: () => true, update: canEditContent },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      name: 'description',
      type: 'textarea',
      label: 'Deskripsi perusahaan',
      localized: true,
      admin: { rows: 2 },
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Kolom tautan',
      maxRows: 3,
      fields: [
        { name: 'title', type: 'text', label: 'Judul kolom', localized: true, required: true },
        {
          name: 'links',
          type: 'array',
          label: 'Tautan',
          fields: linkFields({ required: true }),
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Kolom kontak',
      fields: [
        { name: 'title', type: 'text', label: 'Judul kolom', localized: true },
        {
          name: 'items',
          type: 'array',
          label: 'Baris kontak',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  label: 'Teks',
                  localized: true,
                  required: true,
                  admin: { width: '60%' },
                },
                {
                  name: 'href',
                  type: 'text',
                  label: 'Tautan (opsional)',
                  admin: { width: '40%', description: 'mailto:… atau tel:…' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: 'Teks hak cipta',
      localized: true,
      admin: { description: '{tahun} diganti otomatis dengan tahun berjalan.' },
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Tautan legal',
      maxRows: 4,
      fields: linkFields({ required: true }),
    },
  ],
}
