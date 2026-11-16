/**
 * Data demo untuk meninjau dashboard secara lokal. JANGAN dipakai di production.
 *
 *   pnpm demo:data        → isi 30 hari event analytics + ±40 lead demo
 *   pnpm demo:data:clear  → hapus semua data demo
 *
 * Semua event demo ditandai m.demo=true dan lead demo memakai sumber utm "demo",
 * sehingga bisa dihapus bersih tanpa menyentuh data asli.
 */
import 'dotenv/config'

import config from '@payload-config'
import { ObjectId } from 'mongodb'
import { getPayload } from 'payload'

import { EVENTS_COLLECTION, getDb } from '../../src/lib/analytics/storage'
import { scoreAnswers } from '../../src/lib/forms/scoring'
import { toPublicForm } from '../../src/lib/forms/serialize'
import { buildSnapshot } from '../../src/lib/forms/snapshot'
import type { Answers } from '../../src/lib/forms/types'

if (process.env.NODE_ENV === 'production') {
  console.error('Data demo tidak boleh dibuat di production.')
  process.exit(1)
}

const clear = process.env.DEMO_CLEAR === '1'
const payload = await getPayload({ config })
const db = getDb(payload)

await db.collection(EVENTS_COLLECTION).deleteMany({ 'm.demo': true })
const old = await payload.delete({
  collection: 'form-submissions',
  where: { 'attribution.utmSource': { equals: 'demo' } },
  overrideAccess: true,
})
payload.logger.info(`Data demo lama dihapus (${old.docs.length} lead).`)
if (clear) process.exit(0)

const rnd = (n: number) => Math.floor(Math.random() * n)
const pick = <T>(arr: readonly T[], weights?: number[]): T => {
  if (!weights) return arr[rnd(arr.length)]
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < arr.length; i++) if ((r -= weights[i]) < 0) return arr[i]
  return arr[arr.length - 1]
}

const SECTIONS = [
  'hero',
  'tentang',
  'alur',
  'layanan',
  'deploy-agent',
  'paket',
  'faq',
  'pendaftaran',
]
const REFS = [undefined, 'google.com', 'linkedin.com', 'instagram.com', 'wa.me', 'bing.com']
const CITIES: [string, string, string][] = [
  ['ID', 'Jakarta', 'Jakarta'],
  ['ID', 'West Java', 'Bandung'],
  ['ID', 'East Java', 'Surabaya'],
  ['ID', 'Central Java', 'Semarang'],
  ['ID', 'Bali', 'Denpasar'],
  ['SG', 'Singapore', 'Singapore'],
  ['MY', 'Kuala Lumpur', 'Kuala Lumpur'],
]
const docs: Record<string, unknown>[] = []
const now = Date.now()

for (let day = 29; day >= 0; day--) {
  const weekday = new Date(now - day * 86_400_000).getDay()
  const visitors = (weekday === 0 || weekday === 6 ? 18 : 42) + rnd(25) + (29 - day)
  for (let v = 0; v < visitors; v++) {
    const vid = `demo${day}x${v}`
    const sid = `demo${day}s${v}`
    const t0 = now - day * 86_400_000 - rnd(20 * 3600_000)
    const dev = pick(['desktop', 'mobile', 'tablet'] as const, [55, 40, 5])
    const [cc, rg, ct] = pick(CITIES, [50, 18, 12, 6, 5, 5, 4])
    const base = {
      vid,
      sid,
      dev,
      br: pick(['Chrome', 'Safari', 'Edge', 'Firefox'], [60, 25, 10, 5]),
      os:
        dev === 'desktop'
          ? pick(['Windows', 'macOS', 'Linux'], [60, 32, 8])
          : pick(['Android', 'iOS'], [65, 35]),
      cc,
      rg,
      ct,
      th: pick(['light', 'dark'], [70, 30]),
    }
    const locale = pick(['id', 'en'], [85, 15])
    const prefix = locale === 'en' ? '/en' : ''
    const ref = pick(REFS, [40, 30, 12, 8, 7, 3])
    const campaign = ref === 'linkedin.com' && Math.random() < 0.5 ? 'pilot-umkm-nov' : undefined
    let t = t0
    const ev = (type: string, extra: Record<string, unknown> = {}) => {
      t += 4000 + rnd(30_000)
      docs.push({
        ts: new Date(t),
        m: { type, locale, demo: true },
        path: extra.path ?? (prefix || '/'),
        ...base,
        ...extra,
      })
    }
    ev('pageview', {
      ref,
      utm: campaign ? { s: 'linkedin', m: 'social', c: campaign } : undefined,
      sw: dev === 'mobile' ? 390 : 1440,
    })
    const depth = 1 + rnd(SECTIONS.length)
    for (const s of SECTIONS.slice(0, depth)) ev('section_view', { n: s })
    if (Math.random() < 0.18)
      ev('cta_click', {
        n: pick([
          'hero:Ikut Piloting',
          'header:Daftar',
          'plan:Merdeka Bisnis',
          'nav:#layanan',
          'hero:Cara Pasang Agen',
        ]),
      })
    if (depth >= 5 && Math.random() < 0.15)
      ev('copy_command', { n: pick(['Linux', 'Windows', 'macOS'], [55, 35, 10]) })
    if (Math.random() < 0.2) ev('pageview', { path: `${prefix}/kuesioner` })
    if (depth >= 8 || Math.random() < 0.12) {
      ev('form_view', { n: 'kuesioner-poc-soc-umkm' })
      if (Math.random() < 0.55) {
        ev('form_start', { n: 'kuesioner-poc-soc-umkm' })
        let step = 1
        while (step < 5 && Math.random() < 0.78) ev('form_step', { x: { step: ++step } })
        if (step === 5 && Math.random() < 0.8) ev('form_submit', { n: 'kuesioner-poc-soc-umkm' })
      }
    }
    ev('page_leave', { d: 3000 + rnd(240_000) })
  }
}
await db.collection(EVENTS_COLLECTION).insertMany(docs, { ignoreUndefined: true })
payload.logger.info(`${docs.length} event demo dibuat.`)

// --- Lead demo ---
const form = (await payload.find({ collection: 'forms', depth: 0, limit: 1, locale: 'id' })).docs[0]
if (form) {
  const pf = toPublicForm(form)
  const optionsOf = (name: string) =>
    pf.sections
      .flatMap((s) => s.fields)
      .find((f) => f.name === name)
      ?.options?.map((o) => o.value) ?? []
  const companies = [
    'Kopi Nusantara',
    'Klinik Sehat Mandiri',
    'Logistik Cepat',
    'Toko Batik Sekar',
    'Koperasi Maju Bersama',
    'Percetakan Sinar',
    'Hotel Melati',
    'Sekolah Cendekia',
    'Bengkel Jaya',
    'Apotek Sentosa',
  ]
  const industries = [
    'Ritel',
    'Kesehatan',
    'Logistik',
    'Manufaktur',
    'Pendidikan',
    'Perhotelan',
    'Keuangan',
  ]
  for (let i = 0; i < 42; i++) {
    const poc = pick(optionsOf('minat_poc'), [45, 35, 20])
    const consent = Math.random() < 0.72
    const answers: Answers = {
      nama_perusahaan: `[DEMO] ${pick(companies)} ${i + 1}`,
      bidang_usaha: pick(industries),
      jumlah_karyawan: pick(optionsOf('jumlah_karyawan'), [50, 25, 15, 10]),
      jumlah_perangkat: pick(optionsOf('jumlah_perangkat'), [45, 25, 12, 8, 10]),
      pengelola_it: pick(optionsOf('pengelola_it'), [20, 30, 30, 20]),
      minat_soc: pick(optionsOf('minat_soc'), [30, 40, 22, 8]),
      kebutuhan_layanan: [
        ...new Set([
          pick(optionsOf('kebutuhan_layanan')),
          pick(optionsOf('kebutuhan_layanan')),
          pick(optionsOf('kebutuhan_layanan')),
        ]),
      ],
      peran_keputusan: pick(optionsOf('peran_keputusan'), [45, 25, 20, 10]),
      anggaran: pick(optionsOf('anggaran'), [25, 40, 25, 10]),
      biaya_bulanan: pick(optionsOf('biaya_bulanan'), [20, 30, 22, 12, 6, 10]),
      minat_poc: poc,
      ...(poc === 'ya'
        ? {
            mulai_poc: pick(optionsOf('mulai_poc'), [20, 35, 30, 15]),
            kesediaan_perangkat: pick(optionsOf('kesediaan_perangkat'), [35, 35, 20, 10]),
          }
        : {}),
      pertimbangan_langganan: pick(optionsOf('pertimbangan_langganan'), [30, 45, 18, 7]),
      bersedia_dihubungi: consent,
      ...(consent
        ? {
            nama_pic: 'Contoh PIC, Pemilik',
            whatsapp: '+6281200000000',
            email_perusahaan: `demo${i}@contoh.co.id`,
          }
        : {}),
    }
    const { score, maxScore, tier } = scoreAnswers(form, answers)
    const created = new Date(now - rnd(30) * 86_400_000 - rnd(20 * 3600_000)).toISOString()
    await payload
      .create({
        collection: 'form-submissions',
        overrideAccess: true,
        data: {
          companyName: String(answers.nama_perusahaan),
          industry: String(answers.bidang_usaha),
          picName: consent ? 'Contoh PIC, Pemilik' : '',
          email: consent ? `demo${i}@contoh.co.id` : '',
          whatsapp: consent ? '+6281200000000' : '',
          consent,
          answers,
          snapshot: buildSnapshot(pf, answers),
          score,
          maxScore,
          tier,
          status: pick(
            ['new', 'contacted', 'qualified', 'poc', 'closed'] as const,
            [40, 25, 15, 10, 10],
          ),
          form: form.id,
          formVersion: form.version ?? 1,
          locale: 'id',
          emailStatus: 'skipped',
          attribution: { utmSource: 'demo', device: 'desktop', country: 'ID' },
        },
      })
      .then((doc) =>
        db
          .collection('form-submissions')
          .updateOne(
            { _id: new ObjectId(String(doc.id)) },
            { $set: { createdAt: new Date(created) } },
          ),
      )
  }
  payload.logger.info('42 lead demo dibuat.')
}
process.exit(0)
