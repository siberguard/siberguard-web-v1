'use client'

import type { EventType, TrackEvent } from './events'

/**
 * Tracker pihak pertama di browser. Tanpa cookie: sesi disimpan di sessionStorage
 * dan hilang saat tab ditutup. Event dikumpulkan lalu dikirim per batch via sendBeacon.
 */
type Ctx = { locale: 'id' | 'en'; enabled: boolean }

const ENDPOINT = '/api/ev'
const ctx: Ctx = { locale: 'id', enabled: false }
const queue: TrackEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null

export function configureTracker(next: Partial<Ctx>) {
  Object.assign(ctx, next)
}

export function sessionId(): string {
  try {
    let sid = sessionStorage.getItem('sm_sid')
    if (!sid) {
      sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
      sessionStorage.setItem('sm_sid', sid)
    }
    return sid
  } catch {
    return 'nostorage'
  }
}

function currentTheme(): 'light' | 'dark' | undefined {
  const t = document.documentElement.dataset.theme
  return t === 'dark' || t === 'light' ? t : undefined
}

export function flush() {
  if (!queue.length) return
  const body = JSON.stringify({ e: queue.splice(0, 20) })
  if (timer) clearTimeout(timer)
  timer = null
  const sent = typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(ENDPOINT, body)
  if (!sent) {
    fetch(ENDPOINT, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
    }).catch(() => {})
  }
  if (queue.length) flush()
}

export function track(t: EventType, extra: Partial<Omit<TrackEvent, 't' | 'sid'>> = {}) {
  if (!ctx.enabled || typeof window === 'undefined') return
  queue.push({
    t,
    p: window.location.pathname,
    l: ctx.locale,
    sid: sessionId(),
    th: currentTheme(),
    ...extra,
  })
  if (queue.length >= 10) flush()
  else if (!timer) timer = setTimeout(flush, 2000)
}
