/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode dikendalikan via class "dark" pada <html>
  darkMode: 'class',
  // Scan semua file di src/ supaya Tailwind tahu class mana yang dipakai
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Warna emas/kuning dari kaligrafi logo Al-Riyadl ──
        gold: {
          50:  '#FFFBEB',
          100: '#FEF9C3',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F5D060',
          500: '#F0C030',
          600: '#D4A017',
          700: '#B8860B',
        },
        // ── Hijau pesantren dari logo Al-Riyadl ──
        pesantren: {
          50:  '#F0FDF6',
          100: '#DCFCE9',
          200: '#BBF7D3',
          300: '#86EFAC',
          400: '#6BBE6B',
          500: '#45B066',
          600: '#2E9B4F',
          700: '#1A7A3B',
          800: '#0D6B3A',
          900: '#0A4F2C',
          950: '#052E1A',
        },
      },
    },
  },
  plugins: [],
}
