# Runbook deployment (VPS Indonesia)

Untuk staging di Vercel (MongoDB Atlas, Cloudinary, tanpa email) lihat [deployment-staging-vercel.md](deployment-staging-vercel.md). Rencana production & CI/CD: [deployment-plan.md](deployment-plan.md).

Satu VPS dengan Docker menjalankan seluruh stack:

| Layanan | Fungsi |
|---|---|
| `app` | Next.js + Payload (image standalone, user non-root) |
| `mongo` | MongoDB 8: replica set 1 node + autentikasi (keyfile dibuat otomatis); user aplikasi hanya `readWrite` ke database `soc-merdeka` |
| `caddy` | HTTPS otomatis (Let's Encrypt), kompresi, satu-satunya proxy yang dipercaya untuk IP klien |
| `backup` | `mongodump` + arsip media setiap 02.00 WIB ke `deploy/backups/`, disimpan 14 hari |
| `geoipupdate` | *(opsional, `--profile geoip`)* database GeoLite2 untuk negara/kota pengunjung |
| `tools` | *(sekali jalan, `--profile tools`)* seed konten & skrip lain |

Hanya port 80/443 (Caddy) yang terbuka ke internet. MongoDB tidak dipublikasikan.

## 1. Persiapan server

- **Spesifikasi minimum:** Ubuntu 22.04/24.04, 2 vCPU, 4 GB RAM, 40 GB SSD, di pusat data Indonesia.
- Pasang Docker Engine + plugin Compose.
- **Firewall:** buka 22, 80, 443 (TCP) dan 443 (UDP, HTTP/3).
- **DNS:** arahkan A/AAAA record `socmerdeka.id` dan `www.socmerdeka.id` ke IP server.

```bash
git clone <repo> soc-merdeka && cd soc-merdeka
cp .env.production.example .env.production
nano .env.production       # isi semua nilai kosong
```

Nilai rahasia dibuat dengan `openssl rand -hex 32`:
- `PAYLOAD_SECRET`
- `ANALYTICS_HASH_PEPPER`
- password MongoDB

## 2. Jalankan pertama kali

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps        # tunggu mongo "healthy", app "healthy"
docker compose --env-file .env.production --profile tools run --rm tools pnpm seed
```

Seed mengisi konten awal dan membuat admin dari `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Setelah itu:

1. Login ke `https://socmerdeka.id/admin` dan **ganti password admin**.
2. Buat akun untuk tim di **Pengaturan → Pengguna**, sesuai perannya.
3. Isi **Formulir → Notifikasi & skor → Kirim notifikasi lead baru ke**.
4. Ganti isi draf **Kebijakan Privasi** dan **Syarat Layanan** dengan teks dari tim legal.
5. Kirim satu kuesioner uji, lalu cek email notifikasi dan **Ringkasan → Kondisi sistem**.

## 3. Pembaruan aplikasi

```bash
git pull
docker compose --env-file .env.production up -d --build app
```

Halaman publik dirender saat request pertama setelah deploy lalu di-cache. Perubahan konten dari CMS tidak perlu deploy ulang.

Perlu **rebuild** (`--build`) bila mengubah salah satu:
- `NEXT_PUBLIC_SERVER_URL`
- `TURNSTILE_SITE_KEY`

Keduanya dibaca saat build (URL publik & CSP).

## 4. Backup & restore

Backup tersimpan di `deploy/backups/`:
- `db-YYYYMMDD-HHMM.archive.gz`
- `media-YYYYMMDD-HHMM.tar.gz`

**Salin juga ke lokasi lain** (object storage lokal atau server kedua), misalnya dengan `rclone` via cron.

```bash
# Backup manual sekarang
docker compose --env-file .env.production exec backup bash /backup.sh once

# Restore database (menimpa data!)
docker compose --env-file .env.production exec -T mongo \
  mongorestore --uri "mongodb://$MONGO_ROOT_USER:$MONGO_ROOT_PASSWORD@localhost:27017/?authSource=admin" \
  --gzip --archive --drop < deploy/backups/db-20261116-0200.archive.gz

# Restore media
docker run --rm -v soc-merdeka_media:/media -v "$PWD/deploy/backups:/b" alpine \
  sh -c 'rm -rf /media/* && tar -xzf /b/media-20261116-0200.tar.gz -C /media'
```

Uji restore secara berkala di server staging.

## 5. Monitoring

- **Uptime:** pantau `https://socmerdeka.id/api/health` dengan Uptime Kuma atau layanan serupa. Respons `200 {"status":"ok"}` berarti aplikasi dan database sehat; selain itu `503`.
- **Di admin:** **Ringkasan → Kondisi sistem** menampilkan:
  - latensi DB, versi aplikasi, uptime
  - ukuran media
  - status email notifikasi
  - error terbaru (gagal kirim email, gagal simpan lead)
- **Log:** `docker compose --env-file .env.production logs -f app caddy`

## 6. Opsional

### Data kota/negara (GeoLite2)

1. Buat akun gratis MaxMind, lalu isi `GEOIPUPDATE_ACCOUNT_ID` & `GEOIPUPDATE_LICENSE_KEY`.
2. Jalankan:

```bash
docker compose --env-file .env.production --profile geoip up -d geoipupdate
docker compose --env-file .env.production restart app
```

Tanpa GeoLite2, negara tetap terbaca bila situs berada di belakang Cloudflare (header `CF-IPCountry`).

### Cloudflare di depan server

IP klien asli ada di header `CF-Connecting-IP`. Ubah Caddyfile agar meneruskan header itu, dan batasi akses port 443 hanya dari rentang IP Cloudflare:

```
header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}
```

### Anti-spam Turnstile

Isi `TURNSTILE_SITE_KEY` & `TURNSTILE_SECRET_KEY`, lalu rebuild. Tanpa Turnstile, formulir tetap terlindungi oleh:
- honeypot
- batas waktu isi minimum
- rate limit 5 kiriman / 10 menit per IP

### Media di object storage

Untuk lebih dari satu instance aplikasi, pindahkan media ke object storage S3-compatible lokal dengan `@payloadcms/storage-s3`. Rate limit juga perlu dipindah dari memori ke penyimpanan bersama.

## Catatan keamanan

- **Header keamanan:** HSTS, `X-Frame-Options`, `Referrer-Policy`, dan `Permissions-Policy` aktif di semua rute.
- **CSP situs publik** mengunci sumber skrip, gambar, koneksi, frame, dan `form-action`. `script-src` masih mengizinkan skrip inline karena dibutuhkan hidrasi Next dan skrip anti-kedip tema; CSP berbasis nonce akan membuat semua halaman dirender dinamis.
- **API & data:**
  - GraphQL dimatikan.
  - REST publik tidak bisa membaca formulir, lead, atau pengguna.
  - Cookie admin `Secure` + `SameSite=Strict` dengan proteksi CSRF Payload.
- **Upload:** SVG dibersihkan dari skrip; tipe file dibatasi; maksimal 10 MB.
- **Analytics** tidak menyimpan IP. `ANALYTICS_HASH_PEPPER` jangan dibocorkan.
- **Rotasi rahasia:** mengganti `PAYLOAD_SECRET` akan mengeluarkan semua sesi admin.
