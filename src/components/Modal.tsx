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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onBatal} // klik di luar modal = batal
    >
      {/* Card modal — stopPropagation supaya klik di dalam tidak tutup modal */}
      <div
        className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{judul}</h2>
        <p className="text-gray-600 text-sm mb-6">{pesan}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onBatal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onKonfirmasi}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            {labelKonfirmasi}
          </button>
        </div>
      </div>
    </div>
  );
}
