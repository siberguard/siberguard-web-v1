import type { Form } from '@/payload-types'

import type { Answers } from './types'

export type Tier = 'hot' | 'warm' | 'cold' | 'survey'
export type ScoreResult = { score: number; maxScore: number; tier: Tier }

type ChoiceField = {
  blockType: string
  name: string
  maxSelections?: number | null
  options?: { value: string; score?: number | null }[] | null
}

/**
 * Skor lead = jumlah skor opsi yang dipilih (pilihan ganda: dijumlahkan).
 * Skor maksimum dihitung teoretis dari semua pertanyaan pilihan.
 * Tanpa persetujuan dihubungi → tier "survey" berapa pun skornya.
 */
export function scoreAnswers(form: Form, answers: Answers): ScoreResult {
  let score = 0
  let maxScore = 0
  for (const section of form.sections ?? []) {
    for (const raw of section.fields ?? []) {
      const field = raw as ChoiceField
      if (!field.options?.length) continue
      const scores = new Map(field.options.map((o) => [o.value, o.score ?? 0]))
      if (field.blockType === 'multiChoice') {
        const sorted = [...scores.values()].filter((s) => s > 0).sort((a, b) => b - a)
        maxScore += sorted.slice(0, field.maxSelections ?? sorted.length).reduce((a, b) => a + b, 0)
        const picked = answers[field.name]
        if (Array.isArray(picked)) score += picked.reduce((sum, v) => sum + (scores.get(v) ?? 0), 0)
      } else {
        maxScore += Math.max(0, ...scores.values())
        const picked = answers[field.name]
        if (typeof picked === 'string') score += scores.get(picked) ?? 0
      }
    }
  }

  const settings = form.settings ?? {}
  const consentField = settings.contactConsentField
  let tier: Tier
  if (consentField && answers[consentField] !== true) tier = 'survey'
  else if (score >= (settings.hotMin ?? 17)) tier = 'hot'
  else if (score >= (settings.warmMin ?? 10)) tier = 'warm'
  else tier = 'cold'

  return { score, maxScore, tier }
}
