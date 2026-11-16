import { TIER_META } from './ui'

/** Sel kolom "Tier" di daftar lead: titik warna + label (tidak bergantung warna saja). */
export const TierCell = ({ cellData }: { cellData?: string | null }) => {
  const meta = cellData ? TIER_META[cellData] : null
  if (!meta) return <span>—</span>
  return (
    <span className="smd-tier">
      <i className="smd-dot" style={{ background: meta.color }} aria-hidden="true" />
      {meta.label}
    </span>
  )
}
