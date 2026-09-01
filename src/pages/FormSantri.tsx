// FormSantri.tsx — Form tambah / edit data santri (dengan fitur upload foto)
import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { SantriForm } from "../types/santri";
import type { Kelas } from "../types/kelas";
import { FORM_KOSONG } from "../types/santri";
import { LuArrowLeft, LuUser } from "react-icons/lu";
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
  santriId: number | null; // null = mode tambah, number = mode edit
  onSelesai: () => void;   // dipanggil setelah simpan berhasil
  onBatal: () => void;     // dipanggil saat klik Batal
}

export default function FormSantri({ santriId, onSelesai, onBatal }: FormSantriProps) {
  const [form, setForm] = useState<SantriForm>(FORM_KOSONG);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  // State foto: simpan path absolut untuk display, dan path relatif untuk DB
  const [fotoAbsolut, setFotoAbsolut] = useState<string | null>(null);
  const [uploadFoto, setUploadFoto] = useState(false); // loading saat proses copy file

  const modeEdit = santriId !== null;

  // Load daftar kelas dan (kalau edit) data santri yang akan diedit
  useEffect(() => {
    setLoading(true);

    const promises = modeEdit
      ? Promise.all([getAllKelas(), getSantriById(santriId!)])
      : Promise.all([getAllKelas(), Promise.resolve(null)]);

    promises
      .then(([daftarKelas, dataSantri]) => {
        setKelas(daftarKelas);
        if (dataSantri) {
          setForm({
            nis: dataSantri.nis ?? "",
            nama_lengkap: dataSantri.nama_lengkap,
            jenis_kelamin: (dataSantri.jenis_kelamin ?? "") as SantriForm["jenis_kelamin"],
            tempat_lahir: dataSantri.tempat_lahir ?? "",
            tanggal_lahir: dataSantri.tanggal_lahir ?? "",
            alamat: dataSantri.alamat ?? "",
            nama_orang_tua: dataSantri.nama_orang_tua ?? "",
            no_hp_orang_tua: dataSantri.no_hp_orang_tua ?? "",
            kelas_id: dataSantri.kelas_id?.toString() ?? "",
            status: dataSantri.status,
            tanggal_masuk: dataSantri.tanggal_masuk ?? "",
            catatan: dataSantri.catatan ?? "",
          });
          // Jika sudah punya foto, resolve path absolut untuk ditampilkan
          if (dataSantri.foto_path) {
            resolvePathFoto(dataSantri.foto_path);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [santriId]);

  /**
   * Konversi path relatif (misal "photos/12.jpg") ke base64 data URL
   * menggunakan readFile dari plugin-fs — reliable di Windows.
   */
  async function resolvePathFoto(fotoPath: string) {
    try {
      const fotoDir = await getFotoDirPath();
      const namaFile = fotoPath.split("/").pop() ?? fotoPath;
      const pathAbsolut = await join(fotoDir, namaFile);
      const dataUrl = await fotoKeDataUrl(pathAbsolut);
      setFotoAbsolut(dataUrl);
    } catch (err) {
      console.error("Gagal resolve path foto:", err);
    }
  }

  /**
   * Buka file dialog → user pilih foto → copy ke photos/ → update DB.
   * Hanya bisa dilakukan di mode edit (santri sudah punya ID).
   */
  async function handlePilihFoto() {
    if (!santriId) return;

    try {
      // Buka dialog pilih file (filter hanya gambar)
      const dipilih = await open({
        multiple: false,
        filters: [
          { name: "Gambar", extensions: ["jpg", "jpeg", "png", "webp"] },
        ],
      });

      if (!dipilih) return; // user tutup dialog tanpa pilih

      setUploadFoto(true);

      // Tentukan nama file tujuan: <santri_id>.jpg
      const ext = (dipilih as string).split(".").pop()?.toLowerCase() ?? "jpg";
      const namaFileTujuan = `${santriId}.${ext}`;
      const fotoDir = await getFotoDirPath();
      const pathTujuan = await join(fotoDir, namaFileTujuan);

      // Salin file dari lokasi user ke folder photos/ aplikasi
      await copyFile(dipilih as string, pathTujuan);

      // Update path di database (simpan sebagai path relatif)
      const fotoPathRelatif = `photos/${namaFileTujuan}`;
      await updateFotoSantri(santriId, fotoPathRelatif);

      // Baca file yang baru disalin dan tampilkan sebagai base64
      const dataUrl = await fotoKeDataUrl(pathTujuan);
      setFotoAbsolut(dataUrl);
    } catch (err) {
      console.error("Gagal upload foto:", err);
      setError("Gagal mengunggah foto. Coba lagi.");
    } finally {
      setUploadFoto(false);
    }
  }

  /** Hapus foto santri: set foto_path = null di DB dan bersihkan tampilan. */
  async function handleHapusFoto() {
    if (!santriId) return;
    try {
      await updateFotoSantri(santriId, null);
      setFotoAbsolut(null);
    } catch (err) {
      console.error("Gagal hapus foto:", err);
    }
  }

  function handleChange(field: keyof SantriForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSukses(null);
  }

  function validasi(): string | null {
    if (!form.nama_lengkap.trim()) return "Nama lengkap wajib diisi.";
    if (!form.jenis_kelamin) return "Jenis kelamin wajib dipilih.";
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

      setTimeout(() => {
        onSelesai();
      }, 1500);
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.includes("UNIQUE") && msg.includes("nis")) {
        setError(`NIS "${form.nis}" sudah dipakai santri lain.`);
      } else {
        setError("Gagal menyimpan data. Coba lagi.");
        console.error(err);
      }
    } finally {
      setMenyimpan(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 pt-20 text-center text-gray-400 text-sm">Memuat data...</div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBatal}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-lg"
          title="Kembali ke daftar">
          <LuArrowLeft />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {modeEdit ? "Edit Santri" : "Tambah Santri"}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {modeEdit
              ? "Ubah data santri yang sudah ada"
              : "Isi form di bawah untuk menambah santri baru"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

        {/* ── Area Foto (hanya tampil di mode edit) ── */}
        {modeEdit && (
          <div className="flex items-start gap-5 mb-6 pb-6 border-b border-gray-100">
            {/* Preview foto atau placeholder */}
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center">
              {fotoAbsolut ? (
                <img
                  src={fotoAbsolut}
                  alt="Foto santri"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-gray-300"><LuUser /></span>
              )}
            </div>
            {/* Tombol upload/hapus foto */}
            <div className="flex flex-col gap-2 justify-center pt-1">
              <p className="text-sm font-medium text-gray-700">Foto Santri</p>
              <p className="text-xs text-gray-400">JPG, PNG, atau WEBP</p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handlePilihFoto}
                  disabled={uploadFoto}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-lg transition-colors"
                >
                  {uploadFoto ? "Mengunggah..." : fotoAbsolut ? "Ganti Foto" : "Pilih Foto"}
                </button>
                {fotoAbsolut && (
                  <button
                    type="button"
                    onClick={handleHapusFoto}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info: foto bisa ditambah setelah simpan */}
        {!modeEdit && (
          <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 text-xs">
            ⓘ Foto santri bisa ditambahkan setelah data disimpan, buka halaman Edit santri.
          </div>
        )}

        {/* ── Data Pokok ── */}
        <SeksiForm judul="Data Pokok" />
        <div className="grid grid-cols-2 gap-4 mb-7">
          <Field label="NIS" htmlFor="nis">
            <input id="nis" type="text" value={form.nis}
              onChange={(e) => handleChange("nis", e.target.value)}
              placeholder="Nomor Induk Santri" className={cls} />
          </Field>
          <Field label="Nama Lengkap *" htmlFor="nama_lengkap">
            <input id="nama_lengkap" type="text" value={form.nama_lengkap}
              onChange={(e) => handleChange("nama_lengkap", e.target.value)}
              placeholder="Nama lengkap santri" className={cls} />
          </Field>
          <Field label="Jenis Kelamin *" htmlFor="jenis_kelamin">
            <select id="jenis_kelamin" value={form.jenis_kelamin}
              onChange={(e) => handleChange("jenis_kelamin", e.target.value)}
              className={cls}>
              <option value="">-- Pilih --</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>
          <Field label="Kelas" htmlFor="kelas_id">
            <select id="kelas_id" value={form.kelas_id}
              onChange={(e) => handleChange("kelas_id", e.target.value)}
              className={cls}>
              <option value="">-- Pilih Kelas --</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="status">
            <select id="status" value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className={cls}>
              <option value="aktif">Aktif</option>
              <option value="lulus">Lulus</option>
              <option value="keluar">Keluar</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </Field>
          <Field label="Tanggal Masuk" htmlFor="tanggal_masuk">
            <input id="tanggal_masuk" type="date" value={form.tanggal_masuk}
              onChange={(e) => handleChange("tanggal_masuk", e.target.value)}
              className={cls} />
          </Field>
        </div>

        {/* ── Data Pribadi ── */}
        <SeksiForm judul="Data Pribadi" />
        <div className="grid grid-cols-2 gap-4 mb-7">
          <Field label="Tempat Lahir" htmlFor="tempat_lahir">
            <input id="tempat_lahir" type="text" value={form.tempat_lahir}
              onChange={(e) => handleChange("tempat_lahir", e.target.value)}
              placeholder="Kota tempat lahir" className={cls} />
          </Field>
          <Field label="Tanggal Lahir" htmlFor="tanggal_lahir">
            <input id="tanggal_lahir" type="date" value={form.tanggal_lahir}
              onChange={(e) => handleChange("tanggal_lahir", e.target.value)}
              className={cls} />
          </Field>
          <Field label="Alamat" htmlFor="alamat" fullWidth>
            <textarea id="alamat" rows={2} value={form.alamat}
              onChange={(e) => handleChange("alamat", e.target.value)}
              placeholder="Alamat lengkap santri"
              className={`${cls} resize-none`} />
          </Field>
        </div>

        {/* ── Data Orang Tua / Wali ── */}
        <SeksiForm judul="Data Orang Tua / Wali" />
        <div className="grid grid-cols-2 gap-4 mb-7">
          <Field label="Nama Orang Tua / Wali" htmlFor="nama_orang_tua">
            <input id="nama_orang_tua" type="text" value={form.nama_orang_tua}
              onChange={(e) => handleChange("nama_orang_tua", e.target.value)}
              placeholder="Nama ayah / ibu / wali" className={cls} />
          </Field>
          <Field label="No HP" htmlFor="no_hp_orang_tua">
            <input id="no_hp_orang_tua" type="tel" value={form.no_hp_orang_tua}
              onChange={(e) => handleChange("no_hp_orang_tua", e.target.value)}
              placeholder="08xx-xxxx-xxxx" className={cls} />
          </Field>
        </div>

        {/* ── Catatan ── */}
        <SeksiForm judul="Catatan" />
        <div className="mb-6">
          <Field label="Catatan tambahan" htmlFor="catatan" fullWidth>
            <textarea id="catatan" rows={3} value={form.catatan}
              onChange={(e) => handleChange("catatan", e.target.value)}
              placeholder="Catatan khusus tentang santri ini (opsional)"
              className={`${cls} resize-none`} />
          </Field>
        </div>

        {/* Banner error */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <FaExclamationTriangle />
            <span>Error: {error}</span>
          </div>
        )}

        {/* Banner sukses */}
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
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-lg transition-colors">
            {menyimpan ? "Menyimpan..." : modeEdit ? "Simpan Perubahan" : "Tambah Santri"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helper style input ──
const cls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

// ── Helper: judul seksi ──
function SeksiForm({ judul }: { judul: string }) {
  return (
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-1">
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
    <div className={fullWidth ? "col-span-2" : ""}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
