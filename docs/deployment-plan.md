# Rencana Deployment & CI/CD — SiberGuard

Status: **draf untuk disetujui** · 20 November 2026

Dokumen ini menjelaskan cara kode berpindah dari laptop developer ke staging lalu ke production, dan bagaimana fitur yang sudah berjalan dijaga agar tidak rusak oleh perubahan berikutnya.

Dokumen terkait:

- [deployment-staging-vercel.md](deployment-staging-vercel.md): runbook staging saat ini. Akan diperbarui: Vercel Blob diganti Cloudinary, email dimatikan.
- [deployment.md](deployment.md): runbook VPS dengan Docker, salah satu kandidat production.

---

## Ringkasan

|          | Lokal                       | **Staging**                                                | **Production**                                                                               |
| -------- | --------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Branch   | `feature/*`, `fix/*`        | `development`                                              | `main`                                                                                       |
| Hosting  | `pnpm dev` + Docker (Mongo) | Vercel, region `sin1` (Singapura)                          | **Belum ditentukan.** Disiapkan sebagai image Docker yang bisa dijalankan di server mana pun |
| Database | Mongo lokal (replica set)   | MongoDB Atlas, cluster staging sendiri                     | Ditentukan bersama server                                                                    |
| Media    | Folder `media/`             | **Cloudinary** (folder `soc-merdeka-staging`)              | Ditentukan bersama server                                                                    |
| Email    | Mailpit / mati              | **Mati**                                                   | SMTP atau Resend                                                                             |
| Deploy   | —                           | Otomatis setelah PR di-merge ke `development` dan CI hijau | Setelah PR `development → main`, CI hijau, dan persetujuan manual                            |
| Data     | Dummy                       | Data uji saja, bukan data pelanggan                        | Data asli                                                                                    |

Prinsip utamanya: **tidak ada kode yang masuk ke `development` atau `main` tanpa lolos CI.** Deploy hanya terjadi dari kedua branch itu, jadi apa pun yang ter-deploy sudah lolos pengujian.

---

## 1. Alur branch

```
feature/xyz ──PR──► development ──(otomatis)──► Staging (Vercel)
                         │
                         └──PR rilis──► main ──(persetujuan)──► Production
hotfix/xyz (dari main) ──PR──► main, lalu main di-merge balik ke development
```

- **Pekerjaan harian:** buat branch `feature/<nama>` atau `fix/<nama>` dari `development`, lalu buka PR ke `development`. Setelah CI hijau dan PR di-merge, staging ter-update otomatis.
- **Rilis:** buka PR `development → main`, beri judul versi, misalnya `Rilis v1.2.0`. CI berjalan lagi. Setelah disetujui dan di-merge, image production dibuat dan menunggu persetujuan deploy.
- **Hotfix:** buat `hotfix/<nama>` dari `main` dan buka PR ke `main`. Setelah rilis, merge `main` ke `development` supaya kedua branch tidak berbeda.

**Proteksi branch** di GitHub, Settings → Branches:

| Aturan                                                        | `development` | `main` |
| ------------------------------------------------------------- | ------------- | ------ |
| Wajib lewat PR (tanpa push langsung)                          | ✓             | ✓      |
| Wajib lulus check CI: `checks`, `e2e`, `brand` (bila relevan) | ✓             | ✓      |
| Branch harus up to date sebelum merge                         | ✓             | ✓      |
| Minimal 1 persetujuan reviewer                                | opsional      | ✓      |
| Larang force push & hapus branch                              | ✓             | ✓      |

---

## 2. Pipeline CI: gerbang anti-regresi

CI memakai GitHub Actions (`.github/workflows/ci.yml`). CI berjalan di setiap PR ke `development`/`main` dan setiap push ke kedua branch itu. Run lama di PR yang sama dibatalkan otomatis.

| Job      | Isi                                                                                                               | Waktu     | Memblokir merge?             |
| -------- | ----------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------- |
| `checks` | Pemeriksaan dasar, lihat di bawah tabel                                                                           | ±5 menit  | Ya                           |
| `e2e`    | Uji end-to-end dengan database sungguhan, lihat di bawah tabel                                                    | ±10 menit | Ya                           |
| `brand`  | `pnpm brand:compare`, hanya bila `public/brand/**` atau `scripts/brand/**` berubah. Logo harus tetap mirip sumber | ±1 menit  | Ya                           |
| `docker` | `docker build` tanpa push, hanya di PR ke `main`. Memastikan image production tetap bisa dibuat                   | ±6 menit  | Ya                           |
| `audit`  | `pnpm audit --prod --audit-level=high`                                                                            | <1 menit  | Awalnya tidak, hanya laporan |

Isi job `checks`:

- `pnpm install --frozen-lockfile`, lalu `lint`, `typecheck`, dan unit test (Vitest).
- `next build` dengan `SKIP_BUILD_PRERENDER=1` dan env placeholder, sama seperti di Dockerfile.

Isi job `e2e`:

- MongoDB 8 dijalankan sebagai replica set satu node, sama seperti `docker-compose.dev.yml`.
- Lalu `pnpm seed`, `pnpm build`, `pnpm start`, dan Playwright (Chromium).
- Laporan dan trace Playwright diunggah bila gagal.

Lingkungan `e2e`:

- `PAYLOAD_SECRET` acak per run.
- Admin seed khusus CI.
- **Tanpa email dan tanpa Cloudinary**, karena media tersimpan di disk runner.

Perubahan kecil yang diperlukan:

- `playwright.config.ts`: di CI pakai `pnpm start` (hasil build) dan `baseURL` dari env, bukan `pnpm dev`.
- Tes tidak lagi bergantung pada file `.env` lokal. Semua nilai dibaca dari env CI.

### Cakupan tes regresi

Sudah ada:

- **Unit:** formulir/kuesioner, analytics, dan pemilihan penyedia email.
- **E2E:** beranda id/en, tema, carousel hero, paket Basic, formulir minat, kuesioner bersyarat, menu ponsel, dashboard admin, batas akses editor, dan REST publik tertutup.

Ditambahkan bersama pekerjaan ini:

- Adaptor Cloudinary (unit, SDK di-mock): unggah, hapus, URL, dan penyajian file.
- Email mati: lead tetap tersimpan dengan status email `skipped` dan tidak ada error.
- Mode staging (`SITE_NOINDEX=true`): `robots.txt` menolak crawler dan ada header `X-Robots-Tag`.
- `/api/health` mengembalikan `ok` bila database tersambung.
- Unggah gambar di admin lalu tampil di halaman, memakai storage yang aktif.

Aturan tim ke depan:

- Setiap perbaikan bug disertai tes yang mereproduksi bug itu.
- Setiap fitur baru disertai minimal satu tes e2e untuk alur utamanya.
- Template PR (`.github/pull_request_template.md`) berisi checklist: tes ditambah, staging sudah dicek, dan tidak ada data rahasia di diff.

---

## 3. Staging: Vercel + MongoDB Atlas + Cloudinary, tanpa email

### 3.1 Project Vercel

- Import repo GitHub sebagai project baru, misalnya `siberguard-staging`, dengan region function `sin1` (sudah ada di `vercel.json`).
- **Production Branch** project ini diatur ke `development`. Domain staging selalu menampilkan isi `development`.
- `main` **tidak** boleh ter-deploy ke Vercel. Hanya `development` yang di-build, lewat `vercel.json`:
  ```json
  "ignoreCommand": "[ \"$VERCEL_GIT_COMMIT_REF\" != \"development\" ]"
  ```
  Perintah ini keluar dengan kode 0 (build dilewati) untuk branch lain, dan 1 (build jalan) untuk `development`. Efeknya, preview deployment per PR juga mati.
- Alasan preview dimatikan: preview akan memakai database staging yang sama, sehingga PR yang belum direview bisa menulis ke data staging. Bisa diaktifkan nanti dengan database preview terpisah.
- Deploy hanya terjadi setelah merge ke `development`, dan merge hanya mungkin bila CI hijau (proteksi branch). Jadi staging tidak pernah menerima kode yang gagal tes.
- **Rollback:** Vercel → Deployments → pilih deployment sebelumnya → _Promote_/_Instant Rollback_.

### 3.2 Environment variables staging

Diisi di Vercel → Settings → Environment Variables, environment _Production_ milik project staging:

| Variabel                                  | Nilai                                                           |
| ----------------------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`                            | Connection string Atlas staging, database `soc-merdeka-staging` |
| `PAYLOAD_SECRET`, `ANALYTICS_HASH_PEPPER` | `openssl rand -hex 32`, berbeda dari production                 |
| `NEXT_PUBLIC_SERVER_URL`                  | URL staging tanpa `/` di akhir                                  |
| `SITE_NOINDEX`                            | `true`                                                          |
| `CLOUDINARY_URL`                          | `cloudinary://<api_key>:<api_secret>@<cloud_name>`              |
| `CLOUDINARY_FOLDER`                       | `soc-merdeka-staging`                                           |
| `APP_VERSION`                             | `staging`                                                       |
| ~~`BLOB_READ_WRITE_TOKEN`~~               | Dihapus, Vercel Blob tidak dipakai lagi                         |
| ~~`RESEND_API_KEY`, `SMTP_HOST`~~         | **Tidak diisi**, sehingga email mati (lihat 3.5)                |

### 3.3 MongoDB Atlas

- Project dan cluster terpisah khusus staging, region **AWS Singapura**, dekat dengan Vercel `sin1`. Tier gratis (M0) cukup untuk staging.
- User database hanya punya hak `readWrite` ke database staging. Password panjang dan acak.
- Network access `0.0.0.0/0`, karena IP Vercel berubah-ubah. Keamanan bergantung pada password kuat dan TLS.
- **Hanya data uji.** Atlas gratis berada di luar Indonesia, jadi data pelanggan tidak boleh masuk staging.
- Isi awal dibuat dengan `pnpm seed` dari komputer lokal yang diarahkan ke Atlas, sesuai runbook staging bagian 2.

### 3.4 Cloudinary untuk media

Payload tidak punya adaptor Cloudinary resmi. Rencana saya: membuat **adaptor sendiri** di `src/lib/storage/cloudinary.ts`, sekitar 100 baris.

- Memakai `@payloadcms/plugin-cloud-storage`, yaitu pondasi resmi semua adaptor storage Payload, dikunci di versi 3.93.0 seperti paket Payload lain.
- Ditambah SDK resmi `cloudinary`.
- Paket komunitas tidak saya pilih, karena sering tertinggal dari versi Payload.

| Bagian     | Perilaku                                                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aktif bila | `CLOUDINARY_URL` terisi. Lokal dan CI tetap memakai disk, sehingga production tidak terpengaruh                                                                                                                                   |
| Unggah     | Ke folder `CLOUDINARY_FOLDER`. `public_id` diturunkan dari nama file, termasuk tiap ukuran gambar yang dibuat Payload                                                                                                             |
| Hapus      | Menghapus aset beserta semua ukurannya di Cloudinary                                                                                                                                                                              |
| Penyajian  | **Tetap lewat `/api/media/file/...`**: Payload mengambil file dari Cloudinary. URL gambar sama persis dengan production, jadi CSP, `next/image`, dan halaman tidak perlu diubah                                                   |
| Batas      | Function Vercel menerima maksimal ±4,5 MB per request, sehingga di staging gambar > 4,5 MB gagal diunggah (batas aplikasi 10 MB). Cukup untuk uji. Bila perlu, nanti ditambah _signed upload_ langsung dari browser ke Cloudinary |

`@payloadcms/storage-vercel-blob` dicabut dari dependensi. Bila staging sudah punya media di Blob, media cukup diunggah ulang atau di-seed ulang, karena isinya data uji.

Catatan untuk production: Cloudinary menyimpan file di luar Indonesia. Karena itu Cloudinary **hanya untuk staging**, kecuali kemudian diputuskan lain.

### 3.5 Email dimatikan di staging

Tidak perlu kode baru. Bila `RESEND_API_KEY` dan `SMTP_HOST` kosong, Payload berjalan tanpa email. Ini sudah diuji di `tests/unit/deploy.test.ts`. Konsekuensinya di staging:

- Notifikasi lead ke tim dan balasan otomatis ke responden tidak terkirim. Lead tetap tersimpan dan status email-nya tercatat `skipped`.
- Fitur _lupa password_ di admin tidak berfungsi. Akun admin dibuat lewat seed, dan akun lain dibuat atau di-reset oleh admin dari panel.

### 3.6 Smoke test setelah deploy

Workflow `.github/workflows/staging-smoke.yml` dipicu event `deployment_status` dari Vercel, yaitu saat deploy berhasil. Workflow menjalankan tes **hanya-baca** ke URL staging:

- `/api/health` mengembalikan `ok`.
- `/` dan `/en` tampil.
- `robots.txt` menolak crawler.
- Halaman admin login tampil.

Bila gagal, workflow ditandai merah dan notifikasi dikirim ke email atau Slack tim. Langkah berikutnya: rollback lewat Vercel (bagian 3.1).

---

## 4. Production (server belum ditentukan)

Bagian yang tidak bergantung pada pilihan server dikerjakan sekarang, supaya saat server dipilih tinggal menyambungkan langkah terakhir.

1. **Build image saat merge ke `main`:**
   - Workflow `release.yml` membangun image dari `Dockerfile` yang sudah ada.
   - Image didorong ke GitHub Container Registry (`ghcr.io/<org>/soc-merdeka`) dengan tag `sha-<commit>` dan versi rilis (`v1.2.0`).
2. **Gerbang persetujuan:**
   - Job `deploy` memakai GitHub Environment `production` dengan _required reviewers_.
   - Deploy baru jalan setelah orang yang ditunjuk menekan _Approve_.
3. **Langkah deploy:** diisi setelah server dipilih.

| Pilihan server                         | Langkah deploy                                          | Catatan                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| VPS/Cloud di Indonesia, Docker Compose | SSH, lalu `docker compose pull && docker compose up -d` | Runbook, Caddy (HTTPS), dan backup sudah ada di [deployment.md](deployment.md) dan `deploy/`. Sesuai pesan kedaulatan data |
| Container terkelola di region Jakarta  | Action resmi penyedia untuk menarik image dari GHCR     | Tanpa urus OS, biaya umumnya lebih tinggi                                                                                  |
| Vercel                                 | —                                                       | Tidak disarankan untuk production, karena data dan fungsi berada di luar Indonesia                                         |

Yang ikut diputuskan bersama server:

- **Database:** Mongo self-hosted (replica set + backup harian, sudah ada di compose) atau Atlas region Jakarta.
- **Media:** volume lokal atau object storage S3-compatible di Indonesia.
- **Email:** SMTP atau Resend.
- **Domain/DNS.**

Checklist rilis production:

1. CI hijau di PR rilis.
2. Fitur sudah dicek di staging.
3. Backup database sebelum deploy.
4. Deploy, lalu jalankan smoke test ke domain production.
5. Rollback dilakukan dengan deploy ulang tag image sebelumnya. Image lama tetap tersimpan di GHCR.

---

## 5. Rahasia & akses

- **CI** tidak memakai rahasia asli. Semua nilai dibuat acak per run.
- **Rahasia staging** hanya ada di Vercel.
- **Rahasia production** hanya ada di GitHub Environment `production` dan di server.
- File `.env*` tidak pernah di-commit (sudah di `.gitignore`). `*.example` hanya berisi nama variabel.
- **Akses terpisah per lingkungan:** user Atlas, kunci Cloudinary, dan `PAYLOAD_SECRET` staging berbeda dari production.
- Dependabot (mingguan) membuka PR pembaruan paket. PR itu juga harus lolos CI. Next.js dan Payload tetap dikunci versi persis dan diperbarui secara sadar.

---

## 6. Urutan pengerjaan

| #   | Langkah                                                                                                   | Dikerjakan oleh                                      |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | Commit pekerjaan yang ada, buat repo GitHub (private), push `main`, buat branch `development` dari `main` | Anda (atau saya bila diminta)                        |
| 2   | Workflow CI (`ci.yml`), penyesuaian Playwright untuk CI, template PR, Dependabot                          | Saya                                                 |
| 3   | Adaptor Cloudinary dan tesnya, cabut Vercel Blob, perbarui `.env.staging.example` dan runbook staging     | Saya                                                 |
| 4   | Tes regresi tambahan (bagian 2)                                                                           | Saya                                                 |
| 5   | Proteksi branch `development` & `main`                                                                    | Anda (butuh akses admin GitHub), dengan panduan saya |
| 6   | Cluster Atlas staging dan akun Cloudinary                                                                 | Anda, dengan panduan saya                            |
| 7   | Project Vercel: branch `development`, `ignoreCommand`, env vars                                           | Anda, dengan panduan saya                            |
| 8   | Seed staging, verifikasi, workflow smoke test                                                             | Saya dan Anda                                        |
| 9   | `release.yml`: image ke GHCR + gerbang persetujuan. Langkah deploy menyusul setelah server dipilih        | Saya                                                 |

---

## 7. Keputusan yang perlu dikonfirmasi

1. **Git hosting:** rencana ini mengasumsikan **GitHub**, karena integrasi Vercel dan GitHub Actions paling mulus. GitLab/Bitbucket bisa, tapi workflow-nya ditulis ulang.
2. **Preview deployment per PR:** saran saya **mati** dulu (bagian 3.1).
3. **Adaptor Cloudinary:** saran saya **adaptor sendiri** di atas plugin resmi Payload (bagian 3.4).
4. **Penyajian media:** saran saya lewat `/api/media/file` (sama dengan production). Alternatifnya URL CDN Cloudinary langsung: lebih cepat, tapi CSP dan konfigurasi gambar khusus staging perlu diubah.
5. **Penyetuju deploy production:** siapa saja yang boleh menekan _Approve_.
