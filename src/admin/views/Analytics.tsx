import Link from 'next/link'

import {
  getBreakdown,
  getDailySeries,
  getOverview,
  resolveRange,
  type Filters,
} from '@/lib/analytics/queries'
import { getDb } from '@/lib/analytics/storage'

import { TrafficChart } from '../components/charts'
import { BarList, Card, fmt, PageHeader, pct, RangeTabs, StatTile } from '../components/ui'
import { AdminShell, countryName, DailyTable, param, secondsLabel, type ViewProps } from './shared'

const DEVICE_LABEL: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Ponsel',
  tablet: 'Tablet',
}

function FilterLinks({
  name,
  options,
  active,
  base,
}: {
  name: string
  options: [string, string][]
  active?: string
  base: string
}) {
  return (
    <div className="smd-filter" role="group" aria-label={name}>
      <span>{name}</span>
      {options.map(([value, label]) => {
        const sp = new URLSearchParams(base)
        if (value) sp.set(name === 'Bahasa' ? 'locale' : 'device', value)
        else sp.delete(name === 'Bahasa' ? 'locale' : 'device')
        return (
          <Link
            key={value || 'all'}
            href={`/admin/analytics?${sp.toString()}`}
            aria-current={(active ?? '') === value ? 'true' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

/** /admin/analytics — rincian pengunjung (tanpa data pribadi; boleh diakses semua peran). */
export async function AnalyticsView(props: ViewProps) {
  const db = getDb(props.initPageResult.req.payload)
  const range = resolveRange(param(props.searchParams, 'range'))
  const filters: Filters = {
    locale: param(props.searchParams, 'locale') || undefined,
    device: param(props.searchParams, 'device') || undefined,
  }
  const base = new URLSearchParams({
    range: range.preset,
    ...(filters.locale ? { locale: filters.locale } : {}),
    ...(filters.device ? { device: filters.device } : {}),
  }).toString()
  const extra = `${filters.locale ? `&locale=${filters.locale}` : ''}${filters.device ? `&device=${filters.device}` : ''}`

  const b = (field: string, opts: Parameters<typeof getBreakdown>[3] = {}) =>
    getBreakdown(db, range, field, { filters, ...opts })
  const [
    overview,
    daily,
    pages,
    sources,
    campaigns,
    countries,
    cities,
    devices,
    browsers,
    oses,
    locales,
    themes,
    sections,
    ctas,
    copies,
  ] = await Promise.all([
    getOverview(db, range, filters),
    getDailySeries(db, range, filters),
    b('path'),
    b('ref', { emptyLabel: '(langsung)' }),
    b('utm.c', { emptyLabel: '(tanpa kampanye)' }),
    b('cc'),
    b('ct'),
    b('dev'),
    b('br'),
    b('os'),
    b('m.locale'),
    b('th', { emptyLabel: '(belum dimuat)' }),
    b('n', { type: 'section_view', limit: 12 }),
    b('n', { type: 'cta_click', limit: 12 }),
    b('n', { type: 'copy_command' }),
  ])
  const rows = (list: typeof pages, label: (k: string) => string = (k) => k) =>
    list.map((r) => ({ key: label(r.key), value: r.visitors }))
  const total = overview.visitors

  return (
    <AdminShell props={props}>
      <PageHeader
        title="Analytics pengunjung"
        description="Data pihak pertama tanpa cookie. IP tidak disimpan; pengunjung dibedakan dengan kode harian acak."
        actions={<RangeTabs basePath="/admin/analytics" active={range.preset} extra={extra} />}
      />
      <div className="smd-filters">
        <FilterLinks
          name="Bahasa"
          base={base}
          active={filters.locale}
          options={[
            ['', 'Semua'],
            ['id', 'Indonesia'],
            ['en', 'English'],
          ]}
        />
        <FilterLinks
          name="Perangkat"
          base={base}
          active={filters.device}
          options={[
            ['', 'Semua'],
            ['desktop', 'Desktop'],
            ['mobile', 'Ponsel'],
            ['tablet', 'Tablet'],
          ]}
        />
      </div>

      <div className="smd-stats">
        <StatTile label="Pengunjung unik" value={fmt(overview.visitors)} />
        <StatTile label="Sesi" value={fmt(overview.sessions)} />
        <StatTile label="Tampilan halaman" value={fmt(overview.pageviews)} />
        <StatTile
          label="Sesi aktif"
          value={pct(overview.engagementRate)}
          note={`${fmt(overview.engagedSessions)} sesi`}
        />
        <StatTile label="Rata-rata waktu aktif" value={secondsLabel(overview.avgEngagedSeconds)} />
      </div>

      <Card title="Tren pengunjung" subtitle="Per hari (WIB)">
        <TrafficChart data={daily} />
        <DailyTable data={daily} />
      </Card>

      <div className="smd-grid smd-grid--3">
        <Card title="Halaman teratas">
          <BarList rows={rows(pages)} total={total} keyLabel="Halaman" />
        </Card>
        <Card title="Sumber kunjungan">
          <BarList rows={rows(sources)} total={total} keyLabel="Sumber" />
        </Card>
        <Card title="Kampanye (utm_campaign)">
          <BarList rows={rows(campaigns)} total={total} keyLabel="Kampanye" />
        </Card>
        <Card title="Negara">
          <BarList rows={rows(countries, countryName)} total={total} keyLabel="Negara" />
        </Card>
        <Card title="Kota">
          <BarList
            rows={rows(cities)}
            total={total}
            keyLabel="Kota"
            empty="Data kota tersedia setelah database GeoLite2 dipasang."
          />
        </Card>
        <Card title="Perangkat">
          <BarList
            rows={rows(devices, (k) => DEVICE_LABEL[k] ?? k)}
            total={total}
            keyLabel="Perangkat"
          />
        </Card>
        <Card title="Browser">
          <BarList rows={rows(browsers)} total={total} keyLabel="Browser" />
        </Card>
        <Card title="Sistem operasi">
          <BarList rows={rows(oses)} total={total} keyLabel="Sistem operasi" />
        </Card>
        <Card title="Bahasa & tema">
          <BarList
            rows={[
              ...rows(locales, (k) => (k === 'en' ? 'English' : 'Indonesia')),
              ...rows(themes, (k) =>
                k === 'dark' ? 'Tema gelap' : k === 'light' ? 'Tema terang' : k,
              ),
            ]}
            keyLabel="Preferensi"
          />
        </Card>
      </div>

      <div className="smd-grid smd-grid--3">
        <Card title="Section yang dilihat" subtitle="Pengunjung yang melihat ≥40% section">
          <BarList rows={rows(sections, (k) => `#${k}`)} total={total} keyLabel="Section" />
        </Card>
        <Card title="Klik tombol & menu">
          <BarList rows={rows(ctas)} keyLabel="Tombol" valueLabel="Pengunjung" />
        </Card>
        <Card title="Perintah agen disalin" subtitle="Per sistem operasi">
          <BarList
            rows={copies.map((r) => ({ key: r.key, value: r.events }))}
            keyLabel="OS"
            valueLabel="Kali disalin"
          />
        </Card>
      </div>
    </AdminShell>
  )
}
