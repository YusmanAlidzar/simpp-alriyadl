# Skema Database SIMPP Al-Riyadl

Dokumen ini merupakan **sumber kebenaran tunggal (Single Source of Truth)** untuk arsitektur data aplikasi, yang disintesis dari file eksekusi utama: `src/lib/db.ts` (SQLite), `src/types/santri.ts` (TypeScript Interfaces), dan `src/pages/FormSantri.tsx` (Validasi UI).

Sistem ini menggunakan **8 Tabel Relasional** yang dikelola melalui plugin SQLite bawaan Tauri.

---

## 1. Struktur Tabel (ERD)

Semua proses `INSERT`/`UPDATE` data santri wajib dilakukan di dalam **1 transaksi SQLite** yang mengikat 7 tabel secara berurutan: `alamat_rumah` → `ayah_kandung` / `ibu_kandung` / `wali_santri` → `info_ortu_wali` → `data_input_santri` → `daftar_santri`.

### Tabel Master
```sql
CREATE TABLE IF NOT EXISTS kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kelas TEXT NOT NULL UNIQUE,
    tingkat TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```
*Data Default (Seed):* Ibtida 1, Ibtida 2, Ibtida 3, Wustho' 1, Wustho' 2, Ulya, Tachocuz.

### Tabel Relasi Biodata Keluarga
```sql
CREATE TABLE IF NOT EXISTS alamat_rumah (
    alamat_rumah_id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_rumah TEXT, provinsi TEXT, kabupaten_kota TEXT, kecamatan TEXT,
    kelurahan_desa TEXT, rt TEXT, rw TEXT, alamat TEXT, kode_pos TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ayah_kandung (
    nik_ayah TEXT PRIMARY KEY,
    nama_ayah TEXT NOT NULL, tempat_lahir TEXT, tanggal_lahir TEXT, status_hidup TEXT,
    pendidikan_terakhir TEXT, pekerjaan_utama TEXT, nomor_hp_ayah TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ibu_kandung (
    nik_ibu TEXT PRIMARY KEY,
    nama_ibu TEXT NOT NULL, tempat_lahir TEXT, tanggal_lahir TEXT, status_hidup TEXT,
    pendidikan_terakhir TEXT, pekerjaan_utama TEXT, nomor_hp_ibu TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wali_santri (
    nik_wali TEXT PRIMARY KEY,
    nama_wali TEXT NOT NULL, tempat_lahir TEXT, tanggal_lahir TEXT, posisi_wali TEXT,
    pendidikan_terakhir TEXT, pekerjaan_utama TEXT, nomor_hp_wali TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS info_ortu_wali (
    info_ortu_wali_id INTEGER PRIMARY KEY AUTOINCREMENT,
    penghasilan_gabungan TEXT, foto_ktp_path TEXT, foto_kk_path TEXT,
    nik_ayah TEXT, nik_ibu TEXT, alamat_rumah_id INTEGER, nik_wali TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (nik_ayah) REFERENCES ayah_kandung(nik_ayah),
    FOREIGN KEY (nik_ibu) REFERENCES ibu_kandung(nik_ibu),
    FOREIGN KEY (alamat_rumah_id) REFERENCES alamat_rumah(alamat_rumah_id),
    FOREIGN KEY (nik_wali) REFERENCES wali_santri(nik_wali)
);
```

### Tabel Relasi Biodata Santri
```sql
CREATE TABLE IF NOT EXISTS data_input_santri (
    nik_santri TEXT PRIMARY KEY,
    nama_santri TEXT NOT NULL, tempat_lahir TEXT, tanggal_lahir TEXT, tingkat_sekolah TEXT,
    jenis_kelamin TEXT, tanggal_verifikasi TEXT, tanggal_masuk TEXT, foto_santri TEXT,
    jumlah_saudara INTEGER, anak_ke INTEGER, cita_cita TEXT, hobi TEXT,
    nomor_hp_santri TEXT, email_santri TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daftar_santri (
    nis TEXT PRIMARY KEY,
    kelas_id INTEGER, kelas_pengajian TEXT, kobong TEXT, nik_santri TEXT,
    info_ortu_wali_id INTEGER, status TEXT DEFAULT 'aktif', catatan TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id),
    FOREIGN KEY (nik_santri) REFERENCES data_input_santri(nik_santri),
    FOREIGN KEY (info_ortu_wali_id) REFERENCES info_ortu_wali(info_ortu_wali_id)
);
```

---

## 2. Mapping Tipe Data Frontend (`src/types/santri.ts`)

Di level aplikasi React, seluruh _field_ ini dibungkus menjadi satu form objek raksasa yang disebut `SantriForm`. Hal ini dilakukan agar UI memiliki satu state terpusat sebelum melakukan query ke SQLite:

```typescript
export interface SantriForm {
  // 1. data_input_santri & 2. daftar_santri
  nik_santri: string; nama_santri: string; tempat_lahir: string; tanggal_lahir: string;
  tingkat_sekolah: string; jenis_kelamin: "L" | "P" | ""; tanggal_masuk: string;
  jumlah_saudara: string; anak_ke: string; cita_cita: string; hobi: string;
  nomor_hp_santri: string; email_santri: string; foto_santri: string | null;
  nis: string; kelas_id: string; kelas_pengajian: string; kobong: string;
  status: "aktif" | "lulus" | "keluar" | "nonaktif"; catatan: string;

  // 3. info_ortu_wali & Alamat Rumah & Wali & Ortu
  penghasilan_gabungan: string;
  nik_ayah: string; nama_ayah: string; status_hidup_ayah: string; ...
  nik_ibu: string; nama_ibu: string; status_hidup_ibu: string; ...
  ada_wali: boolean; nik_wali: string; nama_wali: string; ...
  status_rumah: string; provinsi: string; alamat_lengkap: string; kode_pos: string; ...
}
```

---

## 3. Aturan & Batasan Input / UI Validations (`src/pages/FormSantri.tsx`)

Aplikasi menerapkan penyaringan *input* secara *real-time* di UI. Karena SQLite memperlakukan `TEXT` secara bebas, form inilah yang menjadi gerbang utama validasi database:

1. **NIK (Santri, Ayah, Ibu, Wali)**: Wajib berisi **tepat 16 digit angka**. Di-filter memakai _RegEx_ `replace(/\D/g, "")` dan dikunci panjangnya `maxLength={16}`.
2. **NIS**: Wajib hanya menerima angka. Format titik desimal kadang digunakan (`maxLength` tidak dipatok kaku tapi dilarang mengandung abjad).
3. **Kode Pos**: Maksimal 5 digit angka (`maxLength={5}`).
4. **RT / RW**: Maksimal 3 digit angka (`maxLength={3}`).
5. **Jumlah Saudara / Anak Ke**: Angka murni. Diubah menjadi `parseInt()` sebelum masuk database.
6. **Status Santri (Dropdown)**: Terkunci di nilai: `aktif`, `lulus`, `keluar`, `nonaktif`.
7. **Jenis Kelamin (Dropdown)**: Terkunci di `L` (Laki-laki) atau `P` (Perempuan).
8. **Kobong (Asrama)**: 
   - Putra: `Imam Syafi'i`, `Imam Hanafi`, `Imam Hambali`, `Imam Maliki`, `Al-Muqoddas`, `Al-Qodir`, `Abu Bakar Ash-Shidiq`, `Abu Dzar Al-Ghifari`, `Umar bin Khattab`, `Syekh Abdul Qodir Al-Jailani`, `Imam Ghazali`, `Abu Hurairah`, `Ali bin Abi Thalib`, `Utsman bin Affan`
   - Putri: `Siti Fatimah`, `Siti Aisyah`, `Siti Aminah`, `Siti Hafsoh`, `Siti Robiah`, `Siti Khodijah`, `Siti Hajar`, `Siti Sarah`, `Siti Hawa`, `Siti Balqis`
9. **Tingkat Sekolah**: `Belum/Putus Sekolah`, `PAUD/TK/sederajat`, `SD/MI/sederajat`, `SMP/MTs/sederajat`, `SMA/MA/sederajat`, `Perguruan Tinggi`, `Sudah Bekerja`
10. **Status Hidup (Ortu)**: `Hidup`, `Meninggal`, `Cerai/Pisah`, `Tidak Diketahui`
11. **Pendidikan (Ortu)**: `SD`, `SMP`, `SMA`, `S1`, `S2`, `Tidak Sekolah`
12. **Pekerjaan (Ortu)**: `Wiraswasta`, `PNS`, `Pegawai Swasta`, `Buruh`, `Petani`, `Ibu Rumah Tangga`, `Tidak Bekerja`

---

## 4. Referensi Script Generator (Notebook)

Untuk menghasilkan data dummy secara massal yang mematuhi seluruh batasan UI dan Database di atas (serta menjaga konsistensi Foreign Key pada 8 tabel), Anda bisa menggunakan script Node.js.

Jalankan di folder root dengan perintah:
```bash
npm install --no-save sqlite3
node scratch/insert_dummy.cjs
```

**Fitur `scratch/insert_dummy.cjs`**:
1. Menjamin string NIK selalu valid sepanjang 16 karakter tanpa spasi.
2. Otomatis menentukan Kobong putra/putri berdasarkan _field_ `jenis_kelamin`.
3. Mengisi Foreign Keys secara berurutan sesuai alur ERD.
*(Secara bawaan SQLite database-nya tersimpan di `%APPDATA%/com.alriyadl.simpp/`).*

# INFORMASI INPUT DATA
## [Registrasi & Biodata Santri]
1. NIS*: Hanya angka dan titik
2. NIK Santri*: Hanya angka, 16 digit
3. Nama Lengkap*: Teks
4. Jenis Kelamin: Laki-laki/Perempuan
5. Tempat Lahir: Teks
6. Tanggal Lahir: dd/mm/yyyy
7. Tingkat Sekolah: Dropdown
	Belum/Putus Sekolah
	PAUD/TK/sederajat
	SD/MI/sederajat
	SMP/MTs/sederajat
	SMA/MA/sederajat
	Perguruan Tinggi
	Sudah Bekerja
8. Tingkat Kelas Pengajian: Dropdown
	Tingkat Ibtida
	Tingkat Wustho'
	Tingkat Ulya
	Tingkat Takhosus
9. Kelas Pengajian: Sesuai no.8
	Jika [Tingkat Ibtida]: Dropdown
		Ibtida 1
		Ibtida 2
		Ibtida 3
	Jika [Tingkat Wustho']: Dropdown
		Wustho' 1
		Wustho' 2
	Jika [Tingkat Ulya]: Dropdown
		Ulya
	Jika [Tingkat Takhosus]: Dropdown
		Tachocuz
10. Kobong (Asrama): Sesuai no.4
	Jika [Laki-laki]: Dropdown
		Imam Syafi'i
		Imam Hanafi
		Imam Hambali
		Imam Maliki
		Al-Muqoddas
		Al-Qodir
		Abu Bakar Ash-Shidiq
		Abu Dzar Al-Ghifari
		Umar bin Khattab
		Syekh Abdul Qodir Al-Jailani
		Imam Ghazali
		Abu Hurairah
		Ali bin Abi Thalib
		Utsman bin Affan
	Jika [Perempuan]: Dropdown
		Siti Fatimah
		Siti Aisyah
		Siti Aminah
		Siti Hafsoh
		Siti Robiah
		Siti Khodijah
		Siti Hajar
		Siti Sarah
		Siti Hawa
		Siti Balqis
11. Tanggal Masuk: dd/mm/yyyy
12. No. HP Santri: Hanya angka
13. Anak Ke: Hanya angka
14. Jumlah Saudara: Hanya angka
15. Status Santri: Dropdown
	Aktif
	Lulus
	Keluar
	Nonaktif
## [Alamat Rumah]
16. Status Rumah: Dropdown
	Milik Sendiri
	Sewa/Kontrak
	Menumpang
	Asrama/Pesantren
	Lainnya
17. Kode Pos: Hanya angka, 5 digit
18. Provinsi: Dropdown pilihan, sesuai daerah Indonesia
19. Kabupaten / Kota: Dropdown pilihan, sesuai daerah Indonesia dan no.18
20. Kecamatan: Dropdown pilihan, sesuai daerah Indonesia dan no.18-19
21. Kelurahan / Desa: Sesuai daerah Indonesia
22. RT: Hanya angka, 3 digit
23. RW: Hanya angka, 3 digit
24. Alamat Lengkap: Teks
## [Data Orang Tua (Ayah & Ibu)]
25. NIK Ayah*: Hanya angka, 16 digit
26. NIK Ibu*: Hanya angka, 16 digit
27. Nama Ayah*: Teks
28. Nama Ibu*: Teks
29. Status Hidup (Ayah): Dropdown
	Hidup
	Meninggal
	Tidak Diketahui
30. Status Hidup (Ibu): Dropdown
	Hidup
	Meninggal
	Tidak Diketahui
31. Pekerjaan (Ayah): Teks
32. Pekerjaan (Ibu): Teks
33. No. HP Ayah: Hanya angka
34. No. HP Ibu: Hanya angka
## [Wali (Opsional): Ceklis/Tidak]
35. NIK Wali: Hanya angka, 16 digit
36. Nama Wali: Teks
37. Hubungan / Posisi Wali: Teks
38. No. HP Wali: Angka
## [Info Keluarga]
39. Penghasilan Gabungan (Orang Tua): Dropdown
	< Rp 1.000.000
	Rp 1.000.000 - Rp 3.000.000
	Rp 3.000.000 - Rp 5.000.000
	> Rp 5.000.000
40. Catatan Tambahan: Teks