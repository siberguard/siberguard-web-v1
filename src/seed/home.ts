import { t } from './helpers'

/**
 * Konten halaman utama SiberGuard — dari "Rancangan Konten Microsite SiberGuard"
 * (revisi identitas merek, 18 November 2026), plus terjemahan Inggris.
 * Catatan internal brief yang belum disetujui (operator/badan hukum, kuota pilot,
 * definisi SLA) sengaja tidak ditampilkan.
 */

const step = (title: [string, string], description: [string, string], tag?: [string, string]) => ({
  title: t(...title),
  description: t(...description),
  ...(tag ? { tag: t(...tag) } : {}),
})

export const homeLayout = (formId: string) => [
  {
    blockType: 'hero',
    anchorId: 'hero',
    background: 'default',
    heading: t(
      'Keamanan Siber untuk UMKM, Lebih Mudah dengan SiberGuard',
      'Cyber Security for SMEs, Made Easier with SiberGuard',
    ),
    highlight: t('SiberGuard', 'SiberGuard'),
    // Tagline resmi dari logo dipertahankan dalam bahasa Indonesia di kedua bahasa.
    tagline: t('Amankan Usaha, Majukan Nusantara.', 'Amankan Usaha, Majukan Nusantara.'),
    lead: t(
      'SiberGuard membantu usaha kecil dan menengah memantau ancaman keamanan pada perangkat digital bisnis melalui layanan Security Operations Center (SOC) terkelola. Peringatan keamanan ditinjau oleh analis SOC, lalu disampaikan sebagai notifikasi dan informasi yang dapat ditindaklanjuti.',
      'SiberGuard helps small and medium businesses monitor security threats on their business devices through a managed Security Operations Center (SOC) service. Security alerts are reviewed by SOC analysts, then delivered as notifications and actionable information.',
    ),
    primaryCta: { label: t('Konsultasikan Kebutuhan', 'Discuss your needs'), href: '#konsultasi' },
    secondaryCta: { label: t('Lihat Paket Basic', 'See the Basic plan'), href: '#harga' },
    carousel: {
      enabled: true,
      autoplay: true,
      interval: 6,
      slides: [
        {
          visual: 'monitoring',
          tag: t('Monitoring endpoint', 'Endpoint monitoring'),
          title: t(
            'Perangkat bisnis dipantau analis SOC',
            'Business devices watched by SOC analysts',
          ),
          text: t(
            'Log keamanan dari endpoint yang terdaftar dipantau Senin–Jumat, pukul 08.00–17.00 WIB.',
            'Security logs from registered endpoints are monitored Monday to Friday, 08:00–17:00 WIB.',
          ),
          link: { label: t('Lihat layanan', 'See the service'), href: '#layanan' },
        },
        {
          visual: 'response',
          tag: t('Triage alert', 'Alert triage'),
          title: t('Alert divalidasi, prioritas jelas', 'Alerts validated, priorities clear'),
          text: t(
            'Analis L1 menilai tingkat keparahan setiap peringatan, lalu informasinya diteruskan kepada Anda.',
            'L1 analysts assess the severity of each alert, then pass the information on to you.',
          ),
          link: { label: t('Cara kerja', 'How it works'), href: '#cara-kerja' },
        },
        {
          visual: 'agent',
          tag: t('Cakupan endpoint', 'Endpoint scope'),
          title: t('Windows, Linux, dan macOS', 'Windows, Linux and macOS'),
          text: t(
            'Agent dipasang pada komputer kerja, laptop, workstation, dan server yang disepakati bersama tim.',
            'The agent is installed on the work computers, laptops, workstations, and servers agreed with our team.',
          ),
          link: { label: t('Lihat cakupan', 'See the scope'), href: '#cakupan' },
        },
        {
          visual: 'report',
          tag: t('Laporan bulanan', 'Monthly report'),
          title: t(
            'Kondisi keamanan yang mudah dievaluasi',
            'A security picture that is easy to review',
          ),
          text: t(
            'Ringkasan alert dan gambaran kondisi keamanan disampaikan setiap bulan sebagai bahan evaluasi.',
            'A summary of alerts and an overview of your security posture are delivered every month for review.',
          ),
          link: { label: t('Lihat Paket Basic', 'See the Basic plan'), href: '#harga' },
        },
      ],
    },
    stats: [
      {
        value: t('8×5', '8×5'),
        label: t('Monitoring oleh analis SOC L1', 'Monitoring by SOC L1 analysts'),
      },
      {
        value: t('3 platform', '3 platforms'),
        label: t('Endpoint Windows, Linux, dan macOS', 'Windows, Linux and macOS endpoints'),
      },
      { value: t('Bulanan', 'Monthly'), label: t('Laporan keamanan', 'Security report') },
    ],
  },
  {
    blockType: 'challenges',
    anchorId: 'mengapa',
    background: 'default',
    eyebrow: t('Mengapa SiberGuard?', 'Why SiberGuard?'),
    heading: t(
      'Saat Bisnis Semakin Digital, Perlindungan Tidak Boleh Tertinggal',
      'As Your Business Goes Digital, Protection Must Keep Up',
    ),
    lead: t(
      'Komputer kerja, sistem penjualan, aplikasi, dan server membantu bisnis bergerak lebih cepat. Namun, akun yang disalahgunakan, malware, ransomware, dan aktivitas mencurigakan dapat mengganggu layanan dan kepercayaan pelanggan. SiberGuard membantu bisnis mengenali indikasi ancaman lebih awal melalui pemantauan perangkat yang terdaftar.',
      'Work computers, sales systems, applications, and servers help businesses move faster. But misused accounts, malware, ransomware, and suspicious activity can disrupt services and customer trust. SiberGuard helps businesses spot signs of threats earlier by monitoring registered devices.',
    ),
    challengeLabel: t('Tantangan yang umum terjadi', 'Common challenges'),
    benefitLabel: t('Manfaat bagi UMKM', 'How it helps SMEs'),
    items: [
      {
        challenge: t('Belum memiliki tim keamanan khusus', 'No dedicated security team yet'),
        benefit: t(
          'Pemantauan dan triage alert dibantu analis SOC L1.',
          'Monitoring and alert triage are handled with help from SOC L1 analysts.',
        ),
      },
      {
        challenge: t('Aktivitas perangkat sulit diawasi', 'Device activity is hard to oversee'),
        benefit: t(
          'Log dari endpoint yang terpasang agent dikumpulkan untuk analisis.',
          'Logs from endpoints running the agent are collected for analysis.',
        ),
      },
      {
        challenge: t(
          'Tidak tahu prioritas saat ada alert',
          'Unclear priorities when an alert comes in',
        ),
        benefit: t(
          'Peringatan diklasifikasikan berdasarkan tingkat keparahan.',
          'Alerts are classified by severity.',
        ),
      },
      {
        challenge: t('Sulit memantau tren risiko', 'Hard to track risk trends'),
        benefit: t(
          'Laporan bulanan membantu evaluasi kondisi keamanan.',
          'Monthly reports help you review your security posture.',
        ),
      },
    ],
  },
  {
    blockType: 'featureGrid',
    anchorId: 'layanan',
    background: 'muted',
    eyebrow: t('Mengenal SiberGuard', 'About SiberGuard'),
    heading: t('Apa yang Anda Dapatkan dari SiberGuard?', 'What Do You Get with SiberGuard?'),
    lead: t(
      'SiberGuard dirancang untuk membantu UMKM mendapatkan pemantauan keamanan siber terkelola tanpa harus membangun infrastruktur SOC secara mandiri. Layanan menggabungkan agent endpoint, platform SOC berbasis cloud, serta analis keamanan yang melakukan pemantauan dan triage pada jam layanan yang ditetapkan.',
      'SiberGuard is designed to give SMEs managed cyber security monitoring without having to build their own SOC infrastructure. The service combines an endpoint agent, a cloud-based SOC platform, and security analysts who monitor and triage during set service hours.',
    ),
    callout: t(
      'Tim pemantauan keamanan siber untuk bisnis Anda, dengan proses sederhana dan biaya bulanan yang jelas.',
      'A cyber security monitoring team for your business, with a simple process and a clear monthly fee.',
    ),
    items: [
      {
        icon: 'eye',
        title: t('Monitoring endpoint', 'Endpoint monitoring'),
        description: t(
          'Log keamanan dari perangkat yang terdaftar dipantau sesuai jam layanan.',
          'Security logs from registered devices are monitored during service hours.',
        ),
      },
      {
        icon: 'checklist',
        title: t('Triage alert oleh analis L1', 'Alert triage by L1 analysts'),
        description: t(
          'Analis memvalidasi peringatan dan menilai tingkat keparahannya.',
          'Analysts validate alerts and assess their severity.',
        ),
      },
      {
        icon: 'bell',
        title: t('Notifikasi keamanan', 'Security notifications'),
        description: t(
          'Pelanggan menerima informasi alert untuk membantu menentukan langkah berikutnya.',
          'You receive alert information to help decide the next step.',
        ),
      },
      {
        icon: 'report',
        title: t('Laporan keamanan bulanan', 'Monthly security report'),
        description: t(
          'Ringkasan alert dan gambaran kondisi keamanan disampaikan secara berkala.',
          'A summary of alerts and an overview of your security posture, delivered regularly.',
        ),
      },
      {
        icon: 'book',
        title: t('Edukasi keamanan dasar', 'Basic security education'),
        description: t(
          'Informasi dasar tentang phishing dan kebiasaan digital yang lebih aman.',
          'Basic guidance on phishing and safer digital habits.',
        ),
      },
    ],
  },
  {
    blockType: 'processFlow',
    anchorId: 'cara-kerja',
    background: 'default',
    layout: 'horizontal',
    eyebrow: t('Cara Kerja', 'How it works'),
    heading: t('Bagaimana SiberGuard Bekerja?', 'How Does SiberGuard Work?'),
    steps: [
      step(
        ['Instalasi agent', 'Agent installation'],
        [
          'Agent keamanan dipasang pada endpoint yang disepakati.',
          'The security agent is installed on the agreed endpoints.',
        ],
        ['Endpoint terdaftar', 'Registered endpoints'],
      ),
      step(
        ['Pengumpulan log', 'Log collection'],
        [
          'Aktivitas keamanan perangkat dikirim ke platform SOC.',
          'Device security activity is sent to the SOC platform.',
        ],
        ['Platform SOC', 'SOC platform'],
      ),
      step(
        ['Analisis alert', 'Alert analysis'],
        [
          'Sistem mengorelasikan data; analis L1 memvalidasi peringatan.',
          'The system correlates the data; L1 analysts validate the alerts.',
        ],
        ['Analis L1', 'L1 analysts'],
      ),
      step(
        ['Notifikasi', 'Notification'],
        [
          'Informasi keamanan dan prioritas alert diteruskan ke pelanggan.',
          'Security information and alert priorities are passed on to you.',
        ],
        ['Critical · High · Medium', 'Critical · High · Medium'],
      ),
      step(
        ['Laporan bulanan', 'Monthly report'],
        [
          'Temuan selama periode layanan dirangkum untuk evaluasi.',
          'Findings from the service period are summarised for review.',
        ],
        ['Ringkasan periode', 'Period summary'],
      ),
    ],
  },
  {
    blockType: 'coverage',
    anchorId: 'cakupan',
    background: 'muted',
    eyebrow: t('Cakupan', 'Scope'),
    heading: t(
      'Perlindungan Berfokus pada Perangkat Bisnis Anda',
      'Protection Focused on Your Business Devices',
    ),
    lead: t(
      'SiberGuard ditujukan untuk endpoint Windows, Linux, dan macOS yang memenuhi persyaratan instalasi agent, seperti komputer kerja, laptop, workstation, dan server. Perangkat yang ingin didaftarkan akan ditinjau bersama tim sebelum aktivasi layanan.',
      'SiberGuard is built for Windows, Linux, and macOS endpoints that meet the agent installation requirements, such as work computers, laptops, workstations, and servers. The devices you want to register are reviewed with our team before the service is activated.',
    ),
    included: {
      title: t('Endpoint yang dapat dipantau', 'Endpoints we can monitor'),
      platforms: [{ name: 'Windows' }, { name: 'Linux' }, { name: 'macOS' }],
      items: [
        { icon: 'monitor', title: t('Komputer kerja', 'Work computers') },
        { icon: 'laptop', title: t('Laptop', 'Laptops') },
        { icon: 'chip', title: t('Workstation', 'Workstations') },
        { icon: 'server', title: t('Server', 'Servers') },
      ],
    },
    excluded: {
      title: t('Tidak termasuk paket Basic', 'Not included in the Basic plan'),
      items: [
        { text: t('Firewall', 'Firewalls') },
        { text: t('Router dan switch', 'Routers and switches') },
        {
          text: t(
            'Analisis trafik jaringan (misalnya NetFlow)',
            'Network traffic analysis (e.g. NetFlow)',
          ),
        },
      ],
      note: t(
        'Batasan penting: paket dasar tidak mencakup monitoring perangkat jaringan. Kebutuhan monitoring jaringan dibahas melalui solusi terpisah.',
        'Important: the core plan does not cover monitoring of network devices. Network monitoring needs are discussed as a separate solution.',
      ),
    },
  },
  {
    blockType: 'pricing',
    anchorId: 'harga',
    background: 'default',
    eyebrow: t('Harga', 'Pricing'),
    heading: t(
      'Satu Paket Dasar, Lebih Mudah Disesuaikan dengan Kebutuhan',
      'One Core Plan, Easy to Fit Your Needs',
    ),
    plans: [
      {
        name: t('Paket Basic', 'Basic plan'),
        badge: t('Monitoring 8×5', '8×5 monitoring'),
        audience: t(
          'Tim pemantauan keamanan siber untuk bisnis, tanpa membangun SOC sendiri.',
          'A security monitoring team for your business, without building your own SOC.',
        ),
        price: t('Rp300.000', 'IDR 300,000'),
        period: t('/ endpoint / bulan', '/ endpoint / month'),
        priceNote: t(
          'Minimum 5 endpoint • Biaya minimum Rp1.500.000 per bulan',
          'Minimum 5 endpoints • Minimum fee IDR 1,500,000 per month',
        ),
        featured: true,
        features: [
          t(
            'Monitoring keamanan endpoint Windows, Linux, dan macOS oleh analis SOC L1.',
            'Security monitoring of Windows, Linux, and macOS endpoints by SOC L1 analysts.',
          ),
          t(
            'Triage dan notifikasi alert sesuai ketentuan SLA.',
            'Alert triage and notification in line with the SLA terms.',
          ),
          t('Laporan keamanan bulanan.', 'Monthly security report.'),
          t('Retensi data standar 30 hari.', 'Standard 30-day data retention.'),
          t(
            'Penagihan bulanan; layanan jaringan dan add-on tidak termasuk.',
            'Billed monthly; network services and add-ons are not included.',
          ),
        ].map((text) => ({ text })),
        cta: {
          label: t('Konsultasikan Paket Basic', 'Discuss the Basic plan'),
          href: '#konsultasi',
        },
      },
    ],
    addon: {
      label: t('Layanan tambahan', 'Add-on services'),
      title: t('Butuh cakupan lebih luas?', 'Need broader coverage?'),
      description: t(
        'Diskusikan EDR, dashboard pelanggan, panduan remediasi, insight threat intelligence, dan review layanan berkala. Layanan tambahan dikutip terpisah dan ketersediaannya perlu dikonfirmasi.',
        'Talk to us about EDR, a customer dashboard, remediation guidance, threat intelligence insights, and regular service reviews. Add-ons are quoted separately and their availability needs to be confirmed.',
      ),
      cta: { label: t('Diskusikan', 'Talk to us'), href: '#konsultasi' },
    },
    disclaimer: t(
      'Ditagih bulanan. Rincian pajak dan syarat kontrak disampaikan saat konsultasi.',
      'Billed monthly. Tax details and contract terms are provided during consultation.',
    ),
  },
  {
    blockType: 'serviceLevel',
    anchorId: 'jam-layanan',
    background: 'muted',
    eyebrow: t('Jam Layanan', 'Service hours'),
    heading: t('Jam Layanan dan Prioritas Respons', 'Service Hours and Response Priorities'),
    lead: t(
      'Pemantauan oleh analis SOC L1 berlangsung Senin–Jumat, pukul 08.00–17.00 WIB. Tingkat keparahan alert digunakan untuk menentukan prioritas penanganan.',
      'Monitoring by SOC L1 analysts runs Monday to Friday, 08:00–17:00 WIB. Alert severity determines the handling priority.',
    ),
    hours: {
      value: t('8×5', '8×5'),
      label: t('Monitoring analis SOC L1', 'SOC L1 analyst monitoring'),
      days: t('Senin–Jumat', 'Monday–Friday'),
      time: t('08.00–17.00 WIB', '08:00–17:00 WIB'),
      activeDays: ['1', '2', '3', '4', '5'],
    },
    priorityLabel: t('Prioritas alert', 'Alert priority'),
    targetLabel: t('Target respons', 'Response target'),
    priorities: [
      { level: 'critical', label: t('Critical', 'Critical'), target: t('1 jam', '1 hour') },
      { level: 'high', label: t('High', 'High'), target: t('4 jam', '4 hours') },
      { level: 'medium', label: t('Medium', 'Medium'), target: t('8 jam', '8 hours') },
    ],
    note: t(
      'Mekanisme alert di luar jam layanan dijelaskan dalam ketentuan layanan. Definisi lengkap SLA tercantum dalam perjanjian layanan.',
      'How alerts are handled outside service hours is explained in the service terms. Full SLA definitions are set out in the service agreement.',
    ),
  },
  {
    blockType: 'processFlow',
    anchorId: 'mulai',
    background: 'default',
    layout: 'vertical',
    eyebrow: t('Proses Awal', 'Getting started'),
    heading: t('Mulai dalam Lima Langkah', 'Get Started in Five Steps'),
    lead: t(
      'Dari konsultasi hingga laporan pertama, berikut tahapan untuk mulai menggunakan SiberGuard.',
      'From consultation to your first report, these are the steps to start using SiberGuard.',
    ),
    steps: [
      step(
        ['Konsultasi / registrasi', 'Consultation / registration'],
        [
          'Isi informasi dasar perusahaan dan kebutuhan keamanan.',
          'Share basic company details and your security needs.',
        ],
      ),
      step(
        ['Identifikasi endpoint', 'Endpoint identification'],
        [
          'Tentukan jenis dan jumlah perangkat yang dapat dipantau.',
          'Agree on the type and number of devices that can be monitored.',
        ],
      ),
      step(
        ['Instalasi agent', 'Agent installation'],
        [
          'Aktivasi agent pada endpoint yang disepakati.',
          'The agent is activated on the agreed endpoints.',
        ],
      ),
      step(
        ['Baseline dan monitoring', 'Baseline and monitoring'],
        [
          'Sistem menyesuaikan pola aktivitas normal sebelum pemantauan berjalan.',
          'The system learns normal activity patterns before monitoring begins.',
        ],
      ),
      step(
        ['Laporan pertama', 'First report'],
        [
          'Tinjau ringkasan temuan dan rekomendasi awal.',
          'Review the summary of findings and initial recommendations.',
        ],
      ),
    ],
  },
  {
    blockType: 'ctaBanner',
    anchorId: 'program-pilot',
    background: 'ink',
    eyebrow: t('Program Pilot', 'Pilot Programme'),
    heading: t(
      'Ingin Mencoba SiberGuard? Ajukan Minat Program Pilot',
      'Want to Try SiberGuard? Register for the Pilot Programme',
    ),
    lead: t(
      'SiberGuard membuka kesempatan pengajuan minat untuk uji coba terbatas bagi UMKM yang memenuhi kriteria. Melalui program ini, peserta dapat mengenal proses pemantauan keamanan endpoint, menerima informasi alert, dan mengevaluasi kebutuhan keamanan digital bisnisnya. Tim program akan menghubungi calon peserta mengenai kriteria, jadwal, dan ketentuan yang berlaku.',
      'SiberGuard is accepting expressions of interest for a limited trial for SMEs that meet the criteria. Through the programme, participants get to know the endpoint security monitoring process, receive alert information, and assess their business’s digital security needs. The programme team will contact prospective participants about the criteria, schedule, and applicable terms.',
    ),
    primaryCta: {
      label: t('Daftar Minat Program Pilot', 'Register pilot interest'),
      href: '#konsultasi',
    },
  },
  {
    blockType: 'faq',
    anchorId: 'faq',
    background: 'default',
    eyebrow: t('FAQ', 'FAQ'),
    heading: t('Pertanyaan Umum', 'Frequently Asked Questions'),
    items: [
      {
        open: true,
        question: t(
          'Apakah SiberGuard sama dengan antivirus?',
          'Is SiberGuard the same as antivirus?',
        ),
        answer: t(
          'Tidak. SiberGuard merupakan layanan SOC terkelola untuk memantau log keamanan, memvalidasi alert, memberikan notifikasi, dan menyusun laporan. Layanan ini dapat melengkapi kontrol keamanan lain yang sudah digunakan.',
          'No. SiberGuard is a managed SOC service that monitors security logs, validates alerts, sends notifications, and prepares reports. It can complement the other security controls you already use.',
        ),
      },
      {
        question: t(
          'Apakah semua perangkat usaha bisa dipantau?',
          'Can every business device be monitored?',
        ),
        answer: t(
          'Cakupan dasar adalah endpoint Windows, Linux, dan macOS yang kompatibel dengan agent. Kelayakan dan jumlah perangkat dikonfirmasi saat konsultasi.',
          'The core scope is Windows, Linux, and macOS endpoints that are compatible with the agent. Eligibility and the number of devices are confirmed during consultation.',
        ),
      },
      {
        question: t('Apakah tim memantau selama 24 jam?', 'Does the team monitor 24 hours a day?'),
        answer: t(
          'Tidak. Pemantauan oleh analis SOC L1 berlangsung Senin–Jumat, 08.00–17.00 WIB. Mekanisme alert di luar jam tersebut akan dijelaskan dalam ketentuan layanan.',
          'No. Monitoring by SOC L1 analysts runs Monday to Friday, 08:00–17:00 WIB. How alerts are handled outside those hours is explained in the service terms.',
        ),
      },
      {
        question: t(
          'Apakah firewall dan jaringan dipantau?',
          'Are firewalls and the network monitored?',
        ),
        answer: t(
          'Tidak termasuk dalam paket Basic. Kebutuhan monitoring jaringan dibahas melalui solusi terpisah.',
          'Not in the Basic plan. Network monitoring needs are discussed as a separate solution.',
        ),
      },
      {
        question: t('Berapa biaya minimumnya?', 'What is the minimum cost?'),
        answer: t(
          'Rancangan harga Basic sebesar Rp300.000 per endpoint per bulan, minimum lima endpoint atau Rp1.500.000 per bulan, sebelum ketentuan lain yang berlaku.',
          'The proposed Basic price is IDR 300,000 per endpoint per month, with a minimum of five endpoints or IDR 1,500,000 per month, before other applicable terms.',
        ),
      },
      {
        question: t(
          'Apakah layanan menjamin bisnis bebas serangan?',
          'Does the service guarantee my business will be attack-free?',
        ),
        answer: t(
          'Tidak ada solusi yang dapat menjamin bebas insiden. SiberGuard membantu pengenalan indikasi ancaman dan mempercepat penyampaian informasi untuk tindak lanjut.',
          'No solution can guarantee zero incidents. SiberGuard helps you spot signs of threats and speeds up the delivery of information for follow-up.',
        ),
      },
      {
        question: t('Apakah program pilot gratis?', 'Is the pilot programme free?'),
        answer: t(
          'Ketentuan biaya, kuota, jadwal, dan seleksi pilot akan diinformasikan langsung oleh tim program sebelum peserta menyetujui partisipasi.',
          'Fees, quotas, schedule, and pilot selection are communicated directly by the programme team before participants agree to take part.',
        ),
      },
    ],
  },
  {
    blockType: 'formSection',
    anchorId: 'konsultasi',
    background: 'ink',
    layout: 'split',
    eyebrow: t('Konsultasi', 'Consultation'),
    heading: t(
      'Mari Lindungi Bisnis Anda Bersama SiberGuard',
      'Let’s Protect Your Business with SiberGuard',
    ),
    lead: t(
      'Ceritakan kebutuhan keamanan digital usaha Anda. Tim kami akan membantu menjelaskan cakupan endpoint, paket Basic, dan proses konsultasi atau pengajuan program pilot.',
      'Tell us about your business’s digital security needs. Our team will explain endpoint scope, the Basic plan, and the consultation or pilot application process.',
    ),
    checklist: [
      t(
        'Penjelasan cakupan endpoint dan Paket Basic',
        'An explanation of endpoint scope and the Basic plan',
      ),
      t(
        'Pilihan konsultasi layanan atau pengajuan Program Pilot',
        'A choice between a service consultation or a Pilot Programme application',
      ),
      t(
        'Kami tidak pernah meminta password, token akses, atau log mentah',
        'We never ask for passwords, access tokens, or raw logs',
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
    eyebrow: t('SiberGuard · Survei Calon Pelanggan', 'SiberGuard · Prospective customer survey'),
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
