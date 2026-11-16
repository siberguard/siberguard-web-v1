import Link from 'next/link'

import { getAnswerDistributions, getLeadSummary } from '@/lib/analytics/leads'
import { resolveRange } from '@/lib/analytics/queries'
import { getDb } from '@/lib/analytics/storage'
import { toPublicForm } from '@/lib/forms/serialize'

import {
  BarList,
  Card,
  fmt,
  NoAccess,
  PageHeader,
  RangeTabs,
  STATUS_LABEL,
  StatTile,
  TIER_META,
} from '../components/ui'
import { AdminShell, can, param, type ViewProps } from './shared'

/** /admin/leads — sebaran jawaban kuesioner & pipeline. Data agregat; ekspor hanya untuk admin/sales. */
export async function LeadsView(props: ViewProps) {
  if (!can(props, 'admin', 'sales', 'viewer')) {
    return (
      <AdminShell props={props}>
        <PageHeader title="Analisis lead" />
        <NoAccess message="Peran Anda tidak memiliki akses ke data lead." />
      </AdminShell>
    )
  }

  const payload = props.initPageResult.req.payload
  const db = getDb(payload)
  const range = resolveRange(param(props.searchParams, 'range'))
  const canExport = can(props, 'admin', 'sales')

  const forms = await payload.find({
    collection: 'forms',
    depth: 0,
    limit: 20,
    sort: 'createdAt',
    locale: 'id',
  })
  const formId = param(props.searchParams, 'form') ?? forms.docs[0]?.id
  const formDoc = forms.docs.find((f) => f.id === formId) ?? forms.docs[0]
  const [summary, distributions] = await Promise.all([
    getLeadSummary(db, range),
    formDoc ? getAnswerDistributions(db, range, toPublicForm(formDoc)) : Promise.resolve([]),
  ])

  const fromDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(range.from)
  const exportUrl = `/api/form-submissions/export?from=${fromDate}`

  return (
    <AdminShell props={props}>
      <PageHeader
        title="Analisis lead"
        description={
          formDoc
            ? `Sebaran jawaban "${formDoc.title}" (label sesuai versi formulir saat ini).`
            : 'Belum ada formulir.'
        }
        actions={
          <>
            <RangeTabs
              basePath="/admin/leads"
              active={range.preset}
              extra={formDoc ? `&form=${formDoc.id}` : ''}
            />
            {canExport && (
              <a className="btn btn--style-secondary btn--size-small smd-btn" href={exportUrl}>
                Ekspor CSV
              </a>
            )}
          </>
        }
      />

      {forms.docs.length > 1 && (
        <div className="smd-filters">
          <div className="smd-filter" role="group" aria-label="Formulir">
            <span>Formulir</span>
            {forms.docs.map((f) => (
              <Link
                key={f.id}
                href={`/admin/leads?range=${range.preset}&form=${f.id}`}
                aria-current={f.id === formDoc?.id ? 'true' : undefined}
              >
                {f.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="smd-stats">
        <StatTile
          label="Total lead"
          value={fmt(summary.total)}
          note={canExport ? undefined : 'Data agregat'}
        />
        {(['hot', 'warm', 'cold', 'survey'] as const).map((t) => (
          <StatTile
            key={t}
            label={TIER_META[t].label}
            value={fmt(summary.byTier[t] ?? 0)}
            marker={TIER_META[t].color}
          />
        ))}
      </div>

      <div className="smd-grid smd-grid--2-1">
        <Card
          title="Cara membaca tier"
          subtitle="Skor dihitung dari bobot jawaban yang diatur di Formulir → Notifikasi & skor"
        >
          <ul className="smd-legend-list">
            <li>
              <i className="smd-dot" style={{ background: TIER_META.hot.color }} />{' '}
              <strong>Hot</strong> — skor ≥ ambang Hot dan bersedia dihubungi. Prioritaskan.
            </li>
            <li>
              <i className="smd-dot" style={{ background: TIER_META.warm.color }} />{' '}
              <strong>Warm</strong> — minat ada, perlu edukasi atau penawaran.
            </li>
            <li>
              <i className="smd-dot" style={{ background: TIER_META.cold.color }} />{' '}
              <strong>Cold</strong> — minat atau kesiapan rendah.
            </li>
            <li>
              <i className="smd-dot" style={{ background: TIER_META.survey.color }} />{' '}
              <strong>Survei</strong> — tidak bersedia dihubungi; dipakai sebagai data riset pasar.
            </li>
          </ul>
          {canExport && (
            <p className="smd-muted">
              <Link href="/admin/collections/form-submissions">Buka daftar lead →</Link>
            </p>
          )}
        </Card>
        <Card title="Pipeline" subtitle="Status tindak lanjut lead pada rentang ini">
          <BarList
            rows={Object.entries(STATUS_LABEL)
              .map(([k, label]) => ({ key: label, value: summary.byStatus[k] ?? 0 }))
              .filter((r) => r.value > 0)}
            total={summary.total}
            keyLabel="Status"
            valueLabel="Lead"
          />
        </Card>
      </div>

      <div className="smd-grid smd-grid--2">
        {distributions.map((d, i) => {
          const showSection = i === 0 || distributions[i - 1].section !== d.section
          return (
            <Card
              key={d.name}
              className={showSection ? 'smd-card--section-start' : ''}
              title={d.question}
              subtitle={`${d.section} · ${fmt(d.responses)} jawaban${d.multi ? ' · bisa lebih dari satu pilihan' : ''}`}
            >
              <BarList
                rows={d.rows.map((r) => ({ key: r.label, value: r.count }))}
                total={d.responses}
                keyLabel="Jawaban"
                valueLabel="Responden"
                empty="Belum ada jawaban."
              />
            </Card>
          )
        })}
      </div>
    </AdminShell>
  )
}
