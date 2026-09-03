// Layout.tsx — Shell utama aplikasi: sidebar navigasi + area konten
import React from "react";
import { FaHome, FaUser, FaUserPlus, FaHistory } from 'react-icons/fa';

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
          <p className="text-lg font-semibold text-white mt-0.5">AL-RIYADL</p>
          <p className="text-xs text-slate-400">Sistem Informasi Manajemen Pondok Pesantren</p>
        </div>

        {/* Menu navigasi */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem
            icon={<FaHome size={15} />}
            label="Dashboard"
            aktif={halamanAktif === "laporan"}
            onClick={() => onNavigasi("laporan")}
          />
          <NavItem
            icon={<FaUser size={15} />}
            label="Daftar Santri"
            aktif={halamanAktif === "daftar"}
            onClick={() => onNavigasi("daftar")}
          />
          <NavItem
            icon={<FaUserPlus size={15} />}
            label="Tambah Santri"
            aktif={halamanAktif === "tambah"}
            onClick={() => onNavigasi("tambah")}
          />
          <NavItem
            icon={<FaHistory size={15} />}
            label="Backup & Restore"
            aktif={halamanAktif === "backup"}
            onClick={() => onNavigasi("backup")}
          />
        </nav>

        {/* Footer sidebar */}
        <div className="px-5 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-500">Build: 01/09/2026 v1.1.0</p>
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
  icon?: React.ReactNode;
  label: string;
  aktif: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, aktif, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${aktif
        ? "bg-green-700 text-white"
        : "text-slate-300 hover:bg-slate-700 hover:text-white"
        }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
