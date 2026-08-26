// App.tsx — Shell utama: mengatur navigasi antar halaman via state
// Tidak pakai React Router karena ini desktop app dengan halaman yang sedikit.
import { useState } from "react";
import Layout from "./components/Layout";
import DaftarSantri from "./pages/DaftarSantri";
import FormSantri from "./pages/FormSantri";
import Laporan from "./pages/Laporan";
import BackupRestore from "./pages/BackupRestore";

// Nama-nama halaman yang bisa aktif
type NamaHalaman = "daftar" | "tambah" | "edit" | "laporan" | "backup";

function App() {
  const [halaman, setHalaman]           = useState<NamaHalaman>("daftar");
  const [santriIdEdit, setSantriIdEdit] = useState<number | null>(null);

  function keEdit(id: number) {
    setSantriIdEdit(id);
    setHalaman("edit");
  }

  function keDaftar() {
    setSantriIdEdit(null);
    setHalaman("daftar");
  }

  function handleNavigasiSidebar(h: string) {
    if (h === "daftar")  keDaftar();
    if (h === "tambah")  { setSantriIdEdit(null); setHalaman("tambah"); }
    if (h === "laporan") setHalaman("laporan");
    if (h === "backup")  setHalaman("backup");
  }

  return (
    <Layout halamanAktif={halaman} onNavigasi={handleNavigasiSidebar}>
      {halaman === "daftar" && (
        <DaftarSantri onTambah={() => setHalaman("tambah")} onEdit={keEdit} />
      )}
      {(halaman === "tambah" || halaman === "edit") && (
        <FormSantri
          santriId={halaman === "edit" ? santriIdEdit : null}
          onSelesai={keDaftar}
          onBatal={keDaftar}
        />
      )}
      {halaman === "laporan" && <Laporan />}
      {halaman === "backup" && <BackupRestore onSelesaiRestore={keDaftar} />}
    </Layout>
  );
}

export default App;

