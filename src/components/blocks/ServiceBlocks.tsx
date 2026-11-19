import { getTranslations } from 'next-intl/server'

import { ContentIcon, UiIcon } from '@/components/Icon'
import type { Locale } from '@/lib/cms/paths'
import type { ChallengesBlock, CoverageBlock, ServiceLevelBlock } from '@/payload-types'

import { Section, SectionHead } from './Section'

/** "Mengapa": tiap baris memasangkan tantangan umum dengan manfaat layanan. */
export async function Challenges({ block, locale }: { block: ChallengesBlock; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'a11y' })
  const challengeLabel = block.challengeLabel || t('challenge')
  const benefitLabel = block.benefitLabel || t('benefit')
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
        <div className="pairs">
          <div className="pairs__head" aria-hidden="true">
            <span>{challengeLabel}</span>
            <span>{benefitLabel}</span>
          </div>
          <ul className="pairs__list">
            {(block.items ?? []).map((item) => (
              <li key={item.id} className="pair">
                <p className="pair__challenge">
                  <span className="pair__icon" aria-hidden="true">
                    <ContentIcon name="alert" />
                  </span>
                  <span>
                    <span className="sr-only">{challengeLabel}: </span>
                    {item.challenge}
                  </span>
                </p>
                <span className="pair__arrow" aria-hidden="true">
                  <UiIcon name="arrowRight" />
                </span>
                <p className="pair__benefit">
                  <span className="pair__icon pair__icon--ok" aria-hidden="true">
                    <UiIcon name="check" />
                  </span>
                  <span>
                    <span className="sr-only">{benefitLabel}: </span>
                    {item.benefit}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

/** Cakupan: perangkat yang dipantau di kiri, batasan paket di kanan. */
export function Coverage({ block }: { block: CoverageBlock }) {
  const inc = block.included
  const exc = block.excluded
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
        <div className="coverage">
          <div className="coverage__card">
            {inc?.title && <h3 className="coverage__title">{inc.title}</h3>}
            {(inc?.platforms?.length ?? 0) > 0 && (
              <ul className="coverage__os">
                {inc!.platforms!.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            )}
            {(inc?.items?.length ?? 0) > 0 && (
              <ul className="coverage__devices">
                {inc!.items!.map((d) => (
                  <li key={d.id}>
                    <span className="coverage__device-icon" aria-hidden="true">
                      <ContentIcon name={d.icon} />
                    </span>
                    {d.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {(exc?.title || (exc?.items?.length ?? 0) > 0) && (
            <div className="coverage__card coverage__card--out">
              {exc?.title && <h3 className="coverage__title">{exc.title}</h3>}
              <ul className="coverage__out">
                {(exc?.items ?? []).map((x) => (
                  <li key={x.id}>
                    <UiIcon name="minus" />
                    {x.text}
                  </li>
                ))}
              </ul>
              {exc?.note && (
                <p className="coverage__note">
                  <UiIcon name="info" />
                  <span>{exc.note}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

/** Senin = 1 … Minggu = 7, nama hari pendek mengikuti bahasa halaman. */
function weekdayNames(locale: Locale) {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
  // 1 Januari 2024 jatuh pada hari Senin.
  return Array.from({ length: 7 }, (_, i) => fmt.format(Date.UTC(2024, 0, 1 + i)))
}

/** Jam layanan analis + target respons per prioritas alert. */
export function ServiceLevel({ block, locale }: { block: ServiceLevelBlock; locale: Locale }) {
  const hours = block.hours
  const active = new Set<string>(hours?.activeDays ?? [])

  const days = weekdayNames(locale)
  const rows = block.priorities ?? []
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
        <div className="sla">
          {hours && (hours.value || hours.days || hours.time) && (
            <div className="sla__hours">
              <div className="sla__headline">
                {hours.value && <p className="sla__value">{hours.value}</p>}
                {hours.label && <p className="sla__label">{hours.label}</p>}
              </div>
              {active.size > 0 && (
                <ol className="week" aria-hidden="true">
                  {days.map((d, i) => (
                    <li key={d} className={active.has(String(i + 1)) ? 'is-on' : undefined}>
                      {d}
                    </li>
                  ))}
                </ol>
              )}
              <ul className="sla__when">
                {hours.days && (
                  <li>
                    <ContentIcon name="calendar" />
                    {hours.days}
                  </li>
                )}
                {hours.time && (
                  <li>
                    <ContentIcon name="clock" />
                    {hours.time}
                  </li>
                )}
              </ul>
            </div>
          )}
          {rows.length > 0 && (
            <div className="sla__table-card">
              <table className="sla__table">
                <thead>
                  <tr>
                    <th scope="col">{block.priorityLabel}</th>
                    <th scope="col">{block.targetLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <th scope="row">
                        <span className={`sev sev--${r.level ?? 'medium'}`} aria-hidden="true" />
                        {r.label}
                      </th>
                      <td>{r.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {block.note && <p className="fineprint">{block.note}</p>}
      </div>
    </Section>
  )
}
