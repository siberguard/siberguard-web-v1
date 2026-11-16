import type { Db } from 'mongodb'

import type { PublicForm } from '@/lib/forms/types'

import type { Range } from './queries'
import { SUBMISSIONS_COLLECTION } from './storage'

const subs = (db: Db) => db.collection(SUBMISSIONS_COLLECTION)

export type LeadSummary = {
  total: number
  byTier: Record<string, number>
  byStatus: Record<string, number>
  /** Lead berstatus "Baru" yang bisa dihubungi (bukan tier survei), tanpa batas tanggal. */
  awaitingFollowUp: number
}

export async function getLeadSummary(db: Db, range: Range): Promise<LeadSummary> {
  const [res] = await subs(db)
    .aggregate([
      { $match: { createdAt: { $gte: range.from, $lt: range.to } } },
      {
        $facet: {
          total: [{ $count: 'n' }],
          tier: [{ $group: { _id: '$tier', n: { $sum: 1 } } }],
          status: [{ $group: { _id: '$status', n: { $sum: 1 } } }],
        },
      },
    ])
    .toArray()
  const awaitingFollowUp = await subs(db).countDocuments({ status: 'new', tier: { $ne: 'survey' } })
  const toMap = (rows: { _id: string; n: number }[] = []) =>
    Object.fromEntries(rows.map((r) => [r._id ?? '-', r.n]))
  return {
    total: res?.total?.[0]?.n ?? 0,
    byTier: toMap(res?.tier),
    byStatus: toMap(res?.status),
    awaitingFollowUp,
  }
}

export type Distribution = {
  name: string
  section: string
  question: string
  multi: boolean
  responses: number
  rows: { value: string; label: string; count: number }[]
}

/** Sebaran jawaban untuk setiap pertanyaan pilihan (label diambil dari form versi terkini). */
export async function getAnswerDistributions(
  db: Db,
  range: Range,
  form: PublicForm,
): Promise<Distribution[]> {
  const choiceFields = form.sections.flatMap((s) =>
    s.fields
      .filter((f) => ['singleChoice', 'multiChoice', 'selectInput'].includes(f.type))
      .map((f) => ({ section: s.title, field: f })),
  )
  if (!choiceFields.length) return []

  const facets = Object.fromEntries(
    choiceFields.map(({ field }) => [
      field.name,
      [
        { $project: { v: `$answers.${field.name}` } },
        { $match: { v: { $exists: true, $nin: [null, '', []] } } },
        ...(field.type === 'multiChoice' ? [{ $unwind: '$v' }] : []),
        { $group: { _id: '$v', n: { $sum: 1 } } },
      ],
    ]),
  )
  const responses = Object.fromEntries(
    choiceFields.map(({ field }) => [
      `${field.name}__n`,
      [
        { $match: { [`answers.${field.name}`]: { $exists: true, $nin: [null, '', []] } } },
        { $count: 'n' },
      ],
    ]),
  )

  const [res] = await subs(db)
    .aggregate([
      { $match: { createdAt: { $gte: range.from, $lt: range.to }, form: { $exists: true } } },
      { $facet: { ...facets, ...responses } },
    ])
    .toArray()

  return choiceFields.map(({ section, field }) => {
    const counts = new Map<string, number>(
      ((res?.[field.name] ?? []) as { _id: string; n: number }[]).map((r) => [r._id, r.n]),
    )
    const options = [...(field.options ?? [])]
    if (field.allowOther) options.push({ value: 'lainnya', label: field.otherLabel || 'Lainnya' })
    return {
      name: field.name,
      section,
      question: field.label,
      multi: field.type === 'multiChoice',
      responses: res?.[`${field.name}__n`]?.[0]?.n ?? 0,
      rows: options.map((o) => ({
        value: o.value,
        label: o.label,
        count: counts.get(o.value) ?? 0,
      })),
    }
  })
}
