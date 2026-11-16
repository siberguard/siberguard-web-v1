import { indexFields, isFieldVisible } from './conditions'
import { OTHER_VALUE, otherKey, type Answers, type PublicForm } from './types'

export type SnapshotRow = { section: string; name: string; question: string; answer: string }

/**
 * Salinan pertanyaan & label jawaban saat dikirim. Disimpan bersama lead agar
 * tetap terbaca walaupun pertanyaan/opsi di CMS diubah kemudian hari.
 */
export function buildSnapshot(
  form: PublicForm,
  answers: Answers,
  yesNo = { yes: 'Ya', no: 'Tidak' },
): SnapshotRow[] {
  const byName = indexFields(form)
  const rows: SnapshotRow[] = []
  for (const section of form.sections) {
    for (const field of section.fields) {
      if (!isFieldVisible(field, answers, byName)) continue
      const value = answers[field.name]
      const labelOf = (v: string) =>
        v === OTHER_VALUE
          ? `${field.otherLabel || 'Lainnya'}: ${String(answers[otherKey(field.name)] ?? '').trim()}`
          : (field.options?.find((o) => o.value === v)?.label ?? v)

      let answer = ''
      if (field.type === 'consent') answer = value === true ? yesNo.yes : yesNo.no
      else if (Array.isArray(value)) answer = value.map(labelOf).join('; ')
      else if (typeof value === 'string' && field.options) answer = value ? labelOf(value) : ''
      else answer = value == null ? '' : String(value)

      rows.push({ section: section.title, name: field.name, question: field.label, answer })
    }
  }
  return rows
}
