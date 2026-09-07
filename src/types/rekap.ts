// Interface untuk data rekap/statistik santri

/** Rekap per status (aktif, lulus, keluar, nonaktif) */
export interface RekapStatus {
  status: string;
  total: number;
  laki: number;
  perempuan: number;
}

/** Rekap per kelas (dari JOIN kelas + COUNT santri) */
export interface RekapKelas {
  kelas_id: number | null;
  nama_kelas: string | null;
  tingkat: string | null;
  total: number;
  laki: number;
  perempuan: number;
}

/** Rekap per atribut umum (Kobong / Tingkat Sekolah) */
export interface RekapAtribut {
  label: string | null;
  total: number;
  laki: number;
  perempuan: number;
}

/** Rekap keseluruhan: total + breakdown per status, kelas, kobong, tingkat sekolah */
export interface RekapSantri {
  totalSemua: number;
  totalLaki: number;
  totalPerempuan: number;
  perStatus: RekapStatus[];
  perKelas: RekapKelas[];
  perKobong: RekapAtribut[];
  perTingkatSekolah: RekapAtribut[];
}
