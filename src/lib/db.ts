/**
 * db.ts — Pusat semua akses database SQLite
 *
 * ATURAN PENTING:
 * - Semua query SQL HANYA ditulis di file ini, jangan di komponen React.
 * - Selalu pakai parameterized query (?) untuk mencegah SQL injection.
 * - Ekspor fungsi-fungsi query, bukan instance db langsung.
 */

import Database from "@tauri-apps/plugin-sql";
import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir, readFile, copyFile, readDir, remove } from "@tauri-apps/plugin-fs";
import type { Santri, SantriForm } from "../types/santri";
import type { Kelas } from "../types/kelas";
import type { RekapSantri, RekapStatus, RekapKelas } from "../types/rekap";

// Instance database — null sebelum initDatabase() dipanggil
let db: Database | null = null;

/**
 * Mengembalikan instance database yang sudah terbuka.
 * Akan throw error kalau initDatabase() belum dipanggil.
 */
function getDb(): Database {
  if (!db) {
    throw new Error(
      "Database belum diinisialisasi. Pastikan initDatabase() dipanggil saat startup."
    );
  }
  return db;
}

/**
 * initDatabase() — Buka koneksi ke SQLite, buat tabel, dan seed data awal.
 */
export async function initDatabase(): Promise<void> {
  const dataDir = await appDataDir();

  // Buat folder photos/ jika belum ada
  const photosDir = await join(dataDir, "photos");
  await mkdir(photosDir, { recursive: true });

  // Buka (atau buat baru) file database SQLite
  const dbPath = await join(dataDir, "pendataan_santri.db");
  db = await Database.load(`sqlite:${dbPath}`);

  await buatTabel();
  await seedKelas();

  console.log("[db] Database siap:", dbPath);
}

// ============================================================
// Inisialisasi tabel (8 Tabel ERD)
// ============================================================

async function buatTabel(): Promise<void> {
  const database = getDb();

  // Drop tabel lama jika masih ada (karena refactoring drastis ke ERD 8 tabel)
  await database.execute(`DROP TABLE IF EXISTS santri;`);
  await database.execute(`DROP TABLE IF EXISTS mst_santri;`);

  // Aktifkan Foreign Keys
  await database.execute(`PRAGMA foreign_keys = ON;`);

  // 1. kelas
  await database.execute(`
    CREATE TABLE IF NOT EXISTS kelas (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_kelas TEXT NOT NULL UNIQUE,
      tingkat    TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 2. alamat_rumah
  await database.execute(`
    CREATE TABLE IF NOT EXISTS alamat_rumah (
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
    )
  `);

  // 3. ayah_kandung
  await database.execute(`
    CREATE TABLE IF NOT EXISTS ayah_kandung (
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
    )
  `);

  // 4. ibu_kandung
  await database.execute(`
    CREATE TABLE IF NOT EXISTS ibu_kandung (
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
    )
  `);

  // 5. wali_santri
  await database.execute(`
    CREATE TABLE IF NOT EXISTS wali_santri (
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
    )
  `);

  // 6. info_ortu_wali
  await database.execute(`
    CREATE TABLE IF NOT EXISTS info_ortu_wali (
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
    )
  `);

  // 7. data_input_santri
  await database.execute(`
    CREATE TABLE IF NOT EXISTS data_input_santri (
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
    )
  `);

  // 8. daftar_santri
  await database.execute(`
    CREATE TABLE IF NOT EXISTS daftar_santri (
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
    )
  `);
}

async function seedKelas(): Promise<void> {
  const database = getDb();

  const kelasList = [
    { nama: "Ibtida 1", tingkat: "Ibtida" },
    { nama: "Ibtida 2", tingkat: "Ibtida" },
    { nama: "Ibtida 3", tingkat: "Ibtida" },
    { nama: "Wustho' 1", tingkat: "Wustho'" },
    { nama: "Wustho' 2", tingkat: "Wustho'" },
    { nama: "Ulya", tingkat: "Ulya" },
    { nama: "Tachocuz", tingkat: "Takhosus" },
  ];

  for (const k of kelasList) {
    await database.execute(
      `INSERT OR IGNORE INTO kelas (nama_kelas, tingkat) VALUES (?, ?)`,
      [k.nama, k.tingkat]
    );
  }
}

// ============================================================
// KELAS — Query
// ============================================================

export async function getAllKelas(): Promise<Kelas[]> {
  return await getDb().select<Kelas[]>(`SELECT * FROM kelas ORDER BY id ASC`);
}

export async function getRekapSantri(): Promise<RekapSantri> {
  const database = getDb();

  const [totalRow] = await database.select<[{ total: number; laki: number; perempuan: number }]>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN di.jenis_kelamin = 'L' THEN 1 ELSE 0 END) AS laki,
      SUM(CASE WHEN di.jenis_kelamin = 'P' THEN 1 ELSE 0 END) AS perempuan
    FROM daftar_santri ds
    JOIN data_input_santri di ON ds.nik_santri = di.nik_santri
  `);

  const perStatus = await database.select<RekapStatus[]>(`
    SELECT
      ds.status,
      COUNT(*) AS total,
      SUM(CASE WHEN di.jenis_kelamin = 'L' THEN 1 ELSE 0 END) AS laki,
      SUM(CASE WHEN di.jenis_kelamin = 'P' THEN 1 ELSE 0 END) AS perempuan
    FROM daftar_santri ds
    JOIN data_input_santri di ON ds.nik_santri = di.nik_santri
    GROUP BY ds.status
    ORDER BY CASE ds.status
      WHEN 'aktif'    THEN 1
      WHEN 'lulus'    THEN 2
      WHEN 'keluar'   THEN 3
      WHEN 'nonaktif' THEN 4
      ELSE 5
    END
  `);

  const perKelas = await database.select<RekapKelas[]>(`
    SELECT
      k.id AS kelas_id,
      k.nama_kelas,
      k.tingkat,
      COUNT(ds.nis) AS total,
      SUM(CASE WHEN di.jenis_kelamin = 'L' THEN 1 ELSE 0 END) AS laki,
      SUM(CASE WHEN di.jenis_kelamin = 'P' THEN 1 ELSE 0 END) AS perempuan
    FROM kelas k
    LEFT JOIN daftar_santri ds ON ds.kelas_id = k.id
    LEFT JOIN data_input_santri di ON ds.nik_santri = di.nik_santri
    GROUP BY k.id
    ORDER BY k.id
  `);

  return {
    totalSemua: totalRow?.total ?? 0,
    totalLaki: totalRow?.laki ?? 0,
    totalPerempuan: totalRow?.perempuan ?? 0,
    perStatus,
    perKelas,
  };
}

// ============================================================
// SANTRI — Query
// ============================================================

export async function getAllSantri(filter?: {
  cari?: string;
  kelasId?: number | null;
  status?: string | null;
}): Promise<Santri[]> {
  let query = `
    SELECT 
      ds.nis, 
      di.nik_santri, 
      di.nama_santri, 
      di.jenis_kelamin, 
      di.tempat_lahir, 
      di.tanggal_lahir, 
      di.tanggal_masuk,
      ds.kelas_id, 
      di.foto_santri, 
      ds.status, 
      k.nama_kelas, 
      a.nama_ayah, 
      i.nama_ibu, 
      ar.alamat AS alamat,
      COALESCE(a.nomor_hp_ayah, i.nomor_hp_ibu) AS nomor_hp_ortu
    FROM daftar_santri ds
    JOIN data_input_santri di ON ds.nik_santri = di.nik_santri
    LEFT JOIN kelas k ON ds.kelas_id = k.id
    LEFT JOIN info_ortu_wali iow ON ds.info_ortu_wali_id = iow.info_ortu_wali_id
    LEFT JOIN ayah_kandung a ON iow.nik_ayah = a.nik_ayah
    LEFT JOIN ibu_kandung i ON iow.nik_ibu = i.nik_ibu
    LEFT JOIN alamat_rumah ar ON iow.alamat_rumah_id = ar.alamat_rumah_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filter?.cari) {
    query += ` AND (di.nama_santri LIKE ? OR ds.nis LIKE ?)`;
    params.push(`%${filter.cari}%`, `%${filter.cari}%`);
  }

  if (filter?.kelasId != null) {
    query += ` AND ds.kelas_id = ?`;
    params.push(filter.kelasId);
  }

  if (filter?.status) {
    query += ` AND ds.status = ?`;
    params.push(filter.status);
  }

  query += ` ORDER BY di.nama_santri ASC`;

  return await getDb().select<Santri[]>(query, params);
}

export async function getSantriById(nis: string): Promise<SantriForm | null> {
  const query = `
    SELECT 
      ds.*, 
      di.*, 
      iow.*, 
      a.nama_ayah, a.tempat_lahir AS tempat_lahir_ayah, a.tanggal_lahir AS tanggal_lahir_ayah, a.status_hidup AS status_hidup_ayah, a.pendidikan_terakhir AS pendidikan_terakhir_ayah, a.pekerjaan_utama AS pekerjaan_utama_ayah, a.nomor_hp_ayah,
      i.nama_ibu, i.tempat_lahir AS tempat_lahir_ibu, i.tanggal_lahir AS tanggal_lahir_ibu, i.status_hidup AS status_hidup_ibu, i.pendidikan_terakhir AS pendidikan_terakhir_ibu, i.pekerjaan_utama AS pekerjaan_utama_ibu, i.nomor_hp_ibu,
      w.nama_wali, w.tempat_lahir AS tempat_lahir_wali, w.tanggal_lahir AS tanggal_lahir_wali, w.posisi_wali, w.pendidikan_terakhir AS pendidikan_terakhir_wali, w.pekerjaan_utama AS pekerjaan_utama_wali, w.nomor_hp_wali,
      ar.status_rumah, ar.provinsi, ar.kabupaten_kota, ar.kecamatan, ar.kelurahan_desa, ar.rt, ar.rw, ar.alamat AS alamat_lengkap, ar.kode_pos
    FROM daftar_santri ds
    JOIN data_input_santri di ON ds.nik_santri = di.nik_santri
    LEFT JOIN info_ortu_wali iow ON ds.info_ortu_wali_id = iow.info_ortu_wali_id
    LEFT JOIN ayah_kandung a ON iow.nik_ayah = a.nik_ayah
    LEFT JOIN ibu_kandung i ON iow.nik_ibu = i.nik_ibu
    LEFT JOIN wali_santri w ON iow.nik_wali = w.nik_wali
    LEFT JOIN alamat_rumah ar ON iow.alamat_rumah_id = ar.alamat_rumah_id
    WHERE ds.nis = ?
  `;
  const hasil = await getDb().select<any[]>(query, [nis]);
  if (hasil.length === 0) return null;
  const r = hasil[0];

  return {
    nik_santri: r.nik_santri || "",
    nama_santri: r.nama_santri || "",
    tempat_lahir: r.tempat_lahir || "",
    tanggal_lahir: r.tanggal_lahir || "",
    tingkat_sekolah: r.tingkat_sekolah || "",
    jenis_kelamin: r.jenis_kelamin || "",
    tanggal_masuk: r.tanggal_masuk || "",
    jumlah_saudara: r.jumlah_saudara?.toString() || "",
    anak_ke: r.anak_ke?.toString() || "",
    cita_cita: r.cita_cita || "",
    hobi: r.hobi || "",
    nomor_hp_santri: r.nomor_hp_santri || "",
    email_santri: r.email_santri || "",
    foto_santri: r.foto_santri || null,

    nis: r.nis || "",
    kelas_id: r.kelas_id?.toString() || "",
    kelas_pengajian: r.kelas_pengajian || "",
    kobong: r.kobong || "",
    status: r.status || "aktif",
    catatan: r.catatan || "",

    penghasilan_gabungan: r.penghasilan_gabungan || "",

    nik_ayah: r.nik_ayah || "",
    nama_ayah: r.nama_ayah || "",
    tempat_lahir_ayah: r.tempat_lahir_ayah || "",
    tanggal_lahir_ayah: r.tanggal_lahir_ayah || "",
    status_hidup_ayah: r.status_hidup_ayah || "",
    pendidikan_terakhir_ayah: r.pendidikan_terakhir_ayah || "",
    pekerjaan_utama_ayah: r.pekerjaan_utama_ayah || "",
    nomor_hp_ayah: r.nomor_hp_ayah || "",

    nik_ibu: r.nik_ibu || "",
    nama_ibu: r.nama_ibu || "",
    tempat_lahir_ibu: r.tempat_lahir_ibu || "",
    tanggal_lahir_ibu: r.tanggal_lahir_ibu || "",
    status_hidup_ibu: r.status_hidup_ibu || "",
    pendidikan_terakhir_ibu: r.pendidikan_terakhir_ibu || "",
    pekerjaan_utama_ibu: r.pekerjaan_utama_ibu || "",
    nomor_hp_ibu: r.nomor_hp_ibu || "",

    ada_wali: !!r.nik_wali,
    nik_wali: r.nik_wali || "",
    nama_wali: r.nama_wali || "",
    tempat_lahir_wali: r.tempat_lahir_wali || "",
    tanggal_lahir_wali: r.tanggal_lahir_wali || "",
    posisi_wali: r.posisi_wali || "",
    pendidikan_terakhir_wali: r.pendidikan_terakhir_wali || "",
    pekerjaan_utama_wali: r.pekerjaan_utama_wali || "",
    nomor_hp_wali: r.nomor_hp_wali || "",

    status_rumah: r.status_rumah || "",
    provinsi: r.provinsi || "",
    kabupaten_kota: r.kabupaten_kota || "",
    kecamatan: r.kecamatan || "",
    kelurahan_desa: r.kelurahan_desa || "",
    rt: r.rt || "",
    rw: r.rw || "",
    alamat_lengkap: r.alamat_lengkap || "",
    kode_pos: r.kode_pos || "",
  };
}

export async function tambahSantri(data: SantriForm): Promise<void> {
  const database = getDb();

  try {
    // 1. Alamat
    const resAlamat = await database.execute(
      `INSERT INTO alamat_rumah (status_rumah, provinsi, kabupaten_kota, kecamatan, kelurahan_desa, rt, rw, alamat, kode_pos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.status_rumah, data.provinsi, data.kabupaten_kota, data.kecamatan, data.kelurahan_desa, data.rt, data.rw, data.alamat_lengkap, data.kode_pos]
    );
    const alamatId = resAlamat.lastInsertId;

    // 2. Ayah
    await database.execute(
      `INSERT OR IGNORE INTO ayah_kandung (nik_ayah, nama_ayah, tempat_lahir, tanggal_lahir, status_hidup, pendidikan_terakhir, pekerjaan_utama, nomor_hp_ayah)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.nik_ayah, data.nama_ayah, data.tempat_lahir_ayah, data.tanggal_lahir_ayah, data.status_hidup_ayah, data.pendidikan_terakhir_ayah, data.pekerjaan_utama_ayah, data.nomor_hp_ayah]
    );

    // 3. Ibu
    await database.execute(
      `INSERT OR IGNORE INTO ibu_kandung (nik_ibu, nama_ibu, tempat_lahir, tanggal_lahir, status_hidup, pendidikan_terakhir, pekerjaan_utama, nomor_hp_ibu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.nik_ibu, data.nama_ibu, data.tempat_lahir_ibu, data.tanggal_lahir_ibu, data.status_hidup_ibu, data.pendidikan_terakhir_ibu, data.pekerjaan_utama_ibu, data.nomor_hp_ibu]
    );

    // 4. Wali
    let nikWali = null;
    if (data.ada_wali && data.nik_wali) {
      await database.execute(
        `INSERT OR IGNORE INTO wali_santri (nik_wali, nama_wali, tempat_lahir, tanggal_lahir, posisi_wali, pendidikan_terakhir, pekerjaan_utama, nomor_hp_wali)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.nik_wali, data.nama_wali, data.tempat_lahir_wali, data.tanggal_lahir_wali, data.posisi_wali, data.pendidikan_terakhir_wali, data.pekerjaan_utama_wali, data.nomor_hp_wali]
      );
      nikWali = data.nik_wali;
    }

    // 5. Info Ortu Wali
    const resInfo = await database.execute(
      `INSERT INTO info_ortu_wali (penghasilan_gabungan, nik_ayah, nik_ibu, alamat_rumah_id, nik_wali)
       VALUES (?, ?, ?, ?, ?)`,
      [data.penghasilan_gabungan, data.nik_ayah, data.nik_ibu, alamatId, nikWali]
    );
    const infoId = resInfo.lastInsertId;

    // 6. Data Input Santri
    await database.execute(
      `INSERT OR REPLACE INTO data_input_santri (nik_santri, nama_santri, tempat_lahir, tanggal_lahir, tingkat_sekolah, jenis_kelamin, tanggal_verifikasi, tanggal_masuk, jumlah_saudara, anak_ke, cita_cita, hobi, nomor_hp_santri, email_santri)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)`,
      [data.nik_santri, data.nama_santri, data.tempat_lahir, data.tanggal_lahir, data.tingkat_sekolah, data.jenis_kelamin, data.tanggal_masuk, data.jumlah_saudara ? parseInt(data.jumlah_saudara) : null, data.anak_ke ? parseInt(data.anak_ke) : null, data.cita_cita, data.hobi, data.nomor_hp_santri, data.email_santri]
    );

    // 7. Daftar Santri
    await database.execute(
      `INSERT INTO daftar_santri (nis, kelas_id, kelas_pengajian, kobong, nik_santri, info_ortu_wali_id, status, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.nis, data.kelas_id ? parseInt(data.kelas_id) : null, data.kelas_pengajian, data.kobong, data.nik_santri, infoId, data.status, data.catatan]
    );

  } catch (error) {
    console.error("Query Error: ", error);
    throw error;
  }
}

export async function editSantri(nisLama: string, data: SantriForm): Promise<void> {
  const database = getDb();

  try {
    // Dapatkan info_ortu_wali_id dan alamat_rumah_id yang lama
    const res = await database.select<any[]>(`
      SELECT ds.info_ortu_wali_id, iow.alamat_rumah_id 
      FROM daftar_santri ds 
      JOIN info_ortu_wali iow ON ds.info_ortu_wali_id = iow.info_ortu_wali_id 
      WHERE ds.nis = ?`, [nisLama]);

    if (res.length === 0) throw new Error("Santri tidak ditemukan");
    const { info_ortu_wali_id, alamat_rumah_id } = res[0];

    // 1. Update Alamat
    await database.execute(
      `UPDATE alamat_rumah SET status_rumah=?, provinsi=?, kabupaten_kota=?, kecamatan=?, kelurahan_desa=?, rt=?, rw=?, alamat=?, kode_pos=?, updated_at=datetime('now')
       WHERE alamat_rumah_id=?`,
      [data.status_rumah, data.provinsi, data.kabupaten_kota, data.kecamatan, data.kelurahan_desa, data.rt, data.rw, data.alamat_lengkap, data.kode_pos, alamat_rumah_id]
    );

    // 2. Update Ayah (INSERT OR REPLACE)
    await database.execute(
      `INSERT OR REPLACE INTO ayah_kandung (nik_ayah, nama_ayah, tempat_lahir, tanggal_lahir, status_hidup, pendidikan_terakhir, pekerjaan_utama, nomor_hp_ayah)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.nik_ayah, data.nama_ayah, data.tempat_lahir_ayah, data.tanggal_lahir_ayah, data.status_hidup_ayah, data.pendidikan_terakhir_ayah, data.pekerjaan_utama_ayah, data.nomor_hp_ayah]
    );

    // 3. Update Ibu (INSERT OR REPLACE)
    await database.execute(
      `INSERT OR REPLACE INTO ibu_kandung (nik_ibu, nama_ibu, tempat_lahir, tanggal_lahir, status_hidup, pendidikan_terakhir, pekerjaan_utama, nomor_hp_ibu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.nik_ibu, data.nama_ibu, data.tempat_lahir_ibu, data.tanggal_lahir_ibu, data.status_hidup_ibu, data.pendidikan_terakhir_ibu, data.pekerjaan_utama_ibu, data.nomor_hp_ibu]
    );

    // 4. Update Wali
    let nikWali = null;
    if (data.ada_wali && data.nik_wali) {
      await database.execute(
        `INSERT OR REPLACE INTO wali_santri (nik_wali, nama_wali, tempat_lahir, tanggal_lahir, posisi_wali, pendidikan_terakhir, pekerjaan_utama, nomor_hp_wali)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.nik_wali, data.nama_wali, data.tempat_lahir_wali, data.tanggal_lahir_wali, data.posisi_wali, data.pendidikan_terakhir_wali, data.pekerjaan_utama_wali, data.nomor_hp_wali]
      );
      nikWali = data.nik_wali;
    }

    // 5. Update Info Ortu Wali
    await database.execute(
      `UPDATE info_ortu_wali SET penghasilan_gabungan=?, nik_ayah=?, nik_ibu=?, nik_wali=?, updated_at=datetime('now')
       WHERE info_ortu_wali_id=?`,
      [data.penghasilan_gabungan, data.nik_ayah, data.nik_ibu, nikWali, info_ortu_wali_id]
    );

    // 6. Update Data Input Santri
    await database.execute(
      `UPDATE data_input_santri SET nama_santri=?, tempat_lahir=?, tanggal_lahir=?, tingkat_sekolah=?, jenis_kelamin=?, tanggal_masuk=?, jumlah_saudara=?, anak_ke=?, cita_cita=?, hobi=?, nomor_hp_santri=?, email_santri=?, updated_at=datetime('now')
       WHERE nik_santri=?`,
      [data.nama_santri, data.tempat_lahir, data.tanggal_lahir, data.tingkat_sekolah, data.jenis_kelamin, data.tanggal_masuk, data.jumlah_saudara ? parseInt(data.jumlah_saudara) : null, data.anak_ke ? parseInt(data.anak_ke) : null, data.cita_cita, data.hobi, data.nomor_hp_santri, data.email_santri, data.nik_santri]
    );

    // 7. Update Daftar Santri
    await database.execute(
      `UPDATE daftar_santri SET nis=?, kelas_id=?, kelas_pengajian=?, kobong=?, status=?, catatan=?, updated_at=datetime('now')
       WHERE nis=?`,
      [data.nis, data.kelas_id ? parseInt(data.kelas_id) : null, data.kelas_pengajian, data.kobong, data.status, data.catatan, nisLama]
    );

  } catch (error) {
    console.error("Query Error (Edit): ", error);
    throw error;
  }
}

export async function hapusSantri(nis: string): Promise<void> {
  // Hanya menghapus pendaftaran (daftar_santri) dan biodata (data_input_santri).
  // Info ortu dan ortu dibiarkan karena bisa jadi dipakai oleh saudara/kakak.
  const database = getDb();
  try {
    const res = await database.select<any[]>(`SELECT nik_santri FROM daftar_santri WHERE nis = ?`, [nis]);
    if (res.length > 0) {
      const nikSantri = res[0].nik_santri;
      await database.execute(`DELETE FROM daftar_santri WHERE nis = ?`, [nis]);
      await database.execute(`DELETE FROM data_input_santri WHERE nik_santri = ?`, [nikSantri]);
    }
  } catch (e) {
    console.error("Query Error (Hapus): ", e);
    throw e;
  }
}

// ============================================================
// FOTO — Helper
// ============================================================

export async function getFotoDirPath(): Promise<string> {
  return await join(await appDataDir(), "photos");
}

export async function updateFotoSantri(nik_santri: string, fotoPath: string | null): Promise<void> {
  await getDb().execute(
    `UPDATE data_input_santri SET foto_santri = ?, updated_at = datetime('now') WHERE nik_santri = ?`,
    [fotoPath, nik_santri]
  );
}

export async function fotoKeDataUrl(pathAbsolut: string): Promise<string | null> {
  try {
    const bytes = await readFile(pathAbsolut);
    const binary = Array.from(new Uint8Array(bytes)).map((b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binary);
    const ext = pathAbsolut.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

// ============================================================
// BACKUP & RESTORE
// ============================================================

async function getBackupDirPath(): Promise<string> {
  const dataDir = await appDataDir();
  const backupDir = await join(dataDir, "backups");
  await mkdir(backupDir, { recursive: true });
  return backupDir;
}

export async function buatBackup(): Promise<string> {
  if (db) {
    try {
      await db.execute("PRAGMA wal_checkpoint(TRUNCATE)");
    } catch (e) {
      console.warn("Gagal checkpoint WAL:", e);
    }
  }

  const dataDir = await appDataDir();
  const dbAktif = await join(dataDir, "pendataan_santri.db");
  const backupDir = await getBackupDirPath();

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;

  const namaFile = `backup_${timestamp}.db`;
  const pathTujuan = await join(backupDir, namaFile);

  await copyFile(dbAktif, pathTujuan);
  return namaFile;
}

export async function getDaftarBackup(): Promise<string[]> {
  const backupDir = await getBackupDirPath();
  try {
    const entries = await readDir(backupDir);
    const files = entries
      .filter((e) => e.isFile && e.name.endsWith(".db"))
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a));
    return files;
  } catch (error) {
    console.error("Gagal membaca daftar backup:", error);
    return [];
  }
}

export async function hapusBackup(namaFile: string): Promise<void> {
  const backupDir = await getBackupDirPath();
  const pathTarget = await join(backupDir, namaFile);
  await remove(pathTarget);
}

export async function restoreBackup(namaFile: string): Promise<void> {
  const dataDir = await appDataDir();
  const dbAktif = await join(dataDir, "pendataan_santri.db");
  const backupDir = await getBackupDirPath();
  const pathAsal = await join(backupDir, namaFile);

  if (db) {
    try {
      await db.close(db.path);
    } catch (e) {
      console.warn("Gagal close db:", e);
    }
    db = null;
  }

  const walPath = await join(dataDir, "pendataan_santri.db-wal");
  const shmPath = await join(dataDir, "pendataan_santri.db-shm");
  try { await remove(walPath); } catch (e) { }
  try { await remove(shmPath); } catch (e) { }

  await copyFile(pathAsal, dbAktif);
  await initDatabase();
}
