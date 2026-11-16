'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Ringkasan' },
  { href: '/admin/analytics', label: 'Analytics pengunjung' },
  { href: '/admin/leads', label: 'Analisis lead' },
]

/** Tautan dashboard monitoring di navigasi samping admin. */
export const NavLinks = () => {
  const pathname = usePathname()
  return (
    <div className="smd-nav">
      <p className="smd-nav__label">Monitoring</p>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="smd-nav__link"
          aria-current={pathname === l.href ? 'page' : undefined}
        >
          {l.label}
        </Link>
      ))}
    </div>
  )
}
