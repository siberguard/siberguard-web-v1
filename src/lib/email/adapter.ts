import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import type { Config } from 'payload'

export type EmailProvider = 'resend' | 'smtp' | null

/**
 * Penyedia email dipilih dari env, sehingga satu kode bisa dipakai di semua lingkungan:
 * - `RESEND_API_KEY` → Resend (staging di Vercel)
 * - `SMTP_HOST`      → SMTP/nodemailer (VPS/Docker, Mailpit saat development)
 * - keduanya kosong  → email dimatikan; kiriman lead tetap tersimpan dengan status "skipped".
 */
export function emailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.SMTP_HOST) return 'smtp'
  return null
}

export function buildEmailAdapter(): Config['email'] {
  const from = {
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@socmerdeka.id',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'SiberGuard',
  }

  switch (emailProvider()) {
    case 'resend':
      return resendAdapter({
        ...from,
        apiKey: process.env.RESEND_API_KEY as string,
        // Staging: semua email dialihkan ke satu alamat uji agar responden asli tidak menerima email.
        overrideRecipientAddress: process.env.EMAIL_OVERRIDE_TO || undefined,
      })
    case 'smtp':
      return nodemailerAdapter({
        ...from,
        skipVerify: process.env.NODE_ENV !== 'production',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        },
      })
    default:
      return undefined
  }
}
