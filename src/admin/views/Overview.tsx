import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'

import { getLeadSummary } from '@/lib/analytics/leads'
import {
  getDailySeries,
  getFunnel,
  getOverview,
  getRealtime,
  previousRange,
  relativeChange,
  resolveRange,
} from '@/lib/analytics/queries'
import { getDb } from '@/lib/analytics/storage'
import { getSystemStatus } from '@/lib/analytics/system'

import { LeadsChart, TrafficChart } from '../components/charts'
import { Glyph, type GlyphName } from '../components/icons'
import { RealtimePanel } from '../components/RealtimePanel'
import {
  Card,
  formatters,
  Funnel,
  initials,
  Kpi,
  MiniStat,
  PageHeader,
  RangeTabs,
  StatusPill,
  TIER_COLOR,
  TierPill,
} from '../components/ui'
import { can, chartLabels, DailyTable, greeting, param, textFor, type ViewProps } from './shared'

/** Beranda admin: ringkasan pengunjung, lead, dan kesehatan sistem. */
export async function OverviewView(props: ViewProps) {
  const payload = props.initPageResult.req.payload
  const user = props.initPageResult.req.user as { name?: string } | null
  const t = textFor(props)
  const f = formatters(t)
  const db = getDb(payload)
  const range = resolveRange(param(props.searchParams, 'range') ?? '7d')
  const prev = previousRange(range)
  const canLeads = can(props, 'admin', 'sales')
  const isAdmin = can(props, 'admin')
  const canContent = can(props, 'admin', 'editor')

  const forms = await payload.find({ collection: 'forms', depth: 0, limit: 1, sort: 'createdAt' })
  const steps = forms.docs[0]?.sections?.length ?? 5

  const [overview, prevOverview, daily, funnel, realtime, leads, prevLeads, recent, system] =
    await Promise.all([
      getOverview(db, range),
      getOverview(db, prev),
      getDailySeries(db, range),
      getFunnel(db, range, steps),
      getRealtime(db),
      getLeadSummary(db, range),
      getLeadSummary(db, prev),
      canLeads
        ? payload.find({
            collection: 'form-submissions',
            depth: 0,
            limit: 6,
            sort: '-createdAt',
            select: {
              companyName: true,
              industry: true,
              tier: true,
              score: true,
              maxScore: true,
              status: true,
              createdAt: true,
            },
          })
        : null,
      isAdmin ? getSystemStatus(payload) : null,
    ])

  const conversion = overview.visitors ? leads.total / overview.visitors : 0
  const prevConversion = prevOverview.visitors ? prevLeads.total / prevOverview.visitors : 0
  const spark = (key: 'visitors' | 'pageviews' | 'leads') => daily.map((d) => d[key])
  const shortcuts: [string, string, GlyphName][] = [
    ['/admin/collections/pages', t.shortcuts.pages, 'page'],
    ['/admin/collections/forms', t.shortcuts.forms, 'form'],
    ['/admin/globals/header', t.shortcuts.header, 'header'],
    ['/admin/globals/footer', t.shortcuts.footer, 'footer'],
    ['/admin/collections/media', t.shortcuts.media, 'image'],
    ['/admin/globals/site-settings', t.shortcuts.settings, 'settings'],
  ]

  return (
    <Gutter>
      <div className="smd">
        <PageHeader
          title={t.overview.title}
          description={`${greeting(t, user?.name)}. ${t.overview.subtitle}`}
          actions={<RangeTabs basePath="/admin" active={range.preset} t={t} />}
        />

        <div className="smd-kpis">
          <Kpi
            t={t}
            icon="visitors"
            tone="blue"
            label={t.overview.visitors}
            value={f.num(overview.visitors)}
            note={`${f.num(overview.sessions)} ${t.overview.sessions}`}
            delta={{ change: relativeChange(overview.visitors, prevOverview.visitors) }}
            spark={spark('visitors')}
          />
          <Kpi
            t={t}
            icon="pageviews"
            tone="violet"
            label={t.overview.pageviews}
            value={f.num(overview.pageviews)}
            delta={{ change: relativeChange(overview.pageviews, prevOverview.pageviews) }}
            spark={spark('pageviews')}
          />
          <Kpi
            t={t}
            icon="pulse"
            tone="green"
            label={t.overview.engaged}
            value={f.pct(overview.engagementRate)}
            note={t.overview.engagedNote}
            delta={{ change: relativeChange(overview.engagementRate, prevOverview.engagementRate) }}
          />
          <Kpi
            t={t}
            icon="clock"
            tone="slate"
            label={t.overview.avgTime}
            value={t.seconds(overview.avgEngagedSeconds)}
            note={t.overview.perSession}
            delta={{
              change: relativeChange(overview.avgEngagedSeconds, prevOverview.avgEngagedSeconds),
            }}
          />
          <Kpi
            t={t}
            icon="lead"
            tone="red"
            label={t.overview.leads}
            value={f.num(leads.total)}
            note={`${f.num(leads.byTier.hot ?? 0)} Hot · ${f.num(leads.byTier.warm ?? 0)} Warm`}
            delta={{ change: relativeChange(leads.total, prevLeads.total) }}
            spark={spark('leads')}
          />
          <Kpi
            t={t}
            icon="conversion"
            tone="amber"
            label={t.overview.conversion}
            value={f.pct(conversion)}
            note={t.overview.conversionNote}
            delta={{ change: relativeChange(conversion, prevConversion) }}
          />
        </div>

        <div className="smd-grid smd-grid--2-1">
          <Card
            title={t.overview.trend}
            subtitle={t.overview.perDay}
            icon="analytics"
            action={
              <Link className="smd-link" href={`/admin/analytics?range=${range.preset}`}>
                {t.nav.analytics}
                <Glyph name="arrowRight" size={14} />
              </Link>
            }
          >
            <TrafficChart data={daily} labels={chartLabels(t)} locale={t.locale} />
            <DailyTable data={daily} t={t} />
          </Card>
          <Card title={t.overview.now} icon="pulse" className="smd-card--accent">
            <RealtimePanel
              initial={realtime}
              locale={t.locale}
              labels={{
                active: t.realtime.active,
                window: t.realtime.window,
                auto: t.realtime.auto,
                none: t.realtime.none,
                updated: t.realtime.updated('{t}'),
              }}
            />
          </Card>
        </div>

        <div className="smd-grid smd-grid--2">
          <Card title={t.overview.funnel} subtitle={t.overview.funnelSub} icon="target">
            <Funnel steps={funnel} t={t} />
          </Card>
          <Card
            title={t.overview.leadsPerDay}
            icon="lead"
            action={
              can(props, 'admin', 'sales', 'viewer') ? (
                <Link className="smd-link" href={`/admin/leads?range=${range.preset}`}>
                  {t.overview.leadInsights}
                  <Glyph name="arrowRight" size={14} />
                </Link>
              ) : undefined
            }
          >
            <LeadsChart data={daily} labels={chartLabels(t)} locale={t.locale} />
            <div className="smd-tiers">
              {(['hot', 'warm', 'cold', 'survey'] as const).map((tier) => (
                <MiniStat
                  key={tier}
                  label={t.tier[tier]}
                  value={f.num(leads.byTier[tier] ?? 0)}
                  marker={TIER_COLOR[tier]}
                />
              ))}
            </div>
          </Card>
        </div>

        {recent && (
          <Card
            title={t.overview.recentLeads}
            icon="inbox"
            subtitle={
              leads.awaitingFollowUp
                ? t.overview.awaiting(f.num(leads.awaitingFollowUp))
                : t.overview.allHandled
            }
            action={
              <Link className="smd-link" href="/admin/collections/form-submissions">
                {t.overview.allLeads}
                <Glyph name="arrowRight" size={14} />
              </Link>
            }
          >
            {recent.docs.length === 0 ? (
              <p className="smd-empty">{t.overview.noLeads}</p>
            ) : (
              <div className="smd-table-wrap">
                <table className="smd-table">
                  <thead>
                    <tr>
                      <th scope="col">{t.table.company}</th>
                      <th scope="col">{t.table.tier}</th>
                      <th scope="col" className="num">
                        {t.table.score}
                      </th>
                      <th scope="col">{t.table.status}</th>
                      <th scope="col" className="num">
                        {t.table.time}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.docs.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <Link
                            href={`/admin/collections/form-submissions/${d.id}`}
                            className="smd-lead"
                          >
                            <span className="smd-avatar" aria-hidden="true">
                              {initials(d.companyName || '?')}
                            </span>
                            <span>
                              <strong>{d.companyName || t.table.unnamed}</strong>
                              <small>{d.industry || '—'}</small>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <TierPill tier={d.tier} t={t} />
                        </td>
                        <td className="num">
                          <span className="smd-score">
                            {d.score ?? 0}
                            <small>/{d.maxScore ?? 0}</small>
                          </span>
                        </td>
                        <td>
                          <StatusPill status={d.status} t={t} />
                        </td>
                        <td className="num smd-muted-cell">
                          {new Date(d.createdAt).toLocaleString(t.locale, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        <div className={system ? 'smd-grid smd-grid--2-1' : ''}>
          {system && (
            <Card title={t.overview.system} icon="server">
              <div className="smd-system">
                <MiniStat
                  icon="database"
                  label={t.system.database}
                  value={system.db.ok ? t.system.connected : t.system.down}
                  note={
                    system.db.ok
                      ? `${system.db.latencyMs} ms · ${system.db.dataMb} MB ${t.system.data}`
                      : t.system.checkDb
                  }
                  marker={system.db.ok ? 'var(--smd-ok)' : 'var(--smd-critical)'}
                />
                <MiniStat
                  icon="server"
                  label={t.system.app}
                  value={`v${system.app.version}`}
                  note={`${system.app.env} · Node ${system.app.node} · ${t.system.uptime(system.app.uptimeHours)}`}
                />
                <MiniStat
                  icon="image"
                  label={t.system.media}
                  value={`${f.num(system.media.files)} ${t.system.files}`}
                  note={`${system.media.totalMb} MB`}
                />
                <MiniStat
                  icon="mail"
                  label={t.system.email}
                  value={
                    system.email.lastStatus === 'failed'
                      ? t.system.failed
                      : system.email.lastStatus === 'sent'
                        ? t.system.sent
                        : '—'
                  }
                  note={
                    system.email.failures7d
                      ? t.system.failures(system.email.failures7d)
                      : t.system.noFailures
                  }
                  marker={
                    system.email.lastStatus === 'failed' || system.email.failures7d
                      ? 'var(--smd-critical)'
                      : 'var(--smd-ok)'
                  }
                />
              </div>
              {system.logs.length > 0 && (
                <ul className="smd-logs">
                  {system.logs.map((l, i) => (
                    <li key={i}>
                      <span className={`smd-pill smd-logs__level--${l.level}`}>
                        {l.level === 'error' ? t.system.error : t.system.warning}
                      </span>
                      <time>
                        {new Date(l.ts).toLocaleString(t.locale, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          timeZone: 'Asia/Jakarta',
                        })}
                      </time>
                      <span>
                        {l.source}: {l.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          {canContent && (
            <Card title={t.overview.shortcuts} icon="layers">
              <ul className="smd-shortcuts">
                {shortcuts.map(([href, label, icon]) => (
                  <li key={href}>
                    <Link href={href}>
                      <span className="smd-shortcuts__icon">
                        <Glyph name={icon} size={16} />
                      </span>
                      {label}
                      <Glyph name="arrowRight" size={14} className="smd-shortcuts__arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Gutter>
  )
}
