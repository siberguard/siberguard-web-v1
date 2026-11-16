import type { Access, FieldAccess, PayloadRequest } from 'payload'

export const ROLES = ['admin', 'editor', 'sales', 'viewer'] as const
export type Role = (typeof ROLES)[number]

type MaybeUser = { role?: Role | null } | null | undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.role && roles.includes(user.role))

const userOf = (req: PayloadRequest) => req.user as MaybeUser

/** Siapa pun yang sudah login ke admin. */
export const authenticated: Access = ({ req }) => Boolean(req.user)

export const isAdmin: Access = ({ req }) => hasRole(userOf(req), 'admin')

/** Pengelola konten: admin & editor. */
export const canEditContent: Access = ({ req }) => hasRole(userOf(req), 'admin', 'editor')

/** Data lead (berisi data pribadi): admin & sales. */
export const canAccessLeads: Access = ({ req }) => hasRole(userOf(req), 'admin', 'sales')

export const fieldAuthenticated: FieldAccess = ({ req }) => Boolean(req.user)
export const fieldAdmin: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin')

/** Halaman: publik hanya melihat versi terbit; user admin melihat semuanya (termasuk draft). */
export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
