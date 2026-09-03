// Interface untuk data santri yang diambil dari database untuk ditampilkan di list
export interface Santri {
  nis: string;
  nik_santri: string;
  nama_santri: string;
  jenis_kelamin: "L" | "P" | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  tanggal_masuk: string | null;
  kelas_id: number | null;
  foto_santri: string | null;
  status: "aktif" | "lulus" | "keluar" | "nonaktif";
  
  // Dari JOIN dengan tabel lain
  nama_kelas: string | null;
  nama_ayah: string | null;
  nama_ibu: string | null;
  alamat: string | null; // Alamat lengkap
  nomor_hp_ortu: string | null; // Gabungan no hp ayah/ibu
}

// Interface untuk state form yang sangat besar
export interface SantriForm {
  // 1. data_input_santri
  nik_santri: string;
  nama_santri: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  tingkat_sekolah: string;
  jenis_kelamin: "L" | "P" | "";
  tanggal_masuk: string;
  jumlah_saudara: string;
  anak_ke: string;
  cita_cita: string;
  hobi: string;
  nomor_hp_santri: string;
  email_santri: string;
  foto_santri: string | null;
  
  // 2. daftar_santri
  nis: string;
  kelas_id: string; // dikonversi ke number saat save
  kelas_pengajian: string;
  kobong: string;
  status: "aktif" | "lulus" | "keluar" | "nonaktif";
  catatan: string;

  // 3. info_ortu_wali
  penghasilan_gabungan: string;
  // foto ktp & kk ditunda

  // 4. ayah_kandung
  nik_ayah: string;
  nama_ayah: string;
  tempat_lahir_ayah: string;
  tanggal_lahir_ayah: string;
  status_hidup_ayah: string; // e.g., "Hidup", "Meninggal"
  pendidikan_terakhir_ayah: string;
  pekerjaan_utama_ayah: string;
  nomor_hp_ayah: string;

  // 5. ibu_kandung
  nik_ibu: string;
  nama_ibu: string;
  tempat_lahir_ibu: string;
  tanggal_lahir_ibu: string;
  status_hidup_ibu: string;
  pendidikan_terakhir_ibu: string;
  pekerjaan_utama_ibu: string;
  nomor_hp_ibu: string;

  // 6. wali_santri
  ada_wali: boolean; // Field virtual untuk form UI
  nik_wali: string;
  nama_wali: string;
  tempat_lahir_wali: string;
  tanggal_lahir_wali: string;
  posisi_wali: string;
  pendidikan_terakhir_wali: string;
  pekerjaan_utama_wali: string;
  nomor_hp_wali: string;

  // 7. alamat_rumah
  status_rumah: string;
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  kelurahan_desa: string;
  rt: string;
  rw: string;
  alamat_lengkap: string;
  kode_pos: string;
}

// Nilai awal form kosong
export const FORM_KOSONG: SantriForm = {
  nik_santri: "",
  nama_santri: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  tingkat_sekolah: "",
  jenis_kelamin: "",
  tanggal_masuk: "",
  jumlah_saudara: "",
  anak_ke: "",
  cita_cita: "",
  hobi: "",
  nomor_hp_santri: "",
  email_santri: "",
  foto_santri: null,

  nis: "",
  kelas_id: "",
  kelas_pengajian: "",
  kobong: "",
  status: "aktif",
  catatan: "",

  penghasilan_gabungan: "",

  nik_ayah: "",
  nama_ayah: "",
  tempat_lahir_ayah: "",
  tanggal_lahir_ayah: "",
  status_hidup_ayah: "Hidup",
  pendidikan_terakhir_ayah: "",
  pekerjaan_utama_ayah: "",
  nomor_hp_ayah: "",

  nik_ibu: "",
  nama_ibu: "",
  tempat_lahir_ibu: "",
  tanggal_lahir_ibu: "",
  status_hidup_ibu: "Hidup",
  pendidikan_terakhir_ibu: "",
  pekerjaan_utama_ibu: "",
  nomor_hp_ibu: "",

  ada_wali: false,
  nik_wali: "",
  nama_wali: "",
  tempat_lahir_wali: "",
  tanggal_lahir_wali: "",
  posisi_wali: "",
  pendidikan_terakhir_wali: "",
  pekerjaan_utama_wali: "",
  nomor_hp_wali: "",

  status_rumah: "",
  provinsi: "",
  kabupaten_kota: "",
  kecamatan: "",
  kelurahan_desa: "",
  rt: "",
  rw: "",
  alamat_lengkap: "",
  kode_pos: "",
};
