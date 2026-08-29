# Skema Database — SQLite

Skema awal (bisa berkembang). File database: `app_data/pendataan_santri.db`.

## Prinsip

- Foto **tidak** disimpan sebagai BLOB — hanya path filenya (lihat `stack-tech.md` bagian 7).
- Semua tabel punya `created_at` & `updated_at` untuk jejak waktu sederhana.
- Gunakan `INTEGER PRIMARY KEY AUTOINCREMENT` sebagai id — sederhana dan cukup untuk single-user app. **Tidak pakai UUID** — UUID berguna saat banyak sistem/klien saling sinkron data; untuk 1 database lokal itu hanya menambah beban tanpa manfaat nyata.
- **Soft delete**, bukan hapus permanen. Setiap tabel utama (prefix `mst_`) punya kolom `is_deleted` dan `deleted_at`. Data yang "dihapus" user tetap ada di file `.db`, hanya disembunyikan dari tampilan (query selalu filter `WHERE is_deleted = 0`). Ini murah diimplementasikan dan mencegah kehilangan data akibat salah klik hapus — risiko nyata untuk aplikasi yang dioperasikan manual oleh 1 orang.
- **Tidak pakai** audit trail penuh (tabel `hist_`/`log_` terpisah per perubahan field). Itu berguna ketika banyak user berbeda mengakses data yang sama dan perlu tahu "siapa mengubah apa". Untuk 1 operator, `updated_at` + soft delete sudah cukup menutup risiko yang relevan.

### Konvensi penamaan tabel

Dipakai versi ringan dari skema besar, supaya rapi dan mudah diperluas ke modul lain di fase mendatang tanpa menambah kompleksitas sekarang:

| Prefix | Arti | Dipakai di proyek ini? |
|---|---|---|
| `mst_` | Master table — entitas inti (santri, kelas) | ✅ Ya |
| `ref_` | Lookup/kamus nilai tetap (kalau dibutuhkan, misal daftar status) | ✅ Ya, jika perlu |
| `trx_` | Transaksi/kejadian (mis. pembayaran, absensi) | ❌ Belum — milik modul fase 2/3 |
| `hist_` / `arc_` / `log_` | Audit trail & arsip penuh | ❌ Tidak dipakai — berlebihan untuk single-user |

## Tabel: `mst_kelas`

Menyimpan daftar kelas/jenjang santri (misal: "Kelas 1 Ibtidaiyah", "Kelas 2 Tsanawiyah", dst) supaya tidak diketik ulang manual tiap input santri.

```sql
CREATE TABLE mst_kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kelas TEXT NOT NULL UNIQUE,
    tingkat TEXT,               -- contoh: "Ibtidaiyah", "Tsanawiyah", "Aliyah"
    is_deleted INTEGER NOT NULL DEFAULT 0,   -- soft delete: 0 = aktif, 1 = dihapus (disembunyikan)
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## Tabel: `mst_santri`

Tabel utama data santri — gabungan dari `daftar_santri` (index utama) dan `data_input_santri` (biodata) di ERD asli, karena untuk single-user app memisahkan keduanya hanya menambah 1 JOIN tanpa manfaat nyata.

```sql
CREATE TABLE mst_santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nis TEXT UNIQUE,                     -- Nomor Induk Santri
    nik_santri TEXT UNIQUE,              -- NIK santri (dari KTP/KK)
    nama_lengkap TEXT NOT NULL,
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
    tempat_lahir TEXT,
    tanggal_lahir TEXT,                  -- format ISO: YYYY-MM-DD
    tingkat_sekolah TEXT,                -- contoh: "Ibtidaiyah", "Tsanawiyah", "Aliyah"
    kelas_id INTEGER,
    kelas_pengajian TEXT,
    kobong TEXT,                         -- asrama/pondok
    info_ortu_wali_id INTEGER,           -- FK ke mst_info_ortu_wali
    foto_path TEXT,                      -- path relatif, contoh: "photos/12.jpg"
    tanggal_masuk TEXT,
    tanggal_verifikasi TEXT,
    jumlah_saudara INTEGER,
    anak_ke INTEGER,
    cita_cita TEXT,
    hobi TEXT,
    no_hp_santri TEXT,
    email_santri TEXT,
    status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif', 'lulus', 'keluar', 'nonaktif')),
    catatan TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,   -- soft delete: 0 = aktif, 1 = dihapus (disembunyikan)
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (kelas_id) REFERENCES mst_kelas(id),
    FOREIGN KEY (info_ortu_wali_id) REFERENCES mst_info_ortu_wali(id)
);

CREATE INDEX idx_santri_nama ON mst_santri(nama_lengkap);
CREATE INDEX idx_santri_kelas ON mst_santri(kelas_id);
CREATE INDEX idx_santri_status ON mst_santri(status);
CREATE INDEX idx_santri_is_deleted ON mst_santri(is_deleted);
```

**Catatan field:**
- `status` memakai `CHECK` constraint supaya nilai selalu konsisten (mencegah typo seperti "Aktif" vs "aktif" vs "AKTIF").
- Index ditambahkan di kolom yang sering dipakai untuk pencarian/filter (nama, kelas, status, is_deleted) supaya tetap cepat meski data mencapai ribuan baris — meski di skala ini sebenarnya SQLite tetap cepat tanpa index sekalipun.
- **Semua query SELECT untuk tampilan default** (daftar santri, laporan) **wajib menambahkan `WHERE is_deleted = 0`**. Query khusus "lihat data terhapus" (kalau fitur itu dibuat) baru boleh mengabaikan filter ini.
- Tombol "Hapus" di UI melakukan `UPDATE mst_santri SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?` — bukan `DELETE FROM`.
- Field ortu/wali/alamat **tidak** disimpan langsung di sini (beda dari versi skema sebelumnya) — sudah dipecah ke tabel relasional terpisah di bawah, mengikuti ERD `SIMPP Al-Riyadl` yang di-upload user, karena detail lengkap ortu/wali/alamat memang dibutuhkan sejak versi awal.

## Tabel: `mst_alamat_rumah`

Alamat dipisah dari data ortu supaya bisa dipakai bersama (misal ayah & ibu tinggal 1 alamat) tanpa duplikasi data.

```sql
CREATE TABLE mst_alamat_rumah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_rumah TEXT,                   -- contoh: "milik sendiri", "sewa", "menumpang"
    provinsi TEXT,
    kabupaten_kota TEXT,
    kecamatan TEXT,
    kelurahan_desa TEXT,
    rt TEXT,
    rw TEXT,
    alamat_lengkap TEXT,
    kode_pos TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## Tabel: `mst_ayah` dan `mst_ibu`

Data orang tua kandung. Dipisah 2 tabel (bukan 1 tabel "orang_tua" dengan kolom peran) mengikuti ERD asli — cukup jelas dan tidak butuh kolom tambahan untuk membedakan peran.

```sql
CREATE TABLE mst_ayah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nik_ayah TEXT UNIQUE,
    nama_ayah TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    status_hidup TEXT CHECK(status_hidup IN ('hidup', 'meninggal')),
    pendidikan_terakhir TEXT,
    pekerjaan_utama TEXT,
    no_hp_ayah TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE mst_ibu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nik_ibu TEXT UNIQUE,
    nama_ibu TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    status_hidup TEXT CHECK(status_hidup IN ('hidup', 'meninggal')),
    pendidikan_terakhir TEXT,
    pekerjaan_utama TEXT,
    no_hp_ibu TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## Tabel: `mst_wali` (opsional per santri)

Wali diisi hanya jika santri tidak tinggal bersama/diurus oleh orang tua kandung.

```sql
CREATE TABLE mst_wali (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nik_wali TEXT UNIQUE,
    nama_wali TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    posisi_wali TEXT,                    -- contoh: "Paman", "Kakek", "Wali diangkat"
    pendidikan_terakhir TEXT,
    pekerjaan_utama TEXT,
    no_hp_wali TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## Tabel: `mst_info_ortu_wali`

Tabel penghubung — 1 baris di sini merepresentasikan "paket data keluarga" 1 santri: siapa ayahnya, ibunya, wali (jika ada), dan alamat rumahnya, plus data ekonomi keluarga.

```sql
CREATE TABLE mst_info_ortu_wali (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ayah_id INTEGER,
    ibu_id INTEGER,
    wali_id INTEGER,                     -- boleh NULL jika tidak ada wali
    alamat_rumah_id INTEGER,
    penghasilan_gabungan TEXT,           -- disimpan sebagai rentang/kategori, bukan angka presisi
    foto_ktp_path TEXT,                  -- path file, bukan BLOB
    foto_kk_path TEXT,                   -- path file, bukan BLOB
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (ayah_id) REFERENCES mst_ayah(id),
    FOREIGN KEY (ibu_id) REFERENCES mst_ibu(id),
    FOREIGN KEY (wali_id) REFERENCES mst_wali(id),
    FOREIGN KEY (alamat_rumah_id) REFERENCES mst_alamat_rumah(id)
);
```

**Alur relasi keseluruhan:**

```
mst_santri ──FK (info_ortu_wali_id)──> mst_info_ortu_wali
mst_info_ortu_wali ──FK──> mst_ayah
mst_info_ortu_wali ──FK──> mst_ibu
mst_info_ortu_wali ──FK──> mst_wali        (opsional, boleh NULL)
mst_info_ortu_wali ──FK──> mst_alamat_rumah
mst_santri ──FK (kelas_id)──> mst_kelas
```

**Catatan implementasi form:** karena 1 pendaftaran santri baru berarti mengisi hingga 6 tabel sekaligus (santri, ayah, ibu, alamat, info_ortu_wali, dan wali jika ada), form "Tambah Santri" sebaiknya dibuat sebagai **1 form multi-section** (bukan 6 form terpisah), dan proses simpannya dibungkus dalam **1 transaksi SQLite** (`BEGIN TRANSACTION` ... `COMMIT`) supaya kalau salah satu insert gagal, semuanya batal — tidak ada data "setengah tersimpan" (misal ada `mst_ayah` tanpa `mst_santri` yang terhubung).

## Tabel: `mst_riwayat_kelas` (opsional — tahap lanjut)

Untuk mencatat histori perpindahan kelas per tahun ajaran, jika dibutuhkan nanti.

```sql
CREATE TABLE mst_riwayat_kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    kelas_id INTEGER NOT NULL,
    tahun_ajaran TEXT NOT NULL,          -- contoh: "2025/2026"
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (santri_id) REFERENCES mst_santri(id),
    FOREIGN KEY (kelas_id) REFERENCES mst_kelas(id)
);
```

> Catatan: tabel ini **tidak perlu dibuat di Tahap 1–3**. Tambahkan hanya kalau fitur "riwayat kelas per tahun" benar-benar dibutuhkan — hindari bikin tabel yang belum tentu dipakai (YAGNI).

## Sumber skema biodata santri

Struktur `mst_santri`, `mst_ayah`, `mst_ibu`, `mst_wali`, `mst_alamat_rumah`, dan `mst_info_ortu_wali` diadaptasi dari ERD `SIMPP Al-Riyadl` (file `_ERD__SIMPP_Al-Riyadl.drawio`) yang di-upload user, dengan penyesuaian:
- PK diganti dari kode bisnis (NIK/NIS) menjadi `INTEGER AUTOINCREMENT`, NIK/NIS tetap ada sebagai kolom `UNIQUE`.
- `daftar_santri` dan `data_input_santri` (2 tabel terpisah di ERD asli) digabung jadi 1 tabel `mst_santri`.
- Semua kolom foto (santri, KTP, KK) disimpan sebagai path file, bukan BLOB.
- Ditambahkan `is_deleted`/`deleted_at` dan `created_at`/`updated_at` mengikuti prinsip proyek ini.

## Roadmap skema masa depan (fase 2/3 — TIDAK dikerjakan sekarang)

Scope aplikasi resmi hanya **Data Santri** untuk saat ini. Namun karena ada rencana jangka panjang menambah modul lain, dicatat di sini sebagai referensi arah **tanpa dibangun sekarang** — supaya kalau suatu saat dikerjakan, tidak perlu migrasi besar-besaran yang merombak `mst_santri`:

- **Akademik** (fase 2, kemungkinan): `trx_absensi`, `trx_nilai`, `mst_mapel` — akan mereferensikan `mst_santri.id` sebagai foreign key.
- **Perizinan/Kepengasuhan** (fase 3, kemungkinan): `trx_perizinan` — juga mereferensikan `mst_santri.id`.
- Modul **Keuangan RBAC multi-user tidak lagi menjadi bagian dari rencana proyek ini** (dihapus dari roadmap atas keputusan eksplisit).
- Karena `mst_santri` sudah punya `id` INTEGER stabil sebagai primary key, modul manapun di masa depan tinggal menambah tabel baru dengan foreign key ke `mst_santri.id` — **tidak perlu mengubah struktur tabel santri yang sudah ada**.

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
