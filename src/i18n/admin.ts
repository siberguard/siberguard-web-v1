import type { PayloadRequest } from 'payload'

/**
 * Label admin dua bahasa. Payload memilih teks sesuai bahasa admin pengguna
 * (Indonesia default, bisa diganti ke English di sidebar atau halaman akun).
 */
export const L = (id: string, en: string): Record<'id' | 'en', string> => ({ id, en })

/** Bahasa admin untuk request ini ('id' | 'en'). */
export const adminLang = (req?: Pick<PayloadRequest, 'i18n'> | null): 'id' | 'en' =>
  req?.i18n?.language === 'en' ? 'en' : 'id'

/** Pesan (mis. validasi) sesuai bahasa admin. */
export const msg = (
  req: Pick<PayloadRequest, 'i18n'> | null | undefined,
  id: string,
  en: string,
) => (adminLang(req) === 'en' ? en : id)
