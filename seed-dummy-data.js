const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Deteksi seluruh kemungkinan folder userData Electron
const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');

const targetDirs = [
  path.join(appData, 'e-RTS'),
  path.join(appData, 'e-rts'),
  path.join(appData, 'e-rapor-sementara')
];

// Pastikan direktori ada
targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
});

const targetDbPaths = targetDirs.map(dir => path.join(dir, 'database.sqlite'));

console.log('Target database paths:');
targetDbPaths.forEach(p => console.log(' - ' + p));

async function seedDatabase(dbFilePath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) return reject(err);
    });

    db.serialize(() => {
      // 1. Schema setup
      db.run(`CREATE TABLE IF NOT EXISTS school_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_name TEXT,
        headmaster_name TEXT,
        academic_year TEXT,
        semester TEXT,
        headmaster_nuptk TEXT,
        homeroom_name TEXT,
        homeroom_nuptk TEXT,
        class_name TEXT,
        print_place TEXT,
        print_date TEXT,
        logo_path TEXT,
        headmaster_sign_path TEXT,
        homeroom_sign_path TEXT,
        headmaster_id_type TEXT,
        homeroom_id_type TEXT,
        show_rank INTEGER DEFAULT 1
      )`);
      db.run(`ALTER TABLE school_info ADD COLUMN show_rank INTEGER DEFAULT 1`, (err) => {});

      db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nisn TEXT,
        name TEXT,
        gender TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        category TEXT DEFAULT 'Wajib'
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        subject_id INTEGER,
        original_score REAL,
        remedial_score REAL,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE,
        sakit INTEGER DEFAULT 0,
        izin INTEGER DEFAULT 0,
        tanpa_keterangan INTEGER DEFAULT 0,
        catatan TEXT,
        tanggapan_ortu TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )`);

      // 2. Clear old test data
      db.run(`DELETE FROM scores`);
      db.run(`DELETE FROM attendance`);
      db.run(`DELETE FROM students`);
      db.run(`DELETE FROM subjects`);
      db.run(`DELETE FROM school_info`);

      // 3. Insert School Info (Lengkap untuk menguji Setup Guard terbuka)
      db.run(`INSERT INTO school_info (
        school_name, headmaster_name, headmaster_id_type, headmaster_nuptk,
        academic_year, semester, homeroom_name, homeroom_id_type, homeroom_nuptk,
        class_name, print_place, print_date, logo_path, headmaster_sign_path, homeroom_sign_path, show_rank
      ) VALUES (
        'SMP Negeri 1 Merdeka Belajar',
        'Drs. H. Bambang Sudarsono, M.Pd.',
        'NIP',
        '197205141998021003',
        '2026/2027',
        'Ganjil',
        'Nur Wahid Mustofa, S.Pd.',
        'NUPTK',
        '8452761662200032',
        'VII-A',
        'Yogyakarta',
        '19 Oktober 2026',
        '', '', '', 1
      )`);

      // 4. Insert Mata Pelajaran (Kurikulum Merdeka)
      const subjects = [
        { name: 'Pendidikan Agama & Budi Pekerti', category: 'Wajib' },
        { name: 'Pendidikan Pancasila', category: 'Wajib' },
        { name: 'Bahasa Indonesia', category: 'Wajib' },
        { name: 'Matematika', category: 'Wajib' },
        { name: 'Ilmu Pengetahuan Alam (IPA)', category: 'Wajib' },
        { name: 'Ilmu Pengetahuan Sosial (IPS)', category: 'Wajib' },
        { name: 'Bahasa Inggris', category: 'Wajib' },
        { name: 'PJOK', category: 'Wajib' },
        { name: 'Informatika', category: 'Wajib' },
        { name: 'Seni dan Budaya', category: 'Wajib' },
        { name: 'Bahasa Jawa', category: 'Muatan Lokal' }
      ];

      const stmtSubj = db.prepare(`INSERT INTO subjects (name, category) VALUES (?, ?)`);
      subjects.forEach(s => stmtSubj.run(s.name, s.category));
      stmtSubj.finalize();

      // 5. Insert Siswa (10 Siswa VII-A)
      const students = [
        { nisn: '0081234501', name: 'Ahmad Fauzan Alfian', gender: 'L' },
        { nisn: '0081234502', name: 'Anisa Rahmawati Putri', gender: 'P' },
        { nisn: '0081234503', name: 'Bintang Pratama Nugraha', gender: 'L' },
        { nisn: '0081234504', name: 'Cantika Dewi Lestari', gender: 'P' },
        { nisn: '0081234505', name: 'Dimas Aryasatya Wibowo', gender: 'L' },
        { nisn: '0081234506', name: 'Eka Nurul Hidayati', gender: 'P' },
        { nisn: '0081234507', name: 'Fajar Ramadhan Saputra', gender: 'L' },
        { nisn: '0081234508', name: 'Gita Maharani Putri', gender: 'P' },
        { nisn: '0081234509', name: 'Hendra Setiawan', gender: 'L' },
        { nisn: '0081234510', name: 'Indah Permata Sari', gender: 'P' }
      ];

      const stmtStud = db.prepare(`INSERT INTO students (nisn, name, gender) VALUES (?, ?, ?)`);
      students.forEach(st => stmtStud.run(st.nisn, st.name, st.gender));
      stmtStud.finalize();

      // 6. Generate Realistic Scores & Attendance
      db.all(`SELECT id FROM students ORDER BY id ASC`, (err, studentRows) => {
        if (err) return reject(err);
        db.all(`SELECT id FROM subjects ORDER BY id ASC`, (err2, subjectRows) => {
          if (err2) return reject(err2);

          const stmtScore = db.prepare(`INSERT INTO scores (student_id, subject_id, original_score, remedial_score) VALUES (?, ?, ?, ?)`);
          const stmtAtt = db.prepare(`INSERT INTO attendance (student_id, sakit, izin, tanpa_keterangan, catatan, tanggapan_ortu) VALUES (?, ?, ?, ?, ?, ?)`);

          // Catatan wali kelas variatif
          const catatanList = [
            'Sangat aktif dalam diskusi kelas. Pertahankan prestasimu dan tetap rendah hati!',
            'Menunjukkan kemajuan yang sangat pesat dalam pemahaman konsep. Hebat!',
            'Rajin dan berdisiplin tinggi. Terus kembangkan minat dan bakatmu!',
            'Tingkatkan fokus saat jam pembelajaran dan jangan ragu untuk bertanya.',
            'Kemampuan akademik sangat baik, tingkatkan partisipasi dalam kerja kelompok.',
            'Pertahankan semangat belajarmu, rajin mengulang materi di rumah.',
            'Capaian belajar sudah baik, lebih teliti lagi saat mengerjakan tugas.',
            'Selalu ceria dan santun kepada guru. Belajar lebih giat lagi agar nilai maksimal.',
            'Memiliki potensi besar di bidang numerasi, tingkatkan konsistensi belajarmu.',
            'Siswa yang bertanggung jawab dan mandiri. Selamat atas hasil belajarmu!'
          ];

          studentRows.forEach((stud, sIdx) => {
            // Absensi
            const sakit = sIdx === 2 ? 2 : (sIdx === 6 ? 1 : 0);
            const izin = sIdx === 4 ? 1 : (sIdx === 8 ? 2 : 0);
            const alpa = sIdx === 7 ? 1 : 0;
            const catatan = catatanList[sIdx % catatanList.length];

            stmtAtt.run(stud.id, sakit, izin, alpa, catatan, '');

            // Nilai untuk setiap mapel
            subjectRows.forEach((subj, subIdx) => {
              // Simulasi variasi nilai:
              // Siswa ranking 1 (Anisa - sIdx 1) punya nilai 90-98
              // Siswa ranking bawah punya nilai 65-80 dengan remedial
              let baseScore = 78 + ((sIdx * 3 + subIdx * 7) % 18);
              if (sIdx === 1) baseScore = 92 + (subIdx % 7); // Juara 1
              if (sIdx === 3) baseScore = 88 + (subIdx % 9); // Juara 2
              if (sIdx === 0) baseScore = 85 + (subIdx % 8); // Juara 3

              let orig = baseScore;
              let rem = null;

              // Kasus khusus untuk pengujian:
              // Siswa sIdx 8 (Hendra) pada Mapel subIdx 3 (Matematika) memiliki nilai remidi:
              if (sIdx === 8 && subIdx === 3) {
                orig = 65;
                rem = 78;
              }
              // Siswa sIdx 6 (Fajar) pada Mapel subIdx 2 (B. Indonesia) tidak remidi (samakan):
              if (sIdx === 6 && subIdx === 2) {
                orig = 84;
                rem = 84;
              }
              // Kasus uji nilai 0: Siswa sIdx 9 pada mapel Informatika (tugas belum terkumpul):
              if (sIdx === 9 && subIdx === 8) {
                orig = 0;
                rem = null;
              }

              // Untuk membuat 1 mapel (Seni Budaya - subIdx 9) belum lengkap diinput nilainya
              // agar menguji kartu kuning di dashboard:
              if (subIdx === 9 && (sIdx === 4 || sIdx === 5)) {
                // Jangan masukkan nilai untuk siswa ini di mapel Seni Budaya
                return;
              }

              stmtScore.run(stud.id, subj.id, orig, rem);
            });
          });

          stmtScore.finalize();
          stmtAtt.finalize();

          db.close((closeErr) => {
            if (closeErr) return reject(closeErr);
            resolve();
          });
        });
      });
    });
  });
}

(async () => {
  for (const dbPath of targetDbPaths) {
    try {
      console.log(`Menyuntikkan data dummy ke: ${dbPath}...`);
      await seedDatabase(dbPath);
      console.log(`✓ Berhasil mengisi database di: ${dbPath}`);
    } catch (e) {
      console.error(`Gagal mengisi database di ${dbPath}:`, e.message);
    }
  }
  console.log('\n--- SEMUA DATA DUMMY BERHASIL DIBUAT ---');
})();

