'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { configureTracker, flush, track } from '@/lib/analytics/client'

type Props = { locale: 'id' | 'en'; enabled: boolean; respectDoNotTrack: boolean }

function privacySignal(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  return n.globalPrivacyControl === true || n.doNotTrack === '1' || n.msDoNotTrack === '1'
}

/**
 * Mencatat pageview, waktu aktif, section yang terlihat, dan klik CTA.
 * Tidak berjalan di mode preview/draft dan menghormati Do Not Track bila diaktifkan.
 */
export function Tracker({ locale, enabled, respectDoNotTrack }: Props) {
  const pathname = usePathname()
  const activeMs = useRef(0)
  const visibleSince = useRef<number | null>(null)
  const seenSections = useRef(new Set<string>())

  const on = enabled && !(respectDoNotTrack && typeof navigator !== 'undefined' && privacySignal())

  useEffect(() => {
    configureTracker({ locale, enabled: on })
  }, [locale, on])

  // Pageview + waktu aktif per halaman.
  useEffect(() => {
    if (!on) return
    const firstInSession = !sessionStorage.getItem('sm_landed')
    const params = new URLSearchParams(window.location.search)
    const utm = {
      s: params.get('utm_source') ?? undefined,
      m: params.get('utm_medium') ?? undefined,
      c: params.get('utm_campaign') ?? undefined,
    }
    try {
      if (firstInSession) {
        sessionStorage.setItem('sm_landed', window.location.pathname)
        if (document.referrer) sessionStorage.setItem('sm_ref', document.referrer.slice(0, 300))
        if (utm.s || utm.m || utm.c) sessionStorage.setItem('sm_utm', JSON.stringify(utm))
      }
    } catch {}
    track('pageview', {
      r: firstInSession ? document.referrer || undefined : undefined,
      sw: window.innerWidth,
      u: utm.s || utm.m || utm.c ? utm : undefined,
    })

    activeMs.current = 0
    visibleSince.current = document.visibilityState === 'visible' ? performance.now() : null

    const sendLeave = () => {
      if (visibleSince.current !== null)
        activeMs.current += performance.now() - visibleSince.current
      visibleSince.current = null
      if (activeMs.current > 500) track('page_leave', { d: Math.round(activeMs.current) })
      activeMs.current = 0
      flush()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sendLeave()
      else visibleSince.current = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', sendLeave)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', sendLeave)
      sendLeave()
    }
  }, [pathname, on])

  // Section yang benar-benar terlihat (≥ 40%), sekali per sesi per section.
  useEffect(() => {
    if (!on || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.trackSection
          if (!e.isIntersecting || !id || seenSections.current.has(id)) continue
          seenSections.current.add(id)
          track('section_view', { n: id })
        }
      },
      { threshold: 0.4 },
    )
    document.querySelectorAll<HTMLElement>('[data-track-section]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname, on])

  // Klik CTA: elemen dengan data-track-cta="…".
  useEffect(() => {
    if (!on) return
    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest<HTMLElement>('[data-track-cta]')
      if (el) track('cta_click', { n: el.dataset.trackCta?.slice(0, 120) })
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [on])

  return null
}
