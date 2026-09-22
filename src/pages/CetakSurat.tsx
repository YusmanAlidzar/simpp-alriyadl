// CetakSurat.tsx -- Halaman Cetak Surat (pilih santri -> pilih jenis surat -> preview dan cetak)
// Saat ini mendukung: Surat Keterangan Santri Aktif
import { useState, useEffect } from "react";
import { LuPrinter, LuArrowLeft, LuFileText, LuSearch } from "react-icons/lu";
import type { Santri } from "../types/santri";
import type { SantriForm } from "../types/santri";
import { getAllSantri, getSantriById } from "../lib/db";

// Tipe-tipe lokal
type JenisSurat = "keterangan_aktif";
type Tahap = "pilih_santri" | "pilih_surat" | "preview";

const DAFTAR_SURAT: { id: JenisSurat; label: string; deskripsi: string }[] = [
  {
    id: "keterangan_aktif",
    label: "Surat Keterangan Santri Aktif",
    deskripsi: "Surat resmi yang menerangkan bahwa santri berstatus aktif di pondok pesantren.",
  },
];

function formatTanggalIndo(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatJenisKelamin(jk: string | null): string {
  if (jk === "L") return "Laki-laki";
  if (jk === "P") return "Perempuan";
  return "-";
}

export default function CetakSurat() {
  const [tahap, setTahap] = useState<Tahap>("pilih_santri");
  const [cari, setCari] = useState("");
  const [listSantri, setListSantri] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(true);
  const [santriTerpilih, setSantriTerpilih] = useState<Santri | null>(null);
  const [detailSantri, setDetailSantri] = useState<SantriForm | null>(null);
  // const [jenisSurat, setJenisSurat] = useState<JenisSurat | null>(null);
  const [nomorSurat, setNomorSurat] = useState("");

  useEffect(() => {
    getAllSantri({ status: "aktif" })
      .then(setListSantri)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const santriFiltered = listSantri.filter(
    (s) => s.nama_santri.toLowerCase().includes(cari.toLowerCase()) || s.nis.includes(cari)
  );

  async function pilihSantri(s: Santri) {
    setSantriTerpilih(s);
    try {
      const detail = await getSantriById(s.nis);
      setDetailSantri(detail);
    } catch (err) { console.error(err); }
    setTahap("pilih_surat");
  }

  function pilihJenisSurat(_id: JenisSurat) {
    // setJenisSurat(id);
    setTahap("preview");
  }

  function kembali() {
    if (tahap === "preview") { setTahap("pilih_surat"); } // setJenisSurat(null);
    else if (tahap === "pilih_surat") { setTahap("pilih_santri"); setSantriTerpilih(null); setDetailSantri(null); setNomorSurat(""); }
  }

  function handleCetak() { const originalTitle = document.title; if (detailSantri) { document.title = "Surat Keterangan Santri Aktif (SIMPP Al-Riyadl) - " + detailSantri.nama_santri; } window.print(); setTimeout(() => { document.title = originalTitle; }, 1000); } const tanggalCetak = formatTanggalIndo(new Date().toISOString());

  return (
    <div className="min-h-full">
      <div className="print:hidden p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {tahap !== "pilih_santri" && (
            <button onClick={kembali} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Kembali">
              <LuArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-pesantren-900 dark:text-pesantren-200">Cetak Surat</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {tahap === "pilih_santri" && "Pilih santri yang akan dibuatkan surat."}
              {tahap === "pilih_surat" && `Santri: ${santriTerpilih?.nama_santri} -- Pilih jenis surat.`}
              {tahap === "preview" && "Preview surat. Klik Cetak untuk mencetak."}
            </p>
          </div>
        </div>

        {tahap === "pilih_santri" && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Cari nama atau NIS santri aktif..." value={cari} onChange={(e) => setCari(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pesantren-500 transition" />
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Memuat daftar santri...</div>
            ) : santriFiltered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                {cari ? "Tidak ditemukan santri aktif yang cocok." : "Belum ada santri aktif."}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[60vh] overflow-y-auto">
                {santriFiltered.map((s) => (
                  <li key={s.nis}>
                    <button onClick={() => pilihSantri(s)} className="w-full text-left px-5 py-3.5 hover:bg-pesantren-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-pesantren-700 dark:group-hover:text-pesantren-300 transition-colors">{s.nama_santri}</p>
                        <p className="text-xs text-slate-500 mt-0.5">NIS: {s.nis} · {s.kobong || "-"} · {s.nama_kelas || "-"}</p>
                      </div>
                      <LuFileText size={18} className="text-slate-300 group-hover:text-pesantren-500 transition-colors" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tahap === "pilih_surat" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nomor Surat (opsional)</label>
              <input type="text" placeholder="Contoh: 031/PP.A/VII/2026" value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pesantren-500 transition" />
            </div>
            {DAFTAR_SURAT.map((surat) => (
              <button key={surat.id} onClick={() => pilihJenisSurat(surat.id)} className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:border-pesantren-400 dark:hover:border-pesantren-500 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-pesantren-100 dark:bg-pesantren-900/30 flex items-center justify-center flex-shrink-0">
                    <LuFileText size={22} className="text-pesantren-700 dark:text-pesantren-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-pesantren-700 dark:group-hover:text-pesantren-300 transition-colors">{surat.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{surat.deskripsi}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tahap === "preview" && detailSantri && (
          <div>
            <div className="mb-4 flex justify-end">
              <button onClick={handleCetak} className="flex items-center gap-2 px-6 py-2.5 bg-pesantren-700 hover:bg-pesantren-800 text-white font-semibold rounded-lg shadow-sm transition-colors">
                <LuPrinter size={16} /> Cetak Surat
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8">
                <SuratKeteranganAktifContent santri={detailSantri} nomorSurat={nomorSurat} tanggalCetak={tanggalCetak} />
              </div>
            </div>
          </div>
        )}
      </div>

      {tahap === "preview" && detailSantri && (
        <div className="hidden print:block cetak-surat-area">
          <SuratKeteranganAktifContent santri={detailSantri} nomorSurat={nomorSurat} tanggalCetak={tanggalCetak} />
        </div>
      )}
    </div>
  );
}

// Template Surat: Keterangan Santri Aktif
interface SuratContentProps {
  santri: SantriForm;
  nomorSurat: string;
  tanggalCetak: string;
}

function SuratKeteranganAktifContent({ santri, nomorSurat, tanggalCetak }: SuratContentProps) {
  const alamatLengkap = [
    santri.alamat_lengkap,
    santri.kelurahan_desa ? `Desa ${santri.kelurahan_desa}` : "",
    santri.kecamatan ? `Kec. ${santri.kecamatan}` : "",
    santri.kabupaten_kota || "",
    santri.provinsi || "",
  ].filter(Boolean).join(", ");

  const namaOrtuWali = santri.ada_wali && santri.nama_wali
    ? `${santri.nama_ayah} / ${santri.nama_wali} (Wali)`
    : santri.nama_ayah || "-";

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: "1.6", color: "#000", maxWidth: "210mm", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <img src="/kop-surat.jpg" alt="Kop Surat Pondok Pesantren Al-Riyadl" style={{ width: "100%", maxWidth: "720px" }} />
      </div>
      <div style={{ borderBottom: "3px double #000", marginBottom: "20px" }} />

      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "14pt", fontWeight: "bold", textDecoration: "underline", letterSpacing: "1px", margin: 0 }}>SURAT KETERANGAN</h1>
        {nomorSurat && <p style={{ margin: "4px 0 0 0", fontSize: "12pt" }}>Nomor : {nomorSurat}</p>}
      </div>

      <div style={{ textAlign: "justify" }}>
        <p style={{ marginBottom: "8px" }}>Yang bertanda tangan di bawah ini:</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <tbody>
            <tr>
              <td style={{ width: "220px", verticalAlign: "top", padding: "3px 0" }}>Nama</td>
              <td style={{ width: "20px", textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ fontWeight: "bold", padding: "3px 0" }}>KH. Drs. Pipin S. Arifin, MM.Pd</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: "3px 0" }}>Alamat</td>
              <td style={{ textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ padding: "3px 0" }}>Kp. Loji Alriyadl, RT.02/18, Des. Cipanas, Kec. Cipanas Kab. Cianjur</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: "3px 0" }}>Jabatan</td>
              <td style={{ textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ padding: "3px 0" }}>Pimpinan Pondok Pesantren Al-Riyadl</td>
            </tr>
          </tbody>
        </table>

        <p style={{ marginBottom: "8px" }}>Pimpinan Pondok Pesantren Al-Riyadl Kec. Cipanas Kab. Cianjur, dengan ini menerangkan bahwa :</p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <tbody>
            <tr>
              <td style={{ width: "220px", verticalAlign: "top", padding: "3px 0" }}>Nama</td>
              <td style={{ width: "20px", textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ fontWeight: "bold", padding: "3px 0" }}>{santri.nama_santri || "-"}</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: "3px 0" }}>Tempat Tanggal Lahir</td>
              <td style={{ textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ padding: "3px 0" }}>{santri.tempat_lahir || "-"}, {formatTanggalIndo(santri.tanggal_lahir)}</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: "3px 0" }}>Jenis Kelamin</td>
              <td style={{ textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ padding: "3px 0" }}>{formatJenisKelamin(santri.jenis_kelamin)}</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: "3px 0" }}>Nama Orang Tua/Wali</td>
              <td style={{ textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ padding: "3px 0" }}>{namaOrtuWali}</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: "top", padding: "3px 0" }}>Alamat</td>
              <td style={{ textAlign: "center", verticalAlign: "top", padding: "3px 0" }}>:</td>
              <td style={{ padding: "3px 0" }}>{alamatLengkap || "-"}</td>
            </tr>
          </tbody>
        </table>

        <p style={{ textIndent: "40px", marginBottom: "8px" }}>Adalah benar merupakan santri yang berstatus <strong>AKTIF</strong> dan sedang menempuh pendidikan di Pesantren Al-Riyadl Cipanas-Cianjur pada tahun ajaran ini.</p>
        <p style={{ textIndent: "40px" }}>Demikian surat keterangan ini diberikan dengan sebenar-benarnya kepada yang bersangkutan untuk dipergunakan sebagaimana mestinya.</p>
      </div>

      <div style={{ marginTop: "50px", position: "relative" }}>
        <div style={{ width: "300px", float: "right", textAlign: "center" }}>
          <p style={{ margin: 0 }}>Cipanas, {tanggalCetak}</p>
          <p style={{ margin: 0 }}>Pimpinan Pondok Pesantren Al-Riyadl</p>
          <div style={{ height: "80px" }} />
          <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>KH. Drs. Pipin S. Arifin, MM.Pd</p>
        </div>
        <div style={{ clear: "both" }} />
      </div>
    </div>
  );
}
