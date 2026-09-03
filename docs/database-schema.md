# Skema Database — SQLite

Skema ini mengikuti struktur Entity-Relationship Diagram (ERD) terbaru dengan total **8 Tabel**.
File database: `app_data/pendataan_santri.db`.

## Prinsip

- Menggunakan `INTEGER PRIMARY KEY AUTOINCREMENT` untuk mempermudah relasi antar tabel (kecuali disebutkan lain).
- **Relasi:** Semua tabel terhubung melalui foreign key yang kuat.
- Transaksi database wajib digunakan saat *insert/update* data santri karena 1 form akan menyimpan ke 7 tabel sekaligus.

---

## 1. Tabel: `kelas` (Tabel Master)
Menyimpan daftar kelas/jenjang santri agar pilihan kelas terstandarisasi.

```sql
CREATE TABLE kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kelas TEXT NOT NULL UNIQUE,
    tingkat TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## 2. Tabel: `alamat_rumah`
Menyimpan data tempat tinggal.

```sql
CREATE TABLE alamat_rumah (
    alamat_rumah_id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_rumah TEXT,
    provinsi TEXT,
    kabupaten_kota TEXT,
    kecamatan TEXT,
    kelurahan_desa TEXT,
    rt TEXT,
    rw TEXT,
    alamat TEXT,
    kode_pos TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## 3. Tabel: `ayah_kandung`
Data profil demografi ayah.

```sql
CREATE TABLE ayah_kandung (
    nik_ayah TEXT PRIMARY KEY,
    nama_ayah TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    status_hidup TEXT,
    pendidikan_terakhir TEXT,
    pekerjaan_utama TEXT,
    nomor_hp_ayah TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## 4. Tabel: `ibu_kandung`
Data profil demografi ibu.

```sql
CREATE TABLE ibu_kandung (
    nik_ibu TEXT PRIMARY KEY,
    nama_ibu TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    status_hidup TEXT,
    pendidikan_terakhir TEXT,
    pekerjaan_utama TEXT,
    nomor_hp_ibu TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## 5. Tabel: `wali_santri` (Opsional)
Hanya diisi jika santri diurus oleh wali (selain ayah/ibu).

```sql
CREATE TABLE wali_santri (
    nik_wali TEXT PRIMARY KEY,
    nama_wali TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    posisi_wali TEXT,
    pendidikan_terakhir TEXT,
    pekerjaan_utama TEXT,
    nomor_hp_wali TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## 6. Tabel: `info_ortu_wali`
Tabel penghubung/grup keluarga. 

```sql
CREATE TABLE info_ortu_wali (
    info_ortu_wali_id INTEGER PRIMARY KEY AUTOINCREMENT,
    penghasilan_gabungan TEXT,
    foto_ktp_path TEXT,
    foto_kk_path TEXT,
    nik_ayah TEXT,
    nik_ibu TEXT,
    alamat_rumah_id INTEGER,
    nik_wali TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (nik_ayah) REFERENCES ayah_kandung(nik_ayah),
    FOREIGN KEY (nik_ibu) REFERENCES ibu_kandung(nik_ibu),
    FOREIGN KEY (alamat_rumah_id) REFERENCES alamat_rumah(alamat_rumah_id),
    FOREIGN KEY (nik_wali) REFERENCES wali_santri(nik_wali)
);
```

## 7. Tabel: `data_input_santri`
Menyimpan biodata detail santri.

```sql
CREATE TABLE data_input_santri (
    nik_santri TEXT PRIMARY KEY,
    nama_santri TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    tingkat_sekolah TEXT,
    jenis_kelamin TEXT,
    tanggal_verifikasi TEXT,
    tanggal_masuk TEXT,
    foto_santri TEXT,
    jumlah_saudara INTEGER,
    anak_ke INTEGER,
    cita_cita TEXT,
    hobi TEXT,
    nomor_hp_santri TEXT,
    email_santri TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

## 8. Tabel: `daftar_santri` (Tabel Pendaftaran Utama)
Tabel pendaftaran. Tabel ini me-referensikan tabel master `kelas`, `data_input_santri`, dan `info_ortu_wali`.

```sql
CREATE TABLE daftar_santri (
    nis TEXT PRIMARY KEY,
    kelas_id INTEGER,
    kelas_pengajian TEXT,
    kobong TEXT,
    nik_santri TEXT,
    info_ortu_wali_id INTEGER,
    status TEXT DEFAULT 'aktif',
    catatan TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id),
    FOREIGN KEY (nik_santri) REFERENCES data_input_santri(nik_santri),
    FOREIGN KEY (info_ortu_wali_id) REFERENCES info_ortu_wali(info_ortu_wali_id)
);
```

## Alur Relasi (Simulasi 1 Pendaftaran)
1. Insert `alamat_rumah`
2. Insert `ayah_kandung`
3. Insert `ibu_kandung`
4. Insert `wali_santri` (jika ada)
5. Insert `info_ortu_wali` (menyambungkan no 1, 2, 3, 4)
6. Insert `data_input_santri`
7. Insert `daftar_santri` (menyambungkan NIS, kelas_id, NIK Santri, dan ID Info Ortu)

*(Seluruh 7 insert di atas harus dibungkus dalam 1 Transaksi SQLite).*
