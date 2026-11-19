# Runbook staging (Vercel + MongoDB Atlas + Resend)

Staging dipakai untuk meninjau konten, desain, dan alur kuesioner sebelum rilis ke produksi (VPS Indonesia, lihat [deployment.md](deployment.md)). Kode aplikasi sama; perbedaannya diatur lewat environment variable.

| Bagian | Produksi (VPS) | Staging (Vercel) |
|---|---|---|
| Aplikasi | Docker `app` (standalone) di belakang Caddy | Vercel Functions, region `sin1` (Singapura) |
| Database | MongoDB di VPS | MongoDB Atlas |
| Media upload | Folder `media/` di volume | Vercel Blob (`BLOB_READ_WRITE_TOKEN`) |
| Email | SMTP | Resend (`RESEND_API_KEY`), **opsional** |
| IP & lokasi pengunjung | Caddy + GeoLite2 | Header bawaan Vercel (otomatis) |
| Mesin pencari | Diindeks | Tidak diindeks (`SITE_NOINDEX=true`) |

## Batasan staging

- **Jangan isi dengan data pribadi asli.** Cluster Atlas tier gratis tidak tersedia di Jakarta, jadi data staging disimpan di luar Indonesia (Singapura). Gunakan data uji, atau `pnpm demo:data` untuk lead contoh.
- **Ukuran upload maksimal sekitar 4 MB per file.** Vercel menolak request di atas 4,5 MB. Upload langsung dari browser ke Blob sengaja tidak diaktifkan agar SVG tetap dibersihkan di server.
- **Rate limit form dan analytics per instance.** Counter disimpan di memori, sehingga di serverless batasnya lebih longgar daripada di VPS. Ini cukup untuk staging.
- **Backup.** Tier gratis Atlas menyimpan snapshot harian (maksimal 4). Tidak ada backup media terpisah.

## 1. MongoDB Atlas

1. Buat project, misalnya `soc-merdeka`, lalu buat cluster:
   - **Free (M0)** atau **Flex**
   - provider **AWS**, region **Singapore (ap-southeast-1)**, sedekat mungkin dengan region Vercel `sin1`
2. **Database Access** → *Add New Database User*:
   - autentikasi password, password acak yang panjang
   - role: *Read and write to any database*. Lebih ketat: *Specific privileges* → `readWrite` pada database `soc-merdeka-staging`.
3. **Network Access** → *Add IP Address* → `0.0.0.0/0`. Vercel tidak punya IP tetap, jadi keamanan bergantung pada password user database.
4. **Connect → Drivers**, salin connection string, lalu tambahkan nama database setelah host:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/soc-merdeka-staging?retryWrites=true&w=majority
   ```

   Karakter khusus di password (`@ : / ? #`) harus di-URL-encode.

## 2. Isi konten awal (seed) dari komputer lokal

Buat file `.env.staging` di root proyek. File ini sudah di-`.gitignore`. Isinya:

```bash
DATABASE_URL=mongodb+srv://…/soc-merdeka-staging?retryWrites=true&w=majority
PAYLOAD_SECRET=<sama dengan yang akan diisi di Vercel>
NEXT_PUBLIC_SERVER_URL=https://soc-merdeka-staging.vercel.app
SEED_ADMIN_EMAIL=<email admin staging>
SEED_ADMIN_PASSWORD=<password sementara>
SEED_NOTIFY_EMAIL=<email penerima notifikasi lead di staging>
```

Lalu jalankan:

```bash
set -a; source .env.staging; set +a
pnpm seed               # konten halaman (ID + EN), kuesioner, header/footer, admin pertama
pnpm demo:data          # opsional: lead & data kunjungan contoh untuk mencoba dashboard
```

Nilai dari `.env.staging` mengalahkan `.env` lokal, sehingga seed masuk ke Atlas, bukan ke database development. Pastikan output seed menyebut host Atlas.

## 3. Project Vercel

1. Push repo ke GitHub/GitLab/Bitbucket, lalu di Vercel pilih **Add New → Project → Import**. Buat project khusus staging, misalnya `soc-merdeka-staging`. Production branch-nya adalah branch yang ingin ditampilkan di staging (`main` atau `staging`).
   - Framework, install command (`pnpm install`), dan build command (`pnpm build`) terdeteksi otomatis. Region fungsi `sin1` diatur di `vercel.json`.
   - **Node.js version:** 24.x (Settings → Build and Deployment).
2. **Storage → Create Database → Blob**, beri nama misalnya `soc-merdeka-staging-media`, lalu **Connect** ke project. Vercel otomatis menambahkan `BLOB_READ_WRITE_TOKEN`.
3. **Settings → Environment Variables:** isi sesuai [`.env.staging.example`](../.env.staging.example) untuk environment **Production**.
   - Wajib: `DATABASE_URL`, `PAYLOAD_SECRET`, `ANALYTICS_HASH_PEPPER`, `NEXT_PUBLIC_SERVER_URL`, `SITE_NOINDEX=true`.
   - Jangan isi env ini untuk environment **Preview** kecuali memang ingin preview memakai database yang sama.
4. **Deploy.** Build membaca database (pre-render halaman beranda ID/EN), jadi lakukan langkah 2 lebih dulu.

`NEXT_PUBLIC_SERVER_URL` harus sama persis dengan alamat yang dibuka di browser. Payload menolak cookie login dari origin lain (proteksi CSRF), jadi login admin hanya bisa lewat URL ini, bukan lewat URL deployment acak `*-git-…vercel.app`. Bila memakai domain sendiri (misalnya `staging.socmerdeka.id`), tambahkan domain di **Settings → Domains**, ubah `NEXT_PUBLIC_SERVER_URL`, lalu redeploy.

## 4. Email dengan Resend (opsional)

Tanpa `RESEND_API_KEY`:
- kuesioner tetap bisa dikirim dan lead tersimpan dengan status email **skipped**;
- fitur *lupa password* tidak mengirim email.

Untuk mengaktifkan:
1. Di Resend: **Domains → Add Domain**, lalu tambahkan record DNS (SPF/DKIM) yang diminta.
   - Bisa juga memakai subdomain, misalnya `staging.socmerdeka.id`, agar reputasi domain utama tidak tercampur.
   - Untuk uji cepat tanpa domain, pakai `onboarding@resend.dev`. Pengirim ini hanya bisa mengirim ke email pemilik akun Resend.
2. **API Keys → Create**, permission *Sending access*.
3. Isi env di Vercel:
   - `RESEND_API_KEY`
   - `EMAIL_FROM_ADDRESS` (alamat di domain terverifikasi) dan `EMAIL_FROM_NAME`
   - `EMAIL_OVERRIDE_TO`: semua email staging dialihkan ke alamat ini, sehingga responden uji tidak menerima balasan otomatis
4. **Redeploy.** Perubahan env baru berlaku di deployment berikutnya.

Urutan pemilihan penyedia email: `RESEND_API_KEY` → `SMTP_HOST` → tidak ada. Lihat `src/lib/email/adapter.ts`.

## 5. Cek setelah deploy

1. `https://<staging>/api/health` menjawab `{"status":"ok", …}`.
2. `https://<staging>/robots.txt` berisi `Disallow: /`.
3. Login `/admin` dengan akun seed, lalu **ganti password**.
4. **Konten → Media**: upload satu gambar kecil, lalu pastikan tampil (tersimpan di Blob).
5. Kirim satu kuesioner dari `/kuesioner`. Lead muncul di **Leads**, dan **Ringkasan → Kondisi sistem** menunjukkan status email (*skipped* bila Resend belum diisi).
6. Buka situs dari HP. Data kunjungan muncul di **Analytics pengunjung** beberapa detik kemudian, lengkap dengan negara/kota dari Vercel.

## 6. Pembaruan

- **Kode:** push ke production branch project staging. Vercel build & deploy otomatis.
- **Konten:** diubah di admin staging, tanpa deploy.
- **Env:** setelah mengubah env di Vercel, lakukan **Redeploy**.

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| Build/fungsi gagal `MongoServerSelectionError` / timeout | Network Access Atlas belum `0.0.0.0/0`, atau user/password salah di `DATABASE_URL` |
| Login admin kembali ke halaman login | Alamat yang dibuka ≠ `NEXT_PUBLIC_SERVER_URL` |
| Upload gagal `413` / `FUNCTION_PAYLOAD_TOO_LARGE` | File > 4,5 MB. Kompres dulu (WebP/AVIF) |
| Upload gagal "read-only file system" | `BLOB_READ_WRITE_TOKEN` belum ada. Hubungkan Blob store, lalu redeploy |
| Beranda 404 setelah deploy pertama | Seed belum dijalankan saat build. Jalankan langkah 2, lalu redeploy |
| Email tidak terkirim (status *failed*) | Cek log di **Ringkasan → Kondisi sistem**. Biasanya `EMAIL_FROM_ADDRESS` bukan dari domain terverifikasi di Resend |
