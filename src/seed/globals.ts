import { lexical, t } from './helpers'

export const headerData = {
  // Navigasi sesuai brief; "Beranda" diwakili logo (tautan ke atas halaman).
  navItems: [
    { label: t('Mengapa SiberGuard?', 'Why SiberGuard?'), href: '#mengapa' },
    { label: t('Layanan', 'Services'), href: '#layanan' },
    { label: t('Cara Kerja', 'How it works'), href: '#cara-kerja' },
    { label: t('Harga', 'Pricing'), href: '#harga' },
    { label: t('Program Pilot', 'Pilot'), href: '#program-pilot' },
    { label: t('FAQ', 'FAQ'), href: '#faq' },
  ],
  ctas: [
    // Portal klien belum tersedia: tombol disembunyikan sampai URL portal siap.
    {
      label: t('Masuk Portal', 'Client portal'),
      href: '#konsultasi',
      style: 'secondary',
      hidden: true,
    },
    {
      label: t('Konsultasi', 'Consultation'),
      href: '#konsultasi',
      style: 'primary',
      hidden: false,
    },
  ],
}

export const footerData = {
  // Operator/badan hukum belum dicantumkan: menunggu persetujuan hubungan merek (lihat brief).
  description: t(
    'SiberGuard (Siber Guard Indonesia) — layanan Security Operations Center (SOC) terkelola untuk UMKM. Amankan Usaha, Majukan Nusantara.',
    'SiberGuard (Siber Guard Indonesia) — a managed Security Operations Center (SOC) service for SMEs. Amankan Usaha, Majukan Nusantara.',
  ),
  columns: [
    {
      title: t('Layanan', 'Service'),
      links: [
        { label: t('Fitur layanan', 'Features'), href: '#layanan' },
        { label: t('Cara kerja', 'How it works'), href: '#cara-kerja' },
        { label: t('Cakupan endpoint', 'Endpoint scope'), href: '#cakupan' },
        { label: t('Jam layanan & SLA', 'Service hours & SLA'), href: '#jam-layanan' },
      ],
    },
    {
      title: t('Mulai', 'Get started'),
      links: [
        { label: t('Paket Basic', 'Basic plan'), href: '#harga' },
        { label: t('Program Pilot', 'Pilot Programme'), href: '#program-pilot' },
        { label: t('Konsultasi', 'Consultation'), href: '#konsultasi' },
        { label: t('Kuesioner kesiapan', 'Readiness questionnaire'), href: '/kuesioner' },
      ],
    },
  ],
  contact: {
    title: t('Kontak', 'Contact'),
    // Email & WhatsApp resmi belum ditetapkan (brief: [email resmi], [nomor WhatsApp resmi]).
    items: [
      { text: t('Formulir konsultasi', 'Consultation form'), href: '#konsultasi' },
      { text: t('Senin–Jumat, 08.00–17.00 WIB', 'Monday–Friday, 08:00–17:00 WIB') },
      { text: t('Indonesia', 'Indonesia') },
    ],
  },
  copyright: t(
    '© {tahun} SiberGuard · Siber Guard Indonesia',
    '© {tahun} SiberGuard · Siber Guard Indonesia',
  ),
  legalLinks: [
    { label: t('Kebijakan Privasi', 'Privacy Policy'), href: '/kebijakan-privasi' },
    { label: t('Syarat Layanan', 'Terms of Service'), href: '/syarat-layanan' },
  ],
}

export const siteSettingsData = {
  siteName: 'SiberGuard',
  defaultTheme: 'system',
  // Nama badan hukum, email, dan telepon resmi dikosongkan sampai disetujui (dipakai di JSON-LD).
  organization: {
    legalName: null,
    email: null,

    address: t('Indonesia', 'Indonesia'),
  },
  metaTitle: t('SiberGuard · SOC Terkelola untuk UMKM', 'SiberGuard · Managed SOC for SMEs'),
  metaDescription: t(
    'SiberGuard membantu UMKM memantau ancaman keamanan pada perangkat digital bisnis melalui layanan Security Operations Center (SOC) terkelola. Amankan Usaha, Majukan Nusantara.',
    'SiberGuard helps SMEs monitor security threats on their business devices through a managed Security Operations Center (SOC) service. Amankan Usaha, Majukan Nusantara.',
  ),
  analytics: { enabled: true, respectDoNotTrack: true, excludedIps: '' },
}

const DRAFT_NOTE = t(
  'Draf awal untuk ditinjau tim legal sebelum situs diluncurkan.',
  'Initial draft, to be reviewed by legal counsel before launch.',
)

/** Draf halaman legal. Isinya menggambarkan apa yang benar-benar dilakukan situs ini, tapi wajib ditinjau legal. */
export const privacyPage = {
  title: t('Kebijakan Privasi', 'Privacy Policy'),
  slug: 'kebijakan-privasi',
  content: {
    id: lexical([
      { p: DRAFT_NOTE.id },
      { h: 'Data yang kami kumpulkan' },
      {
        p: 'Saat Anda mengisi formulir konsultasi atau kuesioner, kami menyimpan jawaban Anda. Data kontak (nama PIC, jabatan, nomor WhatsApp, email bisnis) disimpan setelah Anda memberikan persetujuan pada formulir. Formulir kami tidak meminta password, token akses, log mentah, atau informasi rahasia lain.',
      },
      {
        p: 'Untuk statistik kunjungan, kami mencatat halaman yang dibuka, sumber kunjungan, jenis perangkat, dan perkiraan lokasi tingkat kota. Kami tidak memakai cookie pelacak dan tidak menyimpan alamat IP. Pengunjung dibedakan dengan kode acak yang berganti setiap hari.',
      },
      { h: 'Penggunaan data' },
      {
        ul: [
          'Memetakan kebutuhan keamanan siber calon pelanggan.',
          'Menindaklanjuti permintaan konsultasi layanan SiberGuard dan minat Program Pilot.',
          'Memperbaiki isi dan kinerja situs ini.',
        ],
      },
      {
        p: 'Pengisian formulir bukan persetujuan instalasi agent, akses perangkat, atau pemrosesan data monitoring.',
      },
      { h: 'Penyimpanan dan hak Anda' },
      {
        p: 'Data disimpan di server yang berlokasi di Indonesia. Anda dapat meminta akses, koreksi, atau penghapusan data sesuai UU Pelindungan Data Pribadi melalui formulir konsultasi di situs ini.',
      },
    ]),
    en: lexical([
      { p: DRAFT_NOTE.en },
      { h: 'Data we collect' },
      {
        p: 'When you complete the consultation form or questionnaire, we store your answers. Contact details (contact name, job title, WhatsApp number, business email) are stored once you give your consent in the form. Our forms never ask for passwords, access tokens, raw logs, or other confidential information.',
      },
      {
        p: 'For visit statistics we record the pages viewed, the traffic source, device type, and approximate city-level location. We do not use tracking cookies and do not store IP addresses. Visitors are distinguished by a random code that changes every day.',
      },
      { h: 'How we use data' },
      {
        ul: [
          'To map the cyber security needs of prospective customers.',
          'To follow up on SiberGuard consultation requests and Pilot Programme interest.',
          'To improve the content and performance of this site.',
        ],
      },
      {
        p: 'Completing a form is not consent to agent installation, device access, or processing of monitoring data.',
      },
      { h: 'Storage and your rights' },
      {
        p: 'Data is stored on servers located in Indonesia. You may request access to, correction of, or deletion of your data under Indonesia’s Personal Data Protection Law through the consultation form on this site.',
      },
    ]),
  },
}

export const termsPage = {
  title: t('Syarat Layanan', 'Terms of Service'),
  slug: 'syarat-layanan',
  content: {
    id: lexical([
      { p: DRAFT_NOTE.id },
      { h: 'Ruang lingkup' },
      {
        p: 'Situs ini memberikan informasi mengenai layanan SiberGuard (Siber Guard Indonesia), Security Operations Center terkelola untuk UMKM. Harga, jam layanan, dan target respons yang ditampilkan adalah informasi pemasaran, bukan kontrak atau SLA final. Ketentuan yang mengikat dituangkan dalam perjanjian layanan.',
      },
      { h: 'Program Pilot' },
      {
        p: 'Keikutsertaan dalam Program Pilot memerlukan kesepakatan tertulis mengenai ruang lingkup, perangkat yang dipantau, dan persetujuan pemrosesan data sebelum agent dipasang. Ketentuan biaya, kuota, jadwal, dan seleksi peserta diinformasikan langsung oleh tim program sebelum peserta menyetujui partisipasi.',
      },
    ]),
    en: lexical([
      { p: DRAFT_NOTE.en },
      { h: 'Scope' },
      {
        p: 'This site provides information about SiberGuard (Siber Guard Indonesia), a managed Security Operations Center service for SMEs. The prices, service hours, and response targets shown are marketing information, not a contract or final SLA. Binding terms are set out in the service agreement.',
      },
      { h: 'Pilot Programme' },
      {
        p: 'Taking part in the Pilot Programme requires a written agreement on scope, monitored devices, and consent to data processing before the agent is installed. Fees, quotas, schedule, and participant selection are communicated directly by the programme team before participants agree to take part.',
      },
    ]),
  },
}
