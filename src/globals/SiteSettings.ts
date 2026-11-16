import { L } from '@/i18n/admin'
import type { GlobalConfig } from 'payload'

import { canEditContent, fieldAdmin, fieldAuthenticated } from '@/access/roles'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'
import { clearAnalyticsSettingsCache } from '@/lib/cms/settingsCache'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: L('Pengaturan situs', 'Site settings'),
  admin: { group: L('Pengaturan', 'Settings') },
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
          label: L('Identitas', 'Identity'),
          fields: [
            {
              name: 'siteName',
              type: 'text',
              label: L('Nama situs', 'Site name'),
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
                  label: L('Logo (latar terang)', 'Logo (light background)'),
                  admin: {
                    width: '50%',
                    description: L(
                      'Kosongkan untuk memakai logo bawaan /brand/logo.svg',
                      'Leave empty to use the default /brand/logo.svg',
                    ),
                  },
                },
                {
                  name: 'logoDark',
                  type: 'upload',
                  relationTo: 'media',
                  label: L('Logo (latar gelap)', 'Logo (dark background)'),
                  admin: {
                    width: '50%',
                    description: L(
                      'Kosongkan untuk memakai /brand/logo-inverse.svg',
                      'Leave empty to use /brand/logo-inverse.svg',
                    ),
                  },
                },
              ],
            },
            {
              name: 'defaultTheme',
              type: 'select',
              label: L('Tema bawaan', 'Default theme'),
              defaultValue: 'system',
              options: [
                {
                  label: L('Ikuti pengaturan perangkat', 'Follow device setting'),
                  value: 'system',
                },
                { label: L('Terang', 'Light'), value: 'light' },
                { label: L('Gelap', 'Dark'), value: 'dark' },
              ],
            },
            {
              name: 'organization',
              type: 'group',
              label: L(
                'Data organisasi (untuk SEO / JSON-LD)',
                'Organisation details (for SEO / JSON-LD)',
              ),
              fields: [
                {
                  name: 'legalName',
                  type: 'text',
                  label: L('Nama badan hukum', 'Legal entity name'),
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'email',
                      type: 'email',
                      label: L('Email', 'Email'),
                      admin: { width: '50%' },
                    },
                    {
                      name: 'phone',
                      type: 'text',
                      label: L('Telepon', 'Phone'),
                      admin: { width: '50%' },
                    },
                  ],
                },
                { name: 'address', type: 'text', label: L('Alamat', 'Address'), localized: true },
              ],
            },
          ],
        },
        {
          label: L('SEO bawaan', 'Default SEO'),
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              label: L('Judul bawaan', 'Default title'),
              localized: true,
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              label: L('Deskripsi bawaan', 'Default description'),
              localized: true,
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              label: L('Gambar berbagi (1200×630)', 'Share image (1200×630)'),
              admin: {
                description: L(
                  'Kosongkan untuk memakai /brand/og-default.png',
                  'Leave empty to use /brand/og-default.png',
                ),
              },
            },
          ],
        },
        {
          label: L('Analytics', 'Analytics'),
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
                  label: L('Aktifkan pencatatan pengunjung', 'Enable visitor tracking'),
                  defaultValue: true,
                },
                {
                  name: 'respectDoNotTrack',
                  type: 'checkbox',
                  label: L(
                    'Hormati sinyal Do Not Track / Global Privacy Control',
                    'Respect Do Not Track / Global Privacy Control',
                  ),
                  defaultValue: true,
                },
                {
                  name: 'excludedIps',
                  type: 'textarea',
                  label: L('IP yang tidak dihitung', 'Excluded IPs'),
                  admin: {
                    description: L(
                      'Satu IP per baris, mis. IP kantor sendiri.',
                      'One IP per line, e.g. your office IP.',
                    ),
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
