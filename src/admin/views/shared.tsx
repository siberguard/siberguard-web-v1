import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import type { ReactNode } from 'react'

import { hasRole, type Role } from '@/access/roles'
import type { DailyPoint } from '@/lib/analytics/queries'

import { formatters } from '../components/ui'
import { adminText, type AdminText } from '../i18n'

export type ViewProps = AdminViewServerProps & {
  searchParams?: Record<string, string | string[] | undefined>
}

export const param = (sp: ViewProps['searchParams'], key: string): string | undefined => {
  const v = sp?.[key]
  return Array.isArray(v) ? v[0] : v
}

export const can = (props: ViewProps, ...roles: Role[]) =>
  hasRole(props.initPageResult.req.user as never, ...roles)

/** Teks dashboard sesuai bahasa admin pengguna. */
export const textFor = (props: ViewProps): AdminText =>
  adminText(props.initPageResult.req.i18n?.language)

/** Salam sesuai jam WIB. */
export function greeting(t: AdminText, name?: string) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(new Date()),
  )
  const g =
    hour < 11
      ? t.greeting.morning
      : hour < 15
        ? t.greeting.afternoon
        : hour < 19
          ? t.greeting.evening
          : t.greeting.night
  return name ? `${g}, ${name.split(' ')[0]}` : g
}

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
export function DailyTable({ data, t }: { data: DailyPoint[]; t: AdminText }) {
  const f = formatters(t)
  return (
    <details className="smd-tableview">
      <summary>{t.chart.table}</summary>
      <table>
        <thead>
          <tr>
            <th scope="col">{t.table.date}</th>
            <th scope="col">{t.chart.visitors}</th>
            <th scope="col">{t.chart.pageviews}</th>
            <th scope="col">{t.chart.leads}</th>
          </tr>
        </thead>
        <tbody>
          {[...data].reverse().map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{f.num(d.visitors)}</td>
              <td>{f.num(d.pageviews)}</td>
              <td>{f.num(d.leads)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

export const countryName = (code: string, locale: string) => {
  if (!/^[A-Z]{2}$/.test(code)) return code
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export const chartLabels = (t: AdminText) => ({
  visitors: t.chart.visitors,
  pageviews: t.chart.pageviews,
  leads: t.chart.leads,
})
