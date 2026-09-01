// DaftarSantri.tsx — Halaman daftar santri dengan search, filter, edit, hapus
import { useState, useEffect } from "react";
import { join } from "@tauri-apps/api/path";
import type { Santri } from "../types/santri";
import type { Kelas } from "../types/kelas";
import { getAllSantri, getAllKelas, hapusSantri, getFotoDirPath, fotoKeDataUrl } from "../lib/db";
import Modal from "../components/Modal";
import { LuSearch } from "react-icons/lu";

interface DaftarSantriProps {
  onTambah: () => void;
  onEdit: (id: number) => void;
}

// Warna badge untuk setiap status santri
const STATUS_STYLE: Record<string, string> = {
  aktif: "bg-green-100 text-green-700",
  lulus: "bg-blue-100 text-blue-700",
  keluar: "bg-red-100 text-red-700",
  nonaktif: "bg-gray-100 text-gray-500",
};

export default function DaftarSantri({ onTambah, onEdit }: DaftarSantriProps) {
  const [listSantri, setListSantri] = useState<Santri[]>([]);
  const [listKelas, setListKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // State untuk modal konfirmasi hapus
  const [modalHapus, setModalHapus] = useState<{
    terbuka: boolean;
    santriId: number | null;
    namaSantri: string;
  }>({ terbuka: false, santriId: null, namaSantri: "" });

  // Load daftar kelas sekali saat komponen pertama kali muncul
  useEffect(() => {
    getAllKelas().then(setListKelas).catch(console.error);
  }, []);

  // Reload daftar santri setiap kali filter berubah
  useEffect(() => {
    muatSantri();
  }, [cari, filterKelas, filterStatus]);

  async function muatSantri() {
    setLoading(true);
    try {
      const hasil = await getAllSantri({
        cari: cari || undefined,
        kelasId: filterKelas ? parseInt(filterKelas) : null,
        status: filterStatus || null,
      });
      setListSantri(hasil);
    } catch (err) {
      console.error("Gagal memuat santri:", err);
    } finally {
      setLoading(false);
    }
  }

  // Dipanggil setelah user konfirmasi hapus
  async function eksekusiHapus() {
    if (!modalHapus.santriId) return;
    try {
      await hapusSantri(modalHapus.santriId);
      setModalHapus({ terbuka: false, santriId: null, namaSantri: "" });
      muatSantri(); // reload tabel setelah hapus
    } catch (err) {
      console.error("Gagal menghapus santri:", err);
    }
  }

  const adaFilter = !!(cari || filterKelas || filterStatus);

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daftar Santri</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Memuat..." : `${listSantri.length} santri ditemukan`}
          </p>
        </div>
        <button
          onClick={onTambah}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          + Tambah Santri
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LuSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Semua Kelas</option>
          {listKelas.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="lulus">Lulus</option>
          <option value="keluar">Keluar</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        {/* Tombol reset filter — muncul hanya kalau ada filter aktif */}
        {adaFilter && (
          <button
            onClick={() => { setCari(""); setFilterKelas(""); setFilterStatus(""); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* ── Tabel data ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Memuat data...</div>
        ) : listSantri.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            {adaFilter
              ? "Tidak ada santri yang cocok dengan filter."
              : 'Belum ada data santri. Klik "+ Tambah Santri" untuk mulai.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="text-left px-4 py-3 font-semibold w-12">No</th>
                <th className="px-3 py-3 w-12"></th>
                <th className="text-left px-4 py-3 font-semibold">NIS</th>
                <th className="text-left px-4 py-3 font-semibold">Nama Lengkap</th>
                <th className="text-left px-4 py-3 font-semibold">Kelas</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listSantri.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <FotoAvatar santri={s} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {s.nis ?? <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.nama_lengkap}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.nama_kelas ?? <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[s.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(s.id)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setModalHapus({
                            terbuka: true,
                            santriId: s.id,
                            namaSantri: s.nama_lengkap,
                          })
                        }
                        className="px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal konfirmasi hapus ── */}
      {modalHapus.terbuka && (
        <Modal
          judul="Hapus Data Santri"
          pesan={`Yakin ingin menghapus data "${modalHapus.namaSantri}"? Tindakan ini tidak bisa dibatalkan.`}
          onKonfirmasi={eksekusiHapus}
          onBatal={() =>
            setModalHapus({ terbuka: false, santriId: null, namaSantri: "" })
          }
        />
      )}
    </div>
  );
}

// ── Komponen avatar foto di tabel ──
// Menampilkan foto kecil jika ada, atau lingkaran dengan inisial nama jika tidak ada.
function FotoAvatar({ santri }: { santri: Santri }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!santri.foto_path) return;
    const namaFile = santri.foto_path.split("/").pop() ?? santri.foto_path;
    getFotoDirPath()
      .then((dir) => join(dir, namaFile))
      .then((pathAbsolut) => fotoKeDataUrl(pathAbsolut))
      .then((dataUrl) => setSrc(dataUrl))
      .catch(() => setSrc(null));
  }, [santri.foto_path]);

  // Ambil inisial dari nama lengkap (maks 2 huruf)
  const inisial = santri.nama_lengkap
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-gray-400">{inisial}</span>
      )}
    </div>
  );
}
