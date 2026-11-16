import type { Form } from '@/payload-types'

import type { FieldType, PublicField, PublicForm, ShowWhen } from './types'

type RawField = NonNullable<NonNullable<Form['sections']>[number]['fields']>[number]

function toShowWhen(raw: RawField['showWhen']): ShowWhen | undefined {
  if (!raw?.field) return undefined
  return {
    field: raw.field,
    operator: raw.operator ?? 'in',
    values: String(raw.values ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  }
}

function toPublicField(raw: RawField): PublicField {
  const base: PublicField = {
    type: raw.blockType as FieldType,
    name: raw.name,
    label: raw.label,
    helpText: raw.helpText ?? undefined,
    required: Boolean(raw.required),
    width: raw.width === 'half' ? 'half' : 'full',
    showWhen: toShowWhen(raw.showWhen),
  }
  if ('placeholder' in raw && raw.placeholder) base.placeholder = raw.placeholder
  if ('options' in raw && raw.options) {
    // Skor sengaja tidak ikut dikirim ke browser.
    base.options = raw.options.map((o) => ({ label: o.label, value: o.value }))
  }
  if (raw.blockType === 'multiChoice') {
    base.maxSelections = raw.maxSelections ?? undefined
    base.allowOther = Boolean(raw.allowOther)
    base.otherLabel = raw.otherLabel ?? undefined
  }
  return base
}

/** Dokumen `forms` → bentuk publik yang aman dikirim ke browser. */
export function toPublicForm(doc: Form): PublicForm {
  return {
    id: doc.id,
    slug: doc.slug,
    version: doc.version ?? 1,
    title: doc.title,
    intro: doc.intro ?? undefined,
    estimatedTime: doc.estimatedTime ?? undefined,
    submitLabel: doc.submitLabel ?? undefined,
    successTitle: doc.successTitle ?? undefined,
    successMessage: doc.successMessage ?? undefined,
    privacyNote: doc.privacyNote ?? undefined,
    sections: (doc.sections ?? []).map((s) => ({
      key: s.key,
      title: s.title,
      description: s.description ?? undefined,
      fields: (s.fields ?? []).map(toPublicField),
    })),
  }
}
