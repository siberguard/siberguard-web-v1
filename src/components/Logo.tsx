import type { Media } from '@/payload-types'

type Props = {
  light?: Media | string | null
  dark?: Media | string | null
  /** Paksa varian: "inverse" untuk latar navy (footer), "auto" mengikuti tema. */
  variant?: 'auto' | 'inverse'
  className?: string
  alt?: string
}

const urlOf = (m: Media | string | null | undefined, fallback: string) =>
  m && typeof m === 'object' && m.url ? m.url : fallback

/**
 * Logo SVG. Dua gambar dirender dan CSS memilih yang sesuai tema
 * (data-theme di <html>), sehingga tidak ada kedipan saat tema dimuat.
 */
export function Logo({
  light,
  dark,
  variant = 'auto',
  className = '',
  alt = 'SOC Merdeka',
}: Props) {
  const lightSrc = urlOf(light, '/brand/logo.svg')
  const darkSrc = urlOf(dark, '/brand/logo-inverse.svg')
  if (variant === 'inverse') {
    return <img src={darkSrc} alt={alt} width={402} height={138} className={`logo ${className}`} />
  }
  return (
    <span className={`logo-switch ${className}`}>
      <img src={lightSrc} alt={alt} width={402} height={138} className="logo logo--light" />
      <img
        src={darkSrc}
        alt=""
        aria-hidden="true"
        width={402}
        height={138}
        className="logo logo--dark"
      />
    </span>
  )
}
