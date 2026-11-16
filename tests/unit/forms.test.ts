import { describe, expect, it } from 'vitest'

import {
  isFieldVisible,
  indexFields,
  matchesCondition,
  pruneHiddenAnswers,
} from '@/lib/forms/conditions'
import { validationMessages } from '@/lib/forms/messages'
import { scoreAnswers } from '@/lib/forms/scoring'
import { toPublicForm } from '@/lib/forms/serialize'
import { buildSnapshot } from '@/lib/forms/snapshot'
import type { Answers } from '@/lib/forms/types'
import { normalizePhone, validateAnswers } from '@/lib/forms/validate'
import type { Form } from '@/payload-types'
import { resolve } from '@/seed/helpers'
import { questionnaire } from '@/seed/questionnaire'

/** Kuesioner hasil seed (bahasa Indonesia) dipakai sebagai fixture yang realistis. */
const rawForm = {
  id: 'f1',
  version: 3,
  updatedAt: '',
  createdAt: '',
  ...resolve(questionnaire, 'id'),
} as unknown as Form
const form = toPublicForm(rawForm)
const m = validationMessages('id')

const fullAnswers: Answers = {
  nama_perusahaan: 'PT Uji',
  bidang_usaha: 'Ritel',
  jumlah_karyawan: '1-25',
  jumlah_perangkat: 'tidak-tahu',
  pengelola_it: 'pemilik',
  minat_soc: 'sangat',
  kebutuhan_layanan: ['monitoring-soc', 'backup'],
  peran_keputusan: 'utama',
  anggaran: 'rutin',
  biaya_bulanan: '1jt-2jt',
  minat_poc: 'ya',
  mulai_poc: '2-minggu',
  pertimbangan_langganan: 'ya',
  kesediaan_perangkat: 'ya',
  bersedia_dihubungi: true,
  nama_pic: 'Rina, Manajer',
  whatsapp: '0812 3456 7890',
  email_perusahaan: 'rina@contoh.co.id',
}

describe('kuesioner hasil seed', () => {
  it('mencakup 13 pertanyaan PDF (Q1 dipecah dua) + bagian kontak', () => {
    expect(form.sections.map((s) => s.key)).toEqual(['A', 'B', 'C', 'D', 'E'])
    const names = form.sections.flatMap((s) => s.fields.map((f) => f.name))
    expect(names).toHaveLength(18) // 14 isian Q1–Q13 + persetujuan + 3 kontak
    expect(new Set(names).size).toBe(names.length)
  })

  it('tidak mengirim skor dan pengaturan notifikasi ke browser', () => {
    const json = JSON.stringify(form)
    expect(json).not.toContain('score')
    expect(json).not.toContain('notifyEmails')
    expect(json).not.toContain('hotMin')
  })

  it('jawaban lengkap lolos validasi', () => {
    expect(validateAnswers(form, fullAnswers, m)).toEqual({})
  })
})

describe('kondisi tampil', () => {
  const byName = indexFields(form)
  const q11 = byName.get('mulai_poc')!
  const pic = byName.get('nama_pic')!

  it('Q11 & Q13 hanya tampil bila minat POC = ya', () => {
    expect(isFieldVisible(q11, { minat_poc: 'ya' }, byName)).toBe(true)
    expect(isFieldVisible(q11, { minat_poc: 'info' }, byName)).toBe(false)
    expect(isFieldVisible(q11, {}, byName)).toBe(false)
  })

  it('field kontak hanya tampil setelah persetujuan dicentang', () => {
    expect(isFieldVisible(pic, { bersedia_dihubungi: true }, byName)).toBe(true)
    expect(isFieldVisible(pic, { bersedia_dihubungi: false }, byName)).toBe(false)
  })

  it('operator notIn / unchecked dan nilai array', () => {
    expect(matchesCondition({ field: 'a', operator: 'notIn', values: ['x'] }, { a: 'y' })).toBe(
      true,
    )
    expect(matchesCondition({ field: 'a', operator: 'in', values: ['x'] }, { a: ['y', 'x'] })).toBe(
      true,
    )
    expect(matchesCondition({ field: 'a', operator: 'unchecked', values: [] }, {})).toBe(true)
  })

  it('jawaban untuk field tersembunyi dibuang sebelum disimpan', () => {
    const pruned = pruneHiddenAnswers(form, {
      ...fullAnswers,
      minat_poc: 'belum',
      bersedia_dihubungi: false,
    })
    expect(pruned.mulai_poc).toBeUndefined()
    expect(pruned.kesediaan_perangkat).toBeUndefined()
    expect(pruned.nama_pic).toBeUndefined()
    expect(pruned.nama_perusahaan).toBe('PT Uji')
  })
})

describe('validasi', () => {
  it('validasi per langkah hanya memeriksa langkah itu', () => {
    const errors = validateAnswers(form, {}, m, 0)
    expect(Object.keys(errors).sort()).toEqual([
      'bidang_usaha',
      'jumlah_karyawan',
      'jumlah_perangkat',
      'nama_perusahaan',
      'pengelola_it',
    ])
  })

  it('Q6 menolak lebih dari 3 pilihan', () => {
    const errors = validateAnswers(
      form,
      {
        ...fullAnswers,
        kebutuhan_layanan: ['monitoring-soc', 'backup', 'edukasi', 'pengelolaan-it'],
      },
      m,
    )
    expect(errors.kebutuhan_layanan).toMatch(/3/)
  })

  it('opsi "Lainnya" wajib disertai keterangan', () => {
    const errors = validateAnswers(form, { ...fullAnswers, kebutuhan_layanan: ['lainnya'] }, m)
    expect(errors.kebutuhan_layanan__other).toBe(m.otherRequired)
  })

  it('kontak wajib & tervalidasi bila bersedia dihubungi', () => {
    const errors = validateAnswers(
      form,
      { ...fullAnswers, whatsapp: 'abc', email_perusahaan: 'bukan-email', nama_pic: '' },
      m,
    )
    expect(errors.whatsapp).toBe(m.phone)
    expect(errors.email_perusahaan).toBe(m.email)
    expect(errors.nama_pic).toBe(m.required)
  })

  it('Q9 (biaya bulanan) opsional', () => {
    const { biaya_bulanan: _omit, ...rest } = fullAnswers
    expect(validateAnswers(form, rest, m)).toEqual({})
  })

  it('menolak nilai opsi yang tidak dikenal', () => {
    expect(validateAnswers(form, { ...fullAnswers, minat_soc: 'hack' }, m).minat_soc).toBe(
      m.invalidOption,
    )
  })

  it('normalisasi nomor Indonesia ke +62', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('+6281234567890')
    expect(normalizePhone('62 812 3456')).toBe('+628123456')
    expect(normalizePhone('+62 812')).toBe('+62812')
  })
})

describe('skor lead', () => {
  it('jawaban paling positif → Hot dengan skor maksimum', () => {
    const r = scoreAnswers(rawForm, fullAnswers)
    expect(r.score).toBe(r.maxScore)
    expect(r.tier).toBe('hot')
  })

  it('tanpa persetujuan kontak → tier Survei berapa pun skornya', () => {
    expect(scoreAnswers(rawForm, { ...fullAnswers, bersedia_dihubungi: false }).tier).toBe('survey')
  })

  it('jawaban negatif → Cold', () => {
    const r = scoreAnswers(rawForm, {
      ...fullAnswers,
      minat_soc: 'belum',
      peran_keputusan: 'tidak-terlibat',
      anggaran: 'belum-ada',
      biaya_bulanan: 'kurang-250rb',
      minat_poc: 'belum',
      pertimbangan_langganan: 'tidak',
    })
    expect(r.tier).toBe('cold')
  })
})

describe('snapshot', () => {
  it('menyimpan label pertanyaan & jawaban, termasuk isian "Lainnya"', () => {
    const rows = buildSnapshot(form, {
      ...fullAnswers,
      kebutuhan_layanan: ['backup', 'lainnya'],
      kebutuhan_layanan__other: 'Audit',
    })
    const q6 = rows.find((r) => r.name === 'kebutuhan_layanan')!
    expect(q6.answer).toBe('Backup & perlindungan data; Lainnya: Audit')
    expect(rows.find((r) => r.name === 'bersedia_dihubungi')!.answer).toBe('Ya')
    expect(rows.find((r) => r.name === 'minat_soc')!.question).toMatch(/Seberapa tertarik/)
  })
})
