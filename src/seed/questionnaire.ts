import { t } from './helpers'

/** Opsi pilihan dengan skor lead (skor hanya terlihat di admin). */
const o = (value: string, id: string, en: string, score = 0) => ({ value, label: t(id, en), score })

const RANGES = [
  o('1-25', '1–25', '1–25'),
  o('25-50', '25–50', '25–50'),
  o('50-100', '50–100', '50–100'),
  o('100-plus', 'Lebih dari 100', 'More than 100'),
]

const ifPocYes = { field: 'minat_poc', operator: 'in', values: 'ya' }
const ifConsent = { field: 'bersedia_dihubungi', operator: 'checked', values: '' }

/**
 * Kuesioner Minat & Kesiapan POC SOC UMKM — disalin dari
 * docs/reference/kuesioner-qualified-lead-poc-soc-umkm-v1.pdf (13 pertanyaan + kontak).
 */
export const questionnaire = {
  slug: 'kuesioner-poc-soc-umkm',
  title: t(
    'Kuesioner Minat & Kesiapan POC SOC UMKM',
    'Interest & Readiness Questionnaire: SOC for SMEs POC',
  ),
  intro: t(
    'Formulir singkat untuk mengenali profil calon pelanggan, kebutuhan layanan, kemampuan berlangganan, dan kesiapan mengikuti uji coba SOC UMKM.',
    'A short form to understand your company profile, service needs, budget, and readiness to join the SOC for SMEs trial.',
  ),
  estimatedTime: t('Estimasi pengisian 4–6 menit', 'Takes about 4–6 minutes'),
  sections: [
    {
      key: 'A',
      title: t('Profil Perusahaan', 'Company profile'),
      fields: [
        {
          blockType: 'textInput',
          name: 'nama_perusahaan',
          label: t('Nama perusahaan', 'Company name'),
          placeholder: t('PT Contoh Sejahtera', 'PT Example Corp'),
          required: true,
          width: 'half',
        },
        {
          blockType: 'textInput',
          name: 'bidang_usaha',
          label: t('Bidang usaha', 'Line of business'),
          placeholder: t('Mis. ritel, logistik, klinik', 'e.g. retail, logistics, clinic'),
          required: true,
          width: 'half',
        },
        {
          blockType: 'singleChoice',
          name: 'jumlah_karyawan',
          label: t(
            'Berapa jumlah karyawan perusahaan saat ini?',
            'How many employees does the company have?',
          ),
          required: true,
          options: RANGES,
        },
        {
          blockType: 'singleChoice',
          name: 'jumlah_perangkat',
          label: t(
            'Berapa jumlah komputer atau laptop untuk operasional perusahaan?',
            'How many computers or laptops are used for day-to-day operations?',
          ),
          required: true,
          options: [...RANGES, o('tidak-tahu', 'Tidak tahu', 'Not sure')],
        },
        {
          blockType: 'singleChoice',
          name: 'pengelola_it',
          label: t(
            'Siapa yang mengelola IT perusahaan saat ini?',
            'Who manages IT at your company today?',
          ),
          required: true,
          options: [
            o('tim-internal', 'Tim IT internal', 'In-house IT team'),
            o('vendor', 'Vendor IT eksternal', 'External IT vendor'),
            o('pemilik', 'Pemilik/karyawan', 'Owner or staff'),
            o('belum-ada', 'Belum ada penanggung jawab khusus', 'No one specifically responsible'),
          ],
        },
      ],
    },
    {
      key: 'B',
      title: t('Minat & Kebutuhan Layanan', 'Interest & service needs'),
      fields: [
        {
          blockType: 'singleChoice',
          name: 'minat_soc',
          label: t(
            'Seberapa tertarik perusahaan menggunakan layanan SOC (pemantauan dan bantuan penanganan ancaman siber)?',
            'How interested is your company in a SOC service (monitoring and help handling cyber threats)?',
          ),
          required: true,
          options: [
            o('sangat', 'Sangat tertarik', 'Very interested', 3),
            o('tertarik', 'Tertarik', 'Interested', 2),
            o('mempertimbangkan', 'Masih mempertimbangkan', 'Still considering', 1),
            o('belum', 'Belum tertarik', 'Not interested yet', 0),
          ],
        },
        {
          blockType: 'multiChoice',
          name: 'kebutuhan_layanan',
          label: t(
            'Layanan keamanan digital apa yang paling dibutuhkan perusahaan?',
            'Which digital security services does your company need most?',
          ),
          required: true,
          maxSelections: 3,
          allowOther: true,
          otherLabel: t('Lainnya', 'Other'),
          options: [
            o('monitoring-soc', 'Monitoring keamanan (SOC)', 'Security monitoring (SOC)'),
            o(
              'perlindungan-perangkat',
              'Perlindungan komputer/laptop',
              'Computer and laptop protection',
            ),
            o('backup', 'Backup & perlindungan data', 'Backup & data protection'),
            o(
              'pemeriksaan-keamanan',
              'Pemeriksaan keamanan sistem/website',
              'System or website security testing',
            ),
            o('bantuan-insiden', 'Bantuan insiden', 'Incident assistance'),
            o('edukasi', 'Edukasi/konsultasi keamanan', 'Security training or consulting'),
            o('pengelolaan-it', 'Pengelolaan IT/cloud', 'IT or cloud management'),
          ],
        },
      ],
    },
    {
      key: 'C',
      title: t('Keputusan Pembelian & Kemampuan Finansial', 'Purchasing decision & budget'),
      fields: [
        {
          blockType: 'singleChoice',
          name: 'peran_keputusan',
          label: t(
            'Apa peran Anda dalam keputusan pembelian layanan IT/keamanan siber?',
            'What is your role in purchasing IT or cyber security services?',
          ),
          required: true,
          options: [
            o('utama', 'Pengambil keputusan utama', 'Main decision-maker', 3),
            o('ikut', 'Ikut mengambil keputusan', 'Involved in the decision', 2),
            o('rekomendasi', 'Memberi rekomendasi', 'I make recommendations', 1),
            o('tidak-terlibat', 'Tidak terlibat langsung', 'Not directly involved', 0),
          ],
        },
        {
          blockType: 'singleChoice',
          name: 'anggaran',
          label: t(
            'Apakah perusahaan memiliki anggaran untuk IT atau keamanan siber?',
            'Does your company have a budget for IT or cyber security?',
          ),
          required: true,
          options: [
            o('rutin', 'Anggaran rutin', 'Regular budget', 3),
            o('sesuai-kebutuhan', 'Sesuai kebutuhan', 'As needed', 2),
            o('belum-ada', 'Belum ada anggaran', 'No budget yet', 0),
            o('tidak-tahu', 'Tidak tahu', 'Not sure', 1),
          ],
        },
        {
          blockType: 'singleChoice',
          name: 'biaya_bulanan',
          label: t(
            'Berapa biaya bulanan yang sesuai dengan kemampuan perusahaan untuk layanan SOC?',
            'What monthly cost for a SOC service fits your company’s budget?',
          ),
          required: false,
          options: [
            o('kurang-250rb', '< Rp250.000', '< IDR 250,000', 0),
            o('250rb-500rb', 'Rp250.000–500.000', 'IDR 250,000–500,000', 1),
            o('500rb-1jt', 'Rp500.001–1.000.000', 'IDR 500,001–1,000,000', 2),
            o('1jt-2jt', 'Rp1.000.001–2.000.000', 'IDR 1,000,001–2,000,000', 3),
            o('lebih-2jt', '> Rp2.000.000', '> IDR 2,000,000', 3),
            o('belum-tentu', 'Belum dapat menentukan', 'Cannot decide yet', 0),
          ],
        },
      ],
    },
    {
      key: 'D',
      title: t('Kesiapan Mengikuti POC', 'Readiness for the POC'),
      fields: [
        {
          blockType: 'singleChoice',
          name: 'minat_poc',
          label: t(
            'Apakah perusahaan berminat mengikuti uji coba terbatas (POC) SOC UMKM?',
            'Is your company interested in the limited trial (POC) of SOC for SMEs?',
          ),
          required: true,
          options: [
            o('ya', 'Ya, berminat', 'Yes, interested', 3),
            o('info', 'Ingin informasi lebih lanjut', 'I would like more information', 1),
            o('belum', 'Belum berminat', 'Not interested yet', 0),
          ],
        },
        {
          blockType: 'singleChoice',
          name: 'mulai_poc',
          label: t(
            'Jika terpilih, kapan perusahaan dapat mulai mengikuti POC?',
            'If selected, when could your company start the POC?',
          ),
          required: true,
          showWhen: ifPocYes,
          options: [
            o('2-minggu', 'Dalam 2 minggu', 'Within 2 weeks', 3),
            o('1-bulan', 'Dalam 1 bulan', 'Within 1 month', 2),
            o('1-3-bulan', 'Dalam 1–3 bulan', 'Within 1–3 months', 1),
            o('belum-tentu', 'Belum dapat menentukan', 'Cannot decide yet', 0),
          ],
        },
        {
          blockType: 'singleChoice',
          name: 'pertimbangan_langganan',
          label: t(
            'Jika POC bermanfaat, apakah perusahaan akan mempertimbangkan berlangganan?',
            'If the POC proves useful, would your company consider subscribing?',
          ),
          required: true,
          options: [
            o('ya', 'Ya', 'Yes', 3),
            o(
              'mungkin',
              'Mungkin, tergantung manfaat dan harga',
              'Maybe, depending on value and price',
              2,
            ),
            o('belum-tahu', 'Belum tahu', 'Not sure yet', 1),
            o('tidak', 'Tidak', 'No', 0),
          ],
        },
        {
          blockType: 'singleChoice',
          name: 'kesediaan_perangkat',
          label: t(
            'Apakah perusahaan bersedia menyediakan perangkat operasional untuk uji coba monitoring setelah ruang lingkup dan persetujuan disepakati?',
            'Would your company provide operational devices for the monitoring trial once the scope and approvals are agreed?',
          ),
          required: true,
          showWhen: ifPocYes,
          options: [
            o('ya', 'Ya', 'Yes', 3),
            o('perlu-persetujuan', 'Perlu persetujuan manajemen', 'Needs management approval', 2),
            o(
              'perlu-penjelasan',
              'Perlu penjelasan teknis',
              'Needs a technical explanation first',
              1,
            ),
            o('belum', 'Belum bersedia', 'Not willing yet', 0),
          ],
        },
      ],
    },
    {
      key: 'E',
      title: t('Kontak Tindak Lanjut', 'Follow-up contact'),
      description: t(
        'Diisi hanya jika bersedia menerima informasi lebih lanjut mengenai layanan SOC atau program POC.',
        'Only fill this in if you would like more information about the SOC service or the POC programme.',
      ),
      fields: [
        {
          blockType: 'consent',
          name: 'bersedia_dihubungi',
          label: t(
            'Saya bersedia dihubungi terkait layanan SOC UMKM dan program POC.',
            'I agree to be contacted about the SOC for SMEs service and the POC programme.',
          ),
          required: false,
        },
        {
          blockType: 'textInput',
          name: 'nama_pic',
          label: t('Nama PIC dan jabatan', 'Contact name and job title'),
          placeholder: t(
            'Mis. Rina Wulandari, Manajer Operasional',
            'e.g. Rina Wulandari, Operations Manager',
          ),
          required: true,
          showWhen: ifConsent,
        },
        {
          blockType: 'phoneInput',
          name: 'whatsapp',
          label: t('Nomor WhatsApp', 'WhatsApp number'),
          placeholder: t('0812 3456 7890', '+62 812 3456 7890'),
          required: true,
          width: 'half',
          showWhen: ifConsent,
        },
        {
          blockType: 'emailInput',
          name: 'email_perusahaan',
          label: t('Email perusahaan', 'Company email'),
          placeholder: t('nama@perusahaan.co.id', 'name@company.com'),
          required: true,
          width: 'half',
          showWhen: ifConsent,
        },
      ],
    },
  ],
  submitLabel: t('Kirim Kuesioner', 'Submit questionnaire'),
  successTitle: t(
    'Terima kasih, jawaban Anda sudah kami terima.',
    'Thank you, we have received your answers.',
  ),
  successMessage: t(
    'Jawaban ini membantu kami memetakan kebutuhan keamanan UMKM. Bila Anda bersedia dihubungi, tim SiberGuard akan menghubungi Anda.',
    'Your answers help us map the security needs of SMEs. If you agreed to be contacted, the SiberGuard team will get in touch.',
  ),
  privacyNote: t(
    'Data yang diberikan digunakan untuk memetakan kebutuhan serta menindaklanjuti minat calon peserta sesuai pemberitahuan privasi penyelenggara. Pengisian kuesioner bukan persetujuan instalasi, akses perangkat, atau pemrosesan data monitoring.',
    'The information you provide is used to map needs and follow up on prospective participants’ interest, in line with the organiser’s privacy notice. Completing this questionnaire is not consent to installation, device access, or processing of monitoring data.',
  ),
  settings: {
    notifyEmails: process.env.SEED_NOTIFY_EMAIL ? [{ email: process.env.SEED_NOTIFY_EMAIL }] : [],
    autoReply: false,
    contactConsentField: 'bersedia_dihubungi',
    autoReplySubject: t(
      'Terima kasih telah mengisi kuesioner SiberGuard',
      'Thank you for completing the SiberGuard questionnaire',
    ),
    autoReplyBody: t(
      'Halo {nama},\n\nTerima kasih telah mengisi kuesioner minat & kesiapan POC SOC UMKM. Tim kami akan meninjau jawaban Anda dan menghubungi Anda.\n\nSalam,\nTim SiberGuard',
      'Hello {nama},\n\nThank you for completing the SOC for SMEs POC questionnaire. Our team will review your answers and get in touch.\n\nBest regards,\nThe SiberGuard team',
    ),
    hotMin: 17,
    warmMin: 10,
  },
}
