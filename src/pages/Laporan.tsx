// Laporan.tsx — Halaman rekap statistik santri & cetak daftar
import { useState, useEffect } from "react";
import type { RekapSantri } from "../types/rekap";
import type { Santri } from "../types/santri";
import type { Kelas } from "../types/kelas";
import { getRekapSantri, getAllSantri, getAllKelas } from "../lib/db";

type TabAktif = "rekap" | "daftar";

// Warna kartu per status
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  aktif:    { bg: "bg-green-50",  text: "text-green-700",  label: "Aktif"    },
  lulus:    { bg: "bg-blue-50",   text: "text-blue-700",   label: "Lulus"    },
  keluar:   { bg: "bg-red-50",    text: "text-red-700",    label: "Keluar"   },
  nonaktif: { bg: "bg-gray-50",   text: "text-gray-600",   label: "Nonaktif" },
};

export default function Laporan() {
  const [tab, setTab]           = useState<TabAktif>("rekap");
  const [rekap, setRekap]       = useState<RekapSantri | null>(null);
  const [listSantri, setListSantri] = useState<Santri[]>([]);
  const [listKelas, setListKelas]   = useState<Kelas[]>([]);
  const [filterKelas, setFilterKelas]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading]   = useState(true);

  // Format tanggal cetak: "26 Agustus 2026"
  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Load rekap & kelas saat pertama kali halaman dibuka
  useEffect(() => {
    Promise.all([getRekapSantri(), getAllKelas()])
      .then(([r, k]) => { setRekap(r); setListKelas(k); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load daftar santri saat tab Daftar aktif / filter berubah
  useEffect(() => {
    if (tab !== "daftar") return;
    getAllSantri({
      kelasId: filterKelas ? parseInt(filterKelas) : null,
      status:  filterStatus || null,
    })
      .then(setListSantri)
      .catch(console.error);
  }, [tab, filterKelas, filterStatus]);

  if (loading) {
    return <div className="p-6 pt-20 text-center text-gray-400 text-sm">Memuat data...</div>;
  }

  return (
    <div className="p-6">

      {/* ── Header halaman (disembunyikan saat print) ── */}
      <div className="print:hidden mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Laporan & Cetak</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Rekap statistik santri dan daftar untuk dicetak
        </p>
      </div>

      {/* ── Tab navigation (disembunyikan saat print) ── */}
      <div className="print:hidden flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("rekap")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "rekap"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          📊 Rekap Statistik
        </button>
        <button
          onClick={() => setTab("daftar")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "daftar"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          🖨 Cetak Daftar Santri
        </button>
      </div>

      {/* ── Konten tab ── */}
      {tab === "rekap" && rekap && <TabRekap rekap={rekap} />}
      {tab === "daftar" && (
        <TabDaftar
          listSantri={listSantri}
          listKelas={listKelas}
          filterKelas={filterKelas}
          filterStatus={filterStatus}
          onFilterKelas={setFilterKelas}
          onFilterStatus={setFilterStatus}
          tanggalCetak={tanggalCetak}
        />
      )}
    </div>
  );
}

// ================================================================
// Tab 1 — Rekap Statistik
// ================================================================

function TabRekap({ rekap }: { rekap: RekapSantri }) {
  return (
    <div className="space-y-6">

      {/* Kartu ringkasan total */}
      <div className="grid grid-cols-3 gap-4">
        <KartuTotal label="Total Santri" nilai={rekap.totalSemua} warna="text-gray-800" />
        <KartuTotal label="Laki-laki"    nilai={rekap.totalLaki}      warna="text-blue-700" />
        <KartuTotal label="Perempuan"    nilai={rekap.totalPerempuan} warna="text-pink-600" />
      </div>

      {/* Tabel per status */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Breakdown per Status
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {rekap.perStatus.map((s) => {
            const style = STATUS_STYLE[s.status] ?? { bg: "bg-gray-50", text: "text-gray-600", label: s.status };
            return (
              <div key={s.status} className={`${style.bg} rounded-xl p-4 border border-gray-200`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
                  {style.label}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{s.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  L: {s.laki} &nbsp;|&nbsp; P: {s.perempuan}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel per kelas */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Jumlah Santri per Kelas
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="text-left px-4 py-3 font-semibold">Kelas</th>
                <th className="text-left px-4 py-3 font-semibold">Tingkat</th>
                <th className="text-center px-4 py-3 font-semibold">L</th>
                <th className="text-center px-4 py-3 font-semibold">P</th>
                <th className="text-center px-4 py-3 font-semibold font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {rekap.perKelas.map((k) => (
                <tr key={k.kelas_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{k.nama_kelas ?? "-"}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{k.tingkat ?? "-"}</td>
                  <td className="px-4 py-2.5 text-center text-blue-600">{k.laki}</td>
                  <td className="px-4 py-2.5 text-center text-pink-500">{k.perempuan}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-gray-800">{k.total}</td>
                </tr>
              ))}
            </tbody>
            {/* Baris total */}
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300">
                <td colSpan={2} className="px-4 py-2.5 font-bold text-gray-700">Total Keseluruhan</td>
                <td className="px-4 py-2.5 text-center font-bold text-blue-700">
                  {rekap.perKelas.reduce((s, k) => s + k.laki, 0)}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-pink-600">
                  {rekap.perKelas.reduce((s, k) => s + k.perempuan, 0)}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-gray-800">
                  {rekap.perKelas.reduce((s, k) => s + k.total, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Kartu statistik kecil ──
function KartuTotal({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-4xl font-bold mt-1 ${warna}`}>{nilai}</p>
    </div>
  );
}

// ================================================================
// Tab 2 — Cetak Daftar Santri
// ================================================================

interface TabDaftarProps {
  listSantri: Santri[];
  listKelas: Kelas[];
  filterKelas: string;
  filterStatus: string;
  onFilterKelas: (v: string) => void;
  onFilterStatus: (v: string) => void;
  tanggalCetak: string;
}

function TabDaftar({
  listSantri, listKelas,
  filterKelas, filterStatus,
  onFilterKelas, onFilterStatus,
  tanggalCetak,
}: TabDaftarProps) {

  // Label filter untuk header cetak
  const labelKelas  = listKelas.find((k) => k.id.toString() === filterKelas)?.nama_kelas ?? "Semua Kelas";
  const labelStatus = filterStatus
    ? filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)
    : "Semua Status";

  return (
    <div>
      {/* ── Filter & tombol cetak (disembunyikan saat print) ── */}
      <div className="print:hidden flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={filterKelas}
          onChange={(e) => onFilterKelas(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Semua Kelas</option>
          {listKelas.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => onFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="lulus">Lulus</option>
          <option value="keluar">Keluar</option>
          <option value="nonaktif">Nonaktif</option>
        </select>

        <span className="text-sm text-gray-500">{listSantri.length} santri</span>

        <button
          onClick={() => window.print()}
          className="ml-auto px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          🖨 Cetak / Simpan PDF
        </button>
      </div>

      {/* ── Header cetak (hanya muncul saat print) ── */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-gray-800 pb-4">
        <p className="text-lg font-bold tracking-wide">PONDOK PESANTREN AL-RIYADL</p>
        <p className="text-base font-semibold mt-0.5">Laporan Data Santri</p>
        <p className="text-sm text-gray-600 mt-1">
          Kelas: {labelKelas} &nbsp;|&nbsp; Status: {labelStatus}
        </p>
        <p className="text-xs text-gray-500 mt-1">Dicetak: {tanggalCetak}</p>
      </div>

      {/* ── Tabel daftar santri ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm print:shadow-none print:border-0 print:rounded-none">
        {listSantri.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm print:hidden">
            Tidak ada santri yang sesuai filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 print:bg-gray-200">
                <th className="text-left px-3 py-3 font-semibold w-8">No</th>
                <th className="text-left px-3 py-3 font-semibold">NIS</th>
                <th className="text-left px-3 py-3 font-semibold">Nama Lengkap</th>
                <th className="text-left px-3 py-3 font-semibold">L/P</th>
                <th className="text-left px-3 py-3 font-semibold">Kelas</th>
                <th className="text-left px-3 py-3 font-semibold">Status</th>
                <th className="text-left px-3 py-3 font-semibold">Tgl Masuk</th>
                <th className="text-left px-3 py-3 font-semibold">Orang Tua</th>
              </tr>
            </thead>
            <tbody>
              {listSantri.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 print:hover:bg-transparent">
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{s.nis ?? "-"}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{s.nama_lengkap}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{s.jenis_kelamin ?? "-"}</td>
                  <td className="px-3 py-2 text-gray-600">{s.nama_kelas ?? "-"}</td>
                  <td className="px-3 py-2 capitalize text-gray-600">{s.status}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">
                    {s.tanggal_masuk
                      ? new Date(s.tanggal_masuk).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{s.nama_orang_tua ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer cetak */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-right">
        Sistem Informasi Manajemen Pondok Pesantren (SIMPP) Al-Riyadl &nbsp;|&nbsp; Dicetak: {tanggalCetak}
      </div>
    </div>
  );
}
