import { lexical, t } from './helpers'

export const headerData = {
  navItems: [
    { label: t('Tentang', 'About'), href: '#tentang' },
    { label: t('Layanan', 'Services'), href: '#layanan' },
    { label: t('Deploy Agent', 'Deploy Agent'), href: '#deploy-agent' },
    { label: t('Paket', 'Plans'), href: '#paket' },
    { label: t('Pendaftaran', 'Register'), href: '#pendaftaran' },
  ],
  ctas: [
    // Portal klien belum tersedia: tombol disembunyikan sampai URL portal siap.
    {
      label: t('Masuk Portal', 'Client portal'),
      href: '#pendaftaran',
      style: 'secondary',
      hidden: true,
    },
    { label: t('Daftar', 'Register'), href: '#pendaftaran', style: 'primary', hidden: false },
  ],
}

export const footerData = {
  description: t(
    'Layanan Security Operations Center terkelola oleh DF18 Security Consulting (PT Duta Firza Mulia).',
    'A managed Security Operations Center service by DF18 Security Consulting (PT Duta Firza Mulia).',
  ),
  columns: [
    {
      title: t('Layanan', 'Services'),
      links: [
        { label: t('Managed SOC', 'Managed SOC'), href: '#layanan' },
        { label: t('SIEM & XDR', 'SIEM & XDR'), href: '#layanan' },
        { label: t('Threat Intelligence', 'Threat Intelligence'), href: '#layanan' },
        { label: t('Incident Response', 'Incident Response'), href: '#layanan' },
      ],
    },
    {
      title: t('Mulai', 'Get started'),
      links: [
        { label: t('Deploy Agent', 'Deploy Agent'), href: '#deploy-agent' },
        { label: t('Paket & Harga', 'Plans & pricing'), href: '#paket' },
        { label: t('Daftar Piloting', 'Join the pilot'), href: '#pendaftaran' },
        { label: t('Kuesioner POC', 'POC questionnaire'), href: '/kuesioner' },
      ],
    },
  ],
  contact: {
    title: t('Kontak', 'Contact'),
    items: [
      { text: t('halo@socmerdeka.id', 'halo@socmerdeka.id'), href: 'mailto:halo@socmerdeka.id' },
      { text: t('Jakarta, Indonesia', 'Jakarta, Indonesia') },
      { text: t('Darurat insiden: 24/7', 'Incident emergencies: 24/7') },
    ],
  },
  copyright: t(
    '© {tahun} SOC Merdeka · DF18 Security Consulting',
    '© {tahun} SOC Merdeka · DF18 Security Consulting',
  ),
  legalLinks: [
    { label: t('Kebijakan Privasi', 'Privacy Policy'), href: '/kebijakan-privasi' },
    { label: t('Syarat Layanan', 'Terms of Service'), href: '/syarat-layanan' },
  ],
}

export const siteSettingsData = {
  siteName: 'SOC Merdeka',
  defaultTheme: 'system',
  organization: {
    legalName: 'PT Duta Firza Mulia',
    email: 'halo@socmerdeka.id',
    address: t('Jakarta, Indonesia', 'Jakarta, Indonesia'),
  },
  metaTitle: t(
    'SOC Merdeka · Security Operations Center terkelola 24/7',
    'SOC Merdeka · Managed 24/7 Security Operations Center',
  ),
  metaDescription: t(
    'SOC Merdeka: layanan Security Operations Center terkelola 24/7 oleh DF18 Security Consulting. Data tersimpan di Indonesia.',
    'SOC Merdeka: a managed 24/7 Security Operations Center service by DF18 Security Consulting. Data stays in Indonesia.',
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
        p: 'Saat Anda mengisi kuesioner, kami menyimpan jawaban Anda. Data kontak (nama PIC, jabatan, nomor WhatsApp, email perusahaan) hanya disimpan bila Anda mencentang persetujuan untuk dihubungi.',
      },
      {
        p: 'Untuk statistik kunjungan, kami mencatat halaman yang dibuka, sumber kunjungan, jenis perangkat, dan perkiraan lokasi tingkat kota. Kami tidak memakai cookie pelacak dan tidak menyimpan alamat IP. Pengunjung dibedakan dengan kode acak yang berganti setiap hari.',
      },
      { h: 'Penggunaan data' },
      {
        ul: [
          'Memetakan kebutuhan keamanan siber calon pelanggan.',
          'Menindaklanjuti minat terhadap layanan SOC Merdeka dan program POC, bila Anda bersedia dihubungi.',
          'Memperbaiki isi dan kinerja situs ini.',
        ],
      },
      {
        p: 'Pengisian kuesioner bukan persetujuan instalasi, akses perangkat, atau pemrosesan data monitoring.',
      },
      { h: 'Penyimpanan dan hak Anda' },
      {
        p: 'Data disimpan di server yang berlokasi di Indonesia. Anda dapat meminta akses, koreksi, atau penghapusan data sesuai UU Pelindungan Data Pribadi dengan menghubungi halo@socmerdeka.id.',
      },
    ]),
    en: lexical([
      { p: DRAFT_NOTE.en },
      { h: 'Data we collect' },
      {
        p: 'When you complete the questionnaire, we store your answers. Contact details (contact name, job title, WhatsApp number, company email) are only stored if you tick the box agreeing to be contacted.',
      },
      {
        p: 'For visit statistics we record the pages viewed, the traffic source, device type, and approximate city-level location. We do not use tracking cookies and do not store IP addresses. Visitors are distinguished by a random code that changes every day.',
      },
      { h: 'How we use data' },
      {
        ul: [
          'To map the cyber security needs of prospective customers.',
          'To follow up on interest in SOC Merdeka and the POC programme, if you agreed to be contacted.',
          'To improve the content and performance of this site.',
        ],
      },
      {
        p: 'Completing the questionnaire is not consent to installation, device access, or processing of monitoring data.',
      },
      { h: 'Storage and your rights' },
      {
        p: 'Data is stored on servers located in Indonesia. You may request access to, correction of, or deletion of your data under Indonesia’s Personal Data Protection Law by contacting halo@socmerdeka.id.',
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
        p: 'Situs ini memberikan informasi mengenai layanan SOC Merdeka oleh DF18 Security Consulting (PT Duta Firza Mulia). Harga dan perintah instalasi yang ditampilkan bersifat indikatif selama tahap pra-peluncuran.',
      },
      { h: 'Program POC' },
      {
        p: 'Keikutsertaan dalam program POC memerlukan kesepakatan tertulis mengenai ruang lingkup, perangkat yang dipantau, dan persetujuan pemrosesan data sebelum agen dipasang.',
      },
    ]),
    en: lexical([
      { p: DRAFT_NOTE.en },
      { h: 'Scope' },
      {
        p: 'This site provides information about the SOC Merdeka service by DF18 Security Consulting (PT Duta Firza Mulia). Prices and installation commands shown are indicative during the pre-launch phase.',
      },
      { h: 'POC programme' },
      {
        p: 'Taking part in the POC programme requires a written agreement on scope, monitored devices, and consent to data processing before the agent is installed.',
      },
    ]),
  },
}
