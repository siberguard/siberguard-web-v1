import { getTranslations } from 'next-intl/server'

import { FormWizard, type WizardMessages } from '@/components/form/FormWizard'
import { UiIcon } from '@/components/Icon'
import type { Locale } from '@/lib/cms/paths'
import { getUiLabels } from '@/lib/cms/queries'
import { toPublicForm } from '@/lib/forms/serialize'
import type { DeployAgentBlock, Form, FormSectionBlock, ServicesBlock } from '@/payload-types'

import { AgentTerminal } from './AgentTerminal'
import { Section, SectionHead } from './Section'
import { ServicesCatalog } from './ServicesCatalog'

export async function Services({ block, locale }: { block: ServicesBlock; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'a11y' })
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
        <ServicesCatalog
          allLabel={block.allLabel}
          filterLabel={t('serviceFilter')}
          categories={(block.categories ?? []).map((c) => ({ key: c.key, label: c.label }))}
          items={(block.items ?? []).map((s) => ({
            id: s.id ?? s.name,
            category: s.category,
            name: s.name,
            description: s.description,
            points: (s.points ?? []).map((p) => p.text),
          }))}
        />
      </div>
    </Section>
  )
}

export async function DeployAgent({ block, locale }: { block: DeployAgentBlock; locale: Locale }) {
  const [t, labels] = await Promise.all([
    getTranslations({ locale, namespace: 'a11y' }),
    getUiLabels(locale),
  ])
  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container">
        <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
        <div className="deploy">
          <ol className="deploy__steps">
            {(block.steps ?? []).map((s, i) => (
              <li key={s.id}>
                <span className="deploy__n" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{s.title}</h3>
                  {s.description && <p>{s.description}</p>}
                </div>
              </li>
            ))}
          </ol>
          <AgentTerminal
            tabsLabel={t('osTabs')}
            labels={{ copy: labels.copy, copied: labels.copied, copyFallback: labels.copyFallback }}
            platforms={(block.platforms ?? []).map((p) => ({
              name: p.name,
              commands: (p.commands ?? []).map((c) => ({
                label: c.label,
                prompt: c.prompt,
                code: c.code,
                output: c.output,
              })),
              requirements: (p.requirements ?? []).map((r) => ({ label: r.label, value: r.value })),
            }))}
          />
        </div>
        {block.note && <p className="fineprint">{block.note}</p>}
      </div>
    </Section>
  )
}

export async function FormSection({ block, locale }: { block: FormSectionBlock; locale: Locale }) {
  const formDoc = typeof block.form === 'object' ? (block.form as Form) : null
  if (!formDoc) return null
  // Hanya bentuk publik (tanpa skor & email notifikasi) yang dikirim ke browser.
  const form = toPublicForm(formDoc)
  const [labels, t] = await Promise.all([
    getUiLabels(locale),
    getTranslations({ locale, namespace: 'form' }),
  ])
  const messages: WizardMessages = {
    required: t('errors.required'),
    email: t('errors.email'),
    phone: t('errors.phone'),
    maxSelections: t.raw('errors.maxSelections') as string,
    invalidOption: t('errors.invalidOption'),
    otherRequired: t('errors.otherRequired'),
    tooLong: t('errors.tooLong'),
    summary: t('errors.summary'),
    network: t('errors.network'),
    rateLimited: t('errors.rateLimited'),
    server: t('errors.server'),
    outdated: t('errors.outdated'),
    honeypot: t('honeypot'),
    progress: t('progress'),
  }
  const wizard = (
    <FormWizard
      form={form}
      locale={locale}
      showHeader={block.layout !== 'full'}
      turnstileSiteKey={process.env.TURNSTILE_SITE_KEY || undefined}
      messages={messages}
      labels={{
        back: labels.back,
        next: labels.next,
        submit: labels.submit,
        submitting: labels.submitting,
        stepOf: labels.stepOf,
        optional: labels.optional,
        chooseUpTo: labels.chooseUpTo,
        otherPlaceholder: labels.otherPlaceholder,
        draftRestored: labels.draftRestored,
        startOver: labels.startOver,
      }}
    />
  )

  if (block.layout === 'full') {
    return (
      <Section anchorId={block.anchorId} background={block.background} className="form-page">
        <div className="container form-page__inner">
          <header className="form-page__head">
            {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
            <h1 className="form-page__title">{block.heading}</h1>
            {block.lead && <p className="lead">{block.lead}</p>}
            {form.estimatedTime && <p className="form-page__meta">{form.estimatedTime}</p>}
          </header>
          <div className="form-card">{wizard}</div>
        </div>
      </Section>
    )
  }

  return (
    <Section anchorId={block.anchorId} background={block.background}>
      <div className="container register">
        <div className="register__copy">
          <SectionHead eyebrow={block.eyebrow} heading={block.heading} lead={block.lead} />
          {(block.checklist?.length ?? 0) > 0 && (
            <ul className="checks">
              {block.checklist!.map((c) => (
                <li key={c.id}>
                  <UiIcon name="check" />
                  {c.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="form-card">{wizard}</div>
      </div>
    </Section>
  )
}
