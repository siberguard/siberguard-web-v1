import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { UiIcon } from '@/components/Icon'
import { SmartLink } from '@/components/SmartLink'
import type { Locale } from '@/lib/cms/paths'
import type { HeroBlock as HeroData, Media } from '@/payload-types'

import { HeroCarousel, type HeroSlide } from './HeroCarousel'

/** Tonjolkan kata kunci di judul (tanpa HTML dari CMS). */
function withHighlight(text: string, highlight?: string | null): ReactNode {
  if (!highlight) return text
  const i = text.indexOf(highlight)
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <em>{highlight}</em>
      {text.slice(i + highlight.length)}
    </>
  )
}

/** Gambar slide: versi `card` (960px) sebagai default, `wide` untuk layar padat piksel. */
function slideImage(image: string | Media | null | undefined): HeroSlide['image'] {
  if (!image || typeof image !== 'object' || !image.url) return null
  const card = image.sizes?.card
  const wide = image.sizes?.wide
  const srcSet = [
    card?.url && card.width ? `${card.url} ${card.width}w` : null,
    wide?.url && wide.width ? `${wide.url} ${wide.width}w` : null,
  ]
    .filter(Boolean)
    .join(', ')
  return {
    src: card?.url ?? image.url,
    srcSet: srcSet || undefined,
    alt: image.alt ?? '',
    width: card?.width ?? image.width ?? undefined,
    height: card?.height ?? image.height ?? undefined,
  }
}

export async function HeroBlock({
  block,
  locale,
  onHome,
}: {
  block: HeroData
  locale: Locale
  onHome: boolean
}) {
  const t = await getTranslations({ locale, namespace: 'a11y' })
  const c = block.carousel
  const slides: HeroSlide[] = (c?.slides ?? []).map((s, i) => ({
    id: s.id ?? String(i),
    image: slideImage(s.image),
    visual: s.visual,
    tag: s.tag,
    title: s.title,
    text: s.text,
    link: s.link,
  }))
  const showCarousel = c?.enabled !== false && slides.length > 0
  const ink = block.background === 'ink'

  return (
    <section
      id={block.anchorId ?? undefined}
      data-track-section={block.anchorId ?? undefined}
      className={`hero${ink ? ' hero--ink section--ink' : ''}${showCarousel ? '' : ' hero--solo'}`}
    >
      <div className="container hero__grid">
        <div className="hero__copy">
          <h1 className="hero__title">{withHighlight(block.heading, block.highlight)}</h1>
          {block.tagline && <p className="hero__tagline">{block.tagline}</p>}
          {block.lead && <p className="hero__lead">{block.lead}</p>}
          <div className="hero__cta">
            {block.primaryCta?.href && block.primaryCta.label && (
              <SmartLink
                href={block.primaryCta.href}
                onHome={onHome}
                className="btn btn--primary"
                data-track-cta={`hero:${block.primaryCta.label}`}
              >
                {block.primaryCta.label}
                <UiIcon name="arrowRight" />
              </SmartLink>
            )}
            {block.secondaryCta?.href && block.secondaryCta.label && (
              <SmartLink
                href={block.secondaryCta.href}
                onHome={onHome}
                className="btn"
                data-track-cta={`hero:${block.secondaryCta.label}`}
              >
                {block.secondaryCta.label}
              </SmartLink>
            )}
          </div>
        </div>
        {showCarousel && (
          <HeroCarousel
            slides={slides}
            autoplay={c?.autoplay !== false}
            interval={Math.min(20, Math.max(3, c?.interval ?? 6))}
            onHome={onHome}
            labels={{
              region: t('carousel.region'),
              slide: t.raw('carousel.slide') as string,
              prev: t('carousel.prev'),
              next: t('carousel.next'),
              pause: t('carousel.pause'),
              play: t('carousel.play'),
              goTo: t.raw('carousel.goTo') as string,
            }}
          />
        )}
      </div>
      {(block.stats?.length ?? 0) > 0 && (
        <div className="container hero__stats">
          <dl className="hero__stats-grid" data-count={block.stats!.length}>
            {block.stats!.map((s) => (
              <div key={s.id} className="hero__stat">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
