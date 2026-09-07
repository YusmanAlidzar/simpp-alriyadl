// DaftarSantri.tsx — Halaman daftar santri dengan search, filter, edit, hapus
import { useState, useEffect } from "react";
import { join } from "@tauri-apps/api/path";
import type { Santri } from "../types/santri";
import type { Kelas } from "../types/kelas";
import { getAllSantri, getAllKelas, hapusSantri, getFotoDirPath, fotoKeDataUrl, getUnikKobong } from "../lib/db";
import Modal from "../components/Modal";
import { LuSearch } from "react-icons/lu";

interface DaftarSantriProps {
  onTambah: () => void;
  onEdit: (nis: string) => void;
}

// Warna badge untuk setiap status santri
const STATUS_STYLE: Record<string, string> = {
  aktif: "bg-pesantren-100 text-pesantren-800",
  lulus: "bg-blue-100 text-blue-700",
  keluar: "bg-red-100 text-red-700",
  nonaktif: "bg-slate-100 text-slate-500",
};

export default function DaftarSantri({ onTambah, onEdit }: DaftarSantriProps) {
  const [listSantri, setListSantri] = useState<Santri[]>([]);
  const [listKelas, setListKelas] = useState<Kelas[]>([]);
  const [listKobong, setListKobong] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterKobong, setFilterKobong] = useState("");
  const [filterJK, setFilterJK] = useState("");

  // State untuk modal konfirmasi hapus
  const [modalHapus, setModalHapus] = useState<{
    terbuka: boolean;
    nis: string | null;
    namaSantri: string;
  }>({ terbuka: false, nis: null, namaSantri: "" });

  // Load daftar kelas dan kobong sekali saat komponen pertama kali muncul
  useEffect(() => {
    getAllKelas().then(setListKelas).catch(console.error);
    getUnikKobong().then(setListKobong).catch(console.error);
  }, []);

  // Reload daftar santri setiap kali filter berubah
  useEffect(() => {
    muatSantri();
  }, [cari, filterKelas, filterStatus, filterKobong, filterJK]);

  async function muatSantri() {
    setLoading(true);
    try {
      const hasil = await getAllSantri({
        cari: cari || undefined,
        kelasId: filterKelas ? parseInt(filterKelas) : null,
        status: filterStatus || null,
        kobong: filterKobong || null,
        jenisKelamin: filterJK || null,
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
    if (!modalHapus.nis) return;
    try {
      await hapusSantri(modalHapus.nis);
      setModalHapus({ terbuka: false, nis: null, namaSantri: "" });
      muatSantri(); // reload tabel setelah hapus
    } catch (err) {
      console.error("Gagal menghapus santri:", err);
    }
  }

  const adaFilter = !!(cari || filterKelas || filterStatus || filterKobong || filterJK);

  return (
    <div className="p-6 dark:bg-slate-950 min-h-full transition-colors">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-pesantren-900 dark:text-pesantren-200">Daftar Santri</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? "Memuat..." : `${listSantri.length} santri ditemukan`}
          </p>
        </div>
        <button
          onClick={onTambah}
          className="px-4 py-2 bg-pesantren-700 hover:bg-pesantren-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          + Tambah Santri
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LuSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
        >
          <option value="">Semua Kelas</option>
          {listKelas.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
          ))}
        </select>
        <select
          value={filterKobong}
          onChange={(e) => setFilterKobong(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
        >
          <option value="">Semua Kobong</option>
          {listKobong.map((kb) => (
            <option key={kb} value={kb}>{kb}</option>
          ))}
        </select>
        <select
          value={filterJK}
          onChange={(e) => setFilterJK(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
        >
          <option value="">L/P</option>
          <option value="L">Putra (L)</option>
          <option value="P">Putri (P)</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
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
            onClick={() => { setCari(""); setFilterKelas(""); setFilterStatus(""); setFilterKobong(""); setFilterJK(""); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* ── Tabel data ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : listSantri.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            {adaFilter
              ? "Tidak ada santri yang cocok dengan filter."
              : 'Belum ada data santri. Klik "+ Tambah Santri" untuk mulai.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-pesantren-950/5 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                <th className="text-left px-4 py-3 font-semibold w-12">No</th>
                <th className="px-3 py-3 w-12"></th>
                <th className="text-left px-4 py-3 font-semibold">NIS</th>
                <th className="text-left px-4 py-3 font-semibold">Nama Lengkap</th>
                <th className="text-center px-4 py-3 font-semibold">L/P</th>
                <th className="text-left px-4 py-3 font-semibold">Kelas</th>
                <th className="text-left px-4 py-3 font-semibold">Kobong</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listSantri.map((s, i) => (
                <tr
                  key={s.nis}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-pesantren-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <FotoAvatar santri={s} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {s.nis ?? <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{s.nama_santri}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center">{s.jenis_kelamin ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {s.nama_kelas ?? <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {s.kobong ?? <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[s.status] ?? "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(s.nis)}
                        className="px-3 py-1 text-xs font-medium text-pesantren-700 hover:bg-pesantren-50 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setModalHapus({
                            terbuka: true,
                            nis: s.nis,
                            namaSantri: s.nama_santri,
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
            setModalHapus({ terbuka: false, nis: null, namaSantri: "" })
          }
        />
      )}
    </div>
  );
}

// ── Komponen avatar foto di tabel ──
function FotoAvatar({ santri }: { santri: Santri }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!santri.foto_santri) return;
    const namaFile = santri.foto_santri.split("/").pop() ?? santri.foto_santri;
    getFotoDirPath()
      .then((dir) => join(dir, namaFile))
      .then((pathAbsolut) => fotoKeDataUrl(pathAbsolut))
      .then((dataUrl) => setSrc(dataUrl))
      .catch(() => setSrc(null));
  }, [santri.foto_santri]);

  const inisial = (santri.nama_santri || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100 flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-slate-400">{inisial}</span>
      )}
    </div>
  );
}
