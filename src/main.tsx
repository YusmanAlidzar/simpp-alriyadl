import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initDatabase } from "./lib/db";

// Inisialisasi database sebelum render React.
// Ini memastikan tabel sudah ada sebelum komponen manapun mencoba query.
initDatabase()
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((err) => {
    // Kalau database gagal dibuka, tampilkan error di layar
    // supaya mudah di-debug (jangan diam-diam gagal)
    console.error("[db] Gagal inisialisasi database:", err);
    document.body.innerHTML = `
      <div style="padding:2rem;font-family:sans-serif;color:red;">
        <h2>Gagal membuka database</h2>
        <pre>${err}</pre>
        <p>Coba restart aplikasi. Jika masih gagal, hubungi pengembang.</p>
      </div>
    `;
  });

