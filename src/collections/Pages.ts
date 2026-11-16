import { L } from '@/i18n/admin'
import { patternValidator, SLUG_HINT } from '@/fields/common'
import type { CollectionConfig } from 'payload'

import { canEditContent, publishedOrAuthenticated } from '@/access/roles'
import { pageBlocks } from '@/blocks'
import { revalidatePageAfterChange, revalidatePageAfterDelete } from '@/hooks/revalidate'
import { pagePath } from '@/lib/cms/paths'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: L('Halaman', 'Page'), plural: L('Halaman', 'Pages') },
  admin: {
    useAsTitle: 'title',
    group: L('Konten', 'Content'),
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
          label: L('Judul halaman', 'Page title'),
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
          validate: patternValidator(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ...SLUG_HINT),
          admin: {
            width: '40%',
            description: L('"home" untuk halaman utama.', '"home" for the homepage.'),
          },
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: L('Section', 'Sections'),
      blocks: pageBlocks,
      admin: { initCollapsed: true },
    },
  ],
}
