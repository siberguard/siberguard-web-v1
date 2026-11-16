import { NavHamburger, NavWrapper } from '@payloadcms/next/client'
import { getTranslation } from '@payloadcms/translations'
import type {
  CollectionSlug,
  GlobalSlug,
  Payload,
  SanitizedPermissions,
  ServerProps,
  VisibleEntities,
} from 'payload'

import { adminText } from '../i18n'
import type { GlyphName } from './icons'
import { SideNavClient, type NavGroupItem } from './SideNavClient'

type Props = ServerProps & {
  payload: Payload
  permissions: SanitizedPermissions
  visibleEntities: VisibleEntities
}

/** Urutan & ikon menu. Label diambil dari konfigurasi collection/global (dua bahasa). */
const MENU: { group: string; type: 'collection' | 'global'; slug: string; icon: GlyphName }[] = [
  { group: 'leads', type: 'collection', slug: 'form-submissions', icon: 'inbox' },
  { group: 'content', type: 'collection', slug: 'pages', icon: 'page' },
  { group: 'content', type: 'collection', slug: 'forms', icon: 'form' },
  { group: 'content', type: 'collection', slug: 'media', icon: 'image' },
  { group: 'site', type: 'global', slug: 'header', icon: 'header' },
  { group: 'site', type: 'global', slug: 'footer', icon: 'footer' },
  { group: 'site', type: 'global', slug: 'ui-labels', icon: 'type' },
  { group: 'settings', type: 'global', slug: 'site-settings', icon: 'settings' },
  { group: 'settings', type: 'collection', slug: 'users', icon: 'users' },
]

/**
 * Sidebar admin: logo, menu berikon sesuai hak akses peran, lencana lead baru,
 * serta pengatur tema & bahasa. Memakai NavWrapper Payload agar buka/tutup di ponsel tetap bekerja.
 */
export async function Nav(props: Props) {
  const { payload, permissions, visibleEntities, i18n, user } = props
  const t = adminText(i18n?.language)
  const config = payload.config

  const canSee = (type: 'collection' | 'global', slug: string) =>
    type === 'collection'
      ? visibleEntities.collections.includes(slug as CollectionSlug) &&
        Boolean(permissions?.collections?.[slug]?.read)
      : visibleEntities.globals.includes(slug as GlobalSlug) &&
        Boolean(permissions?.globals?.[slug]?.read)

  let newLeads = 0
  if (canSee('collection', 'form-submissions')) {
    const res = await payload.count({
      collection: 'form-submissions',
      where: { and: [{ status: { equals: 'new' } }, { tier: { not_equals: 'survey' } }] },
    })
    newLeads = res.totalDocs
  }

  const groups: NavGroupItem[] = [
    {
      key: 'monitoring',
      label: t.nav.monitoring,
      items: [
        { href: '/admin', label: t.nav.overview, icon: 'overview', exact: true },
        { href: '/admin/analytics', label: t.nav.analytics, icon: 'analytics' },
        { href: '/admin/leads', label: t.nav.leadInsights, icon: 'target' },
      ],
    },
  ]

  for (const entry of MENU) {
    if (!canSee(entry.type, entry.slug)) continue
    const entity =
      entry.type === 'collection'
        ? config.collections.find((c) => c.slug === entry.slug)
        : config.globals.find((g) => g.slug === entry.slug)
    if (!entity) continue
    const label =
      entry.type === 'collection'
        ? getTranslation((entity as (typeof config.collections)[number]).labels.plural, i18n)
        : getTranslation((entity as (typeof config.globals)[number]).label ?? entry.slug, i18n)
    const groupLabel = entity.admin?.group ? getTranslation(entity.admin.group, i18n) : entry.group
    let group = groups.find((g) => g.key === entry.group)
    if (!group) {
      group = { key: entry.group, label: String(groupLabel), items: [] }
      groups.push(group)
    }
    group.items.push({
      href: `/admin/${entry.type === 'collection' ? 'collections' : 'globals'}/${entry.slug}`,
      label: String(label),
      icon: entry.icon,
      badge: entry.slug === 'form-submissions' && newLeads > 0 ? newLeads : undefined,
      badgeLabel: t.nav.newLeads,
    })
  }

  const u = user as { name?: string; email?: string; role?: string } | undefined

  return (
    <NavWrapper baseClass="nav">
      <nav className="nav__wrap smd-sidenav" aria-label="Admin">
        <SideNavClient
          groups={groups}
          user={{
            name: u?.name || u?.email || '',
            email: u?.email || '',
            role: t.nav.role[u?.role ?? ''] ?? '',
          }}
          serverURL={config.serverURL || ''}
          labels={{
            viewSite: t.nav.viewSite,
            theme: t.nav.theme,
            light: t.nav.light,
            dark: t.nav.dark,
            auto: t.nav.auto,
            language: t.nav.language,
            logout: t.nav.logout,
          }}
        />
      </nav>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  )
}
