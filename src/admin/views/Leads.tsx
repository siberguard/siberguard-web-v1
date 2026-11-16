import Link from 'next/link'

import { getAnswerDistributions, getLeadSummary } from '@/lib/analytics/leads'
import { previousRange, relativeChange, resolveRange } from '@/lib/analytics/queries'
import { getDb } from '@/lib/analytics/storage'
import { toPublicForm } from '@/lib/forms/serialize'

import { Glyph } from '../components/icons'
import {
  BarList,
  Card,
  formatters,
  Kpi,
  NoAccess,
  PageHeader,
  RangeTabs,
  TIER_COLOR,
} from '../components/ui'
import { AdminShell, can, param, textFor, type ViewProps } from './shared'

/** /admin/leads — sebaran jawaban kuesioner & pipeline. Data agregat; ekspor hanya untuk admin/sales. */
export async function LeadsView(props: ViewProps) {
  const t = textFor(props)
  const l = t.leads
  const f = formatters(t)
  if (!can(props, 'admin', 'sales', 'viewer')) {
    return (
      <AdminShell props={props}>
        <PageHeader title={l.title} />
        <NoAccess message={l.noAccess} />
      </AdminShell>
    )
  }

  const payload = props.initPageResult.req.payload
  const db = getDb(payload)
  const range = resolveRange(param(props.searchParams, 'range'))
  const canExport = can(props, 'admin', 'sales')
  const lang = t.locale.startsWith('en') ? 'en' : 'id'

  const forms = await payload.find({
    collection: 'forms',
    depth: 0,
    limit: 20,
    sort: 'createdAt',
    locale: lang,
  })
  const formId = param(props.searchParams, 'form') ?? forms.docs[0]?.id
  const formDoc = forms.docs.find((x) => x.id === formId) ?? forms.docs[0]
  const [summary, prevSummary, distributions] = await Promise.all([
    getLeadSummary(db, range),
    getLeadSummary(db, previousRange(range)),
    formDoc ? getAnswerDistributions(db, range, toPublicForm(formDoc)) : Promise.resolve([]),
  ])

  const fromDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(range.from)
  const exportUrl = `/api/form-submissions/export?from=${fromDate}`
  const tones = { hot: 'red', warm: 'amber', cold: 'blue', survey: 'slate' } as const

  return (
    <AdminShell props={props}>
      <PageHeader
        title={l.title}
        description={formDoc ? l.subtitle(formDoc.title) : l.noForm}
        actions={
          <>
            <RangeTabs
              basePath="/admin/leads"
              active={range.preset}
              extra={formDoc ? `&form=${formDoc.id}` : ''}
              t={t}
            />
            {canExport && (
              <a className="smd-btn" href={exportUrl}>
                <Glyph name="download" size={16} />
                {l.export}
              </a>
            )}
          </>
        }
      />

      {forms.docs.length > 1 && (
        <div className="smd-filters">
          <div className="smd-filter">
            <span className="smd-filter__label">{l.form}</span>
            <div className="smd-seg" role="group" aria-label={l.form}>
              {forms.docs.map((x) => (
                <Link
                  key={x.id}
                  href={`/admin/leads?range=${range.preset}&form=${x.id}`}
                  className="smd-seg__btn smd-seg__btn--text"
                  aria-current={x.id === formDoc?.id ? 'true' : undefined}
                >
                  {x.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="smd-kpis smd-kpis--5">
        <Kpi
          t={t}
          icon="lead"
          tone="violet"
          label={l.total}
          value={f.num(summary.total)}
          note={canExport ? undefined : l.aggregate}
          delta={{ change: relativeChange(summary.total, prevSummary.total) }}
        />
        {(['hot', 'warm', 'cold', 'survey'] as const).map((tier) => (
          <Kpi
            key={tier}
            t={t}
            icon={tier === 'survey' ? 'form' : 'target'}
            tone={tones[tier]}
            label={t.tier[tier]}
            value={f.num(summary.byTier[tier] ?? 0)}
            note={summary.total ? f.pct((summary.byTier[tier] ?? 0) / summary.total) : undefined}
            delta={{
              change: relativeChange(summary.byTier[tier] ?? 0, prevSummary.byTier[tier] ?? 0),
              goodWhenUp: tier !== 'cold',
            }}
          />
        ))}
      </div>

      <div className="smd-grid smd-grid--2-1">
        <Card title={l.pipeline} subtitle={l.pipelineSub} icon="layers">
          <BarList
            t={t}
            rows={Object.keys(t.status)
              .map((k) => ({ key: t.status[k], value: summary.byStatus[k] ?? 0 }))
              .filter((r) => r.value > 0)}
            total={summary.total}
            keyLabel={t.table.status}
            valueLabel={l.lead}
          />
        </Card>
        <Card title={l.tierGuide} subtitle={l.tierGuideSub} icon="target">
          <ul className="smd-legend-list">
            {(['hot', 'warm', 'cold', 'survey'] as const).map((tier) => (
              <li key={tier}>
                <i
                  className="smd-dot"
                  style={{ background: TIER_COLOR[tier] }}
                  aria-hidden="true"
                />
                <span>
                  <strong>{t.tier[tier]}</strong> — {l[`${tier}Desc` as const]}
                </span>
              </li>
            ))}
          </ul>
          {canExport && (
            <Link className="smd-link smd-link--block" href="/admin/collections/form-submissions">
              {l.openList}
              <Glyph name="arrowRight" size={14} />
            </Link>
          )}
        </Card>
      </div>

      <div className="smd-grid smd-grid--2">
        {distributions.map((d, i) => {
          const sectionStart = i === 0 || distributions[i - 1].section !== d.section
          return (
            <Card
              key={d.name}
              className={sectionStart ? 'smd-card--section-start' : ''}
              title={d.question}
              subtitle={`${d.section} · ${l.answers(f.num(d.responses))}${d.multi ? ` · ${l.multi}` : ''}`}
            >
              <BarList
                t={t}
                rows={d.rows.map((r) => ({ key: r.label, value: r.count }))}
                total={d.responses}
                keyLabel={l.answer}
                valueLabel={l.respondents}
                empty={l.noAnswers}
              />
            </Card>
          )
        })}
      </div>
    </AdminShell>
  )
}
