import type { SnapshotRow } from './snapshot'

const TIER_LABEL: Record<string, string> = {
  hot: 'HOT',
  warm: 'WARM',
  cold: 'COLD',
  survey: 'SURVEI',
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

/** Email notifikasi untuk tim: ringkas, tabel jawaban, tautan ke admin. */
export function leadNotificationEmail(input: {
  company: string
  tier: string
  score: number
  maxScore: number
  rows: SnapshotRow[]
  adminUrl: string
  /** Nama formulir asal lead, mis. "Formulir Minat SiberGuard". */
  formTitle?: string
}) {
  const subject = `[Lead ${TIER_LABEL[input.tier] ?? input.tier}] ${input.company || 'Tanpa nama perusahaan'} — skor ${input.score}/${input.maxScore}`
  let lastSection = ''
  const body = input.rows
    .map((r) => {
      const head =
        r.section !== lastSection
          ? `<tr><td colspan="2" style="padding:14px 0 6px;font:600 12px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#56607a">${esc(r.section)}</td></tr>`
          : ''
      lastSection = r.section
      return `${head}<tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#56607a;width:45%">${esc(r.question)}</td><td style="padding:6px 0;vertical-align:top;color:#0e1a33">${esc(r.answer || '—')}</td></tr>`
    })
    .join('')
  const html = `<div style="font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#0e1a33;max-width:640px">
<p style="margin:0 0 4px;font-size:12px;color:#56607a">SiberGuard${input.formTitle ? ` · ${esc(input.formTitle)}` : ''}</p>
<h2 style="margin:0 0 12px;font-size:18px">${esc(input.company || 'Lead baru')}</h2>
<p style="margin:0 0 16px">Tier <strong>${TIER_LABEL[input.tier] ?? input.tier}</strong> · skor ${input.score} dari ${input.maxScore}</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">${body}</table>
<p style="margin:20px 0 0"><a href="${esc(input.adminUrl)}" style="color:#1d5fe0">Buka lead di admin →</a></p>
</div>`
  const text = [
    subject,
    '',
    ...input.rows.map((r) => `${r.question}\n  ${r.answer || '—'}`),
    '',
    `Admin: ${input.adminUrl}`,
  ].join('\n')
  return { subject, html, text }
}

export function autoReplyEmail(input: { subject: string; body: string; name: string }) {
  const text = input.body.replaceAll('{nama}', input.name || '')
  const html = `<div style="font:14px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#0e1a33;max-width:560px">${esc(
    text,
  )
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')}</div>`
  return { subject: input.subject, html, text }
}
