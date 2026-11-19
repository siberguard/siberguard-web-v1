/**
 * Set ikon terkurasi (24×24, stroke). Dipakai bersama oleh CMS (pilihan ikon)
 * dan frontend (render SVG), sehingga gaya ikon selalu konsisten.
 */
export const ICONS = {
  clock: {
    label: { id: 'Jam / 24 jam', en: 'Clock / 24 hours' },
    d: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  },
  shield: {
    label: { id: 'Perisai', en: 'Shield' },
    d: ['M12 3 4.5 6v5.6c0 4.4 3.1 8.3 7.5 9.4 4.4-1.1 7.5-5 7.5-9.4V6L12 3Z'],
  },
  shieldCheck: {
    label: { id: 'Perisai centang', en: 'Shield check' },
    d: ['M12 3 4.5 6v5.6c0 4.4 3.1 8.3 7.5 9.4 4.4-1.1 7.5-5 7.5-9.4V6L12 3Z', 'm9 12 2 2 4-4'],
  },
  chip: {
    label: { id: 'Chip / agen', en: 'Chip / agent' },
    d: ['M7 7h10v10H7z', 'M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4'],
  },
  activity: {
    label: { id: 'Aktivitas / deteksi', en: 'Activity / detection' },
    d: ['M3 12h4l2.5-6 5 12 2.5-6h4'],
  },
  message: {
    label: { id: 'Pesan / laporan', en: 'Message / report' },
    d: ['M4 5h16v11H9l-5 4V5Z', 'M8 9.5h8M8 12.5h5'],
  },
  checklist: {
    label: { id: 'Daftar periksa / audit', en: 'Checklist / audit' },
    d: ['M9 6h11M9 12h11M9 18h11', 'm3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17'],
  },
  lock: {
    label: { id: 'Gembok', en: 'Lock' },
    d: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  },
  server: {
    label: { id: 'Server', en: 'Server' },
    d: ['M4 4h16v6H4zM4 14h16v6H4z', 'M8 7h.01M8 17h.01'],
  },
  eye: {
    label: { id: 'Pemantauan', en: 'Monitoring' },
    d: [
      'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z',
      'M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    ],
  },
  bell: {
    label: { id: 'Notifikasi', en: 'Notification' },
    d: ['M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z', 'M10 20.5a2 2 0 0 0 4 0'],
  },
  users: {
    label: { id: 'Tim / pengguna', en: 'Team / users' },
    d: [
      'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
      'M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5',
      'M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.8 3.1 2.6 3.5 5.2',
    ],
  },
  database: {
    label: { id: 'Data / penyimpanan', en: 'Data / storage' },
    d: [
      'M12 9c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Z',
      'M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6',
      'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    ],
  },
  globe: {
    label: { id: 'Jaringan / lokasi', en: 'Network / location' },
    d: [
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
      'M3 12h18',
      'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
    ],
  },
  file: {
    label: { id: 'Dokumen', en: 'Document' },
    d: ['M6 3h8l4 4v14H6z', 'M14 3v4h4M9 12h6M9 16h6'],
  },
  bolt: {
    label: { id: 'Respons cepat', en: 'Fast response' },
    d: ['M13 3 5 13h6l-1 8 8-10h-6l1-8Z'],
  },
  laptop: {
    label: { id: 'Laptop / komputer kerja', en: 'Laptop / work computer' },
    d: ['M5 6h14v9H5z', 'M2.5 18.5h19l-1.5-3.5h-16l-1.5 3.5Z'],
  },
  monitor: {
    label: { id: 'Workstation / desktop', en: 'Workstation / desktop' },
    d: ['M3 4h18v12H3z', 'M9 20h6M12 16v4'],
  },
  report: {
    label: { id: 'Laporan / grafik', en: 'Report / chart' },
    d: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9.5 17v-3M12 17v-5M14.5 17v-2'],
  },
  book: {
    label: { id: 'Edukasi / panduan', en: 'Education / guide' },
    d: [
      'M4 5.5C6.5 4.3 9.2 4.3 12 6c2.8-1.7 5.5-1.7 8-.5V19c-2.5-1.2-5.2-1.2-8 .5-2.8-1.7-5.5-1.7-8-.5V5.5Z',
      'M12 6v13.5',
    ],
  },
  alert: {
    label: { id: 'Peringatan / risiko', en: 'Warning / risk' },
    d: ['M12 4 2.8 19.5h18.4L12 4Z', 'M12 10v4.5M12 17h.01'],
  },
  router: {
    label: { id: 'Router / perangkat jaringan', en: 'Router / network device' },
    d: ['M3 13h18v6H3z', 'M7 16h.01M10.5 16h.01', 'M8.5 9.5a5 5 0 0 1 7 0M6 7a8.5 8.5 0 0 1 12 0'],
  },
  calendar: {
    label: { id: 'Kalender / jadwal', en: 'Calendar / schedule' },
    d: ['M4 6h16v14H4z', 'M4 10h16M8 3.5V7M16 3.5V7'],
  },
} as const

export type IconKey = keyof typeof ICONS

export const iconOptions = (Object.keys(ICONS) as IconKey[]).map((value) => ({
  label: { ...ICONS[value].label },
  value,
}))
