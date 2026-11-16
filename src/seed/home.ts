import { t } from './helpers'

/** Konten halaman utama — disalin dari docs/reference/prototype-soc-merdeka.html, plus terjemahan Inggris. */

const ev = (severity: string, id: string, en: string, technique: string, host: string) => ({
  severity,
  title: t(id, en),
  technique,
  host,
})

const svc = (
  category: string,
  name: string,
  desc: [string, string],
  points: [string, string][],
) => ({
  category,
  name: t(name, name),
  description: t(...desc),
  points: points.map(([id, en]) => ({ text: t(id, en) })),
})

const NET = { label: t('Jaringan', 'Network'), value: t('Keluar TCP 443', 'Outbound TCP 443') }
const ARCH = (v: string) => ({ label: t('Arsitektur', 'Architecture'), value: t(v, v) })
const OS = (v: string) => ({ label: t('OS', 'OS'), value: t(v, v) })

export const homeLayout = (formId: string) => [
  {
    blockType: 'hero',
    anchorId: 'hero',
    background: 'ink',
    statusText: t(
      'Segera hadir · Program piloting dibuka',
      'Coming soon · Pilot programme now open',
    ),
    heading: t(
      'Keamanan siber yang berdaulat, dijaga 24 jam dari Indonesia.',
      'Sovereign cyber security, watched around the clock from Indonesia.',
    ),
    highlight: t('berdaulat', 'Sovereign'),
    lead: t(
      'SOC Merdeka memantau server dan endpoint bisnis Anda tanpa henti. Agen ringan mengirim log ke pusat operasi kami, analis lokal memilah ancaman, dan Anda menerima tindakan yang jelas, bukan tumpukan alert.',
      'SOC Merdeka monitors your business servers and endpoints without pause. A lightweight agent ships logs to our operations centre, local analysts triage the threats, and you receive clear actions instead of a pile of alerts.',
    ),
    primaryCta: { label: t('Ikut Piloting', 'Join the pilot'), href: '#pendaftaran' },
    secondaryCta: {
      label: t('Cara Pasang Agen', 'How to install the agent'),
      href: '#deploy-agent',
    },
    console: {
      enabled: true,
      title: t('soc-merdeka / antrean-alert', 'soc-merdeka / alert-queue'),
      badge: t('data simulasi', 'simulated data'),
      events: [
        ev(
          'high',
          'Brute force SSH dari 45.142.x.x',
          'SSH brute force from 45.142.x.x',
          'T1110',
          'srv-web-01',
        ),
        ev('medium', 'Perubahan file /etc/passwd', 'Change to /etc/passwd', 'T1098', 'srv-db-02'),
        ev(
          'low',
          'Login admin di luar jam kerja',
          'Admin login outside working hours',
          'T1078',
          'ws-keu-07',
        ),
        ev(
          'high',
          'Upaya webshell pada /uploads/',
          'Webshell attempt on /uploads/',
          'T1505.003',
          'srv-web-01',
        ),
        ev(
          'medium',
          'PowerShell encoded command',
          'PowerShell encoded command',
          'T1059.001',
          'ws-hr-03',
        ),
        ev(
          'low',
          'Port scan dari jaringan tamu',
          'Port scan from the guest network',
          'T1046',
          'fw-edge',
        ),
        ev(
          'high',
          'Koneksi ke IoC ransomware',
          'Connection to a ransomware IoC',
          'T1071',
          'ws-ops-11',
        ),
        ev(
          'medium',
          'Akun baru ditambahkan ke grup admin',
          'New account added to the admin group',
          'T1136',
          'dc-01',
        ),
        ev(
          'low',
          'Sertifikat TLS mendekati kedaluwarsa',
          'TLS certificate nearing expiry',
          '—',
          'srv-mail',
        ),
      ],
      metrics: [
        {
          label: t('Event / detik', 'Events / sec'),
          value: t('2.418', '2,418'),
          animate: 'fluctuate',
        },
        {
          label: t('Alert ditinjau', 'Alerts reviewed'),
          value: t('37', '37'),
          animate: 'increment',
        },
        {
          label: t('Median tanggap', 'Median response'),
          value: t('11m 40d', '11m 40s'),
          animate: 'none',
        },
      ],
    },
    stats: [
      { value: t('24/7', '24/7'), label: t('Pemantauan oleh analis', 'Monitoring by analysts') },
      {
        value: t('< 15 mnt', '< 15 min'),
        label: t('Target tanggap insiden kritis', 'Response target for critical incidents'),
      },
      {
        value: t('100%', '100%'),
        label: t('Data tersimpan di Indonesia', 'Data stored in Indonesia'),
      },
      {
        value: t('5 menit', '5 min'),
        label: t('Pasang agen per server', 'To install the agent on a server'),
      },
    ],
  },
  {
    blockType: 'featureGrid',
    anchorId: 'tentang',
    background: 'default',
    heading: t(
      'Kemampuan SOC kelas korporasi, dengan biaya yang masuk akal.',
      'Enterprise-grade SOC capability at a sensible cost.',
    ),
    lead: t(
      'Kebanyakan bisnis tidak punya tim keamanan sendiri. Kami menyediakan orang, platform, dan prosesnya sebagai satu layanan berlangganan.',
      'Most businesses do not have their own security team. We provide the people, the platform, and the process as a single subscription.',
    ),
    items: [
      {
        icon: 'clock',
        title: t('Pemantauan 24/7', '24/7 monitoring'),
        description: t(
          'Analis memantau log server, aplikasi, dan jaringan Anda sepanjang hari, termasuk akhir pekan dan hari libur nasional.',
          'Analysts watch your server, application, and network logs all day, including weekends and national holidays.',
        ),
      },
      {
        icon: 'shield',
        title: t('Kedaulatan Data', 'Data sovereignty'),
        description: t(
          'Log dan data insiden disimpan di pusat data dalam negeri, selaras dengan UU Pelindungan Data Pribadi.',
          'Logs and incident data are stored in data centres in Indonesia, in line with the Personal Data Protection Law (UU PDP).',
        ),
      },
      {
        icon: 'chip',
        title: t('Agen Milik Sendiri', 'Our own agent'),
        description: t(
          'Agen SOC Merdeka dikembangkan in-house. Ringan, terenkripsi, dan diperbarui otomatis dari pusat operasi.',
          'The SOC Merdeka agent is built in-house. Lightweight, encrypted, and updated automatically from the operations centre.',
        ),
      },
      {
        icon: 'activity',
        title: t('Deteksi Berbasis MITRE ATT&CK', 'Detection mapped to MITRE ATT&CK'),
        description: t(
          'Aturan deteksi dipetakan ke taktik dan teknik ATT&CK sehingga setiap alert punya konteks serangan yang jelas.',
          'Detection rules are mapped to ATT&CK tactics and techniques, so every alert comes with clear attack context.',
        ),
      },
      {
        icon: 'message',
        title: t('Laporan Berbahasa Indonesia', 'Reports in Bahasa Indonesia'),
        description: t(
          'Ringkasan bulanan dan laporan insiden ditulis untuk pimpinan maupun tim TI, lengkap dengan rekomendasi perbaikan.',
          'Monthly summaries and incident reports are written for leadership and IT teams alike, with remediation advice.',
        ),
      },
      {
        icon: 'checklist',
        title: t('Siap Audit', 'Audit-ready'),
        description: t(
          'Bukti pemantauan dan penanganan insiden mendukung kebutuhan ISO 27001, PSE Kominfo, dan regulasi sektor.',
          'Evidence of monitoring and incident handling supports ISO 27001, Kominfo PSE registration, and sector regulations.',
        ),
      },
    ],
  },
  {
    blockType: 'processFlow',
    anchorId: 'alur',
    background: 'muted',
    eyebrow: t('Arsitektur Operasional', 'How it works'),
    heading: t('Dari log mentah sampai tindakan nyata.', 'From raw logs to real action.'),
    steps: [
      {
        title: t('Agen', 'Agent'),
        tag: t('TLS 1.3 · mTLS', 'TLS 1.3 · mTLS'),
        description: t(
          'Terpasang di server dan endpoint, mengumpulkan log sistem, keamanan, dan integritas file.',
          'Installed on servers and endpoints, collecting system, security, and file-integrity logs.',
        ),
      },
      {
        title: t('Kolektor', 'Collector'),
        tag: t('normalisasi + enrich', 'normalise + enrich'),
        description: t(
          'Log dinormalisasi dan diperkaya dengan data geolokasi dan reputasi IP.',
          'Logs are normalised and enriched with geolocation and IP reputation data.',
        ),
      },
      {
        title: t('SIEM & Korelasi', 'SIEM & correlation'),
        tag: t('ATT&CK mapping', 'ATT&CK mapping'),
        description: t(
          'Aturan korelasi dan intelijen ancaman mendeteksi pola serangan lintas sumber.',
          'Correlation rules and threat intelligence detect attack patterns across sources.',
        ),
      },
      {
        title: t('Analis SOC', 'SOC analysts'),
        tag: t('L1 → L2 → L3', 'L1 → L2 → L3'),
        description: t(
          'Analis memilah alert, membuang false positive, dan menetapkan tingkat keparahan.',
          'Analysts triage alerts, discard false positives, and assign severity.',
        ),
      },
      {
        title: t('Notifikasi & Tiket', 'Notification & ticketing'),
        tag: t('SLA terukur', 'Measured SLA'),
        description: t(
          'Anda menerima kasus dengan langkah penanganan lewat email, WhatsApp, atau sistem tiket Anda.',
          'You receive a case with handling steps by email, WhatsApp, or your own ticketing system.',
        ),
      },
    ],
  },
  {
    blockType: 'services',
    anchorId: 'layanan',
    background: 'default',
    heading: t(
      'Satu langganan, enam lapis perlindungan.',
      'One subscription, six layers of protection.',
    ),
    allLabel: t('Semua', 'All'),
    categories: [
      { key: 'inti', label: t('Layanan Inti', 'Core services') },
      { key: 'intel', label: t('Intelijen', 'Intelligence') },
      { key: 'respons', label: t('Asesmen & Respons', 'Assessment & response') },
    ],
    items: [
      svc(
        'inti',
        'Managed SOC',
        [
          'Pemantauan dan analisis alert oleh tim analis kami.',
          'Alert monitoring and analysis by our analyst team.',
        ],
        [
          ['Monitoring 24/7 termasuk hari libur', '24/7 monitoring, holidays included'],
          ['Triase dan eskalasi berjenjang', 'Tiered triage and escalation'],
          ['Laporan bulanan untuk manajemen', 'Monthly reports for management'],
        ],
      ),
      svc(
        'inti',
        'SIEM & XDR',
        [
          'Visibilitas terpusat atas server, endpoint, dan aplikasi.',
          'Central visibility across servers, endpoints, and applications.',
        ],
        [
          ['Korelasi log dari banyak sumber', 'Log correlation across many sources'],
          ['File Integrity Monitoring', 'File Integrity Monitoring'],
          ['Dasbor keamanan untuk klien', 'Security dashboard for clients'],
        ],
      ),
      svc(
        'intel',
        'Threat Intelligence',
        [
          'Indikator ancaman terbaru disinkronkan ke aturan deteksi.',
          'The latest threat indicators are synced into detection rules.',
        ],
        [
          ['Feed IoC lokal dan global', 'Local and global IoC feeds'],
          ['Deteksi phishing & defacement', 'Phishing & defacement detection'],
          ['Pemetaan TTP MITRE ATT&CK', 'MITRE ATT&CK TTP mapping'],
        ],
      ),
      svc(
        'respons',
        'Vulnerability Assessment',
        [
          'Pemindaian berkala untuk menemukan celah sebelum diserang.',
          'Regular scanning to find weaknesses before attackers do.',
        ],
        [
          ['Pemindaian otomatis terjadwal', 'Scheduled automated scans'],
          ['Prioritas risiko berbasis CVSS', 'CVSS-based risk prioritisation'],
          ['Panduan remediasi', 'Remediation guidance'],
        ],
      ),
      svc(
        'respons',
        'Incident Response',
        ['Penanganan cepat saat serangan terjadi.', 'Fast handling when an attack happens.'],
        [
          ['Isolasi host dari jarak jauh', 'Remote host isolation'],
          ['Investigasi dan forensik digital', 'Investigation and digital forensics'],
          ['Pendampingan pemulihan', 'Recovery support'],
        ],
      ),
      svc(
        'intel',
        'Security Awareness',
        [
          'Melatih karyawan agar tidak menjadi pintu masuk serangan.',
          'Training staff so they do not become the way in.',
        ],
        [
          ['Simulasi phishing', 'Phishing simulations'],
          ['Modul e-learning singkat', 'Short e-learning modules'],
          ['Laporan tingkat kerentanan staf', 'Staff susceptibility reports'],
        ],
      ),
    ],
  },
  {
    blockType: 'deployAgent',
    anchorId: 'deploy-agent',
    background: 'ink',
    eyebrow: t('Deploy Agent', 'Deploy the agent'),
    heading: t('Terhubung ke SOC dalam empat langkah.', 'Connected to the SOC in four steps.'),
    lead: t(
      'Setelah tenant Anda diverifikasi, tim kami mengirimkan token aktivasi. Satu perintah memasang agen dan mendaftarkannya ke pusat operasi.',
      'Once your tenant is verified, our team sends an activation token. A single command installs the agent and registers it with the operations centre.',
    ),
    steps: [
      {
        title: t('Daftar & verifikasi', 'Register & verify'),
        description: t(
          'Isi formulir pendaftaran. Tim kami memverifikasi organisasi dan menyiapkan tenant terisolasi.',
          'Fill in the registration form. Our team verifies your organisation and prepares an isolated tenant.',
        ),
      },
      {
        title: t('Terima token aktivasi', 'Receive your activation token'),
        description: t(
          'Token unik per tenant dikirim melalui kanal resmi. Jangan bagikan token ke pihak lain.',
          'A unique per-tenant token is sent through an official channel. Do not share it with anyone else.',
        ),
      },
      {
        title: t('Jalankan installer', 'Run the installer'),
        description: t(
          'Pilih sistem operasi, salin perintah, lalu jalankan dengan hak administrator.',
          'Choose your operating system, copy the command, and run it with administrator rights.',
        ),
      },
      {
        title: t('Verifikasi koneksi', 'Verify the connection'),
        description: t(
          'Agen muncul di portal dengan status Aktif dalam 1–2 menit dan mulai mengirim log.',
          'The agent shows up in the portal as Active within 1–2 minutes and starts sending logs.',
        ),
      },
    ],
    platforms: [
      {
        name: 'Linux',
        commands: [
          {
            label: t('Instal & daftarkan agen', 'Install & register the agent'),
            prompt: '$',
            code: 'curl -sSL https://get.socmerdeka.id/install.sh \\\n  | sudo bash -s -- --token <TOKEN_TENANT>',
          },
          {
            label: t('Cek status', 'Check status'),
            prompt: '$',
            code: 'sudo systemctl status merdeka-agent',
            output: '# Active: active (running)',
          },
        ],
        requirements: [OS('Ubuntu 20.04+, RHEL 8+, Debian 11+'), ARCH('x86_64, arm64'), NET],
      },
      {
        name: 'Windows',
        commands: [
          {
            label: t('PowerShell (Run as Administrator)', 'PowerShell (Run as Administrator)'),
            prompt: 'PS>',
            code: 'iwr https://get.socmerdeka.id/install.ps1 -UseBasicParsing | iex;\n  Install-MerdekaAgent -Token "<TOKEN_TENANT>"',
          },
          {
            label: t('Cek status', 'Check status'),
            prompt: 'PS>',
            code: 'Get-Service MerdekaAgent',
            output: '# Status: Running',
          },
        ],
        requirements: [OS('Windows Server 2016+, Windows 10/11'), ARCH('x64'), NET],
      },
      {
        name: 'macOS',
        commands: [
          {
            label: t('Instal & daftarkan agen', 'Install & register the agent'),
            prompt: '$',
            code: 'curl -sSL https://get.socmerdeka.id/install-mac.sh \\\n  | sudo bash -s -- --token <TOKEN_TENANT>',
          },
          {
            label: t('Cek status', 'Check status'),
            prompt: '$',
            code: 'sudo launchctl list | grep merdeka',
            output: '# id.socmerdeka.agent',
          },
        ],
        requirements: [OS('macOS 12 Monterey+'), ARCH('Apple Silicon, Intel'), NET],
      },
    ],
    note: t(
      'Domain dan perintah di atas adalah contoh untuk tahap pra-peluncuran.',
      'The domain and commands above are examples for the pre-launch phase.',
    ),
  },
  {
    blockType: 'pricing',
    anchorId: 'paket',
    background: 'default',
    heading: t(
      'Mulai dari yang Anda butuhkan, tambah seiring bisnis tumbuh.',
      'Start with what you need, add more as your business grows.',
    ),
    plans: [
      {
        name: t('Merdeka UMKM', 'Merdeka SME'),
        audience: t(
          'Untuk usaha kecil dengan beberapa server inti.',
          'For small businesses with a few core servers.',
        ),
        price: t('Rp 1,5 jt', 'IDR 1.5M'),
        period: t('/ bulan', '/ month'),
        featured: false,
        features: [
          t('Hingga 3 server atau endpoint', 'Up to 3 servers or endpoints'),
          t('Monitoring 24/7', '24/7 monitoring'),
          t('Retensi log 30 hari', '30-day log retention'),
          t('Laporan bulanan', 'Monthly report'),
        ].map((text) => ({ text })),
        cta: { label: t('Pilih Paket', 'Choose plan'), href: '#pendaftaran' },
      },
      {
        name: t('Merdeka Bisnis', 'Merdeka Business'),
        audience: t(
          'Untuk perusahaan menengah dan institusi.',
          'For mid-sized companies and institutions.',
        ),
        price: t('Rp 6 jt', 'IDR 6M'),
        period: t('/ bulan', '/ month'),
        featured: true,
        badge: t('Paling dipilih', 'Most popular'),
        features: [
          t('Hingga 15 server atau endpoint', 'Up to 15 servers or endpoints'),
          t('Threat intelligence feed', 'Threat intelligence feed'),
          t('Retensi log 90 hari', '90-day log retention'),
          t('Vulnerability scan bulanan', 'Monthly vulnerability scan'),
          t('Respons insiden jarak jauh', 'Remote incident response'),
        ].map((text) => ({ text })),
        cta: { label: t('Pilih Paket', 'Choose plan'), href: '#pendaftaran' },
      },
      {
        name: t('Merdeka Enterprise', 'Merdeka Enterprise'),
        audience: t(
          'Untuk organisasi dengan kebutuhan regulasi khusus.',
          'For organisations with specific regulatory needs.',
        ),
        price: t('Kustom', 'Custom'),
        period: t('', ''),
        featured: false,
        features: [
          t('Jumlah aset tidak dibatasi', 'Unlimited assets'),
          t('Retensi log hingga 1 tahun', 'Log retention up to 1 year'),
          t('Analis khusus & SLA kustom', 'Dedicated analyst & custom SLA'),
          t('Forensik digital di lokasi', 'On-site digital forensics'),
        ].map((text) => ({ text })),
        cta: { label: t('Hubungi Sales', 'Contact sales'), href: '#pendaftaran' },
      },
    ],
    addon: {
      label: t('Add-on', 'Add-on'),
      title: t('Ticketing & ITSM.', 'Ticketing & ITSM.'),
      description: t(
        'Gunakan sistem tiket SOC Merdeka, atau sambungkan kasus langsung ke sistem tiket yang sudah Anda pakai.',
        'Use the SOC Merdeka ticketing system, or route cases straight into the ticketing system you already use.',
      ),
      cta: { label: t('Tanyakan', 'Ask us'), href: '#pendaftaran' },
    },
    disclaimer: t(
      'Harga bersifat indikatif untuk tahap pra-peluncuran dan belum termasuk PPN.',
      'Prices are indicative for the pre-launch phase and exclude VAT.',
    ),
  },
  {
    blockType: 'faq',
    anchorId: 'faq',
    background: 'muted',
    heading: t('Yang sering ditanyakan sebelum bergabung.', 'What people ask before joining.'),
    items: [
      {
        open: true,
        question: t(
          'Apakah agen memperlambat server saya?',
          'Will the agent slow down my servers?',
        ),
        answer: t(
          'Agen dirancang ringan, umumnya memakai di bawah 2% CPU dan sekitar 150 MB RAM. Pengiriman log dikompresi dan dibatasi bandwidth-nya.',
          'The agent is designed to be light, typically using under 2% CPU and about 150 MB of RAM. Log shipping is compressed and bandwidth-limited.',
        ),
      },
      {
        question: t('Di mana data log kami disimpan?', 'Where is our log data stored?'),
        answer: t(
          'Seluruh log disimpan di pusat data di Indonesia dan dipisahkan per tenant. Akses analis tercatat dan diaudit.',
          'All logs are stored in data centres in Indonesia and kept separate per tenant. Analyst access is logged and audited.',
        ),
      },
      {
        question: t(
          'Kami sudah punya sistem tiket sendiri. Apakah bisa diintegrasikan?',
          'We already have our own ticketing system. Can it be integrated?',
        ),
        answer: t(
          'Bisa. Kasus dari SOC dapat dikirim ke sistem tiket Anda melalui integrasi API atau email. Modul tiket kami tersedia sebagai add-on bila Anda belum memilikinya.',
          'Yes. SOC cases can be sent to your ticketing system through an API or email integration. Our ticketing module is available as an add-on if you do not have one yet.',
        ),
      },
      {
        question: t('Bagaimana program piloting berjalan?', 'How does the pilot programme work?'),
        answer: t(
          'Piloting berlangsung sekitar 30 hari pada sejumlah aset terbatas. Di akhir periode Anda menerima laporan temuan untuk menilai manfaat layanan sebelum berlangganan.',
          'The pilot runs for about 30 days on a limited number of assets. At the end you receive a findings report, so you can judge the value of the service before subscribing.',
        ),
      },
      {
        question: t(
          'Apa yang terjadi saat insiden kritis terdeteksi?',
          'What happens when a critical incident is detected?',
        ),
        answer: t(
          'Analis menghubungi PIC Anda sesuai matriks eskalasi, memberi langkah penahanan, dan bila disetujui dapat mengisolasi host dari jarak jauh.',
          'An analyst contacts your designated person according to the escalation matrix, gives containment steps, and, with your approval, can isolate the host remotely.',
        ),
      },
    ],
  },
  {
    blockType: 'formSection',
    anchorId: 'pendaftaran',
    background: 'ink',
    layout: 'split',
    eyebrow: t('Pendaftaran Piloting', 'Pilot registration'),
    heading: t('Siap melindungi aset digital Anda?', 'Ready to protect your digital assets?'),
    lead: t(
      'Daftarkan organisasi Anda untuk program piloting SOC Merdeka melalui kuesioner singkat ini. Bila Anda bersedia dihubungi, tim kami akan merespons dalam satu hari kerja.',
      'Register your organisation for the SOC Merdeka pilot through this short questionnaire. If you agree to be contacted, our team will reply within one working day.',
    ),
    checklist: [
      t(
        'Tenant terisolasi dan token agen khusus organisasi Anda',
        'An isolated tenant and an agent token unique to your organisation',
      ),
      t(
        'Akses dasbor pemantauan selama masa piloting',
        'Access to the monitoring dashboard during the pilot',
      ),
      t(
        'Laporan temuan keamanan di akhir periode',
        'A security findings report at the end of the pilot',
      ),
    ].map((text) => ({ text })),
    form: formId,
  },
]

export const questionnaireLayout = (formId: string) => [
  {
    blockType: 'formSection',
    anchorId: 'kuesioner',
    background: 'default',
    layout: 'full',
    eyebrow: t('Formulir Survei Calon Pelanggan', 'Prospective customer survey'),
    heading: t(
      'Kuesioner Minat & Kesiapan POC SOC UMKM',
      'Interest & Readiness Questionnaire: SOC for SMEs POC',
    ),
    lead: t(
      'Formulir singkat untuk mengenali profil calon pelanggan, kebutuhan layanan, kemampuan berlangganan, dan kesiapan mengikuti uji coba SOC UMKM.',
      'A short form to understand your company profile, service needs, budget, and readiness to join the SOC for SMEs trial.',
    ),
    form: formId,
  },
]
