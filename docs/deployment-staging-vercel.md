# Runbook staging (Vercel + MongoDB Atlas + Cloudinary)

Staging dipakai untuk meninjau konten, desain, dan alur formulir sebelum rilis ke production. Production memakai server yang belum ditentukan; lihat [deployment-plan.md](deployment-plan.md) dan [deployment.md](deployment.md).

Kodenya sama untuk semua lingkungan. Perbedaannya diatur lewat environment variable.

| Bagian                 | Production                | Staging (Vercel)                            |
| ---------------------- | ------------------------- | ------------------------------------------- |
| Branch                 | `main`                    | `development`, sebagai deployment _Preview_ |
| Aplikasi               | Image Docker (standalone) | Vercel Functions, region `sin1` (Singapura) |
| Database               | Ditentukan bersama server | MongoDB Atlas (Singapura)                   |
| Media upload           | Ditentukan bersama server | Cloudinary (`CLOUDINARY_URL`)               |
| Email                  | SMTP atau Resend          | **Mati**                                    |
| IP & lokasi pengunjung | Caddy + GeoLite2          | Header bawaan Vercel (otomatis)             |
| Mesin pencari          | Diindeks                  | Tidak diindeks (`SITE_NOINDEX=true`)        |

## Alur deploy

1. Kerjakan perubahan di branch `feature/*` atau `fix/*`, lalu buka PR ke `development`.
2. CI (`.github/workflows/ci.yml`) menjalankan lint, typecheck, unit test, build, dan e2e. PR hanya bisa di-merge bila CI hijau, karena proteksi branch.
3. Setelah merge, Vercel mem-build `development` sebagai deployment **Preview** dan mengarahkan domain staging ke deployment itu. Branch lain tidak di-build: `ignoreCommand` di `vercel.json` melewati build untuk semua branch selain `development`, termasuk `main` yang menjadi Production Branch di Vercel.
4. Workflow `staging-smoke.yml` menguji staging: health check, halaman utama, dan noindex.

## Batasan staging

- **Jangan isi dengan data pribadi asli.** Atlas tier gratis dan Cloudinary menyimpan data di luar Indonesia. Gunakan data uji, atau `pnpm demo:data` untuk lead contoh.
- **Email mati.** Akibatnya:
  - notifikasi lead dan balasan otomatis tidak terkirim;
  - lead tetap tersimpan dengan status email **skipped**;
  - fitur _lupa password_ tidak berfungsi, jadi akun dibuat atau di-reset oleh admin dari panel.
- **Ukuran upload maksimal sekitar 4 MB per file.** Vercel menolak request di atas 4,5 MB.
- **Rate limit form dan analytics dihitung per instance.** Counter disimpan di memori, sehingga di serverless batasnya lebih longgar daripada di server biasa. Ini cukup untuk staging.
- **Backup.**
  - Tier gratis Atlas menyimpan snapshot harian (maksimal 4).
  - Media di Cloudinary tidak di-backup. Isinya data uji yang bisa diunggah ulang.

## 1. MongoDB Atlas

1. Buat project, misalnya `siberguard-staging`, lalu buat cluster:
   - **Free (M0)** atau **Flex**
   - provider **AWS**, region **Singapore (ap-southeast-1)**, dekat dengan region Vercel `sin1`
2. **Database Access** → _Add New Database User_:
   - autentikasi password, dengan password acak yang panjang
   - role _Specific privileges_ → `readWrite` pada database `soc-merdeka-staging`
3. **Network Access** → _Add IP Address_ → `0.0.0.0/0`. Vercel tidak punya IP tetap, jadi keamanan bergantung pada password user database.
4. **Connect → Drivers**, salin connection string, lalu tambahkan nama database setelah host:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/soc-merdeka-staging?retryWrites=true&w=majority
   ```

   Karakter khusus di password (`@ : / ? #`) harus di-URL-encode.

## 2. Cloudinary

1. Buat akun atau _product environment_ Cloudinary (paket gratis cukup untuk staging).
2. **Settings → API Keys**: salin **API environment variable**, yaitu nilai `CLOUDINARY_URL` dengan format `cloudinary://<api_key>:<api_secret>@<cloud_name>`.
3. Media disimpan di folder `CLOUDINARY_FOLDER` (`soc-merdeka-staging`) sebagai aset _raw_. Artinya:
   - file disimpan byte-identik;
   - tiap ukuran gambar buatan Payload menjadi aset terpisah.
4. Situs tetap menampilkan gambar lewat `/api/media/file/<nama>`, karena aplikasi mengambil filenya dari Cloudinary. Jadi:
   - URL gambar sama seperti di production;
   - CSP tidak perlu diubah;
   - hak akses koleksi Media tetap berlaku.

Implementasinya ada di `src/lib/storage/cloudinary.ts`. Tanpa `CLOUDINARY_URL` (development, CI, server production), media tetap disimpan di folder `media/`.

## 3. Isi konten awal (seed) dari komputer lokal

Buat file `.env.staging` di root proyek. File ini sudah di-`.gitignore`. Isinya:

```bash
DATABASE_URL=mongodb+srv://…/soc-merdeka-staging?retryWrites=true&w=majority
PAYLOAD_SECRET=<sama dengan yang akan diisi di Vercel>
NEXT_PUBLIC_SERVER_URL=https://<domain-staging>
SEED_ADMIN_EMAIL=<email admin staging>
SEED_ADMIN_PASSWORD=<password sementara>
# Tanpa email & tanpa Cloudinary saat seed (seed tidak mengunggah media)
SMTP_HOST=
RESEND_API_KEY=
```

Lalu jalankan:

```bash
set -a; source .env.staging; set +a
pnpm seed               # konten halaman (ID + EN), formulir, header/footer, admin pertama
pnpm demo:data          # opsional: lead & data kunjungan contoh untuk mencoba dashboard
```

Nilai dari `.env.staging` mengalahkan `.env` lokal, sehingga seed masuk ke Atlas, bukan ke database development. Pastikan output seed menyebut host Atlas.

- **Jangan mengganti `DATABASE_URL` di `.env`.** `pnpm dev` dan tes e2e lokal ikut membaca `.env`, sehingga data uji lokal akan tertulis ke staging. `set -a; source …` hanya berlaku di jendela terminal itu.
- Script seed menunggu semua koleksi dan index di database baru selesai dibuat sebelum menulis (`PAYLOAD_ENSURE_INDEXES=true`). Karena itu seed pertama ke Atlas butuh beberapa detik lebih lama.
- Bila seed berhenti di tengah dan menulis "Konten sudah ada", jalankan `pnpm seed:force`. Perintah ini menimpa halaman, formulir, dan globals, tetapi tidak menyentuh lead dan user.

## 4. Project Vercel

1. Di Vercel pilih **Add New → Project → Import**, lalu pilih repo GitHub ini. Beri nama, misalnya `siberguard-staging`.
   - Framework, install command (`pnpm install`), dan build command (`pnpm build`) terdeteksi otomatis. Region fungsi `sin1` diatur di `vercel.json`.
   - **Node.js version:** 24.x (Settings → Build and Deployment).
2. **Production Branch: biarkan `main`.** Staging memakai deployment **Preview** dari `development`.
   - Halaman project Vercel tetap menulis "push ke `main`" untuk deploy production. Abaikan saja: build `main` selalu dilewati `ignoreCommand`, sampai server production diputuskan.
   - Deploy pertama saat import (dari `main`) berstatus _Canceled by Ignored Build Step_. Itu normal.
3. **Domain tetap untuk staging** (Settings → Domains → _Add Domain_):
   - Isi misalnya `siberguard-staging.vercel.app` (bila belum dipakai orang) atau subdomain sendiri.
   - Hubungkan ke environment **Preview**, Git branch **`development`**.
   - Alasannya: URL tiap deployment Preview berubah. Alias otomatis `<project>-git-development-<akun>.vercel.app` memang tetap, tetapi panjang dan bisa dipotong Vercel bila lebih dari 63 karakter.
4. **Settings → Environment Variables:** isi sesuai [`.env.staging.example`](../.env.staging.example) untuk environment **Preview**, lalu pilih branch **`development`** saja.
   - Wajib:
     - `DATABASE_URL`, `PAYLOAD_SECRET`, `ANALYTICS_HASH_PEPPER`
     - `NEXT_PUBLIC_SERVER_URL` = domain dari langkah 3, tanpa `/` di akhir
     - `SITE_NOINDEX=true`
     - `CLOUDINARY_URL`, `CLOUDINARY_FOLDER`
   - **Jangan** isi `RESEND_API_KEY` atau `SMTP_HOST`, supaya email tetap mati.
   - Environment **Production** dibiarkan kosong, karena `main` belum di-deploy ke Vercel.
   - Bila sebelumnya memakai Vercel Blob: hapus `BLOB_READ_WRITE_TOKEN` dan lepaskan Blob store dari project.
5. **Deployment Protection** (Settings → Deployment Protection). Secara bawaan Vercel melindungi deployment Preview dengan _Vercel Authentication_: hanya akun yang punya akses ke project Vercel ini yang bisa membuka staging. Pilih salah satu:
   - **Tetap aktif** (staging tertutup):
     - buat _Protection Bypass for Automation_ di halaman yang sama;
     - simpan nilainya sebagai repository secret GitHub `VERCEL_AUTOMATION_BYPASS_SECRET`, supaya smoke test bisa masuk;
     - orang di luar akun Vercel Anda, misalnya klien, tidak bisa membuka staging.
   - **Matikan** Vercel Authentication: siapa pun yang tahu URL bisa membuka staging. Situs tetap tidak diindeks mesin pencari dan isinya data uji.
6. **Deploy** dengan cara merge atau push ke `development`. Build membaca database (pre-render beranda ID/EN), jadi jalankan seed (bagian 3) lebih dulu.
7. **GitHub → Settings → Secrets and variables → Actions → Variables**: tambahkan `STAGING_URL` (domain dari langkah 3) untuk smoke test otomatis.

`NEXT_PUBLIC_SERVER_URL` harus sama persis dengan alamat yang dibuka di browser. Payload menolak cookie login dari origin lain (proteksi CSRF), jadi login admin hanya bisa lewat domain staging, bukan lewat URL deployment acak `*-<hash>-…vercel.app`.

Bila domain staging diganti:

1. Ubah domain di **Settings → Domains**, tetap terhubung ke branch `development`.
2. Ubah `NEXT_PUBLIC_SERVER_URL` dan `STAGING_URL`.
3. Redeploy.

## 5. Cek setelah deploy

Workflow smoke test menjalankan poin 1 dan 2 otomatis.

1. `https://<staging>/api/health` menjawab `{"status":"ok", …}`.
2. `https://<staging>/robots.txt` berisi `Disallow: /`.
3. Login `/admin` dengan akun seed, lalu **ganti password**.
4. **Konten → Media**: unggah satu gambar kecil, lalu pastikan:
   - gambar tampil di admin dan di halaman;
   - file muncul di Cloudinary (Media Library → folder `soc-merdeka-staging`).
5. Kirim satu formulir dari `/kuesioner`. Lead muncul di **Leads** dengan status email _skipped_.
6. Buka situs dari HP. Data kunjungan muncul di **Analytics pengunjung** beberapa detik kemudian, lengkap dengan negara/kota dari Vercel.

## 6. Pembaruan & rollback

- **Kode:** lewat PR ke `development`. Vercel build & deploy otomatis setelah merge.
- **Konten:** diubah di admin staging, tanpa deploy.
- **Env:** setelah mengubah env di Vercel, lakukan **Redeploy** pada deployment `development` terbaru.
- **Rollback:** revert commit yang bermasalah lewat PR ke `development`. Setelah CI hijau dan merge, Vercel men-deploy ulang otomatis. _Instant Rollback_ Vercel hanya berlaku untuk deployment Production, jadi tidak dipakai di staging.

## Pemecahan masalah

| Gejala                                                    | Penyebab & solusi                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Build/fungsi gagal `MongoServerSelectionError` / timeout  | Network Access Atlas belum `0.0.0.0/0`, atau user/password salah di `DATABASE_URL`                                                   |
| Login admin kembali ke halaman login                      | Alamat yang dibuka ≠ `NEXT_PUBLIC_SERVER_URL`                                                                                        |
| Upload gagal `413` / `FUNCTION_PAYLOAD_TOO_LARGE`         | File > 4,5 MB. Kompres dulu (WebP/AVIF)                                                                                              |
| Upload gagal "read-only file system"                      | `CLOUDINARY_URL` belum diisi atau salah ketik. Isi, lalu redeploy                                                                    |
| Build gagal `CLOUDINARY_URL tidak valid`                  | Format harus `cloudinary://<api_key>:<api_secret>@<cloud_name>`                                                                      |
| Gambar tidak tampil (502) setelah upload                  | Cek log fungsi di Vercel. Biasanya kunci API dicabut, atau kuota Cloudinary habis                                                    |
| Beranda 404 setelah deploy pertama                        | Seed belum dijalankan saat build. Jalankan bagian 3, lalu redeploy                                                                   |
| Seed gagal `WriteConflict … due to catalog changes`       | Database baru belum selesai membuat koleksi saat seed menulis. Pakai `pnpm seed` versi terbaru (menunggu index), lalu jalankan ulang |
| Deploy tidak berjalan setelah push                        | Push bukan ke `development`. Branch lain, termasuk `main`, sengaja dilewati `ignoreCommand`                                          |
| Vercel meminta "push ke `main`" untuk deploy              | Itu petunjuk untuk Production. Staging memakai Preview dari `development`, jadi tidak perlu push ke `main`                           |
| Build gagal karena `DATABASE_URL`/`PAYLOAD_SECRET` kosong | Env diisi di environment Production, atau tidak dicentang untuk branch `development`. Isi untuk Preview → `development`              |
| Staging meminta login Vercel                              | Deployment Protection aktif (bagian 4 langkah 5). Login dengan akun Vercel, atau matikan proteksinya                                 |
| Smoke test gagal "dilindungi Vercel Authentication"       | Isi secret GitHub `VERCEL_AUTOMATION_BYPASS_SECRET`, atau matikan proteksi Preview                                                   |
