# Pendataan Santri

Aplikasi desktop **offline/lokal** untuk mengelola data santri: biodata, kelas, foto, dan laporan cetak — dijalankan di 1 komputer kantor (Windows), 1 pengguna, tanpa jaringan/internet.

## Kenapa proyek ini ada

Sebelumnya data santri dikelola manual (Excel/kertas). Aplikasi ini dibuat supaya:
- Input & pencarian data lebih cepat dan terstruktur
- Ada riwayat data yang rapi per santri (termasuk foto)
- Bisa cetak laporan/kartu santri dengan format konsisten
- Data aman lewat fitur backup/restore bawaan

## Target pengguna

- 1 orang admin/operator (bagian kepesantrenan/tata usaha)
- 1 komputer, offline, Windows saja
- Skala data: ± 500–2.000 santri

## Tech stack (ringkasan)

| Layer | Pilihan | Alasan singkat |
|---|---|---|
| Shell desktop | **Tauri** | Ringan di RAM (pakai WebView2 bawaan Windows), installer kecil |
| Frontend | **React + TypeScript + Vite** | Sesuai skill dev (JS/TS), ekosistem besar |
| UI Kit | **Tailwind CSS** (+ komponen sederhana) | Cepat, ringan, tidak perlu desain dari nol |
| Database | **SQLite** (file lokal) | Serverless, 1 file, cocok untuk skala ribuan baris, backup = copy file |
| Query layer | `@tauri-apps/plugin-sql` | Bisa akses SQLite langsung dari TypeScript, minim kode Rust |
| Laporan/cetak | Render HTML → cetak via dialog print bawaan OS, atau export PDF | Simpel, tidak perlu library berat |

Detail lengkap & alasan trade-off ada di [`docs/stack-tech.md`](docs/stack-tech.md).

## Struktur proyek

```
pendataan-santri/
├── src/                     # Kode frontend (React + TS)
│   ├── components/          # Komponen UI yang dipakai berulang
│   ├── pages/                # Halaman: Dashboard, DaftarSantri, FormSantri, Laporan, Backup
│   ├── lib/                   # Fungsi util: db.ts, format.ts, dsb
│   └── types/                # Definisi TypeScript (Santri, Kelas, dll)
├── src-tauri/                # Bagian native (Rust) — jarang disentuh manual
│   ├── src/                  # main.rs, setup plugin
│   ├── icons/
│   └── tauri.conf.json       # Konfigurasi app: nama, ukuran window, installer
├── docs/
│   ├── stack-tech.md         # Detail & alasan pemilihan tech stack
│   ├── database-schema.md    # Skema tabel SQLite
│   ├── backup-restore.md     # Alur backup/restore
│   └── Design.md             # Sistem warna dan panduan UI (Pesantren & Emas)
├── AGENTS.md                 # Instruksi untuk AI agent (Antigravity) yang mengerjakan proyek ini
└── README.md                 # File ini
```

## Menjalankan proyek (development)

```bash
npm install
npm run tauri dev
```

## Build installer (.exe)

```bash
npm run tauri build
```

Installer akan ada di `src-tauri/target/release/bundle/nsis/`.

## Status proyek

✅ **Selesai (v1.2.4)** - Migrasi ke arsitektur ERD 8 tabel relasional, perbaikan transaksi SQLite, upload foto (3x4), laporan dinamis berdasarkan Kobong/Gender, perombakan tema UI (Hijau Pesantren & Emas Al-Riyadl), serta implementasi Dark Mode yang solid (termasuk fitur cetak Light Mode paksa).

## Directory Database
C:\Users\[username]\AppData\Roaming\com.alriyadl.simpp\