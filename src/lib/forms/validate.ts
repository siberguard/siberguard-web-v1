import { z } from 'zod'

import { indexFields, isFieldVisible } from './conditions'
import { OTHER_VALUE, otherKey, type Answers, type PublicField, type PublicForm } from './types'

export type ValidationMessages = {
  required: string
  email: string
  phone: string
  maxSelections: string // berisi {max}
  invalidOption: string
  otherRequired: string
  tooLong: string
}

export type FieldErrors = Record<string, string>

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{7,17}$/

/** Normalisasi nomor Indonesia ke format +62… (08xx → +628xx). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('62')) return `+${digits}`
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`
  return digits
}

function fieldSchema(field: PublicField, m: ValidationMessages): z.ZodType {
  const optionValues = (field.options ?? []).map((o) => o.value)
  const optionalText = (s: z.ZodString) =>
    field.required ? s.trim().min(1, m.required) : s.trim().optional().or(z.literal(''))

  switch (field.type) {
    case 'emailInput':
      return field.required
        ? z
            .string({ error: m.required })
            .trim()
            .min(1, m.required)
            .max(200, m.tooLong)
            .pipe(z.email(m.email))
        : z
            .union([z.literal(''), z.string().trim().max(200, m.tooLong).pipe(z.email(m.email))])
            .optional()
    case 'phoneInput':
      return field.required
        ? z.string({ error: m.required }).trim().min(1, m.required).regex(PHONE_PATTERN, m.phone)
        : z.union([z.literal(''), z.string().trim().regex(PHONE_PATTERN, m.phone)]).optional()
    case 'textareaInput':
      return optionalText(z.string({ error: m.required }).max(2000, m.tooLong))
    case 'textInput':
      return optionalText(z.string({ error: m.required }).max(200, m.tooLong))
    case 'singleChoice':
    case 'selectInput': {
      const s = z
        .string({ error: m.required })
        .refine((v) => optionValues.includes(v), m.invalidOption)
      return field.required ? s : z.union([z.literal(''), s]).optional()
    }
    case 'multiChoice': {
      const allowed = field.allowOther ? [...optionValues, OTHER_VALUE] : optionValues
      let s = z.array(
        z.string().refine((v) => allowed.includes(v), m.invalidOption),
        { error: m.required },
      )
      if (field.maxSelections)
        s = s.max(
          field.maxSelections,
          m.maxSelections.replace('{max}', String(field.maxSelections)),
        )
      return field.required ? s.min(1, m.required) : s.optional()
    }
    case 'consent':
      return field.required ? z.literal(true, { error: m.required }) : z.boolean().optional()
  }
}

/**
 * Validasi jawaban terhadap definisi form. Hanya field yang sedang tampil yang
 * divalidasi. `sectionIndex` membatasi validasi ke satu langkah wizard.
 * Fungsi yang sama dipakai di browser (per langkah) dan di server (seluruh form).
 */
export function validateAnswers(
  form: Pick<PublicForm, 'sections'>,
  answers: Answers,
  messages: ValidationMessages,
  sectionIndex?: number,
): FieldErrors {
  const byName = indexFields(form)
  const sections =
    sectionIndex === undefined ? form.sections : [form.sections[sectionIndex]].filter(Boolean)
  const errors: FieldErrors = {}

  for (const section of sections) {
    for (const field of section.fields) {
      if (!isFieldVisible(field, answers, byName)) continue
      const result = fieldSchema(field, messages).safeParse(answers[field.name])
      if (!result.success) {
        errors[field.name] = result.error.issues[0]?.message ?? messages.required
        continue
      }
      if (field.type === 'multiChoice' && field.allowOther) {
        const selected = (answers[field.name] as string[] | undefined) ?? []
        const other = String(answers[otherKey(field.name)] ?? '').trim()
        if (selected.includes(OTHER_VALUE) && !other)
          errors[otherKey(field.name)] = messages.otherRequired
        if (other.length > 200) errors[otherKey(field.name)] = messages.tooLong
      }
    }
  }
  return errors
}
