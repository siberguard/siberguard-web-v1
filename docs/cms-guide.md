# Panduan CMS SOC Merdeka

Panduan untuk tim konten dan sales. Admin dibuka di `https://<domain>/admin`.

## Peran pengguna

| Peran | Bisa |
|---|---|
| **Admin** | Semua, termasuk menambah pengguna dan pengaturan analytics |
| **Editor** | Mengubah halaman, header, footer, media, formulir. Tidak bisa melihat data lead |
| **Sales** | Dashboard, daftar lead, ubah status & catatan, ekspor CSV |
| **Viewer** | Dashboard dalam bentuk angka agregat saja |

Akun dikunci 15 menit setelah 5 kali salah password.

## Sidebar, tema, dan bahasa

Sidebar kiri berisi:
- menu **Monitoring** (Ringkasan, Analytics pengunjung, Analisis lead);
- **Leads**, dengan lencana merah berisi jumlah lead "Baru" yang belum ditindaklanjuti;
- **Konten**, **Tampilan situs**, dan **Pengaturan**.

Menu yang tampil menyesuaikan peran. Contohnya, editor tidak melihat menu Leads.

Di bagian bawah sidebar ada:
- **Tema**: Terang, Gelap, atau Otomatis (mengikuti perangkat).
- **Bahasa admin**: ID atau EN. Bawaannya Bahasa Indonesia.
- **Bahasa konten**: ID atau EN.
- Profil Anda (klik inisial untuk membuka halaman akun) dan tombol keluar.

Tombol ⟨▯ di sebelah logo **menciutkan sidebar** menjadi deretan ikon dengan logo perisai. Arahkan kursor ke ikon untuk melihat namanya. Untuk membukanya lagi, klik logo perisai. Pilihan ini diingat di browser Anda.

Di ponsel dan tablet, sidebar dibuka lewat tombol ☰ di kiri atas.

### Bahasa admin vs bahasa konten

Ada dua pengaturan bahasa yang berbeda:

| Pengaturan | Letak | Mengubah |
|---|---|---|
| **Bahasa admin** | Tombol ID/EN di sidebar | Teks tampilan admin (menu, label, tombol) |
| **Bahasa konten** | Tombol ID/EN "Bahasa konten" di sidebar | Versi bahasa konten situs yang sedang Anda edit |

Contoh: dengan admin berbahasa Indonesia, Anda tetap bisa memilih **Bahasa konten: EN** untuk mengisi teks versi Inggris.

- Struktur halaman (urutan section, jumlah item) **sama untuk kedua bahasa konten**. Menambah atau menghapus item cukup sekali.
- Teks diisi per bahasa. Bila teks Inggris kosong, situs otomatis menampilkan teks Indonesia.

## Mengubah halaman

**Konten → Halaman.** Beranda adalah halaman dengan slug `home`; halaman lain tampil di `/<slug>` (mis. `/kuesioner`, dan `/en/kuesioner` untuk bahasa Inggris).

Setiap halaman tersusun dari **section** yang bisa ditambah, diurutkan ulang (seret), atau disembunyikan. Di daftar section terlihat jenis, judul, anchor (mis. `#layanan`), dan penanda *disembunyikan*:

| Section | Isi yang diatur |
|---|---|
| Hero | Label status, judul + kata yang ditonjolkan (merah), paragraf, 2 tombol, konsol contoh alert (event, metrik), 4 statistik |
| Daftar keunggulan | Judul, pengantar, item dengan ikon. Ikon dipilih dari grid bergambar; ketik nama ikon (mis. "gembok") untuk mencari |
| Alur proses | Langkah dengan label teknis |
| Katalog layanan | Kategori filter dan layanan beserta poinnya |
| Panduan pasang agen | Langkah, tab per sistem operasi (perintah yang bisa disalin, contoh output, persyaratan) |
| Paket harga | Paket (harga, fitur, paket unggulan + badge), add-on, catatan harga |
| FAQ | Pertanyaan & jawaban |
| Formulir | Judul, manfaat, dan formulir mana yang dipakai |
| Gambar + teks, Deretan logo, Ajakan (CTA), Teks | Section tambahan untuk screenshot portal, foto tim, logo sertifikasi/mitra, halaman legal |

Di **Pengaturan section** setiap section ada:
- **ID anchor** — target menu. Menu `#layanan` mengarah ke section ber-anchor `layanan`.
- **Latar** — Standar / Abu lembut / Navy gelap.
- **Sembunyikan section ini.**

Perubahan tersimpan otomatis sebagai **draft**. Tekan **Publish** agar tampil di situs. Tombol **Live preview** menampilkan draft sebelum dipublikasikan, dalam ukuran ponsel/tablet/desktop.

### Menu, footer, dan teks kecil

- **Tampilan situs → Header & menu**: item menu dan tombol kanan atas. Tombol "Masuk Portal" disembunyikan sampai portal klien siap; isi URL-nya lalu hilangkan centang *Sembunyikan*.
- **Tampilan situs → Footer**: deskripsi perusahaan, kolom tautan, kontak, tautan legal. `{tahun}` pada teks hak cipta diganti otomatis.
- **Tampilan situs → Teks antarmuka**: label tombol kecil (Salin, Berikutnya, dsb.). Kosongkan untuk memakai teks bawaan.

### Format tautan

`#anchor` (section di beranda), `/kuesioner` (halaman lain; awalan bahasa ditambahkan otomatis), `https://…` (situs lain, dibuka di tab baru), `mailto:…`, `tel:…`.

## Mengubah kuesioner

**Konten → Formulir → Kuesioner Minat & Kesiapan POC SOC UMKM.**

- **Isi formulir**: judul, pengantar, estimasi waktu, lalu **Langkah / bagian** (A–E). Setiap bagian menjadi satu langkah wizard.
- Jenis pertanyaan: teks singkat, teks panjang, email, nomor WhatsApp, pilihan tunggal, pilihan ganda (dengan **maksimal pilihan** dan isian **"Lainnya"**), dropdown, dan centang persetujuan.
- **Kode field** adalah kunci data (mis. `minat_poc`). **Jangan ubah kode** setelah ada kiriman masuk. Mengubah label/teks pertanyaan aman.
- **Tampilkan hanya jika…**: pertanyaan muncul bila jawaban pertanyaan lain memenuhi syarat. Contoh bawaan:
  - Q11 dan Q13 tampil bila `minat_poc` = `ya`.
  - Field kontak tampil (dan wajib) bila `bersedia_dihubungi` dicentang.
- **Setelah dikirim**: label tombol, pesan sukses, catatan privasi.
- **Notifikasi & skor**: alamat email yang menerima notifikasi lead baru, balasan otomatis ke responden (opsional), dan ambang skor.

Kode field yang dipakai untuk kolom daftar lead: `nama_perusahaan`, `bidang_usaha`, `nama_pic`, serta field email dan WhatsApp pertama.

### Skor & tier lead

Setiap opsi jawaban punya **Skor lead** (hanya terlihat di admin). Skor lead adalah jumlah skor jawaban yang dipilih.

| Tier | Aturan |
|---|---|
| **Hot** | skor ≥ *Skor minimal Hot* (bawaan 17) |
| **Warm** | skor ≥ *Skor minimal Warm* (bawaan 10) |
| **Cold** | di bawah itu |
| **Survei** | responden tidak mencentang persetujuan dihubungi |

Bobot bawaan: jawaban paling positif = 3, paling negatif = 0 (Q5, Q7, Q8, Q10–Q13); Q9 naik sesuai rentang biaya. **Tinjau bersama tim sales.**

> Catatan dari PDF: rentang Q2 & Q3 (1–25, 25–50, 50–100) tumpang-tindih di angka 25 dan 50. Disarankan diubah menjadi 1–25, 26–50, 51–100 cukup dengan mengganti label opsi.

## Menangani lead

**Leads → Leads** berisi daftar kiriman, bisa dicari berdasarkan perusahaan, PIC, email, WhatsApp, atau bidang usaha.

- Halaman detail menampilkan **jawaban kuesioner** sesuai teks saat dikirim, walaupun formulir diubah kemudian.
- Di sisi kanan: **Status** (Baru → Dihubungi → Terkualifikasi → Ikut POC → Berlangganan / Tidak lanjut), **Ditangani oleh**, dan **Catatan tindak lanjut**. Penulis dan waktu catatan diisi otomatis.
- **Ekspor CSV** ada di **Monitoring → Analisis lead**. File berformat UTF-8 dan bisa dibuka langsung di Excel.

## Dashboard monitoring

Tautan ada di sidebar, bagian **Monitoring**. Semua waktu dalam WIB. Kartu angka menampilkan perubahan dibanding periode sebelumnya dengan panjang yang sama (hijau = membaik, merah = memburuk; perubahan ≥ 100% ditulis sebagai kelipatan, mis. 2,4×).

- **Ringkasan** (beranda admin):
  - pengunjung, sesi aktif, konversi
  - tren harian dan pengunjung 5 menit terakhir
  - funnel kuesioner
  - lead terbaru
  - kondisi sistem (khusus admin)
- **Analytics pengunjung**:
  - halaman, sumber, kampanye UTM
  - negara/kota, perangkat, browser
  - bahasa & tema
  - section yang dilihat, klik tombol, perintah agen yang disalin
  - bisa disaring per bahasa dan perangkat
- **Analisis lead**: sebaran jawaban setiap pertanyaan, tier, pipeline, ekspor CSV.

Cara membaca:
- **Sesi aktif**: sesi dengan waktu aktif ≥10 detik, membuka ≥2 halaman, atau ada interaksi (klik tombol, salin perintah, mulai isi formulir). Ukuran ini lebih jujur daripada *bounce rate* untuk situs satu halaman.
- **Pengunjung unik** dihitung per hari tanpa cookie. Orang yang sama di hari berbeda terhitung dua kali. Ini konsekuensi dari tidak melacak lintas hari.

**Pengaturan → Pengaturan situs → Analytics** (khusus admin):
- mematikan pencatatan
- menghormati sinyal *Do Not Track*
- mengecualikan IP kantor sendiri

## Media

Upload gambar di **Konten → Media** (PNG, JPG, WebP, AVIF, SVG; maks 10 MB). Isi **teks alternatif** dalam kedua bahasa. SVG dibersihkan otomatis dari skrip.

Logo situs bisa diganti di **Pengaturan situs → Identitas**. Bila dikosongkan, situs memakai logo bawaan `/brand/logo.svg` dan `/brand/logo-inverse.svg`.
