// BackupRestore.tsx — Halaman manajemen backup database
import { useState, useEffect } from "react";
import { confirm, message } from "@tauri-apps/plugin-dialog";
import { FaSave, FaSync, FaArchive } from "react-icons/fa";
import { buatBackup, getDaftarBackup, hapusBackup, restoreBackup } from "../lib/db";

interface BackupRestoreProps {
  onSelesaiRestore: () => void;
}

export default function BackupRestore({ onSelesaiRestore }: BackupRestoreProps) {
  const [listBackup, setListBackup] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Load daftar backup saat komponen mount
  useEffect(() => {
    loadDaftar();
  }, []);

  async function loadDaftar() {
    setLoading(true);
    try {
      const files = await getDaftarBackup();
      setListBackup(files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuatBackup() {
    setLoadingAction(true);
    try {
      const namaFolder = await buatBackup();
      await message(`Backup berhasil dibuat: ${namaFolder}`, { title: "Berhasil", kind: "info" });
      loadDaftar();
    } catch (err) {
      console.error(err);
      await message("Gagal membuat backup. Coba lagi.", { title: "Error", kind: "error" });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleHapus(namaFolder: string) {
    const y = await confirm(`Apakah Anda yakin ingin menghapus backup "${namaFolder}"?`, {
      title: "Konfirmasi Hapus",
      kind: "warning",
    });
    if (!y) return;

    setLoadingAction(true);
    try {
      await hapusBackup(namaFolder);
      loadDaftar();
    } catch (err) {
      console.error(err);
      await message("Gagal menghapus backup.", { title: "Error", kind: "error" });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleRestore(namaFolder: string) {
    const y = await confirm(
      `PERINGATAN: Data saat ini akan DITIMPA dengan data dari folder backup "${namaFolder}".\n\nLanjutkan?`,
      {
        title: "Konfirmasi Restore",
        kind: "warning",
      }
    );
    if (!y) return;

    setLoadingAction(true);
    try {
      await restoreBackup(namaFolder);
      await message("Restore berhasil. Database dan foto telah diperbarui.", { title: "Berhasil", kind: "info" });
      onSelesaiRestore(); // Kembali ke daftar santri atau reload state
    } catch (err) {
      console.error(err);
      await message("Gagal melakukan restore. Pastikan file tidak sedang digunakan.", { title: "Error", kind: "error" });
      setLoadingAction(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto dark:bg-slate-950 min-h-full transition-colors">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-pesantren-900 dark:text-pesantren-200">Backup & Restore</h2>
        <p className="text-sm text-slate-500 mt-1">
          Buat cadangan data aplikasi Anda, atau pulihkan data dari cadangan sebelumnya.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-pesantren-900 dark:text-pesantren-300">Buat Backup Baru</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-lg">
            Semua data santri, foto profil, dan kelas saat ini akan disimpan dalam satu folder aman. Lakukan backup secara berkala untuk menghindari kehilangan data.
          </p>
        </div>
        <button
          onClick={handleBuatBackup}
          disabled={loadingAction}
          className="flex items-center gap-2 px-6 py-2.5 bg-pesantren-700 hover:bg-pesantren-800 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm transition-colors"
        >
          <FaSave />
          <span>{loadingAction ? "Memproses..." : "Backup Sekarang"}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-pesantren-50 dark:bg-slate-700">
          <h3 className="text-lg font-bold text-pesantren-900 dark:text-pesantren-100">Daftar Folder Backup</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat daftar...</div>
        ) : listBackup.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Belum ada folder backup yang dibuat.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {listBackup.map((folder) => (
              <li key={folder} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pesantren-100 flex items-center justify-center">
                    <FaArchive size={18} className="text-pesantren-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 font-mono text-sm">{folder}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Disimpan di .../AppData/backups/</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(folder)}
                    disabled={loadingAction}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-pesantren-700 hover:bg-pesantren-800 disabled:bg-slate-300 rounded-md transition-colors"
                  >
                    <FaSync size={10} className="inline mr-1" /> Restore
                  </button>
                  <button
                    onClick={() => handleHapus(folder)}
                    disabled={loadingAction}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:text-slate-400 rounded-md transition-colors"
                    title="Hapus backup ini"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
