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
 * Dipanggil SEKALI saat app startup di main.tsx.
 * Aman dijalankan berulang kali (semua operasi pakai IF NOT EXISTS / OR IGNORE).
 */
export async function initDatabase(): Promise<void> {
  const dataDir = await appDataDir();

  // Buat folder photos/ jika belum ada (dipakai di Tahap 4)
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
// Inisialisasi tabel
// ============================================================

/** Buat semua tabel sesuai skema di docs/database-schema.md */
async function buatTabel(): Promise<void> {
  const database = getDb();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS kelas (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_kelas TEXT NOT NULL UNIQUE,
      tingkat    TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS santri (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nis             TEXT UNIQUE,
      nama_lengkap    TEXT NOT NULL,
      jenis_kelamin   TEXT CHECK(jenis_kelamin IN ('L', 'P')),
      tempat_lahir    TEXT,
      tanggal_lahir   TEXT,
      alamat          TEXT,
      nama_orang_tua  TEXT,
      no_hp_orang_tua TEXT,
      kelas_id        INTEGER,
      foto_path       TEXT,
      status          TEXT DEFAULT 'aktif'
                           CHECK(status IN ('aktif', 'lulus', 'keluar', 'nonaktif')),
      tanggal_masuk   TEXT,
      catatan         TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (kelas_id) REFERENCES kelas(id)
    )
  `);

  await database.execute(
    `CREATE INDEX IF NOT EXISTS idx_santri_nama   ON santri(nama_lengkap)`
  );
  await database.execute(
    `CREATE INDEX IF NOT EXISTS idx_santri_kelas  ON santri(kelas_id)`
  );
  await database.execute(
    `CREATE INDEX IF NOT EXISTS idx_santri_status ON santri(status)`
  );
}

/**
 * Isi data kelas awal jika belum ada.
 * INSERT OR IGNORE supaya aman dijalankan berulang kali — tidak duplikat.
 */
async function seedKelas(): Promise<void> {
  const database = getDb();

  const kelasList = [
    { nama: "Ibtida' 1A", tingkat: "Ibtida'" },
    { nama: "Ibtida' 1B", tingkat: "Ibtida'" },
    { nama: "Ibtida' 1C", tingkat: "Ibtida'" },
    { nama: "Ibtida' 2A", tingkat: "Ibtida'" },
    { nama: "Ibtida' 2B", tingkat: "Ibtida'" },
    { nama: "Ibtida' 2C", tingkat: "Ibtida'" },
    { nama: "Ibtida' 3A", tingkat: "Ibtida'" },
    { nama: "Ibtida' 3B", tingkat: "Ibtida'" },
    { nama: "Ibtida' 3C", tingkat: "Ibtida'" },
    { nama: "Wustho' 1",  tingkat: "Wustho'" },
    { nama: "Wustho' 2",  tingkat: "Wustho'" },
    { nama: "Ulya",       tingkat: "Ulya" },
    { nama: "Takhosus",   tingkat: "Takhosus" },
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

/** Ambil semua kelas, urut berdasarkan id (urutan data dimasukkan) */
export async function getAllKelas(): Promise<Kelas[]> {
  return await getDb().select<Kelas[]>(`SELECT * FROM kelas ORDER BY id ASC`);
}

/**
 * Ambil rekap statistik santri untuk halaman Laporan.
 * Menggunakan SQL agregasi — lebih efisien daripada hitung di frontend.
 */
export async function getRekapSantri(): Promise<RekapSantri> {
  const database = getDb();

  // Total keseluruhan
  const [totalRow] = await database.select<[{ total: number; laki: number; perempuan: number }]>(`
    SELECT
      COUNT(*)                                                    AS total,
      SUM(CASE WHEN jenis_kelamin = 'L' THEN 1 ELSE 0 END)       AS laki,
      SUM(CASE WHEN jenis_kelamin = 'P' THEN 1 ELSE 0 END)       AS perempuan
    FROM santri
  `);

  // Per status
  const perStatus = await database.select<RekapStatus[]>(`
    SELECT
      status,
      COUNT(*)                                                    AS total,
      SUM(CASE WHEN jenis_kelamin = 'L' THEN 1 ELSE 0 END)       AS laki,
      SUM(CASE WHEN jenis_kelamin = 'P' THEN 1 ELSE 0 END)       AS perempuan
    FROM santri
    GROUP BY status
    ORDER BY CASE status
      WHEN 'aktif'    THEN 1
      WHEN 'lulus'    THEN 2
      WHEN 'keluar'   THEN 3
      WHEN 'nonaktif' THEN 4
      ELSE 5
    END
  `);

  // Per kelas (termasuk kelas yang santrinya 0 via LEFT JOIN)
  const perKelas = await database.select<RekapKelas[]>(`
    SELECT
      k.id                                                        AS kelas_id,
      k.nama_kelas,
      k.tingkat,
      COUNT(s.id)                                                 AS total,
      SUM(CASE WHEN s.jenis_kelamin = 'L' THEN 1 ELSE 0 END)     AS laki,
      SUM(CASE WHEN s.jenis_kelamin = 'P' THEN 1 ELSE 0 END)     AS perempuan
    FROM kelas k
    LEFT JOIN santri s ON s.kelas_id = k.id
    GROUP BY k.id
    ORDER BY k.id
  `);

  return {
    totalSemua:     totalRow?.total     ?? 0,
    totalLaki:      totalRow?.laki      ?? 0,
    totalPerempuan: totalRow?.perempuan ?? 0,
    perStatus,
    perKelas,
  };
}

// ============================================================
// SANTRI — Query
// ============================================================

/**
 * Ambil semua santri dengan filter opsional.
 * Sudah JOIN dengan tabel kelas sehingga nama_kelas tersedia di setiap baris.
 */
export async function getAllSantri(filter?: {
  cari?: string;
  kelasId?: number | null;
  status?: string | null;
}): Promise<Santri[]> {
  let query = `
    SELECT s.*, k.nama_kelas
    FROM santri s
    LEFT JOIN kelas k ON s.kelas_id = k.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filter?.cari) {
    query += ` AND (s.nama_lengkap LIKE ? OR s.nis LIKE ?)`;
    params.push(`%${filter.cari}%`, `%${filter.cari}%`);
  }

  if (filter?.kelasId != null) {
    query += ` AND s.kelas_id = ?`;
    params.push(filter.kelasId);
  }

  if (filter?.status) {
    query += ` AND s.status = ?`;
    params.push(filter.status);
  }

  query += ` ORDER BY s.nama_lengkap ASC`;

  return await getDb().select<Santri[]>(query, params);
}

/** Ambil satu santri berdasarkan id. Return null kalau tidak ketemu. */
export async function getSantriById(id: number): Promise<Santri | null> {
  const hasil = await getDb().select<Santri[]>(
    `SELECT s.*, k.nama_kelas
     FROM santri s
     LEFT JOIN kelas k ON s.kelas_id = k.id
     WHERE s.id = ?`,
    [id]
  );
  return hasil[0] ?? null;
}

/** Tambah santri baru ke database. */
export async function tambahSantri(data: SantriForm): Promise<void> {
  await getDb().execute(
    `INSERT INTO santri
      (nis, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
       alamat, nama_orang_tua, no_hp_orang_tua, kelas_id,
       status, tanggal_masuk, catatan)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nis          || null,
      data.nama_lengkap,
      data.jenis_kelamin || null,
      data.tempat_lahir  || null,
      data.tanggal_lahir || null,
      data.alamat        || null,
      data.nama_orang_tua    || null,
      data.no_hp_orang_tua   || null,
      data.kelas_id ? parseInt(data.kelas_id) : null,
      data.status,
      data.tanggal_masuk || null,
      data.catatan       || null,
    ]
  );
}

/** Update data santri yang sudah ada. */
export async function editSantri(id: number, data: SantriForm): Promise<void> {
  await getDb().execute(
    `UPDATE santri SET
      nis             = ?,
      nama_lengkap    = ?,
      jenis_kelamin   = ?,
      tempat_lahir    = ?,
      tanggal_lahir   = ?,
      alamat          = ?,
      nama_orang_tua  = ?,
      no_hp_orang_tua = ?,
      kelas_id        = ?,
      status          = ?,
      tanggal_masuk   = ?,
      catatan         = ?,
      updated_at      = datetime('now')
     WHERE id = ?`,
    [
      data.nis          || null,
      data.nama_lengkap,
      data.jenis_kelamin || null,
      data.tempat_lahir  || null,
      data.tanggal_lahir || null,
      data.alamat        || null,
      data.nama_orang_tua    || null,
      data.no_hp_orang_tua   || null,
      data.kelas_id ? parseInt(data.kelas_id) : null,
      data.status,
      data.tanggal_masuk || null,
      data.catatan       || null,
      id,
    ]
  );
}

/** Hapus santri berdasarkan id. */
export async function hapusSantri(id: number): Promise<void> {
  await getDb().execute(`DELETE FROM santri WHERE id = ?`, [id]);
}

// ============================================================
// FOTO — Helper
// ============================================================

/**
 * Kembalikan path absolut folder photos/.
 * Dipakai oleh FormSantri saat menyalin file foto yang dipilih user.
 */
export async function getFotoDirPath(): Promise<string> {
  return await join(await appDataDir(), "photos");
}

/**
 * Update kolom foto_path di tabel santri.
 * Dipanggil setelah file foto berhasil disalin ke folder photos/.
 *
 * @param id       - id santri yang fotonya diubah
 * @param fotoPath - path relatif foto, contoh: "photos/12.jpg"
 *                   atau null untuk hapus foto
 */
export async function updateFotoSantri(
  id: number,
  fotoPath: string | null
): Promise<void> {
  await getDb().execute(
    `UPDATE santri SET foto_path = ?, updated_at = datetime('now') WHERE id = ?`,
    [fotoPath, id]
  );
}

/**
 * Baca file foto dari disk dan kembalikan sebagai data URL (base64).
 *
 * Pendekatan ini lebih reliable dari asset:// protocol di Windows
 * karena tidak bergantung pada WebView security policy / path format.
 *
 * @param pathAbsolut - path absolut ke file foto (misal: C:\Users\...\photos\1.jpg)
 * @returns data URL siap pakai di <img src="...">, atau null jika file tidak ada
 */
export async function fotoKeDataUrl(pathAbsolut: string): Promise<string | null> {
  try {
    const bytes = await readFile(pathAbsolut);
    // Konversi Uint8Array ke string binary lalu ke base64
    const binary = Array.from(new Uint8Array(bytes))
      .map((b) => String.fromCharCode(b))
      .join("");
    const base64 = btoa(binary);
    // Deteksi MIME type dari ekstensi file
    const ext = pathAbsolut.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime =
      ext === "png"  ? "image/png"  :
      ext === "webp" ? "image/webp" :
      "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch {
    // File tidak ada atau tidak bisa dibaca — kembalikan null
    return null;
  }
}

// ============================================================
// BACKUP & RESTORE
// ============================================================

/** Mengambil path absolut dari folder backups/ */
async function getBackupDirPath(): Promise<string> {
  const dataDir = await appDataDir();
  const backupDir = await join(dataDir, "backups");
  await mkdir(backupDir, { recursive: true });
  return backupDir;
}

/** 
 * Buat backup database aktif ke folder backups/ 
 * Format nama: backup_YYYY-MM-DD_HH-mm.db
 */
export async function buatBackup(): Promise<string> {
  // Pastikan data terbaru di memori/WAL ditulis ke file .db utama sebelum di-copy
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
  
  // Format timestamp: YYYY-MM-DD_HH-mm
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  
  const namaFile = `backup_${timestamp}.db`;
  const pathTujuan = await join(backupDir, namaFile);

  await copyFile(dbAktif, pathTujuan);
  return namaFile;
}

/** Ambil daftar nama file backup yang tersedia di folder backups/ (urutkan terbaru) */
export async function getDaftarBackup(): Promise<string[]> {
  const backupDir = await getBackupDirPath();
  try {
    const entries = await readDir(backupDir);
    // Filter hanya file .db dan urutkan descending (terbaru di atas)
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

/** Hapus file backup tertentu */
export async function hapusBackup(namaFile: string): Promise<void> {
  const backupDir = await getBackupDirPath();
  const pathTarget = await join(backupDir, namaFile);
  await remove(pathTarget);
}

/** 
 * Restore database dari file backup.
 * Ini akan menimpa file pendataan_santri.db yang aktif, lalu reconnect.
 */
export async function restoreBackup(namaFile: string): Promise<void> {
  const dataDir = await appDataDir();
  const dbAktif = await join(dataDir, "pendataan_santri.db");
  const backupDir = await getBackupDirPath();
  const pathAsal = await join(backupDir, namaFile);

  // 1. Tutup koneksi DB saat ini (wajib, kalau tidak file-nya terkunci oleh SQLite)
  if (db) {
    try {
      await db.close(db.path);
    } catch (e) {
      console.warn("Gagal close db:", e);
    }
    db = null;
  }

  // 1.5. Hapus file temporary WAL & SHM dari SQLite agar tidak korup
  const walPath = await join(dataDir, "pendataan_santri.db-wal");
  const shmPath = await join(dataDir, "pendataan_santri.db-shm");
  try { await remove(walPath); } catch (e) {}
  try { await remove(shmPath); } catch (e) {}

  // 2. Timpa file .db aktif dengan file backup
  await copyFile(pathAsal, dbAktif);

  // 3. Init ulang database untuk memuat data baru
  await initDatabase();
}
