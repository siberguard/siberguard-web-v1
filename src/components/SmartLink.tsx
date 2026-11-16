import type { ComponentProps, ReactNode } from 'react'

import { Link } from '@/i18n/navigation'

type Props = Omit<ComponentProps<'a'>, 'href'> & {
  href?: string | null
  /** Halaman saat ini adalah beranda (anchor #x cukup ditulis apa adanya). */
  onHome?: boolean
  children: ReactNode
}

/**
 * Tautan dari CMS:
 * - "#anchor" → di beranda tetap anchor; di halaman lain diarahkan ke beranda#anchor
 * - "/path"   → tautan internal yang otomatis diberi prefix bahasa (/en/…)
 * - "https://", "mailto:", "tel:" → tautan biasa (eksternal dibuka di tab baru)
 */
export function SmartLink({ href, onHome = true, children, ...rest }: Props) {
  if (!href) return <span {...(rest as ComponentProps<'span'>)}>{children}</span>

  if (href.startsWith('#')) {
    if (onHome)
      return (
        <a href={href} {...rest}>
          {children}
        </a>
      )
    return (
      <Link href={`/${href}`} {...rest}>
        {children}
      </Link>
    )
  }
  if (href.startsWith('/')) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    )
  }
  const external = /^https?:\/\//.test(href)
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}
