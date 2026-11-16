'use client'

import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

import { UiIcon } from '@/components/Icon'
import { usePathname, useRouter } from '@/i18n/navigation'
import { track } from '@/lib/analytics/client'

const noopSubscribe = () => () => {}

type ThemeLabels = { themeLight: string; themeDark: string; themeToggle: string }

/** Tombol tema: dua tema (terang/gelap). Awalnya mengikuti perangkat bila belum dipilih. */
export function ThemeToggle({ labels }: { labels: ThemeLabels }) {
  const { resolvedTheme, setTheme } = useTheme()
  // true di browser, false saat render server — tanpa effect tambahan.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )

  const isDark = mounted && resolvedTheme === 'dark'
  const next = isDark ? 'light' : 'dark'
  const label = `${labels.themeToggle}: ${isDark ? labels.themeLight : labels.themeDark}`

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme(next)
        track('theme_switch', { n: next })
      }}
    >
      {/* Sebelum mount, ikon disembunyikan agar tidak salah tampil saat hidrasi. */}
      <span style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        <UiIcon name={isDark ? 'sun' : 'moon'} />
      </span>
    </button>
  )
}

/** Pilihan bahasa ID / EN — mempertahankan halaman dan anchor yang sedang dibuka. */
export function LocaleSwitch({ label }: { label: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const go = (target: 'id' | 'en') => {
    if (target === locale) return
    track('lang_switch', { n: target })
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    router.replace(`${pathname}${hash}`, { locale: target, scroll: false })
  }

  return (
    <div className="locale-switch" role="group" aria-label={label}>
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => go(l)}
          className="locale-switch__btn"
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
