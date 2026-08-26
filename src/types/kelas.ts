// Interface untuk data kelas dari database
export interface Kelas {
  id: number;
  nama_kelas: string;
  tingkat: string | null;
  created_at: string;
  updated_at: string;
}
