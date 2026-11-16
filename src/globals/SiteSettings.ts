import type { GlobalConfig } from 'payload'

import { canEditContent, fieldAdmin, fieldAuthenticated } from '@/access/roles'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'
import { clearAnalyticsSettingsCache } from '@/lib/cms/settingsCache'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Pengaturan situs',
  admin: { group: 'Pengaturan' },
  access: { read: () => true, update: canEditContent },
  hooks: {
    afterChange: [
      revalidateGlobalAfterChange,
      ({ doc }) => {
        clearAnalyticsSettingsCache()
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identitas',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              label: 'Nama situs',
              required: true,
              defaultValue: 'SOC Merdeka',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'logoLight',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Logo (latar terang)',
                  admin: {
                    width: '50%',
                    description: 'Kosongkan untuk memakai logo bawaan /brand/logo.svg',
                  },
                },
                {
                  name: 'logoDark',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Logo (latar gelap)',
                  admin: {
                    width: '50%',
                    description: 'Kosongkan untuk memakai /brand/logo-inverse.svg',
                  },
                },
              ],
            },
            {
              name: 'defaultTheme',
              type: 'select',
              label: 'Tema bawaan',
              defaultValue: 'system',
              options: [
                { label: 'Ikuti pengaturan perangkat', value: 'system' },
                { label: 'Terang', value: 'light' },
                { label: 'Gelap', value: 'dark' },
              ],
            },
            {
              name: 'organization',
              type: 'group',
              label: 'Data organisasi (untuk SEO / JSON-LD)',
              fields: [
                { name: 'legalName', type: 'text', label: 'Nama badan hukum' },
                {
                  type: 'row',
                  fields: [
                    { name: 'email', type: 'email', label: 'Email', admin: { width: '50%' } },
                    { name: 'phone', type: 'text', label: 'Telepon', admin: { width: '50%' } },
                  ],
                },
                { name: 'address', type: 'text', label: 'Alamat', localized: true },
              ],
            },
          ],
        },
        {
          label: 'SEO bawaan',
          fields: [
            { name: 'metaTitle', type: 'text', label: 'Judul bawaan', localized: true },
            {
              name: 'metaDescription',
              type: 'textarea',
              label: 'Deskripsi bawaan',
              localized: true,
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Gambar berbagi (1200×630)',
              admin: { description: 'Kosongkan untuk memakai /brand/og-default.png' },
            },
          ],
        },
        {
          label: 'Analytics',
          fields: [
            {
              name: 'analytics',
              type: 'group',
              label: false,
              access: { read: fieldAuthenticated, update: fieldAdmin },
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  label: 'Aktifkan pencatatan pengunjung',
                  defaultValue: true,
                },
                {
                  name: 'respectDoNotTrack',
                  type: 'checkbox',
                  label: 'Hormati sinyal Do Not Track / Global Privacy Control',
                  defaultValue: true,
                },
                {
                  name: 'excludedIps',
                  type: 'textarea',
                  label: 'IP yang tidak dihitung',
                  admin: { description: 'Satu IP per baris, mis. IP kantor sendiri.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
