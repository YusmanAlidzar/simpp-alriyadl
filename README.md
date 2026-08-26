# SIMPP - Sistem Manajemen Pondok Pesantren Al-Riyadl

Aplikasi Desktop (Offline) manajemen santri untuk Pondok Pesantren Al-Riyadl, dibangun menggunakan Tauri. Dirancang khusus untuk dapat berjalan ringan di PC dengan spesifikasi terbatas.

## 🌟 Fitur Saat Ini (v0.1.0)

- ✅ **Manajemen Data Santri:** Pendaftaran, edit, status (Aktif/Lulus/Keluar/Nonaktif), dan pencarian.
- ✅ **Upload Foto:** Penyimpanan foto santri secara lokal dengan optimalisasi loading.
- ✅ **Laporan & Cetak:** Rekap statistik per kelas dan cetak data ke printer atau PDF.
- ✅ **Backup & Restore:** Fitur mudah untuk mencadangkan database SQLite aplikasi.

*(Fitur Manajemen Orang Tua, Pembayaran SPP, dan Multi-tahun ada di roadmap versi selanjutnya).*

---

## 🚀 Cara Menjalankan (Development)

### Prasyarat

- Node.js v18+
- Rust (Tauri dependencies)
- npm

### Steps

```bash
# Install dependencies
npm install

# Jalankan aplikasi
npm run tauri dev
```

### Perintah Lain

```bash
# Build production
npm run tauri build

# Jalankan tanpa dev server
npm run tauri run
```

---

## 🗄️ Database

Data disimpan dalam file SQLite:
- File: `.database/simpp.db`
- Dibuat otomatis saat pertama kali aplikasi dijalankan
- Tabel yang ada:
  - `santri`
  - `orangtua`
  - `kelas`
  - `asrama`
  - `pembayaran`
  - `rekapitulasi`

---

## 📂 Struktur Proyek

- `src/`: Source code frontend (React)
  - `lib/db.ts`: Helper database SQLite + Tauri API
  - `pages/`: Halaman-halaman aplikasi
  - `components/`: Komponen UI reusable
  - `types/`: Definisi tipe data

- `src-tauri/`: Source code backend (Rust)
  - `src/lib.rs`: Tauri commands
  - `src/main.rs`: Entry point aplikasi
  - `src-tauri/tauri.conf.json`: Konfigurasi Tauri

- `.database/`: Database SQLite (dibuat otomatis)

---

## 📸 Manajemen Foto Santri

Foto disimpan di:
```
.database/photos/<nama_file>
```

Contoh path foto di database:
```
photos/1756252580631.jpeg
```

Secara otomatis akan dikonversi ke URL `asset://` saat ditampilkan di UI.

---

## 📝 Catatan Implementasi

- Menggunakan `tauri-plugin-sql` untuk akses SQLite dari TypeScript
- Menggunakan `@tauri-apps/api/path` untuk path file dan folder
- Menggunakan `@tauri-apps/api/fs` untuk manipulasi file
- Menggunakan `@tauri-apps/api/dialog` untuk file picker foto
- Foto disimpan relatif dengan nama file unik (timestamp)
- Tahun selalu 2026 (perlu diubah ke dynamic jika ingin multi-tahun)

---

## 🛠️ Dependencies

### Frontend (package.json)

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "axios": "^1.6.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.370.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tauri-plugin-sql": "^2.0.0",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1"
  }
}
```

### Backend (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
tauri-plugin-opener = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"

[lib]
name = "tauri_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

---

## 📦 Build Production

Untuk membuat installer:

```bash
npm run tauri build
```

Installer akan dibuat otomatis sesuai platform:
- Windows: `.msi` / `.exe` installer
- macOS: `.dmg` installer
- Linux: AppImage / deb / rpm

---

## 🐛 Troubleshooting

### Database tidak ditemukan

Jika database tidak muncul saat pertama kali dijalankan:

1. Pastikan folder `.database/` ada
2. Jalankan `npm run tauri dev` — database akan dibuat otomatis
3. Periksa console untuk error

### Foto tidak tampil

Pastikan:
1. Foto disimpan di `.database/photos/`
2. Path foto di database sesuai (misal: `photos/1756252580631.jpeg`)
3. Tidak ada error di console saat membuka halaman Daftar Santri

### Error compilation Rust

Pastikan Rust toolchain terinstall dengan benar:

```bash
rustup check
```

---

## 📄 Lisensi

Private project — all rights reserved.

---

## 👥 Kontribusi

1. Fork repository
2. Buat branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

---

## 📝 Changelog

### v0.1.0 (Initial Release)
- ✅ Setup proyek & SQLite Database
- ✅ CRUD Santri & Filter Data
- ✅ Manajemen Foto Santri
- ✅ Laporan & Cetak Daftar (Print/PDF)
- ✅ Backup & Restore Database Lokal

---

**Finished on:** 2026-08-25  
**Tech stack:** Tauri + React + TypeScript + SQLite + TailwindCSS

Created by ** SIMPP Team **

---

**Untuk pertanyaan atau bantuan, hubungi:** [EMAIL_ADDRESS]

Directory:
C:\Users\thinkpad\AppData\Roaming\com.alriyadl.simpp\
