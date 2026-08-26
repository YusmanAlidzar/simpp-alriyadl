// Interface untuk data santri yang diambil dari database
// (termasuk field nama_kelas dari hasil JOIN dengan tabel kelas)
export interface Santri {
  id: number;
  nis: string | null;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P" | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  nama_orang_tua: string | null;
  no_hp_orang_tua: string | null;
  kelas_id: number | null;
  foto_path: string | null;
  status: "aktif" | "lulus" | "keluar" | "nonaktif";
  tanggal_masuk: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  // Dari LEFT JOIN dengan tabel kelas
  nama_kelas: string | null;
}

// Interface untuk state form (semua string karena berasal dari input HTML)
// Dikonversi ke tipe yang tepat saat disimpan ke database
export interface SantriForm {
  nis: string;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P" | "";
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  nama_orang_tua: string;
  no_hp_orang_tua: string;
  kelas_id: string; // string di form, dikonversi ke number saat save
  status: "aktif" | "lulus" | "keluar" | "nonaktif";
  tanggal_masuk: string;
  catatan: string;
}

// Nilai awal form kosong — dipakai saat mode tambah santri baru
export const FORM_KOSONG: SantriForm = {
  nis: "",
  nama_lengkap: "",
  jenis_kelamin: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  alamat: "",
  nama_orang_tua: "",
  no_hp_orang_tua: "",
  kelas_id: "",
  status: "aktif",
  tanggal_masuk: "",
  catatan: "",
};
