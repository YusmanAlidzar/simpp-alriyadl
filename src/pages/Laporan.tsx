// Laporan.tsx — Halaman rekap statistik santri & cetak daftar
import { useState, useEffect } from "react";
import type { RekapSantri, RekapAtribut } from "../types/rekap";
import type { Santri } from "../types/santri";
import type { Kelas } from "../types/kelas";
import { getRekapSantri, getAllSantri, getAllKelas, getUnikKobong } from "../lib/db";
import { LuUsers, LuPrinter } from "react-icons/lu";

type TabAktif = "rekap" | "daftar";

// Warna kartu per status
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  aktif: { bg: "bg-pesantren-50", text: "text-pesantren-700", label: "Aktif" },
  lulus: { bg: "bg-blue-50", text: "text-blue-700", label: "Lulus" },
  keluar: { bg: "bg-red-50", text: "text-red-700", label: "Keluar" },
  nonaktif: { bg: "bg-slate-50", text: "text-slate-600", label: "Nonaktif" },
};

export default function Laporan() {
  const [tab, setTab] = useState<TabAktif>("rekap");
  const [rekap, setRekap] = useState<RekapSantri | null>(null);
  const [listSantri, setListSantri] = useState<Santri[]>([]);
  const [listKelas, setListKelas] = useState<Kelas[]>([]);
  const [listKobong, setListKobong] = useState<string[]>([]);
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterKobong, setFilterKobong] = useState("");
  const [filterJK, setFilterJK] = useState("");
  const [loading, setLoading] = useState(true);

  // Format tanggal cetak: "26 Agustus 2026"
  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Load rekap & kelas saat pertama kali halaman dibuka
  useEffect(() => {
    Promise.all([getRekapSantri(), getAllKelas(), getUnikKobong()])
      .then(([r, k, kb]) => { setRekap(r); setListKelas(k); setListKobong(kb); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load daftar santri saat tab Daftar aktif / filter berubah
  useEffect(() => {
    if (tab !== "daftar") return;
    getAllSantri({
      kelasId: filterKelas ? parseInt(filterKelas) : null,
      status: filterStatus || null,
      kobong: filterKobong || null,
      jenisKelamin: filterJK || null,
    })
      .then(setListSantri)
      .catch(console.error);
  }, [tab, filterKelas, filterStatus, filterKobong, filterJK]);

  if (loading) {
    return <div className="p-6 pt-20 text-center text-slate-400 text-sm">Memuat data...</div>;
  }

  return (
    <div className="p-6 dark:bg-slate-950 min-h-full transition-colors">

      {/* ── Header halaman (disembunyikan saat print) ── */}
      <div className="print:hidden mb-6">
        <h2 className="text-2xl font-bold text-pesantren-900 dark:text-pesantren-200">DASHBOARD - Laporan & Cetak</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Rekap statistik santri dan daftar untuk dicetak
        </p>
      </div>

      {/* ── Tab navigation (disembunyikan saat print) ── */}
      <div className="print:hidden flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => setTab("rekap")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "rekap"
            ? "border-pesantren-700 text-pesantren-700"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          <LuUsers className="inline-block mr-1.5 mb-0.5 text-base" />
          Rekap Statistik
        </button>
        <button
          onClick={() => setTab("daftar")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "daftar"
            ? "border-pesantren-700 text-pesantren-700"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          <LuPrinter className="inline-block mr-1.5 mb-0.5 text-base" />
          Cetak Daftar Santri
        </button>
      </div>

      {/* ── Konten tab ── */}
      {tab === "rekap" && rekap && <TabRekap rekap={rekap} />}
      {tab === "daftar" && (
        <TabDaftar
          listSantri={listSantri}
          listKelas={listKelas}
          listKobong={listKobong}
          filterKelas={filterKelas}
          filterStatus={filterStatus}
          filterKobong={filterKobong}
          filterJK={filterJK}
          onFilterKelas={setFilterKelas}
          onFilterStatus={setFilterStatus}
          onFilterKobong={setFilterKobong}
          onFilterJK={setFilterJK}
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
        <KartuTotal label="Total Santri" nilai={rekap.totalSemua} warna="text-slate-800" />
        <KartuTotal label="Putra (L)" nilai={rekap.totalLaki} warna="text-blue-700" />
        <KartuTotal label="Putri (P)" nilai={rekap.totalPerempuan} warna="text-pink-600" />
      </div>

      {/* Tabel per status */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Breakdown per Status
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {rekap.perStatus.map((s) => {
            const style = STATUS_STYLE[s.status] ?? { bg: "bg-slate-50", text: "text-slate-600", label: s.status };
            return (
              <div key={s.status} className={`${style.bg} rounded-xl p-4 border border-slate-200`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
                  {style.label}
                </p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{s.total}</p>
                <p className="text-xs text-slate-500 mt-1">
                  L: {s.laki} &nbsp;|&nbsp; P: {s.perempuan}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel per kelas */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Jumlah Santri per Kelas
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="text-left px-4 py-3 font-semibold">Kelas</th>
                <th className="text-left px-4 py-3 font-semibold">Tingkat</th>
                <th className="text-center px-4 py-3 font-semibold">Putra (L)</th>
                <th className="text-center px-4 py-3 font-semibold">Putri (P)</th>
                <th className="text-center px-4 py-3 font-semibold font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {rekap.perKelas.map((k) => (
                <tr key={k.kelas_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{k.nama_kelas ?? "-"}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{k.tingkat ?? "-"}</td>
                  <td className="px-4 py-2.5 text-center text-blue-600">{k.laki}</td>
                  <td className="px-4 py-2.5 text-center text-pink-500">{k.perempuan}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-800">{k.total}</td>
                </tr>
              ))}
            </tbody>
            {/* Baris total */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300">
                <td colSpan={2} className="px-4 py-2.5 font-bold text-slate-700">Total Keseluruhan</td>
                <td className="px-4 py-2.5 text-center font-bold text-blue-700">
                  {rekap.perKelas.reduce((s, k) => s + k.laki, 0)}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-pink-600">
                  {rekap.perKelas.reduce((s, k) => s + k.perempuan, 0)}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-slate-800">
                  {rekap.perKelas.reduce((s, k) => s + k.total, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TabelAtribut judul="Jumlah Santri per Kobong (Asrama)" data={rekap.perKobong} kolomLabel="Kobong" />
        <TabelAtribut judul="Jumlah Santri per Tingkat Sekolah" data={rekap.perTingkatSekolah} kolomLabel="Tingkat Sekolah" />
      </div>

    </div>
  );
}

// ── Komponen Tabel Pembantu ──
function TabelAtribut({ judul, data, kolomLabel }: { judul: string; data: RekapAtribut[]; kolomLabel: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {judul}
      </h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="text-left px-4 py-3 font-semibold">{kolomLabel}</th>
              <th className="text-center px-4 py-3 font-semibold">Putra (L)</th>
              <th className="text-center px-4 py-3 font-semibold">Putri (P)</th>
              <th className="text-center px-4 py-3 font-semibold font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label ?? "-"} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{d.label ?? "-"}</td>
                <td className="px-4 py-2.5 text-center text-blue-600">{d.laki}</td>
                <td className="px-4 py-2.5 text-center text-pink-500">{d.perempuan}</td>
                <td className="px-4 py-2.5 text-center font-bold text-slate-800">{d.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-300">
              <td className="px-4 py-2.5 font-bold text-slate-700">Total Keseluruhan</td>
              <td className="px-4 py-2.5 text-center font-bold text-blue-700">
                {data.reduce((s, k) => s + k.laki, 0)}
              </td>
              <td className="px-4 py-2.5 text-center font-bold text-pink-600">
                {data.reduce((s, k) => s + k.perempuan, 0)}
              </td>
              <td className="px-4 py-2.5 text-center font-bold text-slate-800">
                {data.reduce((s, k) => s + k.total, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Kartu statistik kecil ──
function KartuTotal({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
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
  listKobong: string[];
  filterKelas: string;
  filterStatus: string;
  filterKobong: string;
  filterJK: string;
  onFilterKelas: (v: string) => void;
  onFilterStatus: (v: string) => void;
  onFilterKobong: (v: string) => void;
  onFilterJK: (v: string) => void;
  tanggalCetak: string;
}

function TabDaftar({
  listSantri, listKelas, listKobong,
  filterKelas, filterStatus, filterKobong, filterJK,
  onFilterKelas, onFilterStatus, onFilterKobong, onFilterJK,
  tanggalCetak,
}: TabDaftarProps) {

  // Label filter untuk header cetak
  const labelKelas = listKelas.find((k) => k.id.toString() === filterKelas)?.nama_kelas ?? "Semua Kelas";
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
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
        >
          <option value="">Semua Kelas</option>
          {listKelas.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
          ))}
        </select>

        <select
          value={filterKobong}
          onChange={(e) => onFilterKobong(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
        >
          <option value="">Semua Kobong</option>
          {listKobong.map((kb) => (
            <option key={kb} value={kb}>{kb}</option>
          ))}
        </select>

        <select
          value={filterJK}
          onChange={(e) => onFilterJK(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
        >
          <option value="">L/P</option>
          <option value="L">Putra (L)</option>
          <option value="P">Putri (P)</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => onFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pesantren-500 bg-white"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="lulus">Lulus</option>
          <option value="keluar">Keluar</option>
          <option value="nonaktif">Nonaktif</option>
        </select>

        <span className="text-sm text-slate-500">{listSantri.length} santri</span>

        <button
          onClick={() => window.print()}
          className="ml-auto px-5 py-2 bg-pesantren-700 hover:bg-pesantren-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <LuPrinter className="inline-block mr-1.5 mb-0.5 text-base" />
          Cetak/Simpan PDF
        </button>
      </div>

      {/* ── Header cetak (hanya muncul saat print) ── */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
        <p className="text-lg font-bold tracking-wide">PONDOK PESANTREN AL-RIYADL</p>
        <p className="text-base font-semibold mt-0.5">Laporan Data Santri</p>
        <p className="text-sm text-slate-600 mt-1">
          Kelas: {labelKelas} &nbsp;|&nbsp; Status: {labelStatus}
        </p>
        <p className="text-xs text-slate-500 mt-1">Dicetak: {tanggalCetak}</p>
      </div>

      {/* ── Tabel daftar santri ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm print:shadow-none print:border-0 print:rounded-none">
        {listSantri.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm print:hidden">
            Tidak ada santri yang sesuai filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 print:bg-slate-200">
                <th className="text-left px-3 py-3 font-semibold w-8">No</th>
                <th className="text-left px-3 py-3 font-semibold">NIS</th>
                <th className="text-left px-3 py-3 font-semibold">Nama Lengkap</th>
                <th className="text-left px-3 py-3 font-semibold">L/P</th>
                <th className="text-left px-3 py-3 font-semibold">Kelas</th>
                <th className="text-left px-3 py-3 font-semibold">Kobong</th>
                <th className="text-left px-3 py-3 font-semibold">Status</th>
                <th className="text-left px-3 py-3 font-semibold">Tgl Masuk</th>
                <th className="text-left px-3 py-3 font-semibold">Orang Tua</th>
              </tr>
            </thead>
            <tbody>
              {listSantri.map((s, i) => (
                <tr key={s.nis} className="border-b border-slate-100 hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{s.nis ?? "-"}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{s.nama_santri}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{s.jenis_kelamin ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{s.nama_kelas ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{s.kobong ?? "-"}</td>
                  <td className="px-3 py-2 capitalize text-slate-600">{s.status}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">
                    {s.tanggal_masuk
                      ? new Date(s.tanggal_masuk).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{s.nama_ayah || s.nama_ibu || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer cetak */}
      <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-xs text-slate-500 text-right">
        Sistem Informasi Manajemen Pondok Pesantren (SIMPP) Al-Riyadl &nbsp;|&nbsp; Dicetak: {tanggalCetak}
      </div>
    </div>
  );
}
