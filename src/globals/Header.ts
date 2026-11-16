import type { GlobalConfig } from 'payload'

import { canEditContent } from '@/access/roles'
import { linkFields } from '@/fields/common'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header & menu',
  admin: { group: 'Tampilan situs' },
  access: { read: () => true, update: canEditContent },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Menu',
      labels: { singular: 'Item menu', plural: 'Item menu' },
      maxRows: 7,
      fields: linkFields({ required: true }),
    },
    {
      name: 'ctas',
      type: 'array',
      label: 'Tombol di kanan atas',
      maxRows: 2,
      fields: [
        ...linkFields({ required: true }),
        {
          type: 'row',
          fields: [
            {
              name: 'style',
              type: 'select',
              label: 'Gaya',
              defaultValue: 'primary',
              options: [
                { label: 'Utama (merah)', value: 'primary' },
                { label: 'Garis', value: 'secondary' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'hidden',
              type: 'checkbox',
              label: 'Sembunyikan',
              admin: { width: '50%', style: { alignSelf: 'center' } },
            },
          ],
        },
      ],
    },
  ],
}
