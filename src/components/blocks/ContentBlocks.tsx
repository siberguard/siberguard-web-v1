import { ContentIcon, UiIcon } from '@/components/Icon'
import { SmartLink } from '@/components/SmartLink'
import type {
  CtaBannerBlock,
  FaqBlock as FaqData,
  FeatureGridBlock,
  LogoStripBlock,
  MediaSplitBlock,
  PricingBlock as PricingData,
  ProcessFlowBlock,
} from '@/payload-types'

import { Section, SectionHead } from './Section'

/** "Mengapa": pernyataan di kiri, daftar keunggulan bernomor di kanan (bukan grid kartu ikon). */
export function FeatureGrid({ block }: { block: FeatureGridBlock }) {
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container features">
        <div className="features__head">
          <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
          {block.callout && <p className="callout">{block.callout}</p>}
        </div>
        <ol className="features__list">
          {(block.items ?? []).map((item, i) => (
            <li key={item.id} className="feature">
              <span className="feature__marker" aria-hidden="true">
                {item.icon ? (
                  <ContentIcon name={item.icon} className="feature__icon" />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </span>
              <div>
                <h3 className="feature__title">{item.title}</h3>
                {item.description && <p>{item.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

export function ProcessFlow({ block }: { block: ProcessFlowBlock }) {
  const headingId = block.anchorId ? `${block.anchorId}-title` : undefined
  if (block.layout === 'vertical') {
    return (
      <Section anchorId={block.anchorId} background={block.background}>
        <div className="container steps-split">
          <SectionHead
            className="steps-split__head"
            eyebrow={block.eyebrow}
            heading={block.heading}
            lead={block.lead}
            headingId={headingId}
          />
          <ol className="steps-list" aria-labelledby={headingId}>
            {(block.steps ?? []).map((s, i) => (
              <li key={s.id} className="steps-list__item">
                <span className="steps-list__n" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>{s.title}</h3>
                  {s.description && <p>{s.description}</p>}
                  {s.tag && <code className="flow__tag">{s.tag}</code>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    )
  }
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container">
        <SectionHead
          eyebrow={block.eyebrow}
          heading={block.heading}
          lead={block.lead}
          headingId={headingId}
        />
        <ol
          className="flow"
          aria-labelledby={headingId}
          style={{ ['--steps' as string]: block.steps?.length ?? 5 }}
        >
          {(block.steps ?? []).map((s, i) => (
            <li key={s.id} className="flow__step">
              <span className="flow__n" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{s.title}</h3>
              {s.description && <p>{s.description}</p>}
              {s.tag && <code className="flow__tag">{s.tag}</code>}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

type Plan = NonNullable<PricingData['plans']>[number]

function PlanCard({ p, onHome, wide }: { p: Plan; onHome: boolean; wide: boolean }) {
  const head = (
    <header className="plan__head">
      <div className="plan__name-row">
        <h3>{p.name}</h3>
        {p.badge && (p.featured || wide) && <span className="plan__badge">{p.badge}</span>}
      </div>
      {p.audience && <p className="plan__audience">{p.audience}</p>}
    </header>
  )
  const price = (
    <div className="plan__pricing">
      <p className="plan__price">
        <strong>{p.price}</strong>
        {p.period && <span>{p.period}</span>}
      </p>
      {p.priceNote && <p className="plan__note">{p.priceNote}</p>}
    </div>
  )
  const features = (
    <ul className="plan__features">
      {(p.features ?? []).map((f) => (
        <li key={f.id}>
          <UiIcon name="check" />
          {f.text}
        </li>
      ))}
    </ul>
  )
  const cta = p.cta?.href && p.cta.label && (
    <SmartLink
      href={p.cta.href}
      onHome={onHome}
      className={`btn ${p.featured || wide ? 'btn--primary' : ''}`}
      data-track-cta={`plan:${p.name}`}
    >
      {p.cta.label}
      {wide && <UiIcon name="arrowRight" />}
    </SmartLink>
  )
  // Satu paket saja: kartu lebar dua kolom (harga + tombol di kiri, fitur di kanan).
  if (wide)
    return (
      <article className={`plan plan--wide${p.featured ? ' plan--featured' : ''}`}>
        <div className="plan__main">
          {head}
          {price}
          {cta}
        </div>
        {features}
      </article>
    )
  return (
    <article className={`plan${p.featured ? ' plan--featured' : ''}`}>
      {head}
      {price}
      {features}
      {cta}
    </article>
  )
}

export function Pricing({ block, onHome }: { block: PricingData; onHome: boolean }) {
  const addon = block.addon
  const plans = block.plans ?? []
  const wide = plans.length === 1
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
        <div className={`plans${wide ? ' plans--single' : ''}`}>
          {plans.map((p) => (
            <PlanCard key={p.id} p={p} onHome={onHome} wide={wide} />
          ))}
        </div>

        {addon?.title && (
          <div className="addon">
            {addon.label && <span className="addon__label">{addon.label}</span>}
            <p>
              <strong>{addon.title}</strong> {addon.description}
            </p>
            {addon.cta?.href && addon.cta.label && (
              <SmartLink
                href={addon.cta.href}
                onHome={onHome}
                className="btn btn--sm"
                data-track-cta={`addon:${addon.title}`}
              >
                {addon.cta.label}
              </SmartLink>
            )}
          </div>
        )}
        {block.disclaimer && <p className="fineprint">{block.disclaimer}</p>}
      </div>
    </Section>
  )
}

export function Faq({ block }: { block: FaqData }) {
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container faq">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} className="faq__head" />
        <div className="faq__list">
          {(block.items ?? []).map((item) => (
            <details key={item.id} open={Boolean(item.open)} className="faq__item">
              <summary>
                <span>{item.question}</span>
                <UiIcon name="chevronDown" className="faq__chevron" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function CtaBanner({ block, onHome }: { block: CtaBannerBlock; onHome: boolean }) {
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container cta-banner">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
        <div className="hero__cta">
          {block.primaryCta?.href && (
            <SmartLink
              href={block.primaryCta.href}
              onHome={onHome}
              className="btn btn--primary"
              data-track-cta={`cta:${block.primaryCta.label}`}
            >
              {block.primaryCta.label}
            </SmartLink>
          )}
          {block.secondaryCta?.href && (
            <SmartLink
              href={block.secondaryCta.href}
              onHome={onHome}
              className="btn"
              data-track-cta={`cta:${block.secondaryCta.label}`}
            >
              {block.secondaryCta.label}
            </SmartLink>
          )}
        </div>
      </div>
    </Section>
  )
}

export function MediaSplit({ block }: { block: MediaSplitBlock }) {
  const img = typeof block.image === 'object' ? block.image : null
  const src = img?.sizes?.wide?.url ?? img?.url
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div
        className={`container media-split${block.imagePosition === 'left' ? ' media-split--left' : ''}`}
      >
        <div>
          <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
          {(block.points?.length ?? 0) > 0 && (
            <ul className="checks">
              {block.points!.map((p) => (
                <li key={p.id}>
                  <UiIcon name="check" />
                  {p.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        {src && (
          <figure className="media-split__figure">
            <img
              src={src}
              alt={img?.alt ?? ''}
              width={img?.width ?? undefined}
              height={img?.height ?? undefined}
              loading="lazy"
            />
          </figure>
        )}
      </div>
    </Section>
  )
}

export function LogoStrip({ block }: { block: LogoStripBlock }) {
  return (
    <Section
      anchorId={block.anchorId}
      background={block.background}
      className="logo-strip"
      label={block.heading ?? undefined}
    >
      <div className="container">
        {block.heading && <p className="logo-strip__heading">{block.heading}</p>}
        <ul className="logo-strip__list">
          {(block.logos ?? []).map((l) => {
            const img = typeof l.image === 'object' ? l.image : null
            if (!img?.url) return null
            const image = <img src={img.url} alt={l.name} loading="lazy" />
            return (
              <li key={l.id}>
                {l.url ? (
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {image}
                  </a>
                ) : (
                  image
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}
