// Layout.tsx — Shell utama aplikasi: sidebar navigasi + area konten
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  halamanAktif: string;
  onNavigasi: (halaman: string) => void;
}

export default function Layout({ children, halamanAktif, onNavigasi }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">

      {/* ── Sidebar kiri ── */}
      <aside className="w-56 bg-slate-800 text-white flex flex-col flex-shrink-0 select-none print:hidden">

        {/* Header sidebar: nama app */}
        <div className="px-5 py-5 border-b border-slate-700">
          <p className="text-xs font-bold text-green-400 uppercase tracking-widest">SIMPP</p>
          <p className="text-lg font-semibold text-white mt-0.5">Al-Riyadl</p>
          <p className="text-xs text-slate-400">Pendataan Santri</p>
        </div>

        {/* Menu navigasi */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem
            label="📋  Daftar Santri"
            aktif={halamanAktif === "daftar"}
            onClick={() => onNavigasi("daftar")}
          />
          <NavItem
            label="➕  Tambah Santri"
            aktif={halamanAktif === "tambah"}
            onClick={() => onNavigasi("tambah")}
          />
          {/* Halaman lain ditambah di Tahap berikutnya */}
          <NavItem
            label="📄  Laporan & Cetak"
            aktif={halamanAktif === "laporan"}
            onClick={() => onNavigasi("laporan")}
          />
          <NavItem
            label="💾  Backup & Restore"
            aktif={halamanAktif === "backup"}
            onClick={() => onNavigasi("backup")}
          />
        </nav>

        {/* Footer sidebar */}
        <div className="px-5 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-500">Tahap 3 — CRUD Santri</p>
        </div>
      </aside>

      {/* ── Area konten utama ── */}
      <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto print:block print:w-full">
        {children}
      </main>
    </div>
  );
}

// ── Komponen kecil: item menu sidebar ──
interface NavItemProps {
  label: string;
  aktif: boolean;
  onClick: () => void;
}

function NavItem({ label, aktif, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        aktif
          ? "bg-green-700 text-white"
          : "text-slate-300 hover:bg-slate-700 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
