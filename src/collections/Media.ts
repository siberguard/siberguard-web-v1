import { L } from '@/i18n/admin'
import path from 'path'
import type { CollectionConfig } from 'payload'

import { canEditContent } from '@/access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: L('Media', 'Media'), plural: L('Media', 'Media') },
  admin: { group: L('Konten', 'Content') },
  access: {
    read: () => true,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  hooks: {
    beforeOperation: [
      async ({ req, operation }) => {
        const file = req.file
        if (
          (operation === 'create' || operation === 'update') &&
          file?.mimetype === 'image/svg+xml'
        ) {
          const { sanitizeSvg } = await import('@/lib/security/sanitizeSvg')
          const clean = sanitizeSvg(file.data.toString('utf8'))
          file.data = Buffer.from(clean, 'utf8')
          file.size = file.data.length
        }
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: L('Teks alternatif', 'Alt text'),
      localized: true,
      required: true,
      admin: {
        description: L(
          'Deskripsi singkat gambar untuk pembaca layar dan SEO.',
          'Short image description for screen readers and SEO.',
        ),
      },
    },
  ],
  upload: {
    staticDir: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'],
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'wide', width: 1920, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumbnail',
  },
}
