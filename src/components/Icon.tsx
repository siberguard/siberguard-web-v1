import { ICONS, type IconKey } from '@/lib/icons'

const UI = {
  arrowRight: ['M4 10h12', 'm11 5 5 5-5 5'],
  check: ['m4 10.5 4 4 8-9'],
  menu: ['M3 6h14M3 10h14M3 14h14'],
  close: ['m5 5 10 10M15 5 5 15'],
  sun: [
    'M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M10 1.8v1.7M10 16.5v1.7M3.4 3.4l1.2 1.2M15.4 15.4l1.2 1.2M1.8 10h1.7M16.5 10h1.7M3.4 16.6l1.2-1.2M15.4 4.6l1.2-1.2',
  ],
  moon: ['M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z'],
  copy: ['M7 7h9v9H7z', 'M4 13V4h9'],
  chevronDown: ['m5 8 5 5 5-5'],
  external: ['M8 4H4v12h12v-4', 'M11 3h6v6M17 3l-8 8'],
  minus: ['M5.5 10h9'],
  info: ['M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'M10 9v4.5M10 6.5h.01'],
} as const

export type UiIcon = keyof typeof UI

/** Ikon UI kecil (20×20) dengan stroke 1.6px. */
export function UiIcon({ name, className }: { name: UiIcon; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {UI[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/** Ikon konten (24×24) dari set terkurasi yang dipilih editor di CMS. */
export function ContentIcon({ name, className }: { name?: string | null; className?: string }) {
  const icon = name && name in ICONS ? ICONS[name as IconKey] : null
  if (!icon) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {icon.d.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
