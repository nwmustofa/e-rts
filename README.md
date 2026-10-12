# e-RTS (e-Rapor Tengah Semester)

<p align="center">
  <img src="icon.ico" alt="e-RTS Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Aplikasi Desktop Pengolahan Nilai & Cetak Rapor Tengah Semester Berbasis Kurikulum Merdeka</strong><br>
  <em>Cepat, Ringan, Praktis, dan 100% Offline</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6.svg?logo=windows&logoColor=white" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-29.x-47848F.svg?logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/SQLite-3-003B57.svg?logo=sqlite&logoColor=white" alt="SQLite">
</p>

---

## 📖 Tentang Aplikasi

**e-RTS (e-Rapor Tengah Semester)** adalah aplikasi desktop luring (*offline-first*) yang dirancang khusus untuk mempermudah Wali Kelas dan Guru Mata Pelajaran dalam mengolah nilai dan mencetak lembar rapor Penilaian/Sumatif Tengah Semester (PTS/STS).

Aplikasi ini mengutamakan kecepatan kerja, kemudahan migrasi data dari file Excel, serta keamanan privasi karena seluruh data tersimpan secara lokal di komputer pengguna tanpa memerlukan koneksi internet.

---

## ✨ Fitur Unggulan

- 🔒 **100% Offline & Mandiri:** Tidak membutuhkan koneksi internet atau server eksternal. Data tersimpan aman di database lokal SQLite.
- 📊 **Import Cepat dari Excel:**
  - Import data siswa sekaligus dengan deteksi otomatis kolom (NISN, Nama, Rombel/Kelas, Jenis Kelamin).
  - Download template Excel penilaian dan import kembali nilai siswa secara instan.
- 🖨️ **Tata Letak Cetak A4 Standar:**
  - Format cetak rapor yang rapi dan presisi di kertas A4.
  - Dilengkapi Kop Sekolah, Logo Sekolah, serta kolom Tanda Tangan & Stempel (Wali Kelas dan Kepala Sekolah).
- ⚡ **Batch Printing (Cetak Masal):**
  - Cetak rapor seluruh siswa dalam satu kelas hanya dengan sekali klik (*auto page-break*).
- 📈 **Dashboard Interaktif:**
  - Statistik pemantauan kelengkapan input nilai per mata pelajaran dan rekap kehadiran siswa.
- ⚙️ **Pengaturan Fleksibel:**
  - Mendukung input NUPTK maupun NIP untuk Kepala Sekolah dan Wali Kelas.
  - Pengaturan tempat dan tanggal pencetakan rapor yang dinamis.

---

## 🛠️ Teknologi yang Digunakan

- **Runtime:** [Electron](https://www.electronjs.org/)
- **Frontend:** HTML5, [Tailwind CSS](https://tailwindcss.com/), Vanilla JavaScript, [Lucide Icons](https://lucide.dev/)
- **Database:** [SQLite3](https://www.sqlite.org/) (Embedded Native Database)
- **Spreadsheet Engine:** [SheetJS (xlsx)](https://sheetjs.com/)
- **Packaging:** [electron-builder](https://www.electron.build/) (NSIS Windows Installer)

---

## 🚀 Memulai untuk Pengembangan (Development)

### Prasyarat
- [Node.js](https://nodejs.org/) (disarankan v18 ke atas)
- [Git](https://git-scm.com/)

### Langkah Instalasi

1. **Clone repository:**
   ```bash
   git clone https://github.com/nwmustofa/e-rts.git
   cd e-rts
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan aplikasi (Development mode):**
   ```bash
   npm start
   ```

---

## 📦 Membuat Installer Windows (.exe)

Untuk mem-build aplikasi menjadi file installer `.exe`:

```bash
npm run build
```

Hasil installer NSIS akan tersimpan di dalam folder `dist/` dengan nama:
`Installer e-RTS 1.0.0 by SIGIE Lab.exe`

---

## 📚 Panduan Pengguna

Buku panduan lengkap penggunaan aplikasi untuk Guru dan Wali Kelas tersedia di:
- Format HTML Siap Cetak: [`Panduan_Penggunaan_e-RTS.html`](./Panduan_Penggunaan_e-RTS.html)
- Format Markdown: [`Panduan_Penggunaan_e-RTS.md`](./Panduan_Penggunaan_e-RTS.md)

---

## 👨‍💻 Pengembang (Developer)

Dikembangkan dengan penuh dedikasi oleh:
**SIGIE Lab by Nur Wahid Mustofa**

### ☕ Dukung Pengembangan
Jika aplikasi ini bermanfaat dan membantu pekerjaan Anda di sekolah, Anda dapat mendukung pengembangan dan update fitur selanjutnya melalui:
👉 **[Traktir Kopi / Cendol di Trakteer](https://trakteer.id/nur_wahid_musthofa/gift)**

---

## 📄 Lisensi

Didistribusikan di bawah lisensi ISC. Silakan gunakan dan kembangkan untuk kebutuhan pendidikan.

