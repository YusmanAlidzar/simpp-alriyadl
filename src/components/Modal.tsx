// Modal.tsx — Dialog konfirmasi (dipakai untuk konfirmasi hapus santri, dll.)

interface ModalProps {
  judul: string;
  pesan: string;
  labelKonfirmasi?: string; // default: "Ya, Hapus"
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export default function Modal({
  judul,
  pesan,
  labelKonfirmasi = "Ya, Hapus",
  onKonfirmasi,
  onBatal,
}: ModalProps) {
  return (
    // Overlay gelap
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onBatal} // klik di luar modal = batal
    >
      {/* Card modal — stopPropagation supaya klik di dalam tidak tutup modal */}
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal dengan aksen warna pesantren */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 dark:text-red-400 text-lg">⚠</span>
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">{judul}</h2>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{pesan}</p>
        </div>

        <div className="flex gap-3 justify-end px-6 pb-6">
          <button
            onClick={onBatal}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onKonfirmasi}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
          >
            {labelKonfirmasi}
          </button>
        </div>
      </div>
    </div>
  );
}
