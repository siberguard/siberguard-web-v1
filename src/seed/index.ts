/**
 * Mengisi CMS dengan konten awal SiberGuard (brief microsite), formulir minat,
 * dan kuesioner PDF (id & en).
 *
 *   pnpm seed        → hanya mengisi bila belum ada halaman "home"
 *   pnpm seed:force  → menimpa halaman, form, dan globals (lead & user TIDAK disentuh)
 */
import 'dotenv/config'

import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { consultationForm } from './consultation'
import { footerData, headerData, privacyPage, siteSettingsData, termsPage } from './globals'
import { resolve, withRowIds } from './helpers'
import { homeLayout, questionnaireLayout } from './home'
import { questionnaire } from './questionnaire'

const force = process.env.SEED_FORCE === '1'
const ctx = { disableRevalidate: true }

async function upsertGlobal(
  payload: Payload,
  slug: 'header' | 'footer' | 'site-settings',
  tree: object,
) {
  const created = await payload.updateGlobal({
    slug,
    locale: 'id',
    data: resolve(tree, 'id') as never,
    context: ctx,
  })
  await payload.updateGlobal({
    slug,
    locale: 'en',
    data: withRowIds(resolve(tree, 'en'), created) as never,
    context: ctx,
  })
}

async function upsertPage(
  payload: Payload,
  page: { slug: string; title: unknown; layout: unknown[] },
) {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: page.slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0])
    await payload.delete({ collection: 'pages', id: existing.docs[0].id, context: ctx })
  const idData = resolve(page, 'id') as never
  const created = await payload.create({
    collection: 'pages',
    locale: 'id',
    data: { ...(idData as object), _status: 'published' } as never,
    depth: 0,
    context: ctx,
  })
  await payload.update({
    collection: 'pages',
    id: created.id,
    locale: 'en',
    data: {
      ...(withRowIds(resolve(page, 'en'), created) as object),
      _status: 'published',
    } as never,
    depth: 0,
    context: ctx,
  })
  payload.logger.info(`  halaman /${page.slug === 'home' ? '' : page.slug} dibuat`)
}

/** Buat atau perbarui formulir berdasarkan slug (lead lama tetap terhubung ke ID yang sama). */
async function upsertForm(payload: Payload, form: { slug: string }) {
  const existing = await payload.find({
    collection: 'forms',
    where: { slug: { equals: form.slug } },
    limit: 1,
    depth: 0,
  })
  const idData = resolve(form, 'id') as never
  const doc = existing.docs[0]
    ? await payload.update({
        collection: 'forms',
        id: existing.docs[0].id,
        locale: 'id',
        data: idData,
        context: ctx,
      })
    : await payload.create({ collection: 'forms', locale: 'id', data: idData, context: ctx })
  await payload.update({
    collection: 'forms',
    id: doc.id,
    locale: 'en',
    data: withRowIds(resolve(form, 'en'), doc) as never,
    context: ctx,
  })
  return doc.id
}

async function seed() {
  const payload = await getPayload({ config })
  const log = payload.logger
  // Tampilkan tujuan seed (tanpa user/password) agar tidak salah database, mis. lokal vs Atlas.
  try {
    const url = new URL(process.env.DATABASE_URL ?? '')
    log.info(`Seed ke ${url.protocol}//${url.host}${url.pathname}`)
  } catch {}

  const hasHome = await payload.count({ collection: 'pages', where: { slug: { equals: 'home' } } })
  if (hasHome.totalDocs > 0 && !force) {
    log.info('Konten sudah ada. Jalankan "pnpm seed:force" untuk menimpa.')
    process.exit(0)
  }

  // --- Admin pertama ---
  const users = await payload.count({ collection: 'users' })
  if (users.totalDocs === 0) {
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD
    if (email && password) {
      await payload.create({
        collection: 'users',
        data: { email, password, name: 'Administrator', role: 'admin' },
      })
      log.info(`Admin dibuat: ${email}`)
    } else {
      log.warn('SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD kosong — buat admin lewat /admin.')
    }
  }

  // --- Formulir ---
  log.info('Formulir…')
  const questionnaireId = await upsertForm(payload, questionnaire)
  const consultationId = await upsertForm(payload, consultationForm)

  // --- Halaman ---
  log.info('Halaman…')
  await upsertPage(payload, {
    slug: 'home',
    title: { __l: true, id: 'Beranda', en: 'Home' },
    layout: homeLayout(consultationId),
  })
  await upsertPage(payload, {
    slug: 'kuesioner',
    title: { __l: true, id: 'Kuesioner POC SOC UMKM', en: 'SOC for SMEs POC questionnaire' },
    layout: questionnaireLayout(questionnaireId),
  })
  for (const legal of [privacyPage, termsPage]) {
    const layout = [
      {
        blockType: 'richText',
        anchorId: 'isi',
        background: 'default',
        content: { __l: true, ...legal.content },
      },
    ]
    await upsertPage(payload, { slug: legal.slug, title: legal.title, layout })
  }

  // --- Globals ---
  log.info('Header, footer, pengaturan…')
  await upsertGlobal(payload, 'header', headerData)
  await upsertGlobal(payload, 'footer', footerData)
  await upsertGlobal(payload, 'site-settings', siteSettingsData)

  log.info('Seed selesai.')
  process.exit(0)
}

// `payload run` hanya meng-import file ini, jadi seed harus ditunggu di top-level.
try {
  await seed()
} catch (err) {
  console.error(err)
  process.exit(1)
}
