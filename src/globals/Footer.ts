import { L } from '@/i18n/admin'
import type { GlobalConfig } from 'payload'

import { canEditContent } from '@/access/roles'
import { linkFields } from '@/fields/common'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: L('Footer', 'Footer'),
  admin: { group: L('Tampilan situs', 'Site appearance') },
  access: { read: () => true, update: canEditContent },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      name: 'description',
      type: 'textarea',
      label: L('Deskripsi perusahaan', 'Company description'),
      localized: true,
      admin: { rows: 2 },
    },
    {
      name: 'columns',
      type: 'array',
      label: L('Kolom tautan', 'Link columns'),
      maxRows: 3,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: L('Judul kolom', 'Column title'),
          localized: true,
          required: true,
        },
        {
          name: 'links',
          type: 'array',
          label: L('Tautan', 'Links'),
          fields: linkFields({ required: true }),
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: L('Kolom kontak', 'Contact column'),
      fields: [
        { name: 'title', type: 'text', label: L('Judul kolom', 'Column title'), localized: true },
        {
          name: 'items',
          type: 'array',
          label: L('Baris kontak', 'Contact lines'),
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  label: L('Teks', 'Text'),
                  localized: true,
                  required: true,
                  admin: { width: '60%' },
                },
                {
                  name: 'href',
                  type: 'text',
                  label: L('Tautan (opsional)', 'Link (optional)'),
                  admin: {
                    width: '40%',
                    description: L('mailto:… atau tel:…', 'mailto:… or tel:…'),
                  },
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
      label: L('Teks hak cipta', 'Copyright text'),
      localized: true,
      admin: {
        description: L(
          '{tahun} diganti otomatis dengan tahun berjalan.',
          '{tahun} is replaced with the current year.',
        ),
      },
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: L('Tautan legal', 'Legal links'),
      maxRows: 4,
      fields: linkFields({ required: true }),
    },
  ],
}
