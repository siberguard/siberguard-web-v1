import { L } from '@/i18n/admin'
import type { GlobalConfig } from 'payload'

import { canEditContent } from '@/access/roles'
import { linkFields } from '@/fields/common'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  label: L('Header & menu', 'Header & menu'),
  admin: { group: L('Tampilan situs', 'Site appearance') },
  access: { read: () => true, update: canEditContent },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: L('Menu', 'Menu'),
      labels: { singular: L('Item menu', 'Menu item'), plural: L('Item menu', 'Menu items') },
      maxRows: 7,
      fields: linkFields({ required: true }),
    },
    {
      name: 'ctas',
      type: 'array',
      label: L('Tombol di kanan atas', 'Top-right buttons'),
      maxRows: 2,
      fields: [
        ...linkFields({ required: true }),
        {
          type: 'row',
          fields: [
            {
              name: 'style',
              type: 'select',
              label: L('Gaya', 'Style'),
              defaultValue: 'primary',
              options: [
                { label: L('Utama (merah)', 'Primary (red)'), value: 'primary' },
                { label: L('Garis', 'Outline'), value: 'secondary' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'hidden',
              type: 'checkbox',
              label: L('Sembunyikan', 'Hide'),
              admin: { width: '50%', style: { alignSelf: 'center' } },
            },
          ],
        },
      ],
    },
  ],
}
