// BackupRestore.tsx — Halaman manajemen backup database
import { useState, useEffect } from "react";
import { confirm, message } from "@tauri-apps/plugin-dialog";
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
      const namaFile = await buatBackup();
      await message(`Backup berhasil dibuat: ${namaFile}`, { title: "Berhasil", kind: "info" });
      loadDaftar();
    } catch (err) {
      console.error(err);
      await message("Gagal membuat backup. Coba lagi.", { title: "Error", kind: "error" });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleHapus(namaFile: string) {
    const y = await confirm(`Apakah Anda yakin ingin menghapus backup "${namaFile}"?`, {
      title: "Konfirmasi Hapus",
      kind: "warning",
    });
    if (!y) return;

    setLoadingAction(true);
    try {
      await hapusBackup(namaFile);
      loadDaftar();
    } catch (err) {
      console.error(err);
      await message("Gagal menghapus backup.", { title: "Error", kind: "error" });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleRestore(namaFile: string) {
    const y = await confirm(
      `PERINGATAN: Data saat ini akan DITIMPA dengan data dari file backup "${namaFile}".\n\nLanjutkan?`,
      {
        title: "Konfirmasi Restore",
        kind: "warning",
      }
    );
    if (!y) return;

    setLoadingAction(true);
    try {
      await restoreBackup(namaFile);
      await message("Restore berhasil. Database telah diperbarui.", { title: "Berhasil", kind: "info" });
      onSelesaiRestore(); // Kembali ke daftar santri atau reload state
    } catch (err) {
      console.error(err);
      await message("Gagal melakukan restore. Pastikan file tidak sedang digunakan.", { title: "Error", kind: "error" });
      setLoadingAction(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Backup & Restore</h2>
        <p className="text-sm text-gray-500 mt-1">
          Buat cadangan data aplikasi Anda, atau pulihkan data dari cadangan sebelumnya.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Buat Backup Baru</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-lg">
            Semua data santri dan kelas saat ini akan disimpan dalam satu file aman. Lakukan backup secara berkala untuk menghindari kehilangan data.
          </p>
        </div>
        <button
          onClick={handleBuatBackup}
          disabled={loadingAction}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-lg shadow-sm transition-colors"
        >
          {loadingAction ? "Memproses..." : "💾 Backup Sekarang"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Daftar File Backup</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat daftar...</div>
        ) : listBackup.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Belum ada file backup yang dibuat.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {listBackup.map((file) => (
              <li key={file} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    🗄️
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 font-mono text-sm">{file}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Disimpan di AppData/backups/</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(file)}
                    disabled={loadingAction}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-md transition-colors"
                  >
                    ♻️ Restore
                  </button>
                  <button
                    onClick={() => handleHapus(file)}
                    disabled={loadingAction}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:text-gray-400 rounded-md transition-colors"
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
