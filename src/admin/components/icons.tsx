/** Ikon admin (24×24, stroke 1.75) — satu gaya untuk seluruh sidebar & dashboard. */
const PATHS = {
  overview: ['M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z'],
  analytics: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M21 20H3'],
  target: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M12 12h.01',
  ],
  inbox: ['M4 13h4l2 3h4l2-3h4', 'M5.5 5h13L21 13v6H3v-6l2.5-8Z'],
  page: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6M10 17h6'],
  form: ['M9 4h6v3H9z', 'M7 5.5H5V21h14V5.5h-2', 'M9 12h6M9 16h4'],
  image: ['M4 5h16v14H4z', 'm4 16 5-5 4 4 2-2 5 5', 'M15.5 9.5h.01'],
  header: ['M4 5h16v14H4z', 'M4 9h16'],
  footer: ['M4 5h16v14H4z', 'M4 15h16'],
  type: ['M5 7V5h14v2', 'M12 5v14', 'M9 19h6'],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  ],
  users: [
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1',
    'M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.7',
  ],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  sun: [
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  ],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z'],
  monitor: ['M3 4h18v12H3z', 'M8 20h8M12 16v4'],
  logout: ['M15 4h4v16h-4', 'M10 16l4-4-4-4', 'M14 12H4'],
  visitors: [
    'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  pageviews: ['M7 3h7l5 5v13H7z', 'M14 3v5h5'],
  pulse: ['M3 12h4l3-8 4 16 3-8h4'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  lead: ['M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3Z', 'm9 12 2 2 4-4'],
  conversion: [
    'M4 19 19 4',
    'M7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  ],
  database: [
    'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Z',
    'M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5',
    'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  ],
  server: ['M4 4h16v6H4zM4 14h16v6H4z', 'M8 7h.01M8 17h.01'],
  mail: ['M3 5h18v14H3z', 'm3 7 9 6 9-6'],
  globe: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    'M3 12h18',
    'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  ],
  download: ['M12 4v12', 'm7 11 5 5 5-5', 'M4 20h16'],
  arrowUp: ['M12 19V5', 'm6 11 6-6 6 6'],
  arrowDown: ['M12 5v14', 'm6 13 6 6 6-6'],
  arrowRight: ['M5 12h14', 'm13 6 6 6-6 6'],
  link: [
    'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1',
    'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  ],
  device: ['M7 3h10v18H7z', 'M11 18h2'],
  flag: ['M5 21V4', 'M5 4h11l-2 4 2 4H5'],
  cursor: ['m4 4 7 17 2.5-7.5L21 11 4 4Z'],
  copy: ['M9 9h11v11H9z', 'M5 15V4h11'],
  layers: ['m12 3 9 5-9 5-9-5 9-5Z', 'm3 13 9 5 9-5'],
  panelClose: ['M4 4h16v16H4z', 'M9.5 4v16', 'm16 9-3 3 3 3'],
  panelOpen: ['M4 4h16v16H4z', 'M9.5 4v16', 'm13 9 3 3-3 3'],
  languages: ['M4 5h8M8 3v2M5.5 11s2.5-1.5 4-6M6 7c1 2.5 3 4 5 5', 'm12 21 4.5-10L21 21M13.5 18h6'],
} as const

export type GlyphName = keyof typeof PATHS

export function Glyph({
  name,
  size = 18,
  className,
}: {
  name: GlyphName
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
