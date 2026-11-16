import type { Answers, PublicField, PublicForm, ShowWhen } from './types'

export function matchesCondition(cond: ShowWhen | undefined, answers: Answers): boolean {
  if (!cond?.field) return true
  const current = answers[cond.field]
  switch (cond.operator) {
    case 'checked':
      return current === true
    case 'unchecked':
      return current !== true
    case 'notIn': {
      const list = Array.isArray(current) ? current : current == null ? [] : [String(current)]
      return !list.some((v) => cond.values.includes(v))
    }
    case 'in':
    default: {
      const list = Array.isArray(current) ? current : current == null ? [] : [String(current)]
      return list.some((v) => cond.values.includes(v))
    }
  }
}

/**
 * Sebuah field tampil bila kondisinya terpenuhi DAN field acuannya sendiri tampil
 * (kondisi berantai). `byName` dipakai untuk menelusuri rantai acuan.
 */
export function isFieldVisible(
  field: PublicField,
  answers: Answers,
  byName: Map<string, PublicField>,
  depth = 0,
): boolean {
  if (!field.showWhen?.field) return true
  if (depth > 10) return false
  const parent = byName.get(field.showWhen.field)
  if (parent && !isFieldVisible(parent, answers, byName, depth + 1)) return false
  return matchesCondition(field.showWhen, answers)
}

export function indexFields(form: Pick<PublicForm, 'sections'>): Map<string, PublicField> {
  const map = new Map<string, PublicField>()
  for (const s of form.sections) for (const f of s.fields) map.set(f.name, f)
  return map
}

/** Buang jawaban untuk field yang sedang tersembunyi agar tidak ikut tersimpan. */
export function pruneHiddenAnswers(form: Pick<PublicForm, 'sections'>, answers: Answers): Answers {
  const byName = indexFields(form)
  const out: Answers = {}
  for (const f of byName.values()) {
    if (!isFieldVisible(f, answers, byName)) continue
    if (answers[f.name] !== undefined) out[f.name] = answers[f.name]
    const otherK = `${f.name}__other`
    if (f.allowOther && answers[otherK] !== undefined) out[otherK] = answers[otherK]
  }
  return out
}
