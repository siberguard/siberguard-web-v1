import { L } from '@/i18n/admin'
import type { CollectionConfig } from 'payload'

import { fieldAdmin, hasRole, isAdmin, ROLES, type Role } from '@/access/roles'

const ROLE_LABELS: Record<Role, Record<'id' | 'en', string>> = {
  admin: L('Admin — semua akses', 'Admin — full access'),
  editor: L('Editor — konten & formulir', 'Editor — content & forms'),
  sales: L('Sales — dashboard & leads', 'Sales — dashboard & leads'),
  viewer: L('Viewer — dashboard (agregat)', 'Viewer — dashboard (aggregate)'),
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: L('Pengguna', 'User'), plural: L('Pengguna', 'Users') },
  admin: {
    useAsTitle: 'name',
    group: L('Pengaturan', 'Settings'),
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    },
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    // Tanpa login: ditolak. Admin: semua. Peran lain: hanya akunnya sendiri.
    read: ({ req }) =>
      !req.user
        ? false
        : hasRole(req.user as never, 'admin')
          ? true
          : { id: { equals: req.user.id } },
    update: ({ req }) =>
      !req.user
        ? false
        : hasRole(req.user as never, 'admin')
          ? true
          : { id: { equals: req.user.id } },
    // Semua role boleh masuk admin; batasan per fitur diatur di masing-masing collection/view.
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Pengguna pertama (layar "create first user") otomatis menjadi admin.
        if (operation === 'create') {
          // find (bukan count): perintah count tidak diizinkan di dalam transaksi MongoDB.
          const existing = await req.payload.find({
            collection: 'users',
            limit: 1,
            depth: 0,
            pagination: false,
            req,
          })
          if (existing.docs.length === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: L('Nama', 'Name'), required: true },
    {
      name: 'role',
      type: 'select',
      label: L('Peran', 'Role'),
      required: true,
      defaultValue: 'viewer',
      saveToJWT: true,
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: { update: fieldAdmin, create: fieldAdmin },
    },
  ],
}
