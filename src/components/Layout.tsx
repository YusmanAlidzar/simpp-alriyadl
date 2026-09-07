// Layout.tsx — Shell utama aplikasi: sidebar navigasi + area konten
import React, { useEffect, useState } from "react";
import { FaHome, FaUser, FaUserPlus, FaHistory, FaSync, FaSun, FaMoon } from 'react-icons/fa';

interface LayoutProps {
  children: React.ReactNode;
  halamanAktif: string;
  onNavigasi: (halaman: string) => void;
}

export default function Layout({ children, halamanAktif, onNavigasi }: LayoutProps) {
  // ── Dark mode state ──
  // Default: light mode. Pakai localStorage untuk persistensi pilihan user.
  // TIDAK pakai window.matchMedia (OS preference) karena WebView2/Tauri bisa
  // mengembalikan 'dark' permanen → menyebabkan mode terkunci.
  // Key: 'simpp-ui-theme' (berbeda dari versi lama 'simpp-theme' yang mungkin
  // menyimpan nilai 'dark' akibat deteksi OS — ini mereset state secara bersih).
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('simpp-ui-theme');
    return saved === 'dark'; // Jika key tidak ada → false (light)
  });

  // Sinkronkan class "dark" di <html> setiap kali isDark berubah
  // PLUS: pastikan saat di-print selalu memakai Light Mode (hapus class dark sementara)
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('simpp-ui-theme', isDark ? 'dark' : 'light');

    // Event listener untuk print
    const handleBeforePrint = () => root.classList.remove('dark');
    const handleAfterPrint = () => { if (isDark) root.classList.add('dark'); };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isDark]);

  // Shortcut Ctrl+R untuk refresh general
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 print:block print:h-auto print:overflow-visible print:bg-white transition-colors duration-200">

      {/* ── Sidebar kiri ── */}
      <aside className="w-60 flex flex-col flex-shrink-0 select-none print:hidden"
        style={{ background: 'linear-gradient(180deg, #0A4F2C 0%, #0D6B3A 60%, #1A7A3B 100%)' }}>

        {/* Header sidebar: logo & nama app */}
        <div className="px-5 py-5 border-b border-pesantren-900/60">
          {/* Aksen emas atas */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-8 rounded-full" style={{ background: '#F0C030' }}></div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#F0C030' }}>SIMPP</p>
              <p className="text-base font-bold text-white leading-tight">AL-RIYADL</p>
            </div>
          </div>
          <p className="text-xs text-pesantren-300 leading-relaxed">
            Sistem Informasi Manajemen<br />Pondok Pesantren
          </p>
        </div>

        {/* Menu navigasi */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem
            icon={<FaHome size={14} />}
            label="Dashboard"
            aktif={halamanAktif === "laporan"}
            onClick={() => onNavigasi("laporan")}
          />
          <NavItem
            icon={<FaUser size={14} />}
            label="Daftar Santri"
            aktif={halamanAktif === "daftar"}
            onClick={() => onNavigasi("daftar")}
          />
          <NavItem
            icon={<FaUserPlus size={14} />}
            label="Tambah Santri"
            aktif={halamanAktif === "tambah"}
            onClick={() => onNavigasi("tambah")}
          />
          <NavItem
            icon={<FaHistory size={14} />}
            label="Backup & Restore"
            aktif={halamanAktif === "backup"}
            onClick={() => onNavigasi("backup")}
          />
        </nav>

        {/* Footer sidebar: dark mode + refresh + credit */}
        <div className="px-4 py-4 border-t border-pesantren-900/60 space-y-3">
          {/* Baris: toggle Dark Mode + Refresh berdampingan */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-pesantren-200 hover:text-white hover:bg-pesantren-800/60"
            >
              {isDark
                ? <FaSun size={13} style={{ color: '#F0C030' }} />
                : <FaMoon size={13} className="text-pesantren-300" />
              }
              <span className="text-xs">{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              title="Refresh Aplikasi (Ctrl+R)"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              style={{ background: '#F0C030', color: '#0A4F2C' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#D4A017')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F0C030')}
            >
              <FaSync size={10} />
              Refresh
            </button>
          </div>

          {/* Teks credit di paling bawah */}
          <p className="text-xs text-pesantren-500 text-left leading-relaxed">
            © 2026 Ali Ijat. All rights reserved.<br />Build: 07-09-2026 | v1.2.4
          </p>
        </div>
      </aside>

      {/* ── Area konten utama ── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 print:overflow-visible print:h-auto print:block print:w-full transition-colors duration-200">
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
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${aktif
        ? "text-pesantren-900 shadow-sm"
        : "text-pesantren-200 hover:text-white hover:bg-pesantren-800/60"
        }`}
      style={aktif ? { background: '#F0C030' } : {}}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
