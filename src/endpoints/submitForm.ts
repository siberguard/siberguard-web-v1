import { after } from 'next/server'
import type { Endpoint, Payload } from 'payload'
import { z } from 'zod'

import { lookupGeo, parseUserAgent } from '@/lib/analytics/enrich'
import { logSystem } from '@/lib/analytics/storage'
import { isLocale, type Locale } from '@/lib/cms/paths'
import { pruneHiddenAnswers } from '@/lib/forms/conditions'
import { autoReplyEmail, leadNotificationEmail } from '@/lib/forms/leadEmail'
import { validationMessages, yesNo } from '@/lib/forms/messages'
import { scoreAnswers } from '@/lib/forms/scoring'
import { toPublicForm } from '@/lib/forms/serialize'
import { buildSnapshot, type SnapshotRow } from '@/lib/forms/snapshot'
import type { Answers } from '@/lib/forms/types'
import { normalizePhone, validateAnswers } from '@/lib/forms/validate'
import type { Form, FormSubmission } from '@/payload-types'
import { getClientIp, jsonResponse, rateLimit } from '@/lib/security/request'

const answerValue = z.union([
  z.string().max(2000),
  z.array(z.string().max(100)).max(30),
  z.boolean(),
])

const bodySchema = z.object({
  answers: z.record(z.string().max(60), answerValue),
  locale: z.string(),
  formVersion: z.number().int().optional(),
  hp: z.string().max(200).optional(),
  elapsedMs: z.number().int().min(0).optional(),
  sid: z
    .string()
    .max(40)
    .regex(/^[a-z0-9]*$/i)
    .optional(),
  turnstileToken: z.string().max(4096).optional(),
  attribution: z
    .object({
      utmSource: z.string().max(100).optional(),
      utmMedium: z.string().max(100).optional(),
      utmCampaign: z.string().max(100).optional(),
      referrer: z.string().max(300).optional(),
      landingPath: z.string().max(300).optional(),
    })
    .optional(),
})

/** Respons "sukses" palsu untuk bot agar tidak belajar cara melewati filter. */
const fakeOk = () => jsonResponse({ ok: true })

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip !== 'local' ? { remoteip: ip } : {}),
      }),
    })
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Ambil kolom kontak untuk daftar lead. Kode field bawaan kuesioner dipakai lebih dulu. */
function contactColumns(form: Form, answers: Answers) {
  const fields = (form.sections ?? []).flatMap((s) => s.fields ?? [])
  const firstOf = (type: string) => fields.find((f) => f.blockType === type)?.name
  const firstText = firstOf('textInput')
  const emailField = firstOf('emailInput')
  const phoneField = firstOf('phoneInput')
  const phone = str(answers[phoneField ?? ''])
  return {
    companyName: str(answers.nama_perusahaan) || str(answers[firstText ?? '']),
    industry: str(answers.bidang_usaha),
    picName: str(answers.nama_pic),
    email: str(answers[emailField ?? '']).toLowerCase(),
    whatsapp: phone ? normalizePhone(phone) : '',
  }
}

async function sendLeadEmails(
  payload: Payload,
  form: Form,
  submission: FormSubmission,
  rows: SnapshotRow[],
  locale: Locale,
) {
  const settings = form.settings ?? {}
  const recipients = (settings.notifyEmails ?? []).map((r) => r.email).filter(Boolean)
  let status: 'sent' | 'failed' | 'skipped' = 'skipped'

  if (recipients.length) {
    const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const mail = leadNotificationEmail({
      company: submission.companyName ?? '',
      tier: submission.tier ?? 'cold',
      score: submission.score ?? 0,
      maxScore: submission.maxScore ?? 0,
      rows,
      adminUrl: `${serverURL}/admin/collections/form-submissions/${submission.id}`,
    })
    try {
      await payload.sendEmail({ to: recipients, ...mail })
      status = 'sent'
    } catch (err) {
      status = 'failed'
      await logSystem(payload, {
        level: 'error',
        source: 'email',
        message: `Notifikasi lead gagal: ${(err as Error).message}`,
      })
    }
  }

  if (settings.autoReply && submission.consent && submission.email) {
    const localized = await payload.findByID({
      collection: 'forms',
      id: form.id,
      locale,
      depth: 0,
      overrideAccess: true,
    })
    const subject = localized.settings?.autoReplySubject
    const body = localized.settings?.autoReplyBody
    if (subject && body) {
      try {
        await payload.sendEmail({
          to: submission.email,
          ...autoReplyEmail({ subject, body, name: submission.picName ?? '' }),
        })
      } catch (err) {
        await logSystem(payload, {
          level: 'warn',
          source: 'email',
          message: `Balasan otomatis gagal: ${(err as Error).message}`,
        })
      }
    }
  }

  await payload.update({
    collection: 'form-submissions',
    id: submission.id,
    data: { emailStatus: status },
    overrideAccess: true,
    context: { skipNotes: true },
  })
}

/**
 * POST /api/forms/:id/submit — menerima kuesioner dari website.
 * Validasi ulang di server dengan aturan yang sama seperti wizard di browser.
 */
export const submitFormEndpoint: Endpoint = {
  path: '/:id/submit',
  method: 'post',
  handler: async (req) => {
    const payload = req.payload
    const ip = getClientIp(req.headers)
    if (!rateLimit(`submit:${ip}`, 5, 10 * 60_000))
      return jsonResponse({ error: 'rateLimited' }, 429)

    let body: z.infer<typeof bodySchema>
    try {
      const parsed = bodySchema.safeParse(await req.json?.())
      if (!parsed.success) return jsonResponse({ error: 'server' }, 400)
      body = parsed.data
    } catch {
      return jsonResponse({ error: 'server' }, 400)
    }

    // Anti-spam: honeypot terisi atau dikirim terlalu cepat (< 4 detik) → pura-pura sukses.
    if (body.hp || (body.elapsedMs !== undefined && body.elapsedMs < 4000)) return fakeOk()
    if (!(await verifyTurnstile(body.turnstileToken, ip)))
      return jsonResponse({ error: 'server' }, 400)

    const locale: Locale = isLocale(body.locale) ? body.locale : 'id'
    const id = String(req.routeParams?.id ?? '')

    let form: Form
    try {
      form = await payload.findByID({
        collection: 'forms',
        id,
        locale,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      return jsonResponse({ error: 'server' }, 404)
    }

    const publicForm = toPublicForm(form)
    const answers = pruneHiddenAnswers(publicForm, body.answers)
    const errors = validateAnswers(publicForm, answers, validationMessages(locale))
    if (Object.keys(errors).length) {
      const outdated = body.formVersion !== undefined && body.formVersion !== form.version
      return jsonResponse(outdated ? { error: 'outdated' } : { errors }, 400)
    }

    // Snapshot selalu dalam bahasa Indonesia agar konsisten untuk tim internal.
    const formId =
      locale === 'id'
        ? form
        : await payload.findByID({
            collection: 'forms',
            id,
            locale: 'id',
            depth: 0,
            overrideAccess: true,
          })
    const rows = buildSnapshot(toPublicForm(formId), answers, yesNo('id'))
    const { score, maxScore, tier } = scoreAnswers(form, answers)
    const contact = contactColumns(form, answers)
    const consentField = form.settings?.contactConsentField
    const ua = req.headers.get('user-agent') ?? ''
    const geo = await lookupGeo(ip, req.headers)

    let submission: FormSubmission
    try {
      submission = await payload.create({
        collection: 'form-submissions',
        overrideAccess: true,
        data: {
          ...contact,
          consent: consentField ? answers[consentField] === true : false,
          answers,
          snapshot: rows,
          score,
          maxScore,
          tier,
          status: 'new',
          form: form.id,
          formVersion: form.version ?? 1,
          locale,
          attribution: {
            ...body.attribution,
            country: geo.cc,
            city: geo.ct,
            device: ua ? parseUserAgent(ua).dev : undefined,
            sessionId: body.sid,
          },
        },
      })
    } catch (err) {
      await logSystem(payload, {
        level: 'error',
        source: 'form',
        message: `Gagal menyimpan lead: ${(err as Error).message}`,
      })
      return jsonResponse({ error: 'server' }, 500)
    }

    // Email dikirim setelah respons terkirim agar pengunjung tidak menunggu SMTP.
    const task = () => sendLeadEmails(payload, form, submission, rows, locale)
    try {
      after(task)
    } catch {
      await task()
    }

    return jsonResponse({ ok: true })
  },
}
