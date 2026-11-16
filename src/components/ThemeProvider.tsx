'use client'

import { ThemeProvider as NextThemes } from 'next-themes'
import type { ReactNode } from 'react'

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
    >
      {children}
    </NextThemes>
  )
}
