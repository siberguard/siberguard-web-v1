import type { Endpoint, Where } from 'payload'

import { hasRole } from '@/access/roles'
import type { SnapshotRow } from '@/lib/forms/snapshot'

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  // Cegah formula injection saat dibuka di Excel/Sheets.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const wib = (iso: string) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))

/**
 * GET /api/form-submissions/export?from=YYYY-MM-DD&to=YYYY-MM-DD&tier=hot
 * CSV (UTF-8 + BOM agar terbaca benar di Excel). Satu kolom per pertanyaan.
 */
export const exportSubmissionsEndpoint: Endpoint = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'sales'))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const params = new URL(req.url ?? 'http://x').searchParams
    const where: Where = {}
    const from = params.get('from')
    const to = params.get('to')
    if (from || to) {
      where.createdAt = {
        ...(from ? { greater_than_equal: new Date(`${from}T00:00:00+07:00`).toISOString() } : {}),
        ...(to
          ? {
              less_than: new Date(
                new Date(`${to}T00:00:00+07:00`).getTime() + 86_400_000,
              ).toISOString(),
            }
          : {}),
      }
    }
    const tier = params.get('tier')
    if (tier) where.tier = { equals: tier }

    const { docs } = await req.payload.find({
      collection: 'form-submissions',
      where,
      sort: '-createdAt',
      pagination: false,
      depth: 0,
      req,
      overrideAccess: false,
    })

    // Kolom pertanyaan: gabungan semua snapshot, urutan kemunculan pertama.
    const questions = new Map<string, string>()
    for (const d of docs)
      for (const r of (d.snapshot as SnapshotRow[] | null) ?? [])
        if (!questions.has(r.name)) questions.set(r.name, r.question)

    const fixed = [
      'Waktu (WIB)',
      'Tier',
      'Skor',
      'Status',
      'Perusahaan',
      'Bidang usaha',
      'PIC',
      'Email',
      'WhatsApp',
      'Bersedia dihubungi',
      'Bahasa',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'Referrer',
      'Negara',
      'Kota',
    ]
    const lines = [[...fixed, ...questions.values()].map(csvCell).join(',')]
    for (const d of docs) {
      const answers = new Map(
        ((d.snapshot as SnapshotRow[] | null) ?? []).map((r) => [r.name, r.answer]),
      )
      const a = d.attribution ?? {}
      lines.push(
        [
          wib(d.createdAt),
          d.tier,
          d.score,
          d.status,
          d.companyName,
          d.industry,
          d.picName,
          d.email,
          d.whatsapp,
          d.consent ? 'Ya' : 'Tidak',
          d.locale,
          a.utmSource,
          a.utmMedium,
          a.utmCampaign,
          a.referrer,
          a.country,
          a.city,
          ...[...questions.keys()].map((k) => answers.get(k) ?? ''),
        ]
          .map(csvCell)
          .join(','),
      )
    }

    const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
    return new Response('﻿' + lines.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-soc-merdeka-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}
