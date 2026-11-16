import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'

import { getLeadSummary } from '@/lib/analytics/leads'
import {
  getDailySeries,
  getFunnel,
  getOverview,
  getRealtime,
  resolveRange,
} from '@/lib/analytics/queries'
import { getDb } from '@/lib/analytics/storage'
import { getSystemStatus } from '@/lib/analytics/system'

import { LeadsChart, TrafficChart } from '../components/charts'
import { RealtimePanel } from '../components/RealtimePanel'
import {
  Card,
  fmt,
  Funnel,
  PageHeader,
  pct,
  RangeTabs,
  STATUS_LABEL,
  StatTile,
  TIER_META,
  TierBadge,
} from '../components/ui'
import { can, DailyTable, param, secondsLabel, type ViewProps } from './shared'

/** Beranda admin: ringkasan pengunjung, lead, dan kesehatan sistem. */
export async function OverviewView(props: ViewProps) {
  const payload = props.initPageResult.req.payload
  const db = getDb(payload)
  const range = resolveRange(param(props.searchParams, 'range') ?? '7d')
  const canLeads = can(props, 'admin', 'sales')
  const isAdmin = can(props, 'admin')

  const forms = await payload.find({ collection: 'forms', depth: 0, limit: 1, sort: 'createdAt' })
  const steps = forms.docs[0]?.sections?.length ?? 5

  const [overview, daily, funnel, realtime, leads, recent, system] = await Promise.all([
    getOverview(db, range),
    getDailySeries(db, range),
    getFunnel(db, range, steps),
    getRealtime(db),
    getLeadSummary(db, range),
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
            status: true,
            createdAt: true,
          },
        })
      : null,
    isAdmin ? getSystemStatus(payload) : null,
  ])

  const conversion = overview.visitors ? leads.total / overview.visitors : 0

  return (
    <Gutter>
      <div className="smd">
        <PageHeader
          title="Ringkasan"
          description="Pengunjung website, lead kuesioner, dan kondisi sistem. Waktu dalam WIB."
          actions={<RangeTabs basePath="/admin" active={range.preset} />}
        />

        <div className="smd-stats">
          <StatTile
            label="Pengunjung unik"
            value={fmt(overview.visitors)}
            note={`${fmt(overview.sessions)} sesi`}
          />
          <StatTile label="Tampilan halaman" value={fmt(overview.pageviews)} />
          <StatTile
            label="Sesi aktif"
            value={pct(overview.engagementRate)}
            note="≥10 dtk, ≥2 halaman, atau ada interaksi"
          />
          <StatTile
            label="Rata-rata waktu aktif"
            value={secondsLabel(overview.avgEngagedSeconds)}
            note="per sesi"
          />
          <StatTile
            label="Lead masuk"
            value={fmt(leads.total)}
            note={`${fmt(leads.byTier.hot ?? 0)} Hot · ${fmt(leads.byTier.warm ?? 0)} Warm`}
          />
          <StatTile label="Konversi" value={pct(conversion)} note="lead ÷ pengunjung unik" />
        </div>

        <div className="smd-grid smd-grid--2-1">
          <Card title="Tren pengunjung" subtitle="Per hari">
            <TrafficChart data={daily} />
            <DailyTable data={daily} />
          </Card>
          <Card title="Saat ini">
            <RealtimePanel initial={realtime} />
          </Card>
        </div>

        <div className="smd-grid smd-grid--2">
          <Card
            title="Funnel kuesioner"
            subtitle="Jumlah sesi di setiap tahap · persentase dari tahap sebelumnya"
          >
            <Funnel steps={funnel} />
          </Card>
          <Card
            title="Lead per hari"
            action={
              canLeads ? (
                <Link className="smd-link" href="/admin/leads">
                  Analisis lead →
                </Link>
              ) : undefined
            }
          >
            <LeadsChart data={daily} />
            <div className="smd-tiers">
              {(['hot', 'warm', 'cold', 'survey'] as const).map((t) => (
                <StatTile
                  key={t}
                  label={TIER_META[t].label}
                  value={fmt(leads.byTier[t] ?? 0)}
                  marker={TIER_META[t].color}
                />
              ))}
            </div>
          </Card>
        </div>

        {recent && (
          <Card
            title="Lead terbaru"
            subtitle={
              leads.awaitingFollowUp
                ? `${fmt(leads.awaitingFollowUp)} lead berstatus "Baru" menunggu tindak lanjut`
                : 'Semua lead sudah ditindaklanjuti'
            }
            action={
              <Link className="smd-link" href="/admin/collections/form-submissions">
                Semua lead →
              </Link>
            }
          >
            {recent.docs.length === 0 ? (
              <p className="smd-empty">Belum ada kiriman kuesioner.</p>
            ) : (
              <table className="smd-table">
                <thead>
                  <tr>
                    <th scope="col">Waktu</th>
                    <th scope="col">Perusahaan</th>
                    <th scope="col">Bidang</th>
                    <th scope="col">Tier</th>
                    <th scope="col" className="num">
                      Skor
                    </th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.docs.map((d) => (
                    <tr key={d.id}>
                      <td>
                        {new Date(d.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Jakarta',
                        })}
                      </td>
                      <td>
                        <Link href={`/admin/collections/form-submissions/${d.id}`}>
                          {d.companyName || '(tanpa nama)'}
                        </Link>
                      </td>
                      <td>{d.industry || '—'}</td>
                      <td>
                        <TierBadge tier={d.tier} />
                      </td>
                      <td className="num">{d.score ?? 0}</td>
                      <td>{STATUS_LABEL[d.status] ?? d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {system && (
          <Card title="Kondisi sistem">
            <div className="smd-system">
              <StatTile
                label="Database"
                value={system.db.ok ? 'Terhubung' : 'Gangguan'}
                note={
                  system.db.ok
                    ? `${system.db.latencyMs} ms · ${system.db.dataMb} MB data`
                    : 'Periksa koneksi MongoDB'
                }
                marker={system.db.ok ? 'var(--smd-ok)' : 'var(--smd-critical)'}
              />
              <StatTile
                label="Aplikasi"
                value={`v${system.app.version}`}
                note={`${system.app.env} · Node ${system.app.node} · aktif ${system.app.uptimeHours} jam`}
              />
              <StatTile
                label="Media"
                value={`${fmt(system.media.files)} file`}
                note={`${system.media.totalMb} MB`}
              />
              <StatTile
                label="Email notifikasi"
                value={
                  system.email.lastStatus === 'failed'
                    ? 'Gagal'
                    : system.email.lastStatus === 'sent'
                      ? 'Terkirim'
                      : '—'
                }
                note={
                  system.email.failures7d
                    ? `${system.email.failures7d} kegagalan dalam 7 hari`
                    : 'Tidak ada kegagalan 7 hari terakhir'
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
                    <span className={`smd-logs__level smd-logs__level--${l.level}`}>
                      {l.level === 'error' ? 'Error' : 'Peringatan'}
                    </span>
                    <time>
                      {new Date(l.ts).toLocaleString('id-ID', {
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

        <Card title="Kelola konten">
          <ul className="smd-shortcuts">
            <li>
              <Link href="/admin/collections/pages">Halaman & section</Link>
            </li>
            <li>
              <Link href="/admin/collections/forms">Formulir & pertanyaan</Link>
            </li>
            <li>
              <Link href="/admin/globals/header">Header & menu</Link>
            </li>
            <li>
              <Link href="/admin/globals/footer">Footer</Link>
            </li>
            <li>
              <Link href="/admin/collections/media">Media</Link>
            </li>
            <li>
              <Link href="/admin/globals/site-settings">Pengaturan situs</Link>
            </li>
          </ul>
        </Card>
      </div>
    </Gutter>
  )
}
