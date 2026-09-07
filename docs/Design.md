# Design System — SIMPP Al-Riyadl

Dokumen ini mendefinisikan palet warna, tipografi, dan panduan visual untuk aplikasi **SIMPP Al-Riyadl** berdasarkan identitas visual logo Pondok Pesantren Al-Riyadl.

---

## Palet Warna (dari Logo)

Warna-warna berikut diambil langsung dari logo resmi Pondok Pesantren Al-Riyadl.

### Warna Utama (Primary — Hijau Pesantren)

| Token            | Hex       | Preview                             | Penggunaan                                        |
|------------------|-----------|--------------------------------------|---------------------------------------------------|
| `green-900`      | `#0A4F2C` | 🟩 Hijau sangat tua                 | Teks heading utama, sidebar background utama       |
| `green-800`      | `#0D6B3A` | 🟩 Hijau tua (dominan logo)         | Header sidebar, border aktif, teks nav aktif       |
| `green-700`      | `#1A7A3B` | 🟩 Hijau tua sedang                 | Tombol primary, hover state sidebar                |
| `green-600`      | `#2E9B4F` | 🟩 Hijau sedang (badan mihrab)      | Tombol primary default, badge aktif, aksen utama   |
| `green-500`      | `#45B066` | 🟩 Hijau cerah                      | Hover tombol, focus ring, ikon aktif               |
| `green-400`      | `#6BBE6B` | 🟩 Hijau muda (pilar logo)          | Background badge, highlight area                   |
| `green-100`      | `#DCFCE7` | 🟩 Hijau sangat muda                | Background kartu status "aktif", subtle highlight  |
| `green-50`       | `#F0FDF4` | 🟩 Hijau paling terang              | Background hover baris tabel, area ringan          |

### Warna Aksen (Accent — Emas/Kuning)

| Token            | Hex       | Preview                             | Penggunaan                                        |
|------------------|-----------|--------------------------------------|---------------------------------------------------|
| `gold-500`       | `#F0C030` | 🟨 Kuning emas (kaligrafi logo)     | Aksen dekoratif, ikon penting, label SIMPP         |
| `gold-400`       | `#F5D060` | 🟨 Kuning emas terang               | Hover aksen, badge peringatan                      |
| `gold-600`       | `#D4A017` | 🟨 Kuning emas gelap                | Teks aksen di atas background gelap                |
| `gold-100`       | `#FEF9C3` | 🟨 Kuning sangat muda               | Background peringatan, info highlight              |

### Warna Netral (Neutral — UI)

| Token            | Hex       | Penggunaan                                        |
|------------------|-----------|---------------------------------------------------|
| `slate-800`      | `#1E293B` | Sidebar background, teks heading gelap             |
| `slate-700`      | `#334155` | Border sidebar, separator                          |
| `slate-600`      | `#475569` | Teks body sekunder                                 |
| `slate-500`      | `#64748B` | Label form, placeholder, caption                   |
| `slate-400`      | `#94A3B8` | Ikon nonaktif, nomor urut                          |
| `slate-300`      | `#CBD5E1` | Border input form                                  |
| `slate-200`      | `#E2E8F0` | Border tabel, separator halus                      |
| `slate-100`      | `#F1F5F9` | Background area form                               |
| `slate-50`       | `#F8FAFC` | Background halaman utama                           |
| `white`          | `#FFFFFF` | Background kartu, tabel, modal                     |

### Warna Status (Semantik)

| Status     | Background   | Text         | Penggunaan                  |
|------------|-------------|-------------|------------------------------|
| Aktif      | `#DCFCE7`   | `#166534`   | Badge santri aktif           |
| Lulus      | `#DBEAFE`   | `#1D4ED8`   | Badge santri lulus           |
| Keluar     | `#FEE2E2`   | `#DC2626`   | Badge santri keluar          |
| Nonaktif   | `#F3F4F6`   | `#6B7280`   | Badge santri nonaktif        |
| Sukses     | `#DCFCE7`   | `#166534`   | Alert berhasil simpan        |
| Error      | `#FEE2E2`   | `#DC2626`   | Alert gagal / validasi error |
| Warning    | `#FEF9C3`   | `#92400E`   | Alert peringatan             |

---

## Tipografi

| Elemen            | Font Family                        | Weight   | Size        |
|-------------------|------------------------------------|----------|-------------|
| Body              | Inter, Avenir, Helvetica, sans     | 400      | 16px (1rem) |
| Heading (h2)      | Inter                              | 700 bold | 24px (1.5rem) |
| Subheading (h3)   | Inter                              | 600 semi | 14px (0.875rem) |
| Label Form        | Inter                              | 500 med  | 14px (0.875rem) |
| Tabel Header      | Inter                              | 600 semi | 14px (0.875rem) |
| Tabel Body        | Inter                              | 400      | 14px (0.875rem) |
| Badge / Tag       | Inter                              | 500 med  | 12px (0.75rem) |
| Caption / Hint    | Inter                              | 400      | 12px (0.75rem) |
| NIS (monospace)   | monospace                          | 400      | 12px (0.75rem) |

---

## Komponen Kunci

### Sidebar
- Background: `slate-800` (`#1E293B`)
- Teks judul app: `green-400` (`#6BBE6B`) + `gold-500` (`#F0C030`) untuk "SIMPP"
- Teks nama pesantren: `white` (`#FFFFFF`)
- Nav item aktif: `green-700` (`#1A7A3B`) bg + `white` text
- Nav item hover: `slate-700` (`#334155`) bg

### Tombol Primary
- Default: `green-600` (`#2E9B4F`) bg, `white` text
- Hover: `green-700` (`#1A7A3B`) bg
- Active/Pressed: `green-800` (`#0D6B3A`) bg

### Tombol Danger (Hapus)
- Default: `red-500` text, transparent bg
- Hover: `red-50` bg

### Form Input
- Border: `slate-300` (`#CBD5E1`)
- Focus ring: `green-500` (`#45B066`)
- Label: `slate-700` (`#334155`)

### Tabel
- Header bg: `slate-50` (`#F8FAFC`)
- Header border: `slate-200` (`#E2E8F0`)
- Row hover: `green-50` (`#F0FDF4`)
- Row border: `slate-100` (`#F1F5F9`)

---

## Pemetaan ke Tailwind CSS

Sebagian besar warna di atas sudah tersedia di palette bawaan Tailwind (`green-*`, `slate-*`).
Untuk warna **emas/kuning khas logo**, gunakan custom color di `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
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
        // Hijau pesantren (override jika perlu)
        pesantren: {
          900: '#0A4F2C',
          800: '#0D6B3A',
          700: '#1A7A3B',
          600: '#2E9B4F',
          500: '#45B066',
          400: '#6BBE6B',
        },
      },
    },
  },
};
```

---

## Catatan

- Warna hijau utama diambil dari **gradien mihrab** (area lengkung atas) pada logo.
- Warna emas diambil dari **kaligrafi Arab** (tulisan "Al-Riyadl") di tengah logo.
- Warna hijau tua diambil dari **teks latin** "PONDOK PESANTREN" dan **tulisan Arab** di bagian bawah.
- Prioritaskan kontras yang baik (WCAG AA) terutama untuk teks di atas background berwarna.
