'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import { UiIcon } from '@/components/Icon'
import { SmartLink } from '@/components/SmartLink'

import { HeroVisual } from './HeroVisuals'

export type HeroSlide = {
  id: string
  image?: { src: string; srcSet?: string; alt: string; width?: number; height?: number } | null
  visual?: string | null
  tag?: string | null
  title?: string | null
  text?: string | null
  link?: { label?: string | null; href?: string | null } | null
}

export type HeroCarouselLabels = {
  region: string
  /** Pola "{n} dari {total}" untuk tiap slide. */
  slide: string
  prev: string
  next: string
  pause: string
  play: string
  /** Pola "Tampilkan slide {n}". */
  goTo: string
}

type Props = {
  slides: HeroSlide[]
  autoplay: boolean
  /** Durasi per slide dalam detik. */
  interval: number
  labels: HeroCarouselLabels
  onHome: boolean
}

const fill = (pattern: string, n: number, total: number) =>
  pattern.replace('{n}', String(n)).replace('{total}', String(total))

/**
 * Carousel banner di hero (pola APG "auto-rotating carousel"):
 * - berganti otomatis; berhenti saat kursor/fokus berada di carousel, tab tidak terlihat,
 *   hero keluar dari layar, atau pengguna memilih reduced motion;
 * - tombol jeda selalu tersedia (WCAG 2.2.2), slide tidak aktif di-`inert`;
 * - geser (swipe) di layar sentuh dan tombol panah kiri/kanan.
 * Pergantian slide digerakkan oleh akhir animasi bar progres, sehingga progres
 * dan pergantian selalu sinkron, termasuk saat dijeda.
 */
export function HeroCarousel({ slides, autoplay, interval, labels, onHome }: Props) {
  const total = slides.length
  const [index, setIndex] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [inView, setInView] = useState(true)
  const [reduced, setReduced] = useState(false)
  const root = useRef<HTMLElement>(null)
  const swipeX = useRef<number | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const canRotate = autoplay && total > 1 && !reduced
  const running = canRotate && !userPaused && !hovered && !focused && inView

  const go = useCallback((i: number) => setIndex(((i % total) + total) % total), [total])
  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  if (total === 0) return null

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') swipeX.current = e.clientX
  }
  const onPointerUp = (e: PointerEvent) => {
    if (swipeX.current === null) return
    const dx = e.clientX - swipeX.current
    swipeX.current = null
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)()
  }

  return (
    <section
      ref={root}
      className={`carousel${running ? '' : ' is-paused'}${userPaused ? ' is-stopped' : ''}`}
      aria-roledescription="carousel"
      aria-label={labels.region}
      style={{ ['--carousel-interval' as string]: `${interval}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Hanya fokus keyboard yang menahan rotasi; klik mouse cukup ditangani oleh hover.
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(':focus-visible')) setFocused(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onKeyDown={onKeyDown}
    >
      <div
        className="carousel__viewport"
        aria-live={running ? 'off' : 'polite'}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeX.current = null)}
      >
        {slides.map((s, i) => {
          const active = i === index
          const hasCaption = Boolean(s.tag || s.title || s.text || (s.link?.href && s.link.label))
          return (
            <article
              key={s.id}
              className={`slide${active ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={fill(labels.slide, i + 1, total)}
              aria-hidden={!active}
              inert={!active}
            >
              <div className={`slide__visual${s.image ? ' slide__visual--image' : ''}`}>
                {s.image ? (
                  <img
                    src={s.image.src}
                    srcSet={s.image.srcSet}
                    sizes="(max-width: 960px) 92vw, 560px"
                    alt={s.image.alt}
                    width={s.image.width}
                    height={s.image.height}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <HeroVisual name={s.visual} />
                )}
              </div>
              {hasCaption && (
                <div className="slide__caption">
                  {s.tag && <p className="slide__tag">{s.tag}</p>}
                  {s.title && <p className="slide__title">{s.title}</p>}
                  {s.text && <p className="slide__text">{s.text}</p>}
                  {s.link?.href && s.link.label && (
                    <SmartLink
                      href={s.link.href}
                      onHome={onHome}
                      className="slide__link"
                      data-track-cta={`hero-slide:${s.link.label}`}
                    >
                      {s.link.label}
                      <UiIcon name="arrowRight" />
                    </SmartLink>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {total > 1 && (
        <div className="carousel__controls">
          {canRotate && (
            <button
              type="button"
              className="carousel__btn"
              aria-label={userPaused ? labels.play : labels.pause}
              onClick={() => setUserPaused((p) => !p)}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                {userPaused ? (
                  <path d="M7 5.5v9l7.5-4.5L7 5.5Z" fill="currentColor" />
                ) : (
                  <path
                    d="M7.5 5.5v9M12.5 5.5v9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          )}
          <div className="carousel__dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`carousel__dot${i === index ? ' is-active' : ''}`}
                aria-label={fill(labels.goTo, i + 1, total)}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => go(i)}
              >
                {i === index && canRotate ? (
                  <span
                    key={`${index}-${userPaused}`}
                    className="carousel__progress"
                    onAnimationEnd={next}
                  />
                ) : null}
              </button>
            ))}
          </div>
          <div className="carousel__arrows">
            <button type="button" className="carousel__btn" aria-label={labels.prev} onClick={prev}>
              <UiIcon name="arrowRight" className="is-flipped" />
            </button>
            <button type="button" className="carousel__btn" aria-label={labels.next} onClick={next}>
              <UiIcon name="arrowRight" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
