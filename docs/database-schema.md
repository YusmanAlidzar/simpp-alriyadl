# Skema Database — SQLite

Skema awal (bisa berkembang). File database: `app_data/pendataan_santri.db`.

## Prinsip

- Foto **tidak** disimpan sebagai BLOB — hanya path filenya (lihat `stack-tech.md` bagian 7).
- Semua tabel punya `created_at` & `updated_at` untuk audit trail sederhana.
- Gunakan `INTEGER PRIMARY KEY AUTOINCREMENT` sebagai id — sederhana dan cukup untuk single-user app.

## Tabel: `kelas`

Menyimpan daftar kelas/jenjang santri (misal: "Kelas 1 Ibtidaiyah", "Kelas 2 Tsanawiyah", dst) supaya tidak diketik ulang manual tiap input santri.

```sql
CREATE TABLE kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kelas TEXT NOT NULL UNIQUE,
    tingkat TEXT,               -- contoh: "Ibtidaiyah", "Tsanawiyah", "Aliyah"
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## Tabel: `santri`

Tabel utama data santri.

```sql
CREATE TABLE santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nis TEXT UNIQUE,                     -- nomor induk santri
    nama_lengkap TEXT NOT NULL,
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
    tempat_lahir TEXT,
    tanggal_lahir TEXT,                  -- format ISO: YYYY-MM-DD
    alamat TEXT,
    nama_orang_tua TEXT,
    no_hp_orang_tua TEXT,
    kelas_id INTEGER,
    foto_path TEXT,                      -- path relatif, contoh: "photos/12.jpg"
    status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif', 'lulus', 'keluar', 'nonaktif')),
    tanggal_masuk TEXT,
    catatan TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id)
);

CREATE INDEX idx_santri_nama ON santri(nama_lengkap);
CREATE INDEX idx_santri_kelas ON santri(kelas_id);
CREATE INDEX idx_santri_status ON santri(status);
```

**Catatan field:**
- `status` memakai `CHECK` constraint supaya nilai selalu konsisten (mencegah typo seperti "Aktif" vs "aktif" vs "AKTIF").
- Index ditambahkan di kolom yang sering dipakai untuk pencarian/filter (nama, kelas, status) supaya tetap cepat meski data mencapai ribuan baris — meski di skala ini sebenarnya SQLite tetap cepat tanpa index sekalipun.

## Tabel: `riwayat_kelas` (opsional — tahap lanjut)

Untuk mencatat histori perpindahan kelas per tahun ajaran, jika dibutuhkan nanti.

```sql
CREATE TABLE riwayat_kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    kelas_id INTEGER NOT NULL,
    tahun_ajaran TEXT NOT NULL,          -- contoh: "2025/2026"
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (santri_id) REFERENCES santri(id),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id)
);
```

> Catatan: tabel ini **tidak perlu dibuat di Tahap 1–3**. Tambahkan hanya kalau fitur "riwayat kelas per tahun" benar-benar dibutuhkan — hindari bikin tabel yang belum tentu dipakai (YAGNI).

## Lokasi penyimpanan file

```
app_data/
├── pendataan_santri.db     # database utama
├── photos/                 # foto santri, nama file = <santri_id>.jpg
└── backups/                # hasil backup manual (lihat backup-restore.md)
```

Lokasi `app_data/` sebaiknya memakai App Data Directory yang disediakan Tauri (`@tauri-apps/api/path` → `appDataDir()`), bukan folder relatif ke installer — supaya aman dari hak akses folder Program Files di Windows.

## Migrasi

Untuk tahap awal, cukup jalankan skema di atas sekali saat aplikasi pertama kali dibuka (cek: kalau tabel belum ada, buat). Tidak perlu sistem migrasi versi kompleks (seperti Flyway/Prisma Migrate) untuk skala aplikasi ini — cukup 1 file `schema.sql` yang dieksekusi dengan `CREATE TABLE IF NOT EXISTS`.
