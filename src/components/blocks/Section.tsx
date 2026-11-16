import type { ReactNode } from 'react'

type SectionProps = {
  anchorId?: string | null
  background?: string | null
  className?: string
  children: ReactNode
  /** Label aksesibel bila section tidak punya judul sendiri. */
  label?: string
}

/** Pembungkus section: anchor, latar dari CMS, dan penanda untuk analytics section_view. */
export function Section({ anchorId, background, className = '', children, label }: SectionProps) {
  const bg = background === 'ink' ? 'section--ink' : background === 'muted' ? 'section--muted' : ''
  return (
    <section
      id={anchorId ?? undefined}
      data-track-section={anchorId ?? undefined}
      aria-label={label}
      className={`section ${bg} ${className}`.trim()}
    >
      {children}
    </section>
  )
}

export function SectionHead({
  eyebrow,
  heading,
  lead,
  headingId,
  className = '',
}: {
  eyebrow?: string | null
  heading?: string | null
  lead?: string | null
  headingId?: string
  className?: string
}) {
  if (!eyebrow && !heading && !lead) return null
  return (
    <div className={`section-head ${className}`.trim()}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {heading && (
        <h2 className="h2" id={headingId}>
          {heading}
        </h2>
      )}
      {lead && <p className="lead">{lead}</p>}
    </div>
  )
}
