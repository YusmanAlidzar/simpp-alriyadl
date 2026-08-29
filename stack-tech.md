# Stack Teknologi — Detail & Alasan

Dokumen ini menjelaskan **kenapa** tiap komponen stack dipilih, berdasarkan constraint proyek:
skala data 500–2.000 baris, 1 user, 1 komputer, Windows, RAM 4GB (spek rendah), dev pemula dengan skill JS/TS.

## 1. Shell aplikasi desktop: Tauri

| | Tauri | Electron | Python (PyQt/Flet) |
|---|---|---|---|
| RAM idle | ~40–80MB | ~150–300MB | ~50–100MB |
| Ukuran installer | ~5–10MB | ~80–150MB | ~30–60MB |
| Bahasa UI | HTML/CSS/JS/TS | HTML/CSS/JS/TS | Python (paradigma UI baru) |
| Cocok skill dev saat ini | ✅ | ✅ (paling familiar) | ❌ (belajar dari nol) |
| Cocok RAM 4GB | ✅ | ⚠️ berat | ✅ |

**Keputusan: Tauri.** Alasan utamanya bukan "Tauri lebih modern", tapi murni menyesuaikan constraint RAM 4GB. Tauri merender UI lewat WebView2 (komponen yang sudah terpasang di Windows 10/11), bukan membundel Chromium sendiri seperti Electron — sehingga jauh lebih hemat resource, sambil tetap memakai skill React/TS yang sudah kamu punya.

**Trade-off yang perlu disadari:**
- Bagian native Tauri ditulis di Rust. Untuk app CRUD sederhana ini kamu **hampir tidak perlu menulis Rust manual** — cukup pakai plugin resmi (`plugin-sql`, `plugin-fs`, `plugin-dialog`). Tapi kalau suatu saat butuh fitur native khusus, ada sedikit kurva belajar Rust.
- Ekosistem plugin Tauri lebih kecil dibanding Electron (Electron sudah sangat matang & banyak contoh). Untuk kebutuhan app ini (CRUD + cetak + file lokal), plugin yang tersedia sudah lebih dari cukup.

## 2. Frontend: React + TypeScript + Vite

- **React** dipilih karena paling banyak referensi/tutorial, cocok untuk pemula, dan kamu sudah familiar dengan JS/TS.
- **TypeScript** (bukan JS biasa) direkomendasikan supaya kesalahan tipe data (misal salah isi field NIS jadi angka vs string) ketahuan saat menulis kode, bukan saat runtime — penting karena kamu solo-dev tanpa tim untuk review.
- **Vite** sebagai build tool karena ringan dan sudah jadi standar default Tauri untuk project React.

*Alternatif yang tidak dipilih:* Vue (juga bagus & lebih ringan belajar dari nol, tapi karena kamu sudah pegang JS/TS umum, React tetap relevan dan dokumentasi Tauri+React paling banyak contohnya).

## 3. Styling: Tailwind CSS

Dipilih karena tidak perlu menulis CSS terpisah banyak file, cepat untuk bikin form/table/layout standar aplikasi data, dan ringan (tidak menambah bundle besar seperti UI library penuh macam Material UI/Ant Design yang sebenarnya berlebihan untuk app internal sederhana ini).

## 4. Database: SQLite

| | SQLite | MySQL/PostgreSQL |
|---|---|---|
| Instalasi | Tidak perlu (1 file) | Perlu install & jalankan service DB server |
| Cocok single-user offline | ✅ sangat cocok | ⚠️ berlebihan (didesain multi-user, butuh jaringan) |
| Kapasitas untuk 2.000 baris | Sangat ringan, tidak masalah sampai jutaan baris | Sama-sama sanggup, tapi overkill |
| Backup | Copy 1 file `.db` | Perlu tools dump/export terpisah |
| Overhead RAM | Minimal (in-process) | Ada proses server terpisah yang jalan terus |

**Keputusan: SQLite.** Ini pilihan yang hampir tidak ada alternatif lebih masuk akal untuk skenario single-user + offline + skala kecil-menengah. MySQL/PostgreSQL didesain untuk banyak client mengakses lewat jaringan — kebutuhan yang tidak ada di proyek ini sama sekali, dan justru menambah kompleksitas instalasi + maintenance yang tidak perlu untuk solo-dev pemula.

## 5. Akses database: `@tauri-apps/plugin-sql`

Plugin resmi Tauri yang membungkus SQLite dan expose fungsi query yang bisa dipanggil langsung dari kode TypeScript di frontend (`await db.select(...)`, `await db.execute(...)`). Ini artinya kamu **tidak perlu menulis Rust untuk query database sehari-hari**.

*Kenapa bukan ORM seperti Prisma?* Prisma bagus untuk proyek besar dengan skema kompleks & tim, tapi menambah lapisan build tool + belum tentu kompatibel mulus dengan Tauri. Untuk skema ~3–5 tabel sederhana, menulis SQL langsung (dengan fungsi helper di `src/lib/db.ts`) lebih transparan untuk dipelajari dan di-debug oleh pemula.

## 6. Laporan & cetak

Pendekatan paling sederhana: render halaman HTML biasa (pakai data dari SQLite) lalu manfaatkan dialog print bawaan Windows/WebView (`window.print()`), atau generate PDF ringan bila dibutuhkan file (misalnya pakai library `jsPDF` di frontend). Tidak perlu library reporting berat (seperti engine laporan enterprise) untuk kebutuhan ini.

## 7. Foto santri

Disimpan sebagai **file di folder lokal aplikasi** (`app_data/photos/<id_santri>.jpg`), dan database hanya menyimpan **path/nama filenya**. Menyimpan foto sebagai BLOB langsung di SQLite akan membuat file `.db` cepat membengkak dan memperlambat query — tidak ideal untuk PC spek rendah.

## Ringkasan kebutuhan perangkat

- OS: Windows 10/11 (WebView2 biasanya sudah terpasang bawaan; jika belum, installer Tauri bisa menyertakan installer WebView2 kecil)
- RAM: aman di 4GB karena idle footprint rendah
- Disk: kebutuhan sangat kecil (installer + DB + foto kemungkinan besar < 500MB untuk 2.000 santri dengan foto terkompresi wajar)
- Tidak butuh koneksi internet untuk berjalan sehari-hari
