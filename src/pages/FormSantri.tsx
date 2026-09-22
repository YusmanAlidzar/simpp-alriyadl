// FormSantri.tsx — Form tambah / edit data santri (dengan fitur upload foto)
import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile, remove } from "@tauri-apps/plugin-fs";
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
import wilayahDataRaw from "../data/regions.json";

type RegionData = {
  name: string;
  regencies: {
    name: string;
    districts: string[];
  }[];
};
const wilayahData = wilayahDataRaw as RegionData[];

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
  // const [uploadFoto, setUploadFoto] = useState(false);
  const [tingkatTerpilih, setTingkatTerpilih] = useState<string>("");

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

      // Hapus foto lama secara fisik dari penyimpanan lokal jika sudah ada
      if (form.foto_santri) {
        try {
          const oldPath = await join(dir, form.foto_santri);
          await remove(oldPath);
        } catch (e) {
          console.warn("Gagal menghapus foto lama secara fisik:", e);
        }
      }

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
      // Hapus foto lama secara fisik dari penyimpanan lokal
      if (form.foto_santri) {
        try {
          const dir = await getFotoDirPath();
          const oldPath = await join(dir, form.foto_santri);
          await remove(oldPath);
        } catch (e) {
          console.warn("Gagal menghapus foto secara fisik:", e);
        }
      }

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

          if (dataSantri.kelas_id) {
            const foundKelas = daftarKelas.find(k => k.id.toString() === dataSantri.kelas_id?.toString());
            if (foundKelas && foundKelas.tingkat) {
              setTingkatTerpilih(foundKelas.tingkat);
            }
          }
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
    if (!form.nik_santri.trim() || form.nik_santri.length !== 16) return "NIK Santri wajib 16 digit.";
    if (!form.nama_santri.trim()) return "Nama Santri wajib diisi.";
    if (!form.nik_ayah.trim() || form.nik_ayah.length !== 16) return "NIK Ayah wajib 16 digit.";
    if (!form.nama_ayah.trim()) return "Nama Ayah wajib diisi.";
    if (!form.nik_ibu.trim() || form.nik_ibu.length !== 16) return "NIK Ibu wajib 16 digit.";
    if (!form.nama_ibu.trim()) return "Nama Ibu wajib diisi.";
    if (form.ada_wali && form.nik_wali && form.nik_wali.length !== 16) return "NIK Wali wajib 16 digit.";
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
    return <div className="p-6 pt-20 text-center text-slate-400 text-sm">Memuat data...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBatal}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-lg"
          title="Kembali ke daftar">
          <LuArrowLeft />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-pesantren-900 dark:text-pesantren-200">
            {modeEdit ? "Edit Data Santri" : "Pendaftaran Santri Baru"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">

        {/* =========================================
            FOTO SANTRI (Hanya Mode Edit)
        ========================================= */}
        {modeEdit && (
          <div className="mb-8 flex flex-col items-center sm:items-start sm:flex-row gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-24 h-32 rounded-lg bg-slate-200 border border-slate-300 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
              {fotoAbsolut ? (
                <img src={fotoAbsolut} alt="Foto Santri" className="w-full h-full object-cover" />
              ) : (
                <LuUser className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-2 text-center sm:text-left">
              <h3 className="font-semibold text-slate-700">Foto Profil Santri</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-1">
                Format yang didukung: JPG, PNG, WEBP. Maksimal ukuran file 2MB (disarankan).
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                <button
                  type="button"
                  onClick={handlePilihFoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
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
            <input id="nis" type="text" value={form.nis} disabled={modeEdit} onChange={(e) => handleChange("nis", e.target.value.replace(/[^\d.]/g, ""))} className={cls} />
          </Field>
          <Field label="NIK Santri *" htmlFor="nik_santri">
            <input id="nik_santri" type="text" maxLength={16} value={form.nik_santri} onChange={(e) => handleChange("nik_santri", e.target.value.replace(/\D/g, ""))} className={cls} />
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
            <select id="tingkat_sekolah" value={form.tingkat_sekolah} onChange={(e) => handleChange("tingkat_sekolah", e.target.value)} className={cls}>
              <option value="">-- Pilih Tingkat Sekolah --</option>
              <option value="Belum/Putus Sekolah">Belum/Putus Sekolah</option>
              <option value="PAUD/TK/sederajat">PAUD/TK/sederajat</option>
              <option value="SD/MI/sederajat">SD/MI/sederajat</option>
              <option value="SMP/MTs/sederajat">SMP/MTs/sederajat</option>
              <option value="SMA/MA/sederajat">SMA/MA/sederajat</option>
              <option value="Perguruan Tinggi">Perguruan Tinggi</option>
              <option value="Sudah Bekerja">Sudah Bekerja</option>
            </select>
          </Field>
          <Field label="Tingkat Kelas Pengajian" htmlFor="tingkat_pengajian">
            <select
              id="tingkat_pengajian"
              value={tingkatTerpilih}
              onChange={(e) => {
                setTingkatTerpilih(e.target.value);
                handleChange("kelas_id", "");
              }}
              className={cls}
            >
              <option value="">-- Pilih Tingkat --</option>
              <option value="Ibtida">Tingkat Ibtida</option>
              <option value="Wustho'">Tingkat Wustho'</option>
              <option value="Ulya">Tingkat Ulya</option>
              <option value="Takhosus">Tingkat Takhosus</option>
            </select>
          </Field>
          <Field label="Kelas Pengajian" htmlFor="kelas_id">
            <select
              id="kelas_id"
              value={form.kelas_id}
              onChange={(e) => handleChange("kelas_id", e.target.value)}
              className={cls}
              disabled={!tingkatTerpilih}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelas
                .filter((k) => k.tingkat === tingkatTerpilih)
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Kobong (Asrama)" htmlFor="kobong">
            <select
              id="kobong"
              value={form.kobong}
              onChange={(e) => handleChange("kobong", e.target.value)}
              className={cls}
              disabled={!form.jenis_kelamin}
            >
              <option value="">
                {form.jenis_kelamin
                  ? "-- Pilih Kobong --"
                  : "-- Pilih Jenis Kelamin Dahulu --"}
              </option>
              {form.jenis_kelamin === "L" && (
                <>
                  <option value="Imam Syafi'i">Imam Syafi'i</option>
                  <option value="Imam Hanafi">Imam Hanafi</option>
                  <option value="Imam Hambali">Imam Hambali</option>
                  <option value="Imam Maliki">Imam Maliki</option>
                  <option value="Al-Muqoddas">Al-Muqoddas</option>
                  <option value="Al-Qodir">Al-Qodir</option>
                  <option value="Abu Bakar Ash-Shidiq">Abu Bakar Ash-Shidiq</option>
                  <option value="Abu Dzar Al-Ghifari">Abu Dzar Al-Ghifari</option>
                  <option value="Umar bin Khattab">Umar bin Khattab</option>
                  <option value="Syekh Abdul Qodir Al-Jailani">Syekh Abdul Qodir Al-Jailani</option>
                  <option value="Imam Ghazali">Imam Ghazali</option>
                  <option value="Abu Hurairah">Abu Hurairah</option>
                  <option value="Ali bin Abi Thalib">Ali bin Abi Thalib</option>
                  <option value="Utsman bin Affan">Utsman bin Affan</option>
                </>
              )}
              {form.jenis_kelamin === "P" && (
                <>
                  <option value="Siti Fatimah">Siti Fatimah</option>
                  <option value="Siti Aisyah">Siti Aisyah</option>
                  <option value="Siti Aminah">Siti Aminah</option>
                  <option value="Siti Hafsoh">Siti Hafsoh</option>
                  <option value="Siti Robiah">Siti Robiah</option>
                  <option value="Siti Khodijah">Siti Khodijah</option>
                  <option value="Siti Hajar">Siti Hajar</option>
                  <option value="Siti Sarah">Siti Sarah</option>
                  <option value="Siti Hawa">Siti Hawa</option>
                  <option value="Siti Balqis">Siti Balqis</option>
                </>
              )}
            </select>
          </Field>
          <Field label="Tanggal Masuk" htmlFor="tanggal_masuk">
            <input id="tanggal_masuk" type="date" value={form.tanggal_masuk} onChange={(e) => handleChange("tanggal_masuk", e.target.value)} className={cls} />
          </Field>
          <Field label="No. HP Santri" htmlFor="nomor_hp_santri">
            <input
              id="nomor_hp_santri"
              type="tel"
              value={form.nomor_hp_santri}
              onChange={(e) => handleChange("nomor_hp_santri", e.target.value.replace(/\D/g, ""))}
              placeholder="Cth: 08123456789"
              className={cls}
            />
          </Field>
          <Field label="Anak Ke" htmlFor="anak_ke">
            <input
              id="anak_ke"
              type="number"
              min="1"
              max="99"
              value={form.anak_ke}
              onChange={(e) => handleChange("anak_ke", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className={cls}
            />
          </Field>
          <Field label="Jumlah Saudara" htmlFor="jumlah_saudara">
            <input
              id="jumlah_saudara"
              type="number"
              min="1"
              max="99"
              value={form.jumlah_saudara}
              onChange={(e) => handleChange("jumlah_saudara", e.target.value.replace(/\D/g, "").slice(0, 2))}
              className={cls}
            />
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
        <div className="border-t border-slate-100 pt-6 mt-6" />
        <SeksiForm judul="2. Alamat Rumah" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Field label="Status Rumah" htmlFor="status_rumah">
            <select id="status_rumah" value={form.status_rumah} onChange={(e) => handleChange("status_rumah", e.target.value)} className={cls}>
              <option value="">-- Pilih Status --</option>
              <option value="Milik Sendiri">Milik Sendiri</option>
              <option value="Sewa/Kontrak">Sewa/Kontrak</option>
              <option value="Menumpang">Menumpang</option>
              <option value="Asrama/Pesantren">Asrama/Pesantren</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </Field>
          <Field label="Kode Pos" htmlFor="kode_pos">
            <input id="kode_pos" type="text" maxLength={5} value={form.kode_pos} onChange={(e) => handleChange("kode_pos", e.target.value.replace(/\D/g, ""))} className={cls} />
          </Field>
          <Field label="Provinsi" htmlFor="provinsi">
            <select
              id="provinsi"
              value={form.provinsi}
              onChange={(e) => {
                handleChange("provinsi", e.target.value);
                handleChange("kabupaten_kota", "");
                handleChange("kecamatan", "");
              }}
              className={cls}
            >
              <option value="">-- Pilih Provinsi --</option>
              {wilayahData.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Kabupaten / Kota" htmlFor="kabupaten_kota">
            <select
              id="kabupaten_kota"
              value={form.kabupaten_kota}
              onChange={(e) => {
                handleChange("kabupaten_kota", e.target.value);
                handleChange("kecamatan", "");
              }}
              className={cls}
              disabled={!form.provinsi}
            >
              <option value="">-- Pilih Kabupaten --</option>
              {wilayahData
                .find(p => p.name === form.provinsi)
                ?.regencies.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
            </select>
          </Field>
          <Field label="Kecamatan" htmlFor="kecamatan">
            <select
              id="kecamatan"
              value={form.kecamatan}
              onChange={(e) => handleChange("kecamatan", e.target.value)}
              className={cls}
              disabled={!form.kabupaten_kota}
            >
              <option value="">-- Pilih Kecamatan --</option>
              {wilayahData
                .find(p => p.name === form.provinsi)
                ?.regencies.find(r => r.name === form.kabupaten_kota)
                ?.districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
            </select>
          </Field>
          <Field label="Kelurahan / Desa" htmlFor="kelurahan_desa">
            <input id="kelurahan_desa" type="text" value={form.kelurahan_desa} onChange={(e) => handleChange("kelurahan_desa", e.target.value.replace(/[^a-zA-Z\s.-]/g, ""))} className={cls} />
          </Field>
          <Field label="RT" htmlFor="rt">
            <input id="rt" type="text" maxLength={3} value={form.rt} onChange={(e) => handleChange("rt", e.target.value.replace(/\D/g, "").slice(0, 3))} className={cls} />
          </Field>
          <Field label="RW" htmlFor="rw">
            <input id="rw" type="text" maxLength={3} value={form.rw} onChange={(e) => handleChange("rw", e.target.value.replace(/\D/g, "").slice(0, 3))} className={cls} />
          </Field>
          <Field label="Alamat Lengkap" htmlFor="alamat_lengkap" fullWidth>
            <textarea id="alamat_lengkap" rows={2} value={form.alamat_lengkap} onChange={(e) => handleChange("alamat_lengkap", e.target.value)} className={cls} />
          </Field>
        </div>

        {/* =========================================
            BAGIAN 3: DATA AYAH & IBU
        ========================================= */}
        <div className="border-t border-slate-100 pt-6 mt-6" />
        <SeksiForm judul="3. Data Orang Tua (Ayah & Ibu)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
          {/* Kolom Ayah */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-3 border-b pb-2">Ayah Kandung</h4>
            <div className="space-y-3">
              <Field label="NIK Ayah *" htmlFor="nik_ayah">
                <input id="nik_ayah" type="text" maxLength={16} value={form.nik_ayah} onChange={(e) => handleChange("nik_ayah", e.target.value.replace(/\D/g, ""))} className={cls} />
              </Field>
              <Field label="Nama Ayah *" htmlFor="nama_ayah">
                <input id="nama_ayah" type="text" value={form.nama_ayah} onChange={(e) => handleChange("nama_ayah", e.target.value)} className={cls} />
              </Field>
              <Field label="Status Hidup" htmlFor="status_hidup_ayah">
                <select id="status_hidup_ayah" value={form.status_hidup_ayah} onChange={(e) => handleChange("status_hidup_ayah", e.target.value)} className={cls}>
                  <option value="Hidup">Hidup</option>
                  <option value="Meninggal">Meninggal</option>
                  <option value="Tidak Diketahui">Tidak Diketahui</option>
                </select>
              </Field>
              <Field label="Pekerjaan" htmlFor="pekerjaan_utama_ayah">
                <input id="pekerjaan_utama_ayah" type="text" value={form.pekerjaan_utama_ayah} onChange={(e) => handleChange("pekerjaan_utama_ayah", e.target.value)} className={cls} />
              </Field>
              <Field label="No. HP Ayah" htmlFor="nomor_hp_ayah">
                <input id="nomor_hp_ayah" type="tel" value={form.nomor_hp_ayah} onChange={(e) => handleChange("nomor_hp_ayah", e.target.value)} placeholder="Cth: 08123456789" className={cls} />
              </Field>
            </div>
          </div>

          {/* Kolom Ibu */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-3 border-b pb-2">Ibu Kandung</h4>
            <div className="space-y-3">
              <Field label="NIK Ibu *" htmlFor="nik_ibu">
                <input id="nik_ibu" type="text" maxLength={16} value={form.nik_ibu} onChange={(e) => handleChange("nik_ibu", e.target.value.replace(/\D/g, ""))} className={cls} />
              </Field>
              <Field label="Nama Ibu *" htmlFor="nama_ibu">
                <input id="nama_ibu" type="text" value={form.nama_ibu} onChange={(e) => handleChange("nama_ibu", e.target.value)} className={cls} />
              </Field>
              <Field label="Status Hidup" htmlFor="status_hidup_ibu">
                <select id="status_hidup_ibu" value={form.status_hidup_ibu} onChange={(e) => handleChange("status_hidup_ibu", e.target.value)} className={cls}>
                  <option value="Hidup">Hidup</option>
                  <option value="Meninggal">Meninggal</option>
                  <option value="Tidak Diketahui">Tidak Diketahui</option>
                </select>
              </Field>
              <Field label="Pekerjaan" htmlFor="pekerjaan_utama_ibu">
                <input id="pekerjaan_utama_ibu" type="text" value={form.pekerjaan_utama_ibu} onChange={(e) => handleChange("pekerjaan_utama_ibu", e.target.value)} className={cls} />
              </Field>
              <Field label="No. HP Ibu" htmlFor="nomor_hp_ibu">
                <input id="nomor_hp_ibu" type="tel" value={form.nomor_hp_ibu} onChange={(e) => handleChange("nomor_hp_ibu", e.target.value)} placeholder="Cth: 08123456789" className={cls} />
              </Field>
            </div>
          </div>
        </div>

        {/* =========================================
            BAGIAN 4: DATA WALI & KELUARGA
        ========================================= */}
        <div className="border-t border-slate-100 pt-6 mt-6" />
        <SeksiForm judul="4. Wali & Info Keluarga" />
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.ada_wali} onChange={(e) => handleChange("ada_wali", e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
            Santri ini memiliki Wali (selain Ayah/Ibu)
          </label>
        </div>

        {form.ada_wali && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Field label="NIK Wali" htmlFor="nik_wali">
              <input id="nik_wali" type="text" maxLength={16} value={form.nik_wali} onChange={(e) => handleChange("nik_wali", e.target.value.replace(/\D/g, ""))} className={cls} />
            </Field>
            <Field label="Nama Wali" htmlFor="nama_wali">
              <input id="nama_wali" type="text" value={form.nama_wali} onChange={(e) => handleChange("nama_wali", e.target.value)} className={cls} />
            </Field>
            <Field label="Hubungan / Posisi Wali" htmlFor="posisi_wali">
              <input id="posisi_wali" type="text" value={form.posisi_wali} onChange={(e) => handleChange("posisi_wali", e.target.value)} placeholder="Cth: Kakek, Paman" className={cls} />
            </Field>
            <Field label="No. HP Wali" htmlFor="nomor_hp_wali">
              <input id="nomor_hp_wali" type="text" value={form.nomor_hp_wali} onChange={(e) => handleChange("nomor_hp_wali", e.target.value)} placeholder="Cth: 08123456789" className={cls} />
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
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
            <FaCheckCircle />
            <span>Sukses: {sukses}</span>
          </div>
        )}

        {/* ── Tombol aksi ── */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={onBatal}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            Batal
          </button>
          <button type="submit" disabled={menyimpan}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors shadow-sm">
            {menyimpan ? "Menyimpan..." : modeEdit ? "Simpan Perubahan" : "Simpan Data Santri"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helper style input ──
const cls =
  "w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm";

// ── Helper: judul seksi ──
function SeksiForm({ judul }: { judul: string }) {
  return (
    <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-widest mb-4 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-100">
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
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
