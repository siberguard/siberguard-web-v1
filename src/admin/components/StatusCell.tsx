'use client'

import { useTranslation } from '@payloadcms/ui'

import { adminText } from '../i18n'

/** Sel kolom "Status" di daftar lead: pill berwarna lembut + label sesuai bahasa admin. */
export const StatusCell = ({ cellData }: { cellData?: string | null }) => {
  const { i18n } = useTranslation()
  const t = adminText(i18n.language)
  if (!cellData) return <span>—</span>
  return (
    <span className={`smd-pill smd-pill--status smd-pill--${cellData}`}>
      {t.status[cellData] ?? cellData}
    </span>
  )
}
