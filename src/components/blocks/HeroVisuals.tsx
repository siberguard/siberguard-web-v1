import { useId } from 'react'

import { ICONS, type IconKey } from '@/lib/icons'

/**
 * Ilustrasi bawaan slide hero (dipakai bila editor tidak mengunggah gambar).
 * Murni vektor tanpa teks, sehingga berlaku untuk kedua bahasa. Warna diambil dari
 * variabel CSS `--viz-*` (lihat blocks.css), jadi ikut tema terang/gelap.
 */
export type HeroVisualName = 'monitoring' | 'sovereignty' | 'agent' | 'response' | 'report'

export const HERO_VISUALS: HeroVisualName[] = [
  'monitoring',
  'sovereignty',
  'agent',
  'response',
  'report',
]

/** Ikon 24×24 dari set ikon situs, diskalakan dengan stroke tetap. */
function Glyph({
  name,
  x,
  y,
  size = 24,
  className = 'v-glyph',
}: {
  name: IconKey
  x: number
  y: number
  size?: number
  className?: string
}) {
  const s = size / 24
  const icon = ICONS[name]
  if (!icon) return null

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={className}>
      {icon.d.map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  )
}

/** Kartu kecil: lingkaran ikon + dua baris "teks" abstrak. */
function Chip({
  x,
  y,
  w = 168,
  icon,
  tone = 'line',
}: {
  x: number
  y: number
  w?: number
  icon: IconKey
  tone?: 'line' | 'accent'
}) {
  return (
    <g className="v-float">
      <rect x={x} y={y} width={w} height={56} rx={14} className="v-card v-shadow" />
      <circle
        cx={x + 28}
        cy={y + 28}
        r={15}
        className={tone === 'accent' ? 'v-accent-soft' : 'v-soft'}
      />
      <Glyph
        name={icon}
        x={x + 19}
        y={y + 19}
        size={18}
        className={tone === 'accent' ? 'v-glyph v-glyph--accent' : 'v-glyph'}
      />
      <rect x={x + 54} y={y + 18} width={w - 84} height={7} rx={3.5} className="v-bar-strong" />
      <rect x={x + 54} y={y + 32} width={(w - 84) * 0.62} height={6} rx={3} className="v-bar" />
    </g>
  )
}

function Monitoring({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        {/* Terang di tepi depan sapuan (searah jarum jam), memudar ke belakang. */}
        <linearGradient
          id={`${uid}-sweep`}
          gradientUnits="userSpaceOnUse"
          x1="377"
          y1="133"
          x2="308"
          y2="75"
        >
          <stop offset="0" className="v-stop-strong" />
          <stop offset="1" className="v-stop-clear" />
        </linearGradient>
      </defs>
      <g className="v-rings">
        <circle cx={320} cy={200} r={72} />
        <circle cx={320} cy={200} r={124} />
        <circle cx={320} cy={200} r={176} strokeDasharray="2 6" />
        <path d="M320 18v364M138 200h364" />
      </g>
      <g className="v-spin">
        <path d="M320 200V24a176 176 0 0 1 113.1 41.2Z" fill={`url(#${uid}-sweep)`} />
        <path d="M320 200 433.1 65.2" className="v-sweep-edge" />
      </g>
      <g className="v-blips">
        <circle cx={402} cy={118} r={4.5} className="v-accent" />
        <circle cx={402} cy={118} r={4.5} className="v-pulse" />
        <circle cx={226} cy={262} r={3.5} className="v-dot-line" />
        <circle cx={430} cy={270} r={3.5} className="v-dot-line" />
        <circle cx={250} cy={128} r={3} className="v-dot-line" />
      </g>
      <circle cx={320} cy={200} r={50} className="v-card v-shadow" />
      <Glyph name="shieldCheck" x={296} y={176} size={48} className="v-glyph v-glyph--bold" />
      <Chip x={52} y={58} icon="eye" />
      <Chip x={420} y={298} icon="bell" tone="accent" />
    </>
  )
}

function Sovereignty() {
  const rows = [128, 184, 240]
  return (
    <>
      <rect x={196} y={74} width={248} height={252} rx={30} className="v-perimeter" />
      {rows.map((y, i) => (
        <g key={y}>
          <rect x={236} y={y} width={168} height={46} rx={10} className="v-card v-shadow" />
          <circle
            cx={258}
            cy={y + 23}
            r={4}
            className={i === 0 ? 'v-accent v-blink' : 'v-dot-line'}
          />
          <circle cx={272} cy={y + 23} r={4} className="v-dot-soft" />
          <rect x={300} y={y + 15} width={84} height={6} rx={3} className="v-bar-strong" />
          <rect x={300} y={y + 26} width={52} height={5} rx={2.5} className="v-bar" />
        </g>
      ))}
      {/* Gembok di sudut perimeter: data tidak keluar dari wilayah */}
      <circle cx={444} cy={74} r={24} className="v-solid v-shadow" />
      <Glyph name="lock" x={432} y={62} size={24} className="v-glyph v-glyph--on" />
      {/* Penanda lokasi dengan bendera kecil merah-putih */}
      <g className="v-float">
        <rect x={44} y={100} width={128} height={56} rx={14} className="v-card v-shadow" />
        <rect x={64} y={119} width={24} height={9} rx={2} className="v-flag-red" />
        <rect x={64} y={128} width={24} height={9} rx={2} className="v-flag-white" />
        <rect x={100} y={118} width={52} height={7} rx={3.5} className="v-bar-strong" />
        <rect x={100} y={132} width={34} height={6} rx={3} className="v-bar" />
      </g>
      <path d="M172 128h24" className="v-flow" />
      <g className="v-float v-float--late">
        <rect x={468} y={262} width={128} height={56} rx={14} className="v-card v-shadow" />
        <circle cx={496} cy={290} r={15} className="v-soft" />
        <Glyph name="database" x={487} y={281} size={18} />
        <rect x={522} y={280} width={52} height={7} rx={3.5} className="v-bar-strong" />
        <rect x={522} y={294} width={32} height={6} rx={3} className="v-bar" />
      </g>
      <path d="M444 290h24" className="v-flow" />
    </>
  )
}

function Agent() {
  const devices: { x: number; y: number; icon: IconKey; path: string }[] = [
    { x: 64, y: 70, icon: 'server', path: 'M176 102c70 0 74 98 104 98' },
    { x: 464, y: 70, icon: 'globe', path: 'M464 102c-70 0-74 98-104 98' },
    { x: 64, y: 266, icon: 'chip', path: 'M176 298c70 0 74-98 104-98' },
    { x: 464, y: 266, icon: 'database', path: 'M464 298c-70 0-74-98-104-98' },
  ]
  return (
    <>
      {devices.map((d) => (
        <path key={d.path} d={d.path} className="v-flow" />
      ))}
      <circle cx={320} cy={200} r={74} className="v-rings-one" />
      <circle cx={320} cy={200} r={44} className="v-solid v-shadow" />
      <Glyph name="shield" x={300} y={180} size={40} className="v-glyph v-glyph--on" />
      {devices.map((d, i) => (
        <g key={d.icon} className={`v-float${i % 2 ? ' v-float--late' : ''}`}>
          <rect x={d.x} y={d.y} width={112} height={64} rx={14} className="v-card v-shadow" />
          <circle cx={d.x + 30} cy={d.y + 32} r={16} className="v-soft" />
          <Glyph name={d.icon} x={d.x + 20} y={d.y + 22} size={20} />
          <rect x={d.x + 56} y={d.y + 24} width={38} height={6} rx={3} className="v-bar-strong" />
          <rect x={d.x + 56} y={d.y + 36} width={24} height={5} rx={2.5} className="v-bar" />
        </g>
      ))}
    </>
  )
}

function Response() {
  const steps: { y: number; icon: IconKey; done?: boolean }[] = [
    { y: 82, icon: 'activity' },
    { y: 168, icon: 'eye' },
    { y: 254, icon: 'checklist', done: true },
  ]
  return (
    <>
      <path d="M190 128v40M190 214v40" className="v-flow" />
      {steps.map((s) => (
        <g key={s.y}>
          <rect
            x={150}
            y={s.y}
            width={340}
            height={64}
            rx={16}
            className={`v-card v-shadow${s.done ? ' v-card--active' : ''}`}
          />
          <circle cx={190} cy={s.y + 32} r={18} className={s.done ? 'v-solid' : 'v-soft'} />
          <Glyph
            name={s.icon}
            x={179}
            y={s.y + 21}
            size={22}
            className={s.done ? 'v-glyph v-glyph--on' : 'v-glyph'}
          />
          <rect x={226} y={s.y + 22} width={148} height={7} rx={3.5} className="v-bar-strong" />
          <rect x={226} y={s.y + 36} width={96} height={6} rx={3} className="v-bar" />
          <rect
            x={410}
            y={s.y + 22}
            width={56}
            height={20}
            rx={10}
            className={s.done ? 'v-pill v-pill--done' : 'v-pill'}
          />
        </g>
      ))}
      <circle cx={490} cy={254} r={13} className="v-accent v-shadow" />
      <path d="m484 254 4 4 8-8" className="v-check" />
    </>
  )
}

/** Laporan bulanan: dokumen dengan grafik batang abstrak (tanpa angka), kalender, dan centang. */
function Report() {
  const bars = [44, 70, 56, 92, 78, 112]
  const base = 262
  const top = (i: number) => base - bars[i] - 14
  const trend = bars.map((_, i) => `${i ? 'L' : 'M'}${222 + i * 38} ${top(i)}`).join(' ')
  return (
    <>
      <rect x={196} y={60} width={272} height={300} rx={18} className="v-card" opacity={0.7} />
      <rect x={176} y={44} width={288} height={312} rx={18} className="v-card v-shadow" />
      <circle cx={210} cy={84} r={17} className="v-soft" />
      <Glyph name="report" x={199} y={73} size={22} />
      <rect x={238} y={74} width={124} height={8} rx={4} className="v-bar-strong" />
      <rect x={238} y={90} width={78} height={6} rx={3} className="v-bar" />
      <rect x={394} y={74} width={46} height={20} rx={10} className="v-pill v-pill--done" />
      <path d={`M200 ${base}h240`} className="v-baseline" />
      {bars.map((h, i) => (
        <rect
          key={h}
          x={212 + i * 38}
          y={base - h}
          width={20}
          height={h}
          rx={5}
          className={i === bars.length - 1 ? 'v-col v-col--on' : 'v-col'}
        />
      ))}
      <path d={trend} className="v-trend" />
      {bars.map((h, i) => (
        <circle key={h} cx={222 + i * 38} cy={top(i)} r={3.5} className="v-trend-dot" />
      ))}
      <rect x={200} y={290} width={150} height={7} rx={3.5} className="v-bar-strong" />
      <rect x={200} y={306} width={104} height={6} rx={3} className="v-bar" />
      <rect x={200} y={322} width={128} height={6} rx={3} className="v-bar" />
      <Chip x={52} y={250} w={150} icon="calendar" tone="accent" />
      <g className="v-float v-float--late">
        <circle cx={492} cy={116} r={30} className="v-solid v-shadow" />
        <Glyph name="shieldCheck" x={478} y={102} size={28} className="v-glyph v-glyph--on" />
      </g>
    </>
  )
}

export function HeroVisual({ name }: { name?: string | null }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const visual = (HERO_VISUALS as string[]).includes(name ?? '') ? name : 'monitoring'
  return (
    <svg
      viewBox="0 0 640 400"
      preserveAspectRatio="xMidYMid meet"
      className={`viz viz--${visual}`}
      aria-hidden="true"
      focusable="false"
    >
      {visual === 'monitoring' && <Monitoring uid={uid} />}
      {visual === 'sovereignty' && <Sovereignty />}
      {visual === 'agent' && <Agent />}
      {visual === 'response' && <Response />}
      {visual === 'report' && <Report />}
    </svg>
  )
}
