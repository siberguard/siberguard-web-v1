import Link from 'next/link'

import {
  getBreakdown,
  getDailySeries,
  getOverview,
  previousRange,
  relativeChange,
  resolveRange,
  type Filters,
} from '@/lib/analytics/queries'
import { getDb } from '@/lib/analytics/storage'

import { TrafficChart } from '../components/charts'
import { BarList, Card, formatters, Kpi, PageHeader, RangeTabs } from '../components/ui'
import {
  AdminShell,
  chartLabels,
  countryName,
  DailyTable,
  param,
  textFor,
  type ViewProps,
} from './shared'

function FilterSeg({
  label,
  param: key,
  options,
  active,
  base,
}: {
  label: string
  param: 'locale' | 'device'
  options: [string, string][]
  active?: string
  base: string
}) {
  return (
    <div className="smd-filter">
      <span className="smd-filter__label">{label}</span>
      <div className="smd-seg" role="group" aria-label={label}>
        {options.map(([value, text]) => {
          const sp = new URLSearchParams(base)
          if (value) sp.set(key, value)
          else sp.delete(key)
          return (
            <Link
              key={value || 'all'}
              href={`/admin/analytics?${sp.toString()}`}
              className="smd-seg__btn smd-seg__btn--text"
              aria-current={(active ?? '') === value ? 'true' : undefined}
            >
              {text}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** /admin/analytics — rincian pengunjung (tanpa data pribadi; boleh diakses semua peran). */
export async function AnalyticsView(props: ViewProps) {
  const t = textFor(props)
  const a = t.analytics
  const f = formatters(t)
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
    getBreakdown(db, range, field, { filters, emptyLabel: a.unknown, ...opts })
  const [
    overview,
    prev,
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
    getOverview(db, previousRange(range), filters),
    getDailySeries(db, range, filters),
    b('path'),
    b('ref', { emptyLabel: a.direct }),
    b('utm.c', { emptyLabel: a.noCampaign }),
    b('cc'),
    b('ct'),
    b('dev'),
    b('br'),
    b('os'),
    b('m.locale'),
    b('th', { emptyLabel: a.notLoaded }),
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
        title={a.title}
        description={a.subtitle}
        actions={
          <RangeTabs basePath="/admin/analytics" active={range.preset} extra={extra} t={t} />
        }
      />
      <div className="smd-filters">
        <FilterSeg
          label={a.language}
          param="locale"
          base={base}
          active={filters.locale}
          options={[
            ['', a.all],
            ['id', a.langLabel.id],
            ['en', a.langLabel.en],
          ]}
        />
        <FilterSeg
          label={a.device}
          param="device"
          base={base}
          active={filters.device}
          options={[
            ['', a.all],
            ['desktop', a.deviceLabel.desktop],
            ['mobile', a.deviceLabel.mobile],
            ['tablet', a.deviceLabel.tablet],
          ]}
        />
      </div>

      <div className="smd-kpis smd-kpis--5">
        <Kpi
          t={t}
          icon="visitors"
          tone="blue"
          label={t.overview.visitors}
          value={f.num(overview.visitors)}
          delta={{ change: relativeChange(overview.visitors, prev.visitors) }}
          spark={daily.map((d) => d.visitors)}
        />
        <Kpi
          t={t}
          icon="users"
          tone="slate"
          label={a.sessions}
          value={f.num(overview.sessions)}
          delta={{ change: relativeChange(overview.sessions, prev.sessions) }}
        />
        <Kpi
          t={t}
          icon="pageviews"
          tone="violet"
          label={t.overview.pageviews}
          value={f.num(overview.pageviews)}
          delta={{ change: relativeChange(overview.pageviews, prev.pageviews) }}
          spark={daily.map((d) => d.pageviews)}
        />
        <Kpi
          t={t}
          icon="pulse"
          tone="green"
          label={t.overview.engaged}
          value={f.pct(overview.engagementRate)}
          note={`${f.num(overview.engagedSessions)} ${t.overview.sessions}`}
          delta={{ change: relativeChange(overview.engagementRate, prev.engagementRate) }}
        />
        <Kpi
          t={t}
          icon="clock"
          tone="amber"
          label={t.overview.avgTime}
          value={t.seconds(overview.avgEngagedSeconds)}
          delta={{ change: relativeChange(overview.avgEngagedSeconds, prev.avgEngagedSeconds) }}
        />
      </div>

      <Card title={t.overview.trend} subtitle={a.perDayWib} icon="analytics">
        <TrafficChart data={daily} labels={chartLabels(t)} locale={t.locale} />
        <DailyTable data={daily} t={t} />
      </Card>

      <div className="smd-grid smd-grid--3">
        <Card title={a.topPages} icon="page">
          <BarList t={t} rows={rows(pages)} total={total} keyLabel={a.topPages} />
        </Card>
        <Card title={a.sources} icon="link">
          <BarList t={t} rows={rows(sources)} total={total} keyLabel={a.sources} />
        </Card>
        <Card title={a.campaigns} icon="flag">
          <BarList t={t} rows={rows(campaigns)} total={total} keyLabel={a.campaigns} />
        </Card>
        <Card title={a.countries} icon="globe">
          <BarList
            t={t}
            rows={rows(countries, (k) => countryName(k, t.locale))}
            total={total}
            keyLabel={a.countries}
          />
        </Card>
        <Card title={a.cities} icon="globe">
          <BarList
            t={t}
            rows={rows(cities)}
            total={total}
            keyLabel={a.cities}
            empty={a.citiesEmpty}
          />
        </Card>
        <Card title={a.devices} icon="device">
          <BarList
            t={t}
            rows={rows(devices, (k) => a.deviceLabel[k] ?? k)}
            total={total}
            keyLabel={a.devices}
          />
        </Card>
        <Card title={a.browsers} icon="monitor">
          <BarList t={t} rows={rows(browsers)} total={total} keyLabel={a.browsers} />
        </Card>
        <Card title={a.os} icon="server">
          <BarList t={t} rows={rows(oses)} total={total} keyLabel={a.os} />
        </Card>
        <Card title={a.prefs} icon="sun">
          <BarList
            t={t}
            rows={[
              ...rows(locales, (k) => a.langLabel[k] ?? k),
              ...rows(themes, (k) => a.themeLabel[k] ?? k),
            ]}
            keyLabel={a.prefs}
          />
        </Card>
      </div>

      <div className="smd-grid smd-grid--3">
        <Card title={a.sections} subtitle={a.sectionsSub} icon="layers">
          <BarList t={t} rows={rows(sections, (k) => `#${k}`)} total={total} />
        </Card>
        <Card title={a.ctas} icon="cursor">
          <BarList t={t} rows={rows(ctas)} />
        </Card>
        <Card title={a.copies} subtitle={a.copiesSub} icon="copy">
          <BarList
            t={t}
            rows={copies.map((r) => ({ key: r.key, value: r.events }))}
            valueLabel={a.timesCopied}
          />
        </Card>
      </div>
    </AdminShell>
  )
}
