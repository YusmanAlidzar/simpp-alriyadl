// FormSantri.tsx — Form tambah / edit data santri (dengan fitur upload foto)
import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { SantriForm } from "../types/santri";
import type { Kelas } from "../types/kelas";
import { FORM_KOSONG } from "../types/santri";
import { LuArrowLeft, LuUser, LuImagePlus, LuTrash2 } from "react-icons/lu";
import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import {
  getAllKelas,
  getSantriById,
  tambahSantri,
  editSantri,
  getFotoDirPath,
  updateFotoSantri,
  fotoKeDataUrl,
} from "../lib/db";

interface FormSantriProps {
  santriId: string | null; // NIS (null = mode tambah)
  onSelesai: () => void;
  onBatal: () => void;
}

export default function FormSantri({ santriId, onSelesai, onBatal }: FormSantriProps) {
  const [form, setForm] = useState<SantriForm>(FORM_KOSONG);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  
  const [fotoAbsolut, setFotoAbsolut] = useState<string | null>(null);
  const [uploadFoto, setUploadFoto] = useState(false);

  const modeEdit = santriId !== null;

  async function resolvePathFoto(namaFile: string) {
    try {
      const dir = await getFotoDirPath();
      const pathAbsolut = await join(dir, namaFile);
      const dataUrl = await fotoKeDataUrl(pathAbsolut);
      setFotoAbsolut(dataUrl);
    } catch {
      setFotoAbsolut(null);
    }
  }

  async function handlePilihFoto() {
    try {
      const file = await open({
        multiple: false,
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
      });
      if (!file) return;

      const filePath = Array.isArray(file) ? file[0] : file;
      const fileName = `santri_${form.nik_santri}_${Date.now()}.${filePath.split(".").pop()}`;
      const dir = await getFotoDirPath();
      const newPath = await join(dir, fileName);

      await copyFile(filePath, newPath);
      await updateFotoSantri(form.nik_santri, fileName);
      setForm((prev) => ({ ...prev, foto_santri: fileName }));
      resolvePathFoto(fileName);
      setSukses("Foto berhasil diperbarui.");
    } catch (err) {
      console.error(err);
      setError("Gagal mengupload foto.");
    }
  }

  async function handleHapusFoto() {
    try {
      await updateFotoSantri(form.nik_santri, null);
      setForm((prev) => ({ ...prev, foto_santri: null }));
      setFotoAbsolut(null);
      setSukses("Foto berhasil dihapus.");
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus foto.");
    }
  }

  useEffect(() => {
    setLoading(true);
    const promises = modeEdit
      ? Promise.all([getAllKelas(), getSantriById(santriId!)])
      : Promise.all([getAllKelas(), Promise.resolve(null)]);

    promises
      .then(([daftarKelas, dataSantri]) => {
        setKelas(daftarKelas);
        if (dataSantri) {
          setForm(dataSantri);
          if (dataSantri.foto_santri) resolvePathFoto(dataSantri.foto_santri);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [santriId]);

  function handleChange(field: keyof SantriForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSukses(null);
  }

  function validasi(): string | null {
    if (!form.nis.trim()) return "NIS wajib diisi.";
    if (!form.nik_santri.trim()) return "NIK Santri wajib diisi.";
    if (!form.nama_santri.trim()) return "Nama Santri wajib diisi.";
    if (!form.nik_ayah.trim()) return "NIK Ayah wajib diisi.";
    if (!form.nama_ayah.trim()) return "Nama Ayah wajib diisi.";
    if (!form.nik_ibu.trim()) return "NIK Ibu wajib diisi.";
    if (!form.nama_ibu.trim()) return "Nama Ibu wajib diisi.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pesanError = validasi();
    if (pesanError) { setError(pesanError); return; }

    setMenyimpan(true);
    try {
      if (modeEdit && santriId) {
        await editSantri(santriId, form);
        setSukses("Data santri berhasil diperbarui!");
      } else {
        await tambahSantri(form);
        setSukses("Data santri berhasil ditambahkan!");
      }
      setTimeout(() => onSelesai(), 1500);
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.includes("UNIQUE") && msg.includes("nis")) {
        setError(`NIS "${form.nis}" sudah terdaftar.`);
      } else {
        setError("Gagal menyimpan data. Detail Error: " + msg);
        console.error(err);
      }
    } finally {
      setMenyimpan(false);
    }
  }

  if (loading) {
    return <div className="p-6 pt-20 text-center text-gray-400 text-sm">Memuat data...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBatal}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-lg"
          title="Kembali ke daftar">
          <LuArrowLeft />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {modeEdit ? "Edit Data Santri" : "Pendaftaran Santri Baru"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8">
        
        {/* =========================================
            FOTO SANTRI (Hanya Mode Edit)
        ========================================= */}
        {modeEdit && (
          <div className="mb-8 flex flex-col items-center sm:items-start sm:flex-row gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-24 h-32 rounded-lg bg-gray-200 border border-gray-300 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
              {fotoAbsolut ? (
                <img src={fotoAbsolut} alt="Foto Santri" className="w-full h-full object-cover" />
              ) : (
                <LuUser className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-2 text-center sm:text-left">
              <h3 className="font-semibold text-gray-700">Foto Profil Santri</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-1">
                Format yang didukung: JPG, PNG, WEBP. Maksimal ukuran file 2MB (disarankan).
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                <button
                  type="button"
                  onClick={handlePilihFoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <LuImagePlus className="w-4 h-4" />
                  {fotoAbsolut ? "Ganti Foto" : "Pilih Foto"}
                </button>
                {fotoAbsolut && (
                  <button
                    type="button"
                    onClick={handleHapusFoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                  >
                    <LuTrash2 className="w-4 h-4" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            BAGIAN 1: DATA REGISTRASI & BIODATA 
        ========================================= */}
        <SeksiForm judul="1. Registrasi & Biodata Santri" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Field label="NIS *" htmlFor="nis">
            <input id="nis" type="text" value={form.nis} disabled={modeEdit} onChange={(e) => handleChange("nis", e.target.value)} className={cls} />
          </Field>
          <Field label="NIK Santri *" htmlFor="nik_santri">
            <input id="nik_santri" type="text" value={form.nik_santri} onChange={(e) => handleChange("nik_santri", e.target.value)} className={cls} />
          </Field>
          <Field label="Nama Lengkap *" htmlFor="nama_santri">
            <input id="nama_santri" type="text" value={form.nama_santri} onChange={(e) => handleChange("nama_santri", e.target.value)} className={cls} />
          </Field>
          <Field label="Jenis Kelamin" htmlFor="jenis_kelamin">
            <select id="jenis_kelamin" value={form.jenis_kelamin} onChange={(e) => handleChange("jenis_kelamin", e.target.value)} className={cls}>
              <option value="">-- Pilih --</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>
          <Field label="Tempat Lahir" htmlFor="tempat_lahir">
            <input id="tempat_lahir" type="text" value={form.tempat_lahir} onChange={(e) => handleChange("tempat_lahir", e.target.value)} className={cls} />
          </Field>
          <Field label="Tanggal Lahir" htmlFor="tanggal_lahir">
            <input id="tanggal_lahir" type="date" value={form.tanggal_lahir} onChange={(e) => handleChange("tanggal_lahir", e.target.value)} className={cls} />
          </Field>
          <Field label="Tingkat Sekolah" htmlFor="tingkat_sekolah">
            <input id="tingkat_sekolah" type="text" value={form.tingkat_sekolah} onChange={(e) => handleChange("tingkat_sekolah", e.target.value)} className={cls} />
          </Field>
          <Field label="Kelas Master" htmlFor="kelas_id">
            <select id="kelas_id" value={form.kelas_id} onChange={(e) => handleChange("kelas_id", e.target.value)} className={cls}>
              <option value="">-- Pilih Kelas --</option>
              {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </Field>
          <Field label="Kelas Pengajian" htmlFor="kelas_pengajian">
            <input id="kelas_pengajian" type="text" value={form.kelas_pengajian} onChange={(e) => handleChange("kelas_pengajian", e.target.value)} className={cls} />
          </Field>
          <Field label="Kobong (Asrama)" htmlFor="kobong">
            <input id="kobong" type="text" value={form.kobong} onChange={(e) => handleChange("kobong", e.target.value)} className={cls} />
          </Field>
          <Field label="Tanggal Masuk" htmlFor="tanggal_masuk">
            <input id="tanggal_masuk" type="date" value={form.tanggal_masuk} onChange={(e) => handleChange("tanggal_masuk", e.target.value)} className={cls} />
          </Field>
          <Field label="No HP Santri" htmlFor="nomor_hp_santri">
            <input id="nomor_hp_santri" type="tel" value={form.nomor_hp_santri} onChange={(e) => handleChange("nomor_hp_santri", e.target.value)} className={cls} />
          </Field>
          <Field label="Anak Ke" htmlFor="anak_ke">
            <input id="anak_ke" type="number" value={form.anak_ke} onChange={(e) => handleChange("anak_ke", e.target.value)} className={cls} />
          </Field>
          <Field label="Jumlah Saudara" htmlFor="jumlah_saudara">
            <input id="jumlah_saudara" type="number" value={form.jumlah_saudara} onChange={(e) => handleChange("jumlah_saudara", e.target.value)} className={cls} />
          </Field>
          <Field label="Status Santri" htmlFor="status">
            <select id="status" value={form.status} onChange={(e) => handleChange("status", e.target.value)} className={cls}>
              <option value="aktif">Aktif</option>
              <option value="lulus">Lulus</option>
              <option value="keluar">Keluar</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </Field>
        </div>

        {/* =========================================
            BAGIAN 2: ALAMAT RUMAH
        ========================================= */}
        <div className="border-t border-gray-100 pt-6 mt-6" />
        <SeksiForm judul="2. Alamat Rumah" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Field label="Status Rumah" htmlFor="status_rumah">
            <input id="status_rumah" type="text" value={form.status_rumah} onChange={(e) => handleChange("status_rumah", e.target.value)} className={cls} />
          </Field>
          <Field label="Kode Pos" htmlFor="kode_pos">
            <input id="kode_pos" type="text" value={form.kode_pos} onChange={(e) => handleChange("kode_pos", e.target.value)} className={cls} />
          </Field>
          <Field label="Provinsi" htmlFor="provinsi">
            <input id="provinsi" type="text" value={form.provinsi} onChange={(e) => handleChange("provinsi", e.target.value)} className={cls} />
          </Field>
          <Field label="Kabupaten / Kota" htmlFor="kabupaten_kota">
            <input id="kabupaten_kota" type="text" value={form.kabupaten_kota} onChange={(e) => handleChange("kabupaten_kota", e.target.value)} className={cls} />
          </Field>
          <Field label="Kecamatan" htmlFor="kecamatan">
            <input id="kecamatan" type="text" value={form.kecamatan} onChange={(e) => handleChange("kecamatan", e.target.value)} className={cls} />
          </Field>
          <Field label="Kelurahan / Desa" htmlFor="kelurahan_desa">
            <input id="kelurahan_desa" type="text" value={form.kelurahan_desa} onChange={(e) => handleChange("kelurahan_desa", e.target.value)} className={cls} />
          </Field>
          <Field label="RT" htmlFor="rt">
            <input id="rt" type="text" value={form.rt} onChange={(e) => handleChange("rt", e.target.value)} className={cls} />
          </Field>
          <Field label="RW" htmlFor="rw">
            <input id="rw" type="text" value={form.rw} onChange={(e) => handleChange("rw", e.target.value)} className={cls} />
          </Field>
          <Field label="Alamat Lengkap" htmlFor="alamat_lengkap" fullWidth>
            <textarea id="alamat_lengkap" rows={2} value={form.alamat_lengkap} onChange={(e) => handleChange("alamat_lengkap", e.target.value)} className={cls} />
          </Field>
        </div>

        {/* =========================================
            BAGIAN 3: DATA AYAH & IBU
        ========================================= */}
        <div className="border-t border-gray-100 pt-6 mt-6" />
        <SeksiForm judul="3. Data Orang Tua (Ayah & Ibu)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
          {/* Kolom Ayah */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Ayah Kandung</h4>
            <div className="space-y-3">
              <Field label="NIK Ayah *" htmlFor="nik_ayah">
                <input id="nik_ayah" type="text" value={form.nik_ayah} onChange={(e) => handleChange("nik_ayah", e.target.value)} className={cls} />
              </Field>
              <Field label="Nama Ayah *" htmlFor="nama_ayah">
                <input id="nama_ayah" type="text" value={form.nama_ayah} onChange={(e) => handleChange("nama_ayah", e.target.value)} className={cls} />
              </Field>
              <Field label="Status Hidup" htmlFor="status_hidup_ayah">
                <select id="status_hidup_ayah" value={form.status_hidup_ayah} onChange={(e) => handleChange("status_hidup_ayah", e.target.value)} className={cls}>
                  <option value="Hidup">Hidup</option>
                  <option value="Meninggal">Meninggal</option>
                </select>
              </Field>
              <Field label="Pekerjaan" htmlFor="pekerjaan_utama_ayah">
                <input id="pekerjaan_utama_ayah" type="text" value={form.pekerjaan_utama_ayah} onChange={(e) => handleChange("pekerjaan_utama_ayah", e.target.value)} className={cls} />
              </Field>
              <Field label="No HP" htmlFor="nomor_hp_ayah">
                <input id="nomor_hp_ayah" type="tel" value={form.nomor_hp_ayah} onChange={(e) => handleChange("nomor_hp_ayah", e.target.value)} className={cls} />
              </Field>
            </div>
          </div>
          
          {/* Kolom Ibu */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Ibu Kandung</h4>
            <div className="space-y-3">
              <Field label="NIK Ibu *" htmlFor="nik_ibu">
                <input id="nik_ibu" type="text" value={form.nik_ibu} onChange={(e) => handleChange("nik_ibu", e.target.value)} className={cls} />
              </Field>
              <Field label="Nama Ibu *" htmlFor="nama_ibu">
                <input id="nama_ibu" type="text" value={form.nama_ibu} onChange={(e) => handleChange("nama_ibu", e.target.value)} className={cls} />
              </Field>
              <Field label="Status Hidup" htmlFor="status_hidup_ibu">
                <select id="status_hidup_ibu" value={form.status_hidup_ibu} onChange={(e) => handleChange("status_hidup_ibu", e.target.value)} className={cls}>
                  <option value="Hidup">Hidup</option>
                  <option value="Meninggal">Meninggal</option>
                </select>
              </Field>
              <Field label="Pekerjaan" htmlFor="pekerjaan_utama_ibu">
                <input id="pekerjaan_utama_ibu" type="text" value={form.pekerjaan_utama_ibu} onChange={(e) => handleChange("pekerjaan_utama_ibu", e.target.value)} className={cls} />
              </Field>
              <Field label="No HP" htmlFor="nomor_hp_ibu">
                <input id="nomor_hp_ibu" type="tel" value={form.nomor_hp_ibu} onChange={(e) => handleChange("nomor_hp_ibu", e.target.value)} className={cls} />
              </Field>
            </div>
          </div>
        </div>

        {/* =========================================
            BAGIAN 4: DATA WALI & KELUARGA
        ========================================= */}
        <div className="border-t border-gray-100 pt-6 mt-6" />
        <SeksiForm judul="4. Wali & Info Keluarga" />
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.ada_wali} onChange={(e) => handleChange("ada_wali", e.target.checked)} className="w-4 h-4 text-green-600 rounded" />
            Santri ini memiliki Wali (selain Ayah/Ibu)
          </label>
        </div>
        
        {form.ada_wali && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Field label="NIK Wali" htmlFor="nik_wali">
              <input id="nik_wali" type="text" value={form.nik_wali} onChange={(e) => handleChange("nik_wali", e.target.value)} className={cls} />
            </Field>
            <Field label="Nama Wali" htmlFor="nama_wali">
              <input id="nama_wali" type="text" value={form.nama_wali} onChange={(e) => handleChange("nama_wali", e.target.value)} className={cls} />
            </Field>
            <Field label="Hubungan / Posisi Wali" htmlFor="posisi_wali">
              <input id="posisi_wali" type="text" value={form.posisi_wali} onChange={(e) => handleChange("posisi_wali", e.target.value)} placeholder="Cth: Kakek, Paman" className={cls} />
            </Field>
            <Field label="No HP Wali" htmlFor="nomor_hp_wali">
              <input id="nomor_hp_wali" type="text" value={form.nomor_hp_wali} onChange={(e) => handleChange("nomor_hp_wali", e.target.value)} className={cls} />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Field label="Penghasilan Gabungan (Orang Tua)" htmlFor="penghasilan_gabungan">
            <select id="penghasilan_gabungan" value={form.penghasilan_gabungan} onChange={(e) => handleChange("penghasilan_gabungan", e.target.value)} className={cls}>
              <option value="">-- Pilih --</option>
              <option value="< 1 Juta">&lt; Rp 1.000.000</option>
              <option value="1 - 3 Juta">Rp 1.000.000 - Rp 3.000.000</option>
              <option value="3 - 5 Juta">Rp 3.000.000 - Rp 5.000.000</option>
              <option value="> 5 Juta">&gt; Rp 5.000.000</option>
            </select>
          </Field>
          <Field label="Catatan Tambahan" htmlFor="catatan">
            <input id="catatan" type="text" value={form.catatan} onChange={(e) => handleChange("catatan", e.target.value)} className={cls} />
          </Field>
        </div>


        {/* Banner error / sukses */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <FaExclamationTriangle />
            <span>Error: {error}</span>
          </div>
        )}
        {sukses && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <FaCheckCircle />
            <span>Sukses: {sukses}</span>
          </div>
        )}

        {/* ── Tombol aksi ── */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <button type="button" onClick={onBatal}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Batal
          </button>
          <button type="submit" disabled={menyimpan}
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-lg transition-colors shadow-sm">
            {menyimpan ? "Menyimpan..." : modeEdit ? "Simpan Perubahan" : "Simpan Data Santri"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helper style input ──
const cls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm";

// ── Helper: judul seksi ──
function SeksiForm({ judul }: { judul: string }) {
  return (
    <h3 className="text-sm font-bold text-green-700 uppercase tracking-widest mb-4 bg-green-50 py-2 px-3 rounded-lg border border-green-100">
      {judul}
    </h3>
  );
}

// ── Helper: wrapper label + input ──
interface FieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}
function Field({ label, htmlFor, children, fullWidth }: FieldProps) {
  return (
    <div className={fullWidth ? "col-span-1 md:col-span-2" : ""}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
