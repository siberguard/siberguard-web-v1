# Panduan CMS SiberGuard

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
| Hero | Judul + kata yang ditonjolkan (biru), tagline (garis merah kecil), paragraf, 2 tombol, carousel banner, 2–4 sorotan. Lihat [Carousel banner di hero](#carousel-banner-di-hero) |
| Tantangan & manfaat | Pasangan "tantangan → manfaat" beserta judul kolomnya (section *Mengapa SiberGuard?*) |
| Daftar keunggulan | Judul, pengantar, **pesan kunci** (kotak sorotan), item dengan ikon. Ikon dipilih dari grid bergambar; ketik nama ikon (mis. "laporan") untuk mencari |
| Alur proses | Langkah (judul, deskripsi, label opsional). **Tata letak**: *garis waktu mendatar* (Cara Kerja) atau *daftar bernomor* (Proses Awal) — pakai yang berbeda bila satu halaman punya dua alur |
| Cakupan & batasan | Sistem operasi, jenis perangkat yang dipantau, daftar yang tidak termasuk, dan catatan batasan |
| Paket harga | Paket (harga, periode, **keterangan harga**, fitur, badge), add-on, catatan harga. Bila hanya ada **satu paket**, tampil sebagai kartu lebar |
| Jam layanan & prioritas | Angka utama (mis. 8×5), hari & jam, hari aktif untuk penanda minggu, tabel prioritas alert (Critical/High/Medium/Low + target respons), catatan |
| FAQ | Pertanyaan & jawaban |
| Formulir | Judul, manfaat, dan formulir mana yang dipakai |
| Ajakan (CTA) | Judul, paragraf, 2 tombol (dipakai untuk *Program Pilot*) |
| Katalog layanan, Panduan pasang agen | Tersedia, tetapi tidak dipakai di beranda SiberGuard saat ini |
| Gambar + teks, Deretan logo, Teks | Section tambahan untuk screenshot portal, foto tim, logo sertifikasi/mitra, halaman legal |

Di **Pengaturan section** setiap section ada:
- **ID anchor** — target menu. Menu `#layanan` mengarah ke section ber-anchor `layanan`.
- **Latar** — Standar / Abu lembut / Biru gelap. Untuk hero, *Standar* memberi latar terang yang lembut; *Biru gelap* membuat hero berlatar gelap.
- **Sembunyikan section ini.**

Perubahan tersimpan otomatis sebagai **draft**. Tekan **Publish** agar tampil di situs. Tombol **Live preview** menampilkan draft sebelum dipublikasikan, dalam ukuran ponsel/tablet/desktop.

### Carousel banner di hero

Buka section **Hero → Carousel banner**:
- **Tampilkan carousel** — hilangkan centang agar hero hanya berisi teks dan tombol.
- **Berganti otomatis** dan **Durasi per slide** (3–20 detik). Pergantian berhenti sendiri saat pengunjung mengarahkan kursor ke carousel. Pengunjung juga bisa menjedanya dengan tombol jeda, dan pengunjung yang mematikan animasi di perangkatnya tidak melihat pergantian otomatis.
- **Slide** (maks. 6), masing-masing berisi:
  - **Gambar banner (opsional)**: rasio 16:10, misalnya 1600×1000 px, maksimal sekitar 4 MB. Isi *Teks alternatif* gambar di Media.
  - **Ilustrasi bawaan**: dipakai bila gambar kosong. Pilihannya pemantauan endpoint (radar), data di Indonesia, agen/perangkat terhubung, respons insiden, atau laporan bulanan. Ilustrasi menyesuaikan tema terang/gelap secara otomatis.
  - **Label kecil**, **Judul slide**, **Keterangan singkat**, dan **Tautan** (opsional), per bahasa.

Hindari angka atau data yang terlihat seperti data pemantauan nyata di banner. Pakai pesan dan manfaat layanan.

### Menu, footer, dan teks kecil

- **Tampilan situs → Header & menu**: item menu dan tombol kanan atas. Tombol "Masuk Portal" disembunyikan sampai portal klien siap; isi URL-nya lalu hilangkan centang *Sembunyikan*.
- **Tampilan situs → Footer**: deskripsi perusahaan, kolom tautan, kontak, tautan legal. `{tahun}` pada teks hak cipta diganti otomatis.
- **Tampilan situs → Teks antarmuka**: label tombol kecil (Salin, Berikutnya, dsb.). Kosongkan untuk memakai teks bawaan.

### Format tautan

`#anchor` (section di beranda), `/kuesioner` (halaman lain; awalan bahasa ditambahkan otomatis), `https://…` (situs lain, dibuka di tab baru), `mailto:…`, `tel:…`.

## Mengubah formulir

Ada dua formulir bawaan di **Konten → Formulir**:
- **Formulir Minat SiberGuard** — dipakai di section *Konsultasi* beranda (`#konsultasi`). Kolomnya mengikuti brief: minat (Paket Basic / Program Pilot), nama perusahaan, sektor, perkiraan jumlah endpoint, kondisi pengelolaan keamanan, perkiraan anggaran (opsional), PIC & jabatan, email bisnis, WhatsApp, dan persetujuan pemrosesan data (wajib). Jangan menambahkan pertanyaan yang meminta password, token akses, log mentah, atau data rahasia.
- **Kuesioner Minat & Kesiapan POC SOC UMKM** — kuesioner lengkap dari PDF, di halaman `/kuesioner` (ditautkan dari footer).

Pengaturan yang sama berlaku untuk keduanya:

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
| **Hot** | skor ≥ *Skor minimal Hot* (bawaan: formulir minat 8, kuesioner 17) |
| **Warm** | skor ≥ *Skor minimal Warm* (bawaan: formulir minat 5, kuesioner 10) |
| **Cold** | di bawah itu |
| **Survei** | responden tidak mencentang persetujuan dihubungi (hanya terjadi di kuesioner; di formulir minat persetujuan wajib) |

Bobot bawaan formulir minat (maks. 11): Paket Basic 3 / Program Pilot 2; endpoint 5–10 = 2, 11 ke atas = 3; anggaran Rp3 juta ke atas = 3. Kuesioner: jawaban paling positif = 3, paling negatif = 0 (Q5, Q7, Q8, Q10–Q13); Q9 naik sesuai rentang biaya. **Tinjau bersama tim sales.**

> Catatan dari PDF: rentang Q2 & Q3 (1–25, 25–50, 50–100) tumpang-tindih di angka 25 dan 50. Disarankan diubah menjadi 1–25, 26–50, 51–100 cukup dengan mengganti label opsi.

## Sebelum situs ditayangkan

Brief konten SiberGuard menandai beberapa hal yang harus disetujui dulu. Isian terkait sengaja dikosongkan atau ditulis netral:

| Topik | Di mana mengubahnya |
|---|---|
| Pemilik brand, entitas kontrak, penyebutan operator | **Pengaturan situs → Data organisasi** (nama badan hukum, dipakai di metadata SEO) dan **Footer** (deskripsi, hak cipta) |
| Email & WhatsApp resmi | **Footer → Kontak**, **Pengaturan situs → Data organisasi**, dan halaman **Kebijakan Privasi** |
| Harga, pajak, syarat penagihan | Section **Paket harga** dan jawaban FAQ "Berapa biaya minimumnya?" |
| Definisi SLA & mekanisme di luar jam layanan | Section **Jam layanan & prioritas** dan FAQ "Apakah tim memantau selama 24 jam?" |
| Kuota, jadwal, biaya Program Pilot | Section **Program Pilot** dan FAQ "Apakah program pilot gratis?". Jangan menulis pilot gratis sebelum disetujui |
| Tidak menulis "SOC 24/7" | Pemantauan analis 8×5 (Senin–Jumat, 08.00–17.00 WIB) |

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
