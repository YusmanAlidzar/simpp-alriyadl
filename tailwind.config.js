/** @type {import('tailwindcss').Config} */
export default {
  // Scan semua file di src/ supaya Tailwind tahu class mana yang dipakai
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
