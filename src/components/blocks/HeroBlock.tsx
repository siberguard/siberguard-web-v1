import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { UiIcon } from '@/components/Icon'
import { SmartLink } from '@/components/SmartLink'
import type { Locale } from '@/lib/cms/paths'
import type { HeroBlock as HeroData } from '@/payload-types'

import { AlertConsole } from './AlertConsole'

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
  const c = block.console
  const showConsole = c?.enabled !== false && (c?.events?.length ?? 0) > 0

  return (
    <section
      id={block.anchorId ?? undefined}
      data-track-section={block.anchorId ?? undefined}
      className={`hero section--ink ${showConsole ? '' : 'hero--solo'}`}
    >
      <div className="container hero__grid">
        <div className="hero__copy">
          {block.statusText && <p className="hero__status">{block.statusText}</p>}
          <h1 className="hero__title">{withHighlight(block.heading, block.highlight)}</h1>
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
        {showConsole && (
          <AlertConsole
            title={c?.title}
            badge={c?.badge}
            locale={locale}
            ariaLabel={t('consoleLabel')}
            events={(c?.events ?? []).map((e) => ({
              severity: e.severity,
              title: e.title,
              technique: e.technique,
              host: e.host,
            }))}
            metrics={(c?.metrics ?? []).map((m) => ({
              label: m.label,
              value: m.value,
              animate: m.animate,
            }))}
          />
        )}
      </div>
      {(block.stats?.length ?? 0) > 0 && (
        <div className="hero__stats">
          <dl className="container hero__stats-grid">
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
