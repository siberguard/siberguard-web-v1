'use client'

import { useId, useRef, useState } from 'react'

import { track } from '@/lib/analytics/client'

type Command = { label: string; prompt?: string | null; code: string; output?: string | null }
type Platform = {
  name: string
  commands: Command[]
  requirements: { label: string; value: string }[]
}

function CopyButton({
  text,
  labels,
  os,
}: {
  text: string
  labels: { copy: string; copied: string; copyFallback: string }
  os: string
}) {
  const [state, setState] = useState<'idle' | 'done' | 'manual'>('idle')
  const timer = useRef<number | null>(null)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('done')
      track('copy_command', { n: os })
    } catch {
      setState('manual')
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1800)
  }

  return (
    <button
      type="button"
      className={`term__copy${state === 'done' ? ' is-done' : ''}`}
      onClick={onCopy}
      aria-live="polite"
    >
      {state === 'done' ? labels.copied : state === 'manual' ? labels.copyFallback : labels.copy}
    </button>
  )
}

/** Terminal instalasi agen dengan tab per sistem operasi (pola tab WAI-ARIA). */
export function AgentTerminal({
  platforms,
  labels,
  tabsLabel,
}: {
  platforms: Platform[]
  labels: { copy: string; copied: string; copyFallback: string }
  tabsLabel: string
}) {
  const [active, setActive] = useState(0)
  const baseId = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const current = platforms[active]
  if (!current) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + platforms.length) % platforms.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="term">
      <div className="term__tabs" role="tablist" aria-label={tabsLabel} onKeyDown={onKey}>
        {platforms.map((p, i) => (
          <button
            key={p.name}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={i === active ? 0 : -1}
            className="term__tab"
            onClick={() => setActive(i)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div
        className="term__body"
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
      >
        {current.commands.map((c) => (
          <div key={c.label + c.code} className="term__cmd">
            <div className="term__label">{c.label}</div>
            <div className="term__box">
              <pre>
                {c.prompt && (
                  <span className="term__prompt" aria-hidden="true">
                    {c.prompt}{' '}
                  </span>
                )}
                {c.code}
                {c.output && (
                  <>
                    {'\n'}
                    <span className="term__out">{c.output}</span>
                  </>
                )}
              </pre>
              <CopyButton text={c.code} labels={labels} os={current.name} />
            </div>
          </div>
        ))}
      </div>
      {current.requirements.length > 0 && (
        <dl className="term__reqs">
          {current.requirements.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
