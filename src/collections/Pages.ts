import type { CollectionConfig } from 'payload'

import { canEditContent, publishedOrAuthenticated } from '@/access/roles'
import { pageBlocks } from '@/blocks'
import { revalidatePageAfterChange, revalidatePageAfterDelete } from '@/hooks/revalidate'
import { pagePath } from '@/lib/cms/paths'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Halaman', plural: 'Halaman' },
  admin: {
    useAsTitle: 'title',
    group: 'Konten',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, locale }) =>
        `${serverURL}/next/preview?path=${encodeURIComponent(pagePath(String(data?.slug ?? 'home'), locale?.code ?? 'id'))}`,
    },
    preview: (data, { locale }) =>
      `${serverURL}/next/preview?path=${encodeURIComponent(pagePath(String(data?.slug ?? 'home'), locale ?? 'id'))}`,
  },
  access: {
    read: publishedOrAuthenticated,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  versions: {
    drafts: { autosave: { interval: 1500 }, schedulePublish: true },
    maxPerDoc: 30,
  },
  hooks: {
    afterChange: [revalidatePageAfterChange],
    afterDelete: [revalidatePageAfterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Judul halaman',
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
          validate: (v: string | null | undefined) =>
            !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) ? true : 'Huruf kecil, angka, tanda hubung',
          admin: { width: '40%', description: '"home" untuk halaman utama.' },
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Section',
      blocks: pageBlocks,
      admin: { initCollapsed: true },
    },
  ],
}
