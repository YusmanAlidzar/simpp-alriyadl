# Alur Backup & Restore

## Prinsip

Karena database adalah **1 file `.db`** (SQLite) plus folder foto, backup cukup berarti **menyalin file/folder tersebut** ke lokasi lain. Tidak perlu tools export/import rumit.

## Yang perlu dibackup

```
app_data/pendataan_santri.db   ← wajib
app_data/photos/               ← wajib (kalau ada fitur foto)
```

## Alur "Backup" di dalam aplikasi

1. User klik tombol **Backup** di halaman Pengaturan/Backup.
2. Aplikasi membuka dialog pilih folder tujuan (pakai `@tauri-apps/plugin-dialog`).
3. Aplikasi menyalin:
   - `pendataan_santri.db` → `backup_santri_2026-08-24_1430.db` (nama file diberi timestamp supaya tidak tertimpa backup sebelumnya)
   - Folder `photos/` → dikompres jadi `.zip` (opsional, atau disalin apa adanya jika foto sedikit)
4. Tampilkan notifikasi sukses + lokasi file backup.

**Rekomendasi tambahan:** sebelum menyalin, pastikan tidak ada transaksi database yang sedang berjalan (SQLite pada dasarnya aman disalin selama tidak ada write yang sedang berlangsung persis di detik yang sama — risiko ini sangat kecil untuk single-user app, tapi baiknya backup dilakukan saat idle, bukan di tengah proses simpan data).

## Alur "Restore" di dalam aplikasi

1. User klik tombol **Restore**.
2. Aplikasi **wajib menampilkan konfirmasi tegas**: "Restore akan MENGGANTI seluruh data saat ini dengan data dari file backup. Lanjutkan?" — karena ini operasi destruktif.
3. User pilih file `.db` backup yang ingin dipulihkan.
4. Aplikasi:
   - Menutup koneksi database aktif
   - Menyalin file backup terpilih → menimpa `pendataan_santri.db`
   - (Jika ada backup foto) mengekstrak/menyalin kembali folder `photos/`
   - Membuka ulang koneksi database / restart aplikasi
5. Tampilkan notifikasi sukses.

## Rekomendasi kebiasaan backup (di luar aplikasi)

Sampaikan ke pengguna aplikasi (mungkin dirimu sendiri sebagai operator):
- Backup rutin **minimal mingguan**, idealnya tiap ada input data dalam jumlah besar (misal setelah pendaftaran santri baru).
- Simpan hasil backup **tidak hanya di komputer yang sama** — idealnya juga disalin ke flashdisk atau media lain, supaya kalau PC rusak/hilang, data tidak ikut hilang.

## Yang TIDAK perlu dibangun di tahap awal

- ❌ Backup otomatis terjadwal (cron-like) — user secara eksplisit memilih backup manual via tombol untuk versi awal. Bisa ditambahkan belakangan sebagai fitur opsional jika dirasa perlu.
- ❌ Backup incremental/differential — untuk skala data ini, full copy file `.db` (biasanya hanya beberapa MB–puluhan MB) sudah sangat cepat dan cukup.
- ❌ Enkripsi backup — tidak diminta di requirement awal; bisa dipertimbangkan nanti jika data dianggap sensitif dan perlu proteksi tambahan.
