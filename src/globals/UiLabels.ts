import type { Field, GlobalConfig } from 'payload'

import { canEditContent } from '@/access/roles'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

/**
 * Teks kecil antarmuka yang terlihat pengunjung (tombol, label, petunjuk).
 * Default diambil dari kode; isi di sini menimpa default tersebut.
 */
export const UI_LABEL_DEFAULTS = {
  skipToContent: { id: 'Langsung ke konten', en: 'Skip to content' },
  menu: { id: 'Menu', en: 'Menu' },
  close: { id: 'Tutup', en: 'Close' },
  themeLight: { id: 'Terang', en: 'Light' },
  themeDark: { id: 'Gelap', en: 'Dark' },
  themeToggle: { id: 'Ganti tema', en: 'Toggle theme' },
  language: { id: 'Bahasa', en: 'Language' },
  copy: { id: 'Salin', en: 'Copy' },
  copied: { id: 'Tersalin', en: 'Copied' },
  copyFallback: { id: 'Tekan Ctrl+C', en: 'Press Ctrl+C' },
  back: { id: 'Sebelumnya', en: 'Back' },
  next: { id: 'Berikutnya', en: 'Next' },
  submit: { id: 'Kirim', en: 'Submit' },
  submitting: { id: 'Mengirim…', en: 'Sending…' },
  stepOf: { id: 'Langkah {current} dari {total}', en: 'Step {current} of {total}' },
  optional: { id: 'opsional', en: 'optional' },
  chooseUpTo: { id: 'Pilih maksimal {max}', en: 'Choose up to {max}' },
  otherPlaceholder: { id: 'Sebutkan…', en: 'Please specify…' },
  draftRestored: { id: 'Isian sebelumnya dipulihkan.', en: 'Your previous answers were restored.' },
  startOver: { id: 'Mulai ulang', en: 'Start over' },
  backToTop: { id: 'Kembali ke atas', en: 'Back to top' },
} as const

export type UiLabelKey = keyof typeof UI_LABEL_DEFAULTS

export const UiLabels: GlobalConfig = {
  slug: 'ui-labels',
  label: 'Teks antarmuka',
  admin: {
    group: 'Tampilan situs',
    description: 'Teks kecil pada tombol dan petunjuk. Kosongkan untuk memakai teks bawaan.',
  },
  access: { read: () => true, update: canEditContent },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: (Object.keys(UI_LABEL_DEFAULTS) as UiLabelKey[]).map((key): Field => ({
    name: key,
    type: 'text',
    localized: true,
    label: UI_LABEL_DEFAULTS[key].id,
    admin: { placeholder: UI_LABEL_DEFAULTS[key].id },
  })),
}
