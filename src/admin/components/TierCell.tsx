'use client'

import { useTranslation } from '@payloadcms/ui'

import { adminText } from '../i18n'

const COLOR: Record<string, string> = {
  hot: 'var(--smd-tier-hot)',
  warm: 'var(--smd-tier-warm)',
  cold: 'var(--smd-tier-cold)',
  survey: 'var(--smd-tier-survey)',
}

/** Sel kolom "Tier" di daftar lead: titik warna + label (tidak bergantung warna saja). */
export const TierCell = ({ cellData }: { cellData?: string | null }) => {
  const { i18n } = useTranslation()
  const t = adminText(i18n.language)
  if (!cellData) return <span>—</span>
  return (
    <span className={`smd-pill smd-pill--tier-${cellData}`}>
      <i className="smd-dot" style={{ background: COLOR[cellData] }} aria-hidden="true" />
      {t.tier[cellData] ?? cellData}
    </span>
  )
}
