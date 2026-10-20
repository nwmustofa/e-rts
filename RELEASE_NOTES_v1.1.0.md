# Catatan Rilis (Release Notes) - e-RTS v1.1.0

**Tanggal Rilis:** 19 Oktober 2026  
**Versi:** 1.1.0  
**Nama File Installer:** `Installer e-RTS 1.1.0 by SIGIE Lab.exe`  
**Pengembang:** SIGIE Lab by Nur Wahid Mustofa  

---

## 🌟 Ringkasan Pembaruan

Versi 1.1.0 hadir dengan fokus utama pada **peningkatan kestabilan aplikasi (menghilangkan kendala form freeze/terkunci)**, **dukungan penuh nilai nol (0)**, **fitur Leger Nilai & Ranking Kelas**, **pencadangan (Backup & Restore)**, serta **alur pengaturan awal yang lebih terarah**.

---

## 🐛 Perbaikan Bug & Stabilitas (Bug Fixes)

1. **Mengatasi Form & Input Terkunci / Keyboard Freeze:**
   - Menghapus seluruh pemanggilan `alert()` dan `confirm()` native Windows yang menyebabkan hilangnya fokus keyboard di Chromium/Electron.
   - Mengganti notifikasi dengan sistem *Floating In-App Toast* dan *Custom Modal Dialog* yang non-blocking.
   - Memperbaiki pemanggilan dialog file Electron (`showOpenDialog`/`showSaveDialog`) agar terikat ke jendela utama dan mengembalikan fokus input secara otomatis.
2. **Dukungan Penuh Nilai Nol (0):**
   - Memperbaiki logika nilai *falsy* pada form input nilai, template ekspor Excel, impor nilai dari Excel, dan tampilan lembar cetak rapor.
   - Nilai angka `0` kini diakui sebagai nilai yang sah dan tidak dianggap kosong.
3. **Notifikasi Tersimpan yang Lebih Elegan:**
   - Menghilangkan perubahan teks sementara pada tombol simpan dan menggantinya dengan notifikasi *toast* modern di sudut kanan atas layar.

---

## 🚀 Fitur Baru (New Features)

1. **Setup Guard & Alur Terarah:**
   - Menu operasional (Siswa, Mapel, Nilai, Kehadiran, Leger, Cetak) dikunci secara visual hingga pengguna melengkapi tab **Data Sekolah** dan **Pengaturan Cetak**.
   - Setelah pengaturan awal berhasil disimpan, aplikasi otomatis mengarahkan pengguna ke halaman **Dashboard**.
2. **Popup Dukungan Developer (Trakteer):**
   - Menampilkan popup interaktif apresiasi Trakteer:
     - Setelah pertama kali menyimpan pengaturan awal sekolah.
     - Setiap awal membuka aplikasi (jika sudah disetup).
     - Secara berkala setiap interval 1 jam.
3. **Tombol "Tidak Remedi":**
   - Menambahkan tombol satu klik di tabel penilaian untuk menyalin seluruh Nilai Asli ke Nilai Remidi bagi siswa yang tidak mengikuti remedial.
4. **Indikator Kelengkapan Mapel di Dashboard:**
   - Menambahkan kartu ringkasan hijau yang menampilkan daftar mata pelajaran yang telah 100% lengkap diinput nilainya.
5. **Menu Baru: Leger Nilai & Ranking Kelas:**
   - Menu **Leger Nilai** di sidebar yang menampilkan tabel matriks nilai seluruh siswa dan seluruh mata pelajaran dalam satu layar.
   - Perhitungan otomatis Total Nilai, Rata-Rata Nilai, dan Peringkat Kelas (dilengkapi lencana 🥇, 🥈, 🥉).
   - Tombol **Export Leger ke Excel** untuk mengunduh rekap nilai lengkap satu rombel.
6. **Format Cetak Rapor A4 Standar Arsip/Jilid & Kontrol Peringkat:**
   - Format cetak rapor dipadatkan pas **1 halaman penuh A4 (210 × 297 mm)** standar arsip/jilid dengan margin presisi: **Atas: 1.2 cm, Bawah: 1.25 cm, Kiri: 1.85 cm, Kanan: 1.85 cm**.
   - Rendering cetak pada skala asli **100% tanpa downscale**, teks peringkat kelas tampil utuh dalam satu baris lurus mendatar.
   - Kolom tanda tangan 2 tingkat (Orang Tua & Wali Kelas di atas sejajar, Kepala Sekolah di tengah bawah) dengan stempel digital otentik dan ruang nafas teks jabatan yang bersih.
   - Penambahan opsi **Tampilkan/Sembunyikan Peringkat Kelas** (dapat diatur global di Pengaturan Cetak maupun live toggle di menu Cetak Rapor), plus tombol pintasan pengaturan cetak.
   - Rekapitulasi Jumlah Nilai (Total), Rata-Rata, dan Peringkat tercantum rapi dan terbaca jelas.
7. **Fitur Backup & Restore Database:**
   - Tab baru di menu Pengaturan untuk mencadangkan database `.sqlite` ke direktori lokal (misal Flashdisk) dan memulihkan data kapan pun dibutuhkan.

---

## 📥 Panduan Unduh & Pasang

1. Unduh file `Installer e-RTS 1.1.0 by SIGIE Lab.exe` dari bagian Assets rilis ini.
2. Jalankan installer untuk memperbarui aplikasi e-RTS Anda ke versi 1.1.0. Data nilai dan pengaturan yang ada di komputer Anda akan tetap aman.

---

*Terima kasih atas dukungan seluruh Bapak/Ibu Guru dan Wali Kelas. Dukung terus karya lokal melalui:*  
👉 **[Traktir Kopi / Cendol di Trakteer](https://trakteer.id/nur_wahid_musthofa/gift)**

