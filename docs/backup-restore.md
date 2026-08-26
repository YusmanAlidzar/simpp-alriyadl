# Backup & Restore — Panduan

## Prinsip

Backup di aplikasi ini sesederhana mungkin: **copy file `.db`**. Tidak ada dump SQL, tidak ada export per tabel.

File database: `{appDataDir}/pendataan_santri.db`
Folder backup: `{appDataDir}/backups/`

## Alur Backup (Manual)

1. User klik tombol **"Backup Sekarang"** di halaman Backup.
2. Aplikasi generate nama file: `backup_YYYY-MM-DD_HH-mm.db`
3. Copy file `.db` ke folder `backups/`
4. Tampilkan konfirmasi sukses + nama file backup.

## Alur Restore

1. User klik **"Restore dari Backup"** di halaman Backup.
2. Tampilkan daftar file backup yang tersedia (dari folder `backups/`), urutkan terbaru di atas.
3. User pilih file backup.
4. **Konfirmasi peringatan**: "Data saat ini akan diganti. Lanjutkan?"
5. Copy file backup menggantikan file `.db` aktif.
6. Restart koneksi database (atau restart app).

## Implementasi Teknis (Tauri)

Gunakan plugin resmi:
- `@tauri-apps/plugin-fs` — untuk copy file
- `@tauri-apps/api/path` — untuk resolve `appDataDir()`
- `@tauri-apps/plugin-dialog` — untuk dialog konfirmasi (opsional)

```typescript
// Contoh pseudocode backup
import { appDataDir, join } from '@tauri-apps/api/path';
import { copyFile, mkdir } from '@tauri-apps/plugin-fs';

async function buatBackup() {
  const dataDir = await appDataDir();
  const backupDir = await join(dataDir, 'backups');
  await mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const namaFile = `backup_${timestamp}.db`;

  await copyFile(
    await join(dataDir, 'pendataan_santri.db'),
    await join(backupDir, namaFile)
  );
}
```

## Catatan

- Jangan implement backup otomatis/scheduled untuk tahap awal — tambahkan hanya jika user minta.
- Jumlah file backup tidak dibatasi di tahap awal. Kalau suatu saat jadi banyak, bisa tambahkan fitur hapus backup lama.
- Backup folder bisa juga digunakan user untuk copy manual ke flashdisk/cloud storage secara mandiri.
