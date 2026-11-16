import en from '@/i18n/messages/en.json'
import id from '@/i18n/messages/id.json'
import type { Locale } from '@/lib/cms/paths'

import type { ValidationMessages } from './validate'

const MESSAGES = { id, en } as const

/** Pesan validasi untuk dipakai di server (endpoint) — sama dengan yang dipakai wizard. */
export function validationMessages(locale: Locale): ValidationMessages {
  const e = MESSAGES[locale].form.errors
  return {
    required: e.required,
    email: e.email,
    phone: e.phone,
    maxSelections: e.maxSelections,
    invalidOption: e.invalidOption,
    otherRequired: e.otherRequired,
    tooLong: e.tooLong,
  }
}

export function yesNo(locale: Locale) {
  return { yes: MESSAGES[locale].form.yes, no: MESSAGES[locale].form.no }
}
