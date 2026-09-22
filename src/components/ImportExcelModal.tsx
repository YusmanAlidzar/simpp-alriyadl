import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import type { SantriForm } from "../types/santri";
import { FORM_KOSONG } from "../types/santri";
import { simpanSantriMassal, getAllKelas } from "../lib/db";
import { LuUpload, LuDownload, LuCheck } from "react-icons/lu";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notif, setNotif] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Template Lengkap
  const handleDownloadTemplate = () => {
    const header = [
      "NIS*", "NIK Santri*", "Nama Lengkap*", "Jenis Kelamin", "Tempat Lahir", 
      "Tanggal Lahir", "Tingkat Sekolah", "Tingkat Kelas Pengajian", "Kelas Pengajian", 
      "Kobong (Asrama)", "Tanggal Masuk", "No. HP Santri", "Anak Ke", "Jumlah Saudara", 
      "Status Santri", "Status Rumah", "Kode Pos", "Provinsi", "Kabupaten / Kota", 
      "Kecamatan", "Kelurahan / Desa", "RT", "RW", "Alamat Lengkap", 
      "NIK Ayah*", "Nama Ayah*", "Status Hidup Ayah", "Pekerjaan Ayah", "No. HP Ayah", 
      "NIK Ibu*", "Nama Ibu*", "Status Hidup Ibu", "Pekerjaan Ibu", "No. HP Ibu", 
      "NIK Wali", "Nama Wali", "Hubungan / Posisi Wali", "No. HP Wali", 
      "Penghasilan Gabungan (Orang Tua)", "Catatan Tambahan"
    ];

    const aturan = [
      ["KOLOM", "ATURAN / KETERANGAN"],
      ["NIS*", "hanya angka dan titik."],
      ["NIK Santri*", "hanya angka, maks. 16 digit."],
      ["Nama Lengkap*", "teks."],
      ["Jenis Kelamin", "Dropdown: Laki-laki / Perempuan"],
      ["Tempat Lahir", "teks."],
      ["Tanggal Lahir", "Format: dd/mm/yyyy"],
      ["Tingkat Sekolah", "Dropdown: Belum/Putus Sekolah / PAUD/TK/sederajat / SD/MI/sederajat / SMP/MTs/sederajat / SMA/MA/sederajat / Perguruan Tinggi / Sudah Bekerja"],
      ["Tingkat Kelas Pengajian", "Dropdown: Tingkat Ibtida / Tingkat Wustho` / Tingkat Ulya / Tingkat Takhosus"],
      ["Kelas Pengajian", "Sesuai tingkat (misal: Ibtida 1, Wustho` 1, dll)"],
      ["Kobong (Asrama)", "Laki-laki (Imam Syafi`i, dll) / Perempuan (Siti Fatimah, dll)"],
      ["Tanggal Masuk", "Format: dd/mm/yyyy"],
      ["No. HP Santri", "hanya angka."],
      ["Anak Ke", "hanya angka, maks. 2 digit."],
      ["Jumlah Saudara", "hanya angka, maks. 2 digit."],
      ["Status Santri", "Dropdown: Aktif / Lulus / Keluar / Nonaktif"],
      ["Status Rumah", "Dropdown: Milik Sendiri / Sewa/Kontrak / Menumpang / Asrama/Pesantren / Lainnya"],
      ["Kode Pos", "hanya angka, maks. 5 digit."],
      ["Provinsi", "Dropdown Provinsi di Indonesia"],
      ["Kabupaten / Kota", "Dropdown Kabupaten/Kota"],
      ["Kecamatan", "Dropdown Kecamatan"],
      ["Kelurahan / Desa", "hanya teks dan titik."],
      ["RT", "hanya angka, maks. 3 digit."],
      ["RW", "hanya angka, maks. 3 digit."],
      ["Alamat Lengkap", "teks."],
      ["NIK Ayah*", "hanya angka, maks. 16 digit."],
      ["Nama Ayah*", "teks."],
      ["Status Hidup Ayah", "Dropdown: Hidup / Meninggal / Tidak Diketahui"],
      ["Pekerjaan Ayah", "teks."],
      ["No. HP Ayah", "angka."],
      ["NIK Ibu*", "hanya angka, maks. 16 digit."],
      ["Nama Ibu*", "teks."],
      ["Status Hidup Ibu", "Dropdown: Hidup / Meninggal / Tidak Diketahui"],
      ["Pekerjaan Ibu", "teks."],
      ["No. HP Ibu", "angka."],
      ["NIK Wali", "hanya angka, maks. 16 digit."],
      ["Nama Wali", "teks."],
      ["Hubungan / Posisi Wali", "teks."],
      ["No. HP Wali", "angka."],
      ["Penghasilan Gabungan", "Dropdown: < Rp 1.000.000 / Rp 1.000.000 - Rp 3.000.000 / Rp 3.000.000 - Rp 5.000.000 / > Rp 5.000.000"],
      ["Catatan Tambahan", "semua karakter."]
    ];

    const wsData = XLSX.utils.aoa_to_sheet([header]);
    const wsAturan = XLSX.utils.aoa_to_sheet(aturan);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, "Data_Santri");
    XLSX.utils.book_append_sheet(wb, wsAturan, "Aturan_Pengisian");
    XLSX.writeFile(wb, "Template_Import_Santri_Alriyadl.xlsx");
    
    setNotif("Template Excel berhasil diunduh!");
    setTimeout(() => setNotif(""), 4000);
  };

  // 2. Baca File Excel
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg("");
    setNotif("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        setPreviewData(json);
      } catch (err) {
        setErrorMsg("Gagal membaca file Excel. Pastikan formatnya benar.");
      }
    };
    reader.readAsArrayBuffer(selected);
  };

  // Format string dd/mm/yyyy to yyyy-mm-dd
  const parseDateToISO = (val: any) => {
    if (!val) return "";
    let str = String(val).trim();
    if (!isNaN(Number(str)) && Number(str) > 1000) {
       const d = new Date(Math.round((Number(str) - 25569) * 864e5));
       return d.toISOString().split("T")[0];
    }
    const parts = str.split("/");
    if (parts.length === 3) {
       let d = parts[0].padStart(2, "0");
       let m = parts[1].padStart(2, "0");
       let y = parts[2];
       if (y.length === 2) y = "20" + y;
       return `${y}-${m}-${d}`;
    }
    return str;
  };

  // 3. Proses Import Massal
  const handleImport = async () => {
    if (previewData.length === 0) {
      setErrorMsg("Tidak ada data untuk di-import.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg("");

    try {
      // Get class mapping to assign class_id based on class name
      const listKelas = await getAllKelas();

      const dataToSave: SantriForm[] = previewData.map((row) => {
        const santri = { ...FORM_KOSONG };

        // Helper to get value reliably
        const getVal = (key: string) => String(row[key] || "").trim();

        santri.nis = getVal("NIS*");
        santri.nik_santri = getVal("NIK Santri*");
        santri.nama_santri = getVal("Nama Lengkap*");
        
        const jk = getVal("Jenis Kelamin").toLowerCase();
        santri.jenis_kelamin = jk.includes("laki") ? "L" : (jk.includes("perempuan") ? "P" : "");
        
        santri.tempat_lahir = getVal("Tempat Lahir");
        santri.tanggal_lahir = parseDateToISO(getVal("Tanggal Lahir"));
        santri.tingkat_sekolah = getVal("Tingkat Sekolah");
        santri.kelas_pengajian = getVal("Kelas Pengajian");
        
        const matchedKelas = listKelas.find(k => k.nama_kelas.toLowerCase() === santri.kelas_pengajian.toLowerCase());
        santri.kelas_id = matchedKelas ? String(matchedKelas.id) : "";

        santri.kobong = getVal("Kobong (Asrama)");
        santri.tanggal_masuk = parseDateToISO(getVal("Tanggal Masuk"));
        santri.nomor_hp_santri = getVal("No. HP Santri");
        santri.anak_ke = getVal("Anak Ke");
        santri.jumlah_saudara = getVal("Jumlah Saudara");
        
        const stat = getVal("Status Santri").toLowerCase();
        santri.status = stat === "lulus" ? "lulus" : stat === "keluar" ? "keluar" : stat === "nonaktif" ? "nonaktif" : "aktif";
        
        santri.status_rumah = getVal("Status Rumah");
        santri.kode_pos = getVal("Kode Pos");
        santri.provinsi = getVal("Provinsi");
        santri.kabupaten_kota = getVal("Kabupaten / Kota");
        santri.kecamatan = getVal("Kecamatan");
        santri.kelurahan_desa = getVal("Kelurahan / Desa");
        santri.rt = getVal("RT");
        santri.rw = getVal("RW");
        santri.alamat_lengkap = getVal("Alamat Lengkap");

        santri.nik_ayah = getVal("NIK Ayah*");
        santri.nama_ayah = getVal("Nama Ayah*");
        santri.status_hidup_ayah = getVal("Status Hidup Ayah") || "Hidup";
        santri.pekerjaan_utama_ayah = getVal("Pekerjaan Ayah");
        santri.nomor_hp_ayah = getVal("No. HP Ayah");

        santri.nik_ibu = getVal("NIK Ibu*");
        santri.nama_ibu = getVal("Nama Ibu*");
        santri.status_hidup_ibu = getVal("Status Hidup Ibu") || "Hidup";
        santri.pekerjaan_utama_ibu = getVal("Pekerjaan Ibu");
        santri.nomor_hp_ibu = getVal("No. HP Ibu");

        santri.nik_wali = getVal("NIK Wali");
        santri.nama_wali = getVal("Nama Wali");
        santri.posisi_wali = getVal("Hubungan / Posisi Wali");
        santri.nomor_hp_wali = getVal("No. HP Wali");
        santri.ada_wali = santri.nik_wali !== "" || santri.nama_wali !== "";

        santri.penghasilan_gabungan = getVal("Penghasilan Gabungan (Orang Tua)");
        santri.catatan = getVal("Catatan Tambahan");
        
        return santri;
      });

      for (let i = 0; i < dataToSave.length; i++) {
        const d = dataToSave[i];
        if (!d.nis || !d.nik_santri || !d.nama_santri || !d.nik_ayah || !d.nama_ayah || !d.nik_ibu || !d.nama_ibu) {
          throw new Error(`Data tidak valid di baris ${i + 2}! Pastikan kolom bertanda (*) wajib diisi.`);
        }
      }

      await simpanSantriMassal(dataToSave);
      onSuccess();
    } catch (err: any) {
      console.error(err); setErrorMsg(err.message || (typeof err === "string" ? err : JSON.stringify(err)) || "Terjadi kesalahan saat menyimpan ke database.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Import Excel Data Santri</h2>
          {notif && <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">{notif}</span>}
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-500 mb-1">Peringatan Penting!</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200/90">Jika NIS atau NIK yang di-import sudah terdaftar, sistem akan <strong className="underline">menimpa (overwrite)</strong> data lama tersebut dengan data dari Excel.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold mb-2 dark:text-slate-200">1. Unduh Template Lengkap</h3>
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors">
              <LuDownload size={16} /> Download Template Excel
            </button>
          </div>
          <div>
            <h3 className="text-sm font-bold mb-2 dark:text-slate-200">2. Unggah File Excel</h3>
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-pesantren-50 hover:bg-pesantren-100 dark:bg-pesantren-900/30 dark:hover:bg-pesantren-900/50 text-pesantren-700 dark:text-pesantren-400 text-sm font-semibold rounded-lg transition-colors">
              <LuUpload size={16} /> Pilih File Excel
            </button>
            {file && <span className="ml-3 text-xs text-slate-500">{file.name}</span>}
          </div>
          {previewData.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Preview: {previewData.length} baris</p>
              <div className="max-h-32 overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-600 dark:text-slate-400">
                {previewData.slice(0, 3).map((r, i) => <div key={i} className="mb-1 truncate">{JSON.stringify(r)}</div>)}
                {previewData.length > 3 && <div className="mt-1 italic">... dan {previewData.length - 3} data lainnya</div>}
              </div>
            </div>
          )}
          {errorMsg && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">{errorMsg}</div>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors">Batal</button>
          <button onClick={handleImport} disabled={isProcessing || previewData.length === 0} className="flex items-center gap-2 px-5 py-2 bg-pesantren-700 hover:bg-pesantren-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {isProcessing ? "Menyimpan..." : <><LuCheck size={16} /> Import Data</>}
          </button>
        </div>
      </div>
    </div>
  );
}
