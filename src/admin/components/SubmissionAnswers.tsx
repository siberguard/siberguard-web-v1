'use client'

import { useFormFields, useTranslation } from '@payloadcms/ui'

import { adminText } from '../i18n'

type Row = { section: string; name: string; question: string; answer: string }

/** Jawaban kuesioner yang mudah dibaca, dikelompokkan per bagian (dari snapshot saat dikirim). */
export const SubmissionAnswers = () => {
  const snapshot = useFormFields(([fields]) => fields.snapshot?.value) as Row[] | undefined
  const { i18n } = useTranslation()
  const t = adminText(i18n.language)
  if (!Array.isArray(snapshot) || snapshot.length === 0) return null

  const sections: { title: string; rows: Row[] }[] = []
  for (const row of snapshot) {
    const last = sections[sections.length - 1]
    if (last && last.title === row.section) last.rows.push(row)
    else sections.push({ title: row.section, rows: [row] })
  }

  return (
    <div className="smd-answers">
      <h3 className="smd-answers__title">{t.submission.answers}</h3>
      {sections.map((s) => (
        <section key={s.title} className="smd-answers__section">
          <h4>{s.title}</h4>
          <dl>
            {s.rows.map((r) => (
              <div key={r.name}>
                <dt>{r.question}</dt>
                <dd>{r.answer || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
