import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import type { ReactNode } from 'react'

import { hasRole, type Role } from '@/access/roles'
import type { DailyPoint } from '@/lib/analytics/queries'

import { fmt } from '../components/ui'

export type ViewProps = AdminViewServerProps & {
  searchParams?: Record<string, string | string[] | undefined>
}

export const param = (sp: ViewProps['searchParams'], key: string): string | undefined => {
  const v = sp?.[key]
  return Array.isArray(v) ? v[0] : v
}

export const userRole = (props: ViewProps) =>
  (props.initPageResult.req.user as { role?: Role } | null)?.role
export const can = (props: ViewProps, ...roles: Role[]) =>
  hasRole(props.initPageResult.req.user as never, ...roles)

/** Bungkus view kustom dengan template admin (navigasi, header) milik Payload. */
export function AdminShell({ props, children }: { props: ViewProps; children: ReactNode }) {
  const { initPageResult, params, searchParams } = props
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div className="smd">{children}</div>
      </Gutter>
    </DefaultTemplate>
  )
}

/** Padanan tabel untuk grafik harian (dapat dibaca tanpa hover/pembaca layar). */
export function DailyTable({ data }: { data: DailyPoint[] }) {
  return (
    <details className="smd-tableview">
      <summary>Lihat sebagai tabel</summary>
      <table>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Pengunjung unik</th>
            <th scope="col">Tampilan halaman</th>
            <th scope="col">Lead</th>
          </tr>
        </thead>
        <tbody>
          {[...data].reverse().map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{fmt(d.visitors)}</td>
              <td>{fmt(d.pageviews)}</td>
              <td>{fmt(d.leads)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['id'], { type: 'region' })
  } catch {
    return null
  }
})()

export const countryName = (code: string) => {
  if (!/^[A-Z]{2}$/.test(code)) return code
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

export const secondsLabel = (s: number) =>
  s < 60 ? `${s} dtk` : `${Math.floor(s / 60)} mnt ${s % 60} dtk`
