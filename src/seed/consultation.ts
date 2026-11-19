import { t } from './helpers'

/** Opsi pilihan dengan skor lead (skor hanya terlihat di admin). */
const o = (value: string, id: string, en: string, score = 0) => ({ value, label: t(id, en), score })

/**
 * Formulir minat SiberGuard — kolom mengikuti brief konten microsite (bagian 07):
 * nama perusahaan, sektor, PIC, email & WhatsApp, jumlah endpoint, kondisi keamanan,
 * minat (Paket Basic / Program Pilot), anggaran (opsional), dan persetujuan data.
 * Formulir sengaja tidak meminta password, token akses, log mentah, atau data rahasia.
 */
export const consultationForm = {
  slug: 'formulir-minat-siberguard',
  title: t('Formulir Minat SiberGuard', 'SiberGuard Interest Form'),
  intro: t(
    'Ceritakan kebutuhan keamanan digital usaha Anda. Pilih konsultasi Paket Basic atau pengajuan minat Program Pilot.',
    'Tell us about your business’s digital security needs. Choose a Basic plan consultation or register interest in the Pilot Programme.',
  ),
  estimatedTime: t('Sekitar 2 menit', 'About 2 minutes'),
  sections: [
    {
      key: 'kebutuhan',
      title: t('Usaha & Kebutuhan', 'Business & needs'),
      fields: [
        {
          blockType: 'singleChoice',
          name: 'minat',
          label: t('Apa yang ingin Anda ajukan?', 'What would you like to request?'),
          required: true,
          options: [
            o('paket-basic', 'Konsultasi Paket Basic', 'Basic plan consultation', 3),
            o('program-pilot', 'Minat Program Pilot', 'Pilot Programme interest', 2),
          ],
        },
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
          label: t('Sektor usaha', 'Business sector'),
          placeholder: t('Mis. ritel, logistik, klinik', 'e.g. retail, logistics, clinic'),
          required: true,
          width: 'half',
        },
        {
          blockType: 'singleChoice',
          name: 'jumlah_endpoint',
          label: t(
            'Perkiraan jumlah endpoint yang ingin dipantau',
            'Estimated number of endpoints to monitor',
          ),
          helpText: t(
            'Endpoint: komputer kerja, laptop, workstation, atau server Windows, Linux, dan macOS.',
            'Endpoints: work computers, laptops, workstations, or Windows, Linux and macOS servers.',
          ),
          required: true,
          options: [
            o('1-4', '1–4', '1–4', 0),
            o('5-10', '5–10', '5–10', 2),
            o('11-25', '11–25', '11–25', 3),
            o('lebih-25', 'Lebih dari 25', 'More than 25', 3),
            o('belum-tahu', 'Belum tahu', 'Not sure yet', 1),
          ],
        },
        {
          blockType: 'singleChoice',
          name: 'kondisi_keamanan',
          label: t('Bagaimana keamanan IT dikelola saat ini?', 'How is IT security managed today?'),
          required: true,
          options: [
            o('belum-ada', 'Belum ada pengelolaan khusus', 'No dedicated management yet', 2),
            o('staf-internal', 'Ditangani staf IT internal', 'Handled by in-house IT staff', 2),
            o('vendor-it', 'Dibantu vendor IT eksternal', 'Supported by an external IT vendor', 2),
            o(
              'layanan-keamanan',
              'Sudah memakai layanan keamanan lain',
              'Already using another security service',
              1,
            ),
          ],
        },
        {
          blockType: 'singleChoice',
          name: 'anggaran',
          label: t('Perkiraan anggaran keamanan per bulan', 'Estimated monthly security budget'),

          required: false,
          options: [
            o('kurang-1-5jt', 'Di bawah Rp1,5 juta', 'Under IDR 1.5 million', 0),
            o('1-5jt-3jt', 'Rp1,5–3 juta', 'IDR 1.5–3 million', 2),
            o('3jt-5jt', 'Rp3–5 juta', 'IDR 3–5 million', 3),
            o('lebih-5jt', 'Di atas Rp5 juta', 'Over IDR 5 million', 3),
            o('belum-ditentukan', 'Belum ditentukan', 'Not decided yet', 1),
          ],
        },
      ],
    },
    {
      key: 'kontak',
      title: t('Kontak', 'Contact'),
      fields: [
        {
          blockType: 'textInput',
          name: 'nama_pic',
          label: t('Nama PIC dan jabatan', 'Contact name and job title'),
          placeholder: t(
            'Mis. Rina Wulandari, Manajer Operasional',
            'e.g. Rina Wulandari, Operations Manager',
          ),
          required: true,
        },
        {
          blockType: 'emailInput',
          name: 'email_bisnis',
          label: t('Email bisnis', 'Business email'),
          placeholder: t('nama@perusahaan.co.id', 'name@company.com'),
          required: true,
          width: 'half',
        },
        {
          blockType: 'phoneInput',
          name: 'whatsapp',
          label: t('Nomor WhatsApp', 'WhatsApp number'),
          placeholder: t('0812 3456 7890', '+62 812 3456 7890'),
          required: true,
          width: 'half',
        },
        {
          blockType: 'consent',
          name: 'persetujuan_data',
          label: t(
            'Saya menyetujui pemrosesan data pada formulir ini untuk tindak lanjut konsultasi atau program pilot, sesuai Kebijakan Privasi.',
            'I agree to the processing of the data in this form to follow up on my consultation or pilot request, in line with the Privacy Policy.',
          ),
          required: true,
        },
      ],
    },
  ],
  submitLabel: t('Kirim Permintaan', 'Send request'),
  successTitle: t(
    'Terima kasih, permintaan Anda sudah kami terima.',
    'Thank you, we have received your request.',
  ),
  successMessage: t(
    'Tim SiberGuard akan menghubungi Anda melalui email atau WhatsApp untuk membahas kebutuhan, cakupan endpoint, dan langkah berikutnya.',
    'The SiberGuard team will contact you by email or WhatsApp to discuss your needs, endpoint scope, and next steps.',
  ),
  privacyNote: t(
    'Jangan cantumkan password, token akses, log mentah, atau informasi rahasia lain di formulir ini. Data hanya digunakan untuk menindaklanjuti permintaan Anda sesuai Kebijakan Privasi.',
    'Please do not include passwords, access tokens, raw logs, or other confidential information in this form. Your data is only used to follow up on your request, in line with the Privacy Policy.',
  ),
  settings: {
    notifyEmails: process.env.SEED_NOTIFY_EMAIL ? [{ email: process.env.SEED_NOTIFY_EMAIL }] : [],
    autoReply: false,
    contactConsentField: 'persetujuan_data',
    autoReplySubject: t(
      'Terima kasih telah menghubungi SiberGuard',
      'Thank you for contacting SiberGuard',
    ),
    autoReplyBody: t(
      'Halo {nama},\n\nTerima kasih atas minat Anda terhadap SiberGuard. Tim kami akan meninjau permintaan Anda dan menghubungi Anda untuk membahas langkah berikutnya.\n\nSalam,\nTim SiberGuard',
      'Hello {nama},\n\nThank you for your interest in SiberGuard. Our team will review your request and contact you to discuss the next steps.\n\nBest regards,\nThe SiberGuard team',
    ),
    // Skor maks. 11 (minat 3 + endpoint 3 + kondisi 2 + anggaran 3).
    hotMin: 8,
    warmMin: 5,
  },
}
