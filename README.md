# SiberGuard — Website & CMS

Microsite **SiberGuard** (Siber Guard Indonesia): layanan Security Operations Center terkelola untuk UMKM — *Amankan Usaha, Majukan Nusantara.* Lengkap dengan CMS, formulir minat & kuesioner lead yang bisa diatur, dan dashboard monitoring pengunjung.

Konten awal mengikuti *Rancangan Konten Microsite SiberGuard* (revisi identitas merek, 18 November 2026). Nama repo, database, dan layanan Docker masih memakai `soc-merdeka` sebagai identitas teknis.

- **Next.js 16** (App Router) + **Payload CMS 3** dalam satu aplikasi
- **MongoDB** (replica set 1 node agar transaksi Payload aktif)
- Dua bahasa: Indonesia (`/`, default) dan Inggris (`/en`)
- Dua tema: terang & gelap (awalnya mengikuti perangkat, bisa diatur di CMS)

| Bagian | Lokasi |
|---|---|
| Situs publik | `http://localhost:3000` |
| Admin CMS & dashboard | `http://localhost:3000/admin` |
| Panduan editor konten & sales | [docs/cms-guide.md](docs/cms-guide.md) |
| Runbook deployment VPS | [docs/deployment.md](docs/deployment.md) |
| Runbook staging (Vercel + Atlas + Resend) | [docs/deployment-staging-vercel.md](docs/deployment-staging-vercel.md) |
| Bahan acuan (prototype, PDF kuesioner, logo asli) | [docs/reference/](docs/reference/) |

## Menjalankan secara lokal

Prasyarat: Node.js `24.22.3` (lihat `.nvmrc`), pnpm 10, Docker.

```bash
nvm use
pnpm install
cp .env.example .env            # isi PAYLOAD_SECRET & ANALYTICS_HASH_PEPPER (openssl rand -hex 32)
docker compose -f docker-compose.dev.yml up -d   # MongoDB + Mailpit
pnpm seed                       # konten prototype (id+en), kuesioner, admin dari SEED_ADMIN_*
pnpm dev
```

- Email notifikasi lead tertangkap di Mailpit: `http://localhost:8025`
- `pnpm seed:force` menimpa halaman, formulir, dan globals dengan isi awal (lead & user tidak disentuh).
- `pnpm demo:data` mengisi 30 hari data analytics + 42 lead **demo** untuk meninjau dashboard; hapus dengan `pnpm demo:data:clear`. Tidak bisa dijalankan di production.

## Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Development, build produksi, jalankan build |
| `pnpm test:unit` | Vitest: engine formulir (kondisi, validasi, skor, snapshot) & analytics |
| `pnpm test:e2e` | Playwright: situs dua bahasa, tema, kuesioner sampai terkirim, admin & batas akses |
| `pnpm typecheck` / `pnpm lint` | TypeScript & ESLint |
| `pnpm generate:types` / `pnpm generate:importmap` | Wajib setelah mengubah schema Payload / komponen admin |
| `pnpm brand:compare` | Uji kesamaan logo SVG vs JPEG sumber `docs/reference/logo-siberguard.jpg` (SSIM ukuran tampil ≥ 0,97, wordmark ≥ 0,97 tanpa selisih mengelompok, path varian identik) |
| `pnpm brand:export` | Buat ulang varian logo, favicon, PNG, gambar OG dari `public/brand/logo.svg` |

## Struktur

```
src/
├─ app/(frontend)/[locale]/   situs publik (layout, beranda, halaman CMS, 404)
├─ app/(payload)/             admin & REST API Payload (custom.scss = gaya dashboard)
├─ collections/  globals/     schema CMS (Pages, Forms, FormSubmissions, Media, Users; Header, Footer, …)
├─ blocks/                    section halaman (Hero, FeatureGrid, Services, DeployAgent, Pricing, Faq, FormSection, …)
├─ components/                renderer section, header/footer, wizard kuesioner, tracker analytics
├─ admin/                     dashboard monitoring (Ringkasan, Analytics, Leads) & komponen admin
├─ endpoints/                 /api/ev, /api/forms/:id/submit, /api/form-submissions/export, /api/health
├─ lib/forms/                 engine formulir dipakai bersama browser & server
├─ lib/analytics/             penyimpanan time-series, pengayaan, query agregasi
├─ i18n/  proxy.ts            routing bahasa (next-intl) & teks sistem
└─ seed/                      isi awal dari prototype & PDF
scripts/brand/                tracing logo, export varian, uji kesamaan
deploy/                       Caddyfile, backup, init MongoDB
```

## Catatan arsitektur

- **Semua konten dari CMS.** Struktur section dipakai bersama kedua bahasa; editor hanya menerjemahkan teks. Perubahan tampil di kunjungan berikutnya lewat revalidasi tag (`src/hooks/revalidate.ts`).
- **Formulir** (`forms`) berupa blok pertanyaan dengan kondisi tampil, batas pilihan, opsi "Lainnya", dan skor per opsi. Browser hanya menerima bentuk publik (`toPublicForm`) tanpa skor/email notifikasi. Validasi yang sama berjalan di browser dan server (`lib/forms/validate.ts`). Setiap lead menyimpan *snapshot* label pertanyaan & jawaban.
- **Analytics tanpa cookie.** Event masuk ke koleksi time-series `analytics_events` (TTL ±13 bulan) langsung lewat driver MongoDB. ID pengunjung = hash(salt harian + IP + user agent); IP tidak pernah disimpan. Bot, admin yang login, dan IP internal tidak dihitung.
- **Peran:** admin (semua), editor (konten, tanpa lead), sales (dashboard & lead), viewer (dashboard agregat).
