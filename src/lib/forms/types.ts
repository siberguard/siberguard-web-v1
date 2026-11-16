/**
 * Bentuk formulir yang aman dikirim ke browser: tanpa skor opsi dan tanpa
 * pengaturan notifikasi. Dibuat dari dokumen `forms` lewat `toPublicForm`.
 */
export type FieldType =
  | 'textInput'
  | 'textareaInput'
  | 'emailInput'
  | 'phoneInput'
  | 'singleChoice'
  | 'multiChoice'
  | 'selectInput'
  | 'consent'

export type ShowWhen = {
  field: string
  operator: 'in' | 'notIn' | 'checked' | 'unchecked'
  values: string[]
}

export type PublicOption = { label: string; value: string }

export type PublicField = {
  type: FieldType
  name: string
  label: string
  helpText?: string
  placeholder?: string
  required: boolean
  width: 'full' | 'half'
  showWhen?: ShowWhen
  options?: PublicOption[]
  maxSelections?: number
  allowOther?: boolean
  otherLabel?: string
}

export type PublicSection = {
  key: string
  title: string
  description?: string
  fields: PublicField[]
}

export type PublicForm = {
  id: string
  slug: string
  version: number
  title: string
  intro?: string
  estimatedTime?: string
  submitLabel?: string
  successTitle?: string
  successMessage?: string
  privacyNote?: string
  sections: PublicSection[]
}

/** Nilai jawaban: teks, pilihan tunggal, daftar pilihan, atau centang. */
export type AnswerValue = string | string[] | boolean
export type Answers = Record<string, AnswerValue | undefined>

export const OTHER_VALUE = 'lainnya'
export const otherKey = (name: string) => `${name}__other`
