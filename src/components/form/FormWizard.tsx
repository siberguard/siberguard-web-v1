'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { UiIcon } from '@/components/Icon'
import { flush, sessionId, track } from '@/lib/analytics/client'
import { indexFields, isFieldVisible } from '@/lib/forms/conditions'
import type { AnswerValue, Answers, PublicForm } from '@/lib/forms/types'
import { validateAnswers, type FieldErrors, type ValidationMessages } from '@/lib/forms/validate'

import { fieldId, FormField, type FieldLabels } from './fields'

export type WizardLabels = FieldLabels & {
  back: string
  next: string
  submit: string
  submitting: string
  stepOf: string
  draftRestored: string
  startOver: string
}

export type WizardMessages = ValidationMessages & {
  summary: string
  network: string
  rateLimited: string
  server: string
  outdated: string
  honeypot: string
  progress: string
}

type Props = {
  form: PublicForm
  locale: 'id' | 'en'
  labels: WizardLabels
  messages: WizardMessages
  turnstileSiteKey?: string
  /** Tampilkan judul & intro form di dalam kartu (layout dua kolom). */
  showHeader?: boolean
}

type Draft = { step: number; answers: Answers }

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
    }
  }
}

function readAttribution() {
  try {
    const utm = JSON.parse(sessionStorage.getItem('sm_utm') ?? '{}') as {
      s?: string
      m?: string
      c?: string
    }
    return {
      utmSource: utm.s,
      utmMedium: utm.m,
      utmCampaign: utm.c,
      referrer: sessionStorage.getItem('sm_ref') ?? undefined,
      landingPath: sessionStorage.getItem('sm_landed') ?? undefined,
    }
  } catch {
    return {}
  }
}

export function FormWizard({
  form,
  locale,
  labels,
  messages,
  turnstileSiteKey,
  showHeader = true,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const draftKey = `sm-form:${form.slug}:v${form.version}`
  const total = form.sections.length
  const byName = useMemo(() => indexFields(form), [form])

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)
  const [token, setToken] = useState<string | undefined>()

  const root = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const viewedAt = useRef<number>(0)
  const started = useRef(false)
  const turnstileEl = useRef<HTMLDivElement>(null)

  // Pulihkan draft dari kunjungan sebelumnya (khusus versi form yang sama).
  useEffect(() => {
    viewedAt.current = Date.now()
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const draft = JSON.parse(raw) as Draft
        if (draft.answers && Object.keys(draft.answers).length) {
          // localStorage hanya ada di browser, jadi draft baru bisa dibaca setelah hidrasi.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAnswers(draft.answers)
          setStep(Math.min(Math.max(0, draft.step ?? 0), total - 1))
          setRestored(true)
          started.current = true
        }
      }
    } catch {}
  }, [draftKey, total])

  // Simpan draft setiap ada perubahan.
  useEffect(() => {
    if (status === 'done' || !started.current) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ step, answers } satisfies Draft))
    } catch {}
  }, [answers, step, status, draftKey])

  // form_view: sekali saat kartu formulir benar-benar terlihat.
  useEffect(() => {
    const el = root.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          track('form_view', { n: form.slug })
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [form.slug])

  // Cloudflare Turnstile (opsional): dirender di langkah terakhir.
  useEffect(() => {
    if (!turnstileSiteKey || step !== total - 1 || !turnstileEl.current) return
    const el = turnstileEl.current
    const render = () => {
      if (window.turnstile && !el.dataset.rendered) {
        el.dataset.rendered = '1'
        window.turnstile.render(el, {
          sitekey: turnstileSiteKey,
          callback: (t: string) => setToken(t),
          language: locale,
        })
      }
    }
    if (window.turnstile) return render()
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = render
    document.head.appendChild(s)
  }, [turnstileSiteKey, step, total, locale])

  const onChange = useCallback(
    (name: string, value: AnswerValue | undefined) => {
      if (!started.current) {
        started.current = true
        track('form_start', { n: form.slug })
      }
      setAnswers((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => {
        if (!prev[name]) return prev
        const next = { ...prev }
        delete next[name]
        return next
      })
    },
    [form.slug],
  )

  const scrollToTop = () => {
    const top = root.current?.getBoundingClientRect().top ?? 0
    if (top < 80) root.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showErrors = (errs: FieldErrors) => {
    setErrors(errs)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const goNext = () => {
    const errs = validateAnswers(form, answers, messages, step)
    if (Object.keys(errs).length) {
      track('form_error', { n: 'validation', x: { step: step + 1 } })
      return showErrors(errs)
    }
    setErrors({})
    setFormError(null)
    setStep(step + 1)
    track('form_step', { n: form.slug, x: { step: step + 2 } })
    scrollToTop()
  }

  const goBack = () => {
    setErrors({})
    setFormError(null)
    setStep(Math.max(0, step - 1))
    scrollToTop()
  }

  const startOver = () => {
    try {
      localStorage.removeItem(draftKey)
    } catch {}
    setAnswers({})
    setErrors({})
    setStep(0)
    setRestored(false)
    started.current = false
  }

  const submit = async () => {
    const errs = validateAnswers(form, answers, messages)
    if (Object.keys(errs).length) {
      const firstStep = form.sections.findIndex((s) =>
        s.fields.some((f) => errs[f.name] || errs[`${f.name}__other`]),
      )
      if (firstStep >= 0 && firstStep !== step) setStep(firstStep)
      return showErrors(errs)
    }
    setStatus('submitting')
    setFormError(null)
    try {
      const res = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          locale,
          formVersion: form.version,
          hp: honeypot.current?.value ?? '',
          elapsedMs: Date.now() - viewedAt.current,
          sid: sessionId(),
          turnstileToken: token,
          attribution: readAttribution(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        errors?: FieldErrors
        error?: string
      }
      if (res.ok && data.ok) {
        setStatus('done')
        try {
          localStorage.removeItem(draftKey)
        } catch {}
        track('form_submit', { n: form.slug })
        flush()
        requestAnimationFrame(() =>
          root.current?.querySelector<HTMLElement>('.wizard__done')?.focus(),
        )
        return
      }
      setStatus('idle')
      if (data.errors) return showErrors(data.errors)
      const msg =
        data.error === 'rateLimited'
          ? messages.rateLimited
          : data.error === 'outdated'
            ? messages.outdated
            : messages.server
      track('form_error', { n: data.error ?? `http_${res.status}` })
      setFormError(msg)
      if (turnstileSiteKey) window.turnstile?.reset()
    } catch {
      setStatus('idle')
      track('form_error', { n: 'network' })
      setFormError(messages.network)
    }
  }

  if (status === 'done') {
    return (
      <div className="wizard" ref={root}>
        <div className="wizard__done" tabIndex={-1}>
          <span className="wizard__done-icon" aria-hidden="true">
            <UiIcon name="check" />
          </span>
          <h3>{form.successTitle}</h3>
          {form.successMessage && <p>{form.successMessage}</p>}
        </div>
      </div>
    )
  }

  const section = form.sections[step]
  const visibleFields = section.fields.filter((f) => isFieldVisible(f, answers, byName))
  const errorList = Object.entries(errors)
  const isLast = step === total - 1
  const progressText = labels.stepOf
    .replace('{current}', String(step + 1))
    .replace('{total}', String(total))

  return (
    <div className="wizard" ref={root}>
      {showHeader && (
        <div className="wizard__head">
          <h3 className="wizard__title">{form.title}</h3>
          {form.estimatedTime && <p className="wizard__meta">{form.estimatedTime}</p>}
        </div>
      )}

      <div className="wizard__progress">
        <p className="wizard__step" aria-live="polite">
          <span>{progressText}</span>
          <span aria-hidden="true"> · </span>
          <span className="wizard__step-title">{section.title}</span>
        </p>
        <ol className="wizard__bar" aria-label={messages.progress}>
          {form.sections.map((s, i) => (
            <li key={s.key} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
              <span className="sr-only">{s.title}</span>
            </li>
          ))}
        </ol>
      </div>

      {restored && step === 0 && (
        <p className="wizard__notice">
          {labels.draftRestored}{' '}
          <button type="button" className="link-btn" onClick={startOver}>
            {labels.startOver}
          </button>
        </p>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (isLast) submit()
          else goNext()
        }}
      >
        {errorList.length > 0 && (
          <div className="wizard__summary" role="alert" tabIndex={-1} ref={summaryRef}>
            <p>{messages.summary}</p>
            <ul>
              {errorList.map(([name, msg]) => {
                const base = name.replace(/__other$/, '')
                const f = byName.get(base)
                return (
                  <li key={name}>
                    <a href={`#${fieldId(uid, base)}${name.endsWith('__other') ? '-other' : ''}`}>
                      {f?.label ?? name}: {msg}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {section.description && <p className="wizard__desc">{section.description}</p>}

        <div className="wizard__fields">
          {visibleFields.map((f) => (
            <div
              key={f.name}
              className={f.width === 'half' ? 'wizard__cell wizard__cell--half' : 'wizard__cell'}
            >
              <FormField
                field={f}
                answers={answers}
                errors={errors}
                idPrefix={uid}
                labels={labels}
                onChange={onChange}
              />
            </div>
          ))}
        </div>

        {/* Honeypot: tidak terlihat oleh manusia, sering diisi bot. */}
        <div className="hp" aria-hidden="true">
          <label htmlFor={`${uid}-website`}>{messages.honeypot}</label>
          <input
            ref={honeypot}
            id={`${uid}-website`}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {isLast && turnstileSiteKey && <div ref={turnstileEl} className="wizard__turnstile" />}

        {formError && (
          <p className="wizard__error" role="alert">
            {formError}
          </p>
        )}

        <div className="wizard__nav">
          {step > 0 ? (
            <button type="button" className="btn" onClick={goBack}>
              {labels.back}
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn--primary" disabled={status === 'submitting'}>
            {isLast
              ? status === 'submitting'
                ? labels.submitting
                : form.submitLabel || labels.submit
              : labels.next}
            {!isLast && <UiIcon name="arrowRight" />}
          </button>
        </div>

        {isLast && form.privacyNote && <p className="wizard__privacy">{form.privacyNote}</p>}
      </form>
    </div>
  )
}
