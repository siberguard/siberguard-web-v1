'use client'

import { ThemeProvider as NextThemes } from 'next-themes'
import type { ReactNode } from 'react'

/**
 * Script anti-kedip next-themes hanya dibutuhkan di HTML dari server. Saat bahasa diganti,
 * root layout `[locale]` dipasang ulang di browser dan React 19 memperingatkan setiap
 * <script> yang dibuat di client. Di client script itu ditandai sebagai blok data (tidak
 * dieksekusi, tanpa peringatan); perbedaan atribut saat hidrasi diabaikan karena
 * next-themes memasang `suppressHydrationWarning` pada script-nya.
 */
const scriptProps =
  typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const)

/** Tema terang/gelap via atribut data-theme di <html>; default diatur di CMS. */
export function ThemeProvider({
  children,
  defaultTheme,
}: {
  children: ReactNode
  defaultTheme: string
}) {
  return (
    <NextThemes
      attribute="data-theme"
      defaultTheme={defaultTheme}
      enableSystem
      themes={['light', 'dark']}
      disableTransitionOnChange
      scriptProps={scriptProps}
    >
      {children}
    </NextThemes>
  )
}
