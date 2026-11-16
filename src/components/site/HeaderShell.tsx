'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { UiIcon } from '@/components/Icon'
import { usePathname } from '@/i18n/navigation'

type Props = {
  brand: ReactNode
  nav: ReactNode
  actions: ReactNode
  mobileExtras: ReactNode
  labels: { menu: string; close: string; mainNav: string }
}

/** Kerangka header: status menu ponsel dan bayangan saat halaman digulir. */
export function HeaderShell({ brand, nav, actions, mobileExtras, labels }: Props) {
  const pathname = usePathname()
  // Menu menyimpan path saat dibuka; pindah halaman otomatis menutupnya.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (value: boolean | ((prev: boolean) => boolean)) =>
    setOpenOn((prev) => {
      const next = typeof value === 'function' ? value(prev === pathname) : value
      return next ? pathname : null
    })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="container site-header__inner">
        {brand}
        <nav
          id="site-nav"
          className="site-nav"
          aria-label={labels.mainNav}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) setOpen(false)
          }}
        >
          {nav}
          <div className="site-nav__mobile-extras">{mobileExtras}</div>
        </nav>
        <div className="site-header__actions">{actions}</div>
        <button
          type="button"
          className="icon-btn site-header__menu"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? labels.close : labels.menu}
          onClick={() => setOpen((o) => !o)}
        >
          <UiIcon name={open ? 'close' : 'menu'} />
        </button>
      </div>
    </header>
  )
}
