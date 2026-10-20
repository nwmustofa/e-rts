const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');

// Initialize SQLite database
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database opening error: ', err);
  else console.log('Database connected at', dbPath);
});

function setupDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS school_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_name TEXT,
      headmaster_name TEXT,
      academic_year TEXT,
      semester TEXT
    )`);
    // Alter table to add new columns (ignore error if exists)
    db.run(`ALTER TABLE school_info ADD COLUMN headmaster_nuptk TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN homeroom_name TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN homeroom_nuptk TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN class_name TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN print_place TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN print_date TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN logo_path TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN headmaster_sign_path TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN homeroom_sign_path TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN headmaster_id_type TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN homeroom_id_type TEXT`, (err) => {});
    db.run(`ALTER TABLE school_info ADD COLUMN show_rank INTEGER DEFAULT 1`, (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nisn TEXT,
      name TEXT
    )`);
    db.run(`ALTER TABLE students ADD COLUMN gender TEXT`, (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )`);
    db.run(`ALTER TABLE subjects ADD COLUMN category TEXT DEFAULT 'Wajib'`, (err) => {});

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
  });
}

setupDatabase();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('src/index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for database communication
ipcMain.handle('get-school-info', async () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM school_info LIMIT 1', (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
});

ipcMain.handle('save-school-info', async (event, data) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM school_info LIMIT 1', (err, row) => {
      if (err) return reject(err);
      if (row) {
        db.run(`UPDATE school_info SET 
          school_name=?, headmaster_name=?, headmaster_nuptk=?, 
          academic_year=?, semester=?, homeroom_name=?, 
          homeroom_nuptk=?, class_name=?, print_place=?, 
          print_date=?, logo_path=?, headmaster_sign_path=?, homeroom_sign_path=?, headmaster_id_type=?, homeroom_id_type=?, show_rank=? WHERE id=?`, 
          [
            data.schoolName, data.headmasterName, data.headmasterNuptk, 
            data.academicYear, data.semester, data.homeroomName, 
            data.homeroomNuptk, data.className, data.printPlace, 
            data.printDate, data.logoPath || '', data.headmasterSignPath || '', data.homeroomSignPath || '',
            data.headmasterIdType || 'NUPTK', data.homeroomIdType || 'NUPTK',
            data.showRank !== undefined ? (Number(data.showRank) ? 1 : 0) : 1,
            row.id
          ], 
          function(updateErr) {
            if (updateErr) reject(updateErr);
            else resolve(this.changes);
          });
      } else {
        db.run(`INSERT INTO school_info (
          school_name, headmaster_name, headmaster_nuptk, 
          academic_year, semester, homeroom_name, 
          homeroom_nuptk, class_name, print_place, print_date, logo_path, headmaster_sign_path, homeroom_sign_path, headmaster_id_type, homeroom_id_type, show_rank
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [
            data.schoolName, data.headmasterName, data.headmasterNuptk, 
            data.academicYear, data.semester, data.homeroomName, 
            data.homeroomNuptk, data.className, data.printPlace, 
            data.printDate, data.logoPath || '', data.headmasterSignPath || '', data.homeroomSignPath || '',
            data.headmasterIdType || 'NUPTK', data.homeroomIdType || 'NUPTK',
            data.showRank !== undefined ? (Number(data.showRank) ? 1 : 0) : 1
          ], 
          function(insertErr) {
            if (insertErr) reject(insertErr);
            else resolve(this.lastID);
          });
      }
    });
  });
});

// Add more IPC handlers for students, subjects, scores as needed
ipcMain.handle('get-students', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students ORDER BY name ASC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('add-student', async (event, data) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO students (nisn, name) VALUES (?, ?)', [data.nisn, data.name], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
});

ipcMain.handle('delete-student', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
});

ipcMain.handle('reset-students', async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('DELETE FROM scores');
      db.run('DELETE FROM attendance');
      db.run('DELETE FROM students');
      db.run('DELETE FROM sqlite_sequence WHERE name="students"');
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  });
});

ipcMain.handle('update-student', async (event, data) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE students SET nisn = ?, name = ?, gender = ? WHERE id = ?', 
      [data.nisn, data.name, data.gender, data.id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
});

ipcMain.handle('scan-excel-classes', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Pilih File Excel Data Siswa',
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
  });
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }

  if (filePaths && filePaths.length > 0) {
    try {
      const wb = xlsx.readFile(filePaths[0]);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const dataMatrix = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
      let headerRowIndex = 0;
      for (let i = 0; i < dataMatrix.length; i++) {
        const row = dataMatrix[i];
        if (Array.isArray(row) && row.includes('Nama') && row.includes('NISN')) {
          headerRowIndex = i;
          break;
        }
      }
      
      const headers = dataMatrix[headerRowIndex] || [];
      const rombelIdx = headers.findIndex(h => String(h).trim() === 'Rombel Saat Ini');
      
      const classes = new Set();
      for (let i = headerRowIndex + 1; i < dataMatrix.length; i++) {
        const rowArr = dataMatrix[i];
        if (!rowArr || rowArr.length === 0 || rowArr[0] === '') continue;
        
        const className = rombelIdx >= 0 ? rowArr[rombelIdx] : null;
        if (className) {
          classes.add(String(className).trim());
        }
      }
      
      return { filePath: filePaths[0], classes: Array.from(classes) };
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  return null;
});

ipcMain.handle('import-students-excel', async (event, dataParams) => {
  const { filePath, selectedClass } = dataParams || {};
  if (!filePath) return null;
  
  try {
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const dataMatrix = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
    
    let headerRowIndex = 0;
    for (let i = 0; i < dataMatrix.length; i++) {
      const row = dataMatrix[i];
      if (Array.isArray(row) && row.includes('Nama') && row.includes('NISN')) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = dataMatrix[headerRowIndex] || [];
    const data = [];
    for (let i = headerRowIndex + 1; i < dataMatrix.length; i++) {
      const rowArr = dataMatrix[i];
      if (!rowArr || rowArr.length === 0 || rowArr[0] === '') continue;
      
      const rowObj = {};
      headers.forEach((h, idx) => {
        if (h) rowObj[String(h).trim()] = rowArr[idx];
      });
      data.push(rowObj);
    }
    
    let importedCount = 0;
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare('INSERT INTO students (nisn, name, gender) VALUES (?, ?, ?)');
        
        for (const row of data) {
          // Filter by class if provided
          if (selectedClass && row['Rombel Saat Ini']) {
             if (String(row['Rombel Saat Ini']).trim() !== selectedClass) continue;
          }

          const nisn = row['NISN'] || row['nisn'] || '';
          const name = row['Nama'] || row['Nama Siswa'] || row['name'] || '';
          let gender = row['L/P'] || row['JK'] || row['Jenis Kelamin'] || row['gender'] || '';
          
          gender = gender.toString().toUpperCase().trim();
          if (gender === 'LAKI-LAKI') gender = 'L';
          if (gender === 'PEREMPUAN') gender = 'P';
          
          if (name) {
            stmt.run(String(nisn), name, gender);
            importedCount++;
          }
        }
        
        stmt.finalize();
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve(importedCount);
        });
      });
    });
  } catch (e) {
    console.error(e);
    return null;
  }
});

ipcMain.handle('get-subjects', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM subjects ORDER BY category DESC, name ASC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('add-subject', async (event, data) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO subjects (name, category) VALUES (?, ?)', [data.name, data.category], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
});

ipcMain.handle('delete-subject', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM subjects WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
});

ipcMain.handle('update-subject', async (event, data) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE subjects SET name = ?, category = ? WHERE id = ?', 
      [data.name, data.category, data.id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
});

ipcMain.handle('get-scores-by-subject', async (event, subjectId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT students.id as student_id, students.nisn, students.name, 
             scores.original_score, scores.remedial_score 
      FROM students 
      LEFT JOIN scores ON students.id = scores.student_id AND scores.subject_id = ?
      ORDER BY students.name ASC
    `;
    db.all(query, [subjectId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('save-scores-by-subject', async (event, { subjectId, scores }) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare('INSERT OR REPLACE INTO scores (id, student_id, subject_id, original_score, remedial_score) VALUES ((SELECT id FROM scores WHERE student_id = ? AND subject_id = ?), ?, ?, ?, ?)');
      
      for (const score of scores) {
        stmt.run(score.student_id, subjectId, score.student_id, subjectId, score.original_score, score.remedial_score);
      }
      
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if(err) reject(err);
        else resolve(true);
      });
    });
  });
});

ipcMain.handle('export-excel', async (event, { subjectName, className, scores }) => {
  const safeSubjectName = subjectName ? subjectName.replace(/[^a-zA-Z0-9 _-]/g, '') : 'Mapel';
  const safeClassName = className ? className.replace(/[^a-zA-Z0-9 _-]/g, '') : 'Kelas';
  
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Simpan Template Excel',
    defaultPath: `Template_Nilai_${safeSubjectName}_${safeClassName}.xlsx`,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  });
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }

  if (filePath) {
    // Format data for Excel (support score 0)
    const data = scores.map((s, i) => ({
      'No': i + 1,
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'Nilai Asli': (s.original_score !== null && s.original_score !== undefined) ? s.original_score : '',
      'Nilai Remidi': (s.remedial_score !== null && s.remedial_score !== undefined) ? s.remedial_score : ''
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Nilai");
    xlsx.writeFile(wb, filePath);
    return true;
  }
  return false;
});

ipcMain.handle('pick-image', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Pilih Gambar',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
  });
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }
  if (filePaths && filePaths.length > 0) {
    return filePaths[0]; // Return the local file path
  }
  return null;
});

ipcMain.handle('import-excel', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Pilih File Excel',
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
  });
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }

  if (filePaths && filePaths.length > 0) {
    const wb = xlsx.readFile(filePaths[0]);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);
    
    // Map Excel columns to our format (properly preserve score 0)
    return data.map(row => {
      const origVal = row['Nilai Asli'];
      const remVal = row['Nilai Remidi'];
      return {
        nisn: String(row['NISN'] || ''),
        name: row['Nama Siswa'] || '',
        original_score: (origVal !== undefined && origVal !== null && String(origVal).trim() !== '') ? Number(origVal) : null,
        remedial_score: (remVal !== undefined && remVal !== null && String(remVal).trim() !== '') ? Number(remVal) : null
      };
    });
  }
  return null;
});

ipcMain.handle('get-student-report', async (event, studentId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT subjects.name as subject_name, subjects.category, scores.original_score, scores.remedial_score
      FROM subjects
      LEFT JOIN scores ON subjects.id = scores.subject_id AND scores.student_id = ?
      ORDER BY subjects.category DESC, subjects.name ASC
    `;
    db.all(query, [studentId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('get-attendance', async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT students.id as student_id, students.nisn, students.name,
             attendance.sakit, attendance.izin, attendance.tanpa_keterangan,
             attendance.catatan, attendance.tanggapan_ortu
      FROM students
      LEFT JOIN attendance ON students.id = attendance.student_id
      ORDER BY students.name ASC
    `;
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
});

ipcMain.handle('save-attendance', async (event, attendanceData) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO attendance (id, student_id, sakit, izin, tanpa_keterangan, catatan, tanggapan_ortu)
        VALUES ((SELECT id FROM attendance WHERE student_id = ?), ?, ?, ?, ?, ?, ?)
      `);
      
      for (const data of attendanceData) {
        stmt.run(
          data.student_id, 
          data.student_id, 
          data.sakit || 0, 
          data.izin || 0, 
          data.tanpa_keterangan || 0, 
          data.catatan || '', 
          data.tanggapan_ortu || ''
        );
      }
      
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if(err) reject(err);
        else resolve(true);
      });
    });
  });
});

ipcMain.handle('get-attendance-by-student', async (event, studentId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM attendance WHERE student_id = ? LIMIT 1`;
    db.get(query, [studentId], (err, row) => {
      if (err) reject(err);
      else resolve(row || { sakit: 0, izin: 0, tanpa_keterangan: 0, catatan: '', tanggapan_ortu: '' });
    });
  });
});

ipcMain.handle('get-dashboard-stats', async () => {
  return new Promise((resolve, reject) => {
    const stats = {
      totalStudents: 0,
      totalBoys: 0,
      totalGirls: 0,
      totalSubjects: 0,
      totalScoresExpected: 0,
      totalScoresEntered: 0,
      totalRemedialEntered: 0,
      subjectsNeedsInput: [],
      subjectsComplete: []
    };

    db.serialize(() => {
      db.get('SELECT COUNT(*) as count, SUM(CASE WHEN gender="L" THEN 1 ELSE 0 END) as boys, SUM(CASE WHEN gender="P" THEN 1 ELSE 0 END) as girls FROM students', (err, row) => {
        if (!err && row) {
          stats.totalStudents = row.count || 0;
          stats.totalBoys = row.boys || 0;
          stats.totalGirls = row.girls || 0;
        }
      });

      db.all('SELECT id, name FROM subjects', (err, rows) => {
        if (!err && rows) {
          stats.totalSubjects = rows.length;
          stats.totalScoresExpected = stats.totalStudents * stats.totalSubjects;
          
          let checkedSubjects = 0;
          if (stats.totalSubjects === 0) {
            resolve(stats);
            return;
          }

          rows.forEach(subject => {
            db.get('SELECT COUNT(*) as entered, SUM(CASE WHEN remedial_score IS NOT NULL THEN 1 ELSE 0 END) as remedial FROM scores WHERE subject_id = ? AND original_score IS NOT NULL', [subject.id], (err2, r2) => {
              if (!err2 && r2) {
                const entered = r2.entered || 0;
                stats.totalScoresEntered += entered;
                stats.totalRemedialEntered += r2.remedial || 0;
                
                if (stats.totalStudents > 0 && entered >= stats.totalStudents) {
                  stats.subjectsComplete.push(subject.name);
                } else {
                  stats.subjectsNeedsInput.push(subject.name);
                }
              }
              
              checkedSubjects++;
              if (checkedSubjects === rows.length) {
                resolve(stats);
              }
            });
          });
        } else {
          resolve(stats);
        }
      });
    });
  });
});

ipcMain.handle('open-link', (event, url) => {
  shell.openExternal(url);
});

// --- BACKUP & RESTORE DATABASE ---
ipcMain.handle('backup-database', async () => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Simpan Cadangan Database e-RTS',
    defaultPath: `Backup_eRTS_${dateStr}.sqlite`,
    filters: [{ name: 'e-RTS Backup (*.sqlite)', extensions: ['sqlite', 'db'] }]
  });
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }

  if (filePath) {
    try {
      fs.copyFileSync(dbPath, filePath);
      return { success: true, filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  return { success: false, canceled: true };
});

ipcMain.handle('restore-database', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Pilih File Cadangan Database e-RTS',
    properties: ['openFile'],
    filters: [{ name: 'e-RTS Backup (*.sqlite)', extensions: ['sqlite', 'db'] }]
  });
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }

  if (filePaths && filePaths.length > 0) {
    const backupFile = filePaths[0];
    try {
      // Tutup koneksi database aktif
      await new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Timpa file database dengan cadangan
      fs.copyFileSync(backupFile, dbPath);

      // Buka kembali koneksi database
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Database opening error after restore:', err);
        else console.log('Database re-connected after restore');
      });
      setupDatabase();

      return { success: true };
    } catch (e) {
      // Jika gagal, pastikan koneksi tetap terbuka
      db = new sqlite3.Database(dbPath, () => {});
      return { success: false, error: e.message };
    }
  }
  return { success: false, canceled: true };
});

// --- LEGER NILAI & RANKING ---
ipcMain.handle('get-leger-data', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students ORDER BY name ASC', (err, students) => {
      if (err) return reject(err);
      db.all('SELECT * FROM subjects ORDER BY category DESC, name ASC', (err2, subjects) => {
        if (err2) return reject(err2);
        db.all('SELECT * FROM scores', (err3, allScores) => {
          if (err3) return reject(err3);

          const scoreMap = new Map();
          for (const s of (allScores || [])) {
            scoreMap.set(`${s.student_id}_${s.subject_id}`, s);
          }

          const studentRows = (students || []).map(student => {
            let total = 0;
            let scoredCount = 0;
            const subjectScores = {};

            for (const subj of (subjects || [])) {
              const sc = scoreMap.get(`${student.id}_${subj.id}`);
              let finalScore = null;
              let origScore = null;
              let remScore = null;

              if (sc) {
                if (sc.original_score !== null && sc.original_score !== undefined) {
                  origScore = sc.original_score;
                }
                if (sc.remedial_score !== null && sc.remedial_score !== undefined) {
                  remScore = sc.remedial_score;
                }
                // Nilai akhir: gunakan remidi jika ada, jika tidak gunakan nilai asli
                if (remScore !== null) {
                  finalScore = remScore;
                } else if (origScore !== null) {
                  finalScore = origScore;
                }
              }

              if (finalScore !== null) {
                total += finalScore;
                scoredCount++;
              }

              subjectScores[subj.id] = {
                original: origScore,
                remedial: remScore,
                final: finalScore
              };
            }

            const totalSubj = (subjects || []).length;
            const average = totalSubj > 0 ? (total / totalSubj) : 0;

            return {
              student,
              subjectScores,
              totalScore: Number(total.toFixed(2)),
              averageScore: Number(average.toFixed(2)),
              scoredCount
            };
          });

          // Peringkat berdasarkan totalScore tertinggi
          const sorted = [...studentRows].sort((a, b) => b.totalScore - a.totalScore);
          let currentRank = 1;
          for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i].totalScore < sorted[i - 1].totalScore) {
              currentRank = i + 1;
            }
            sorted[i].rank = currentRank;
          }

          // Lookup map untuk akses cepat ranking per student_id
          const rankMap = {};
          for (const item of sorted) {
            rankMap[item.student.id] = {
              rank: item.rank,
              totalScore: item.totalScore,
              averageScore: item.averageScore
            };
          }

          resolve({
            students: studentRows,
            subjects: subjects || [],
            totalStudents: (students || []).length,
            rankMap
          });
        });
      });
    });
  });
});

ipcMain.handle('export-leger-excel', async (event, { className, data }) => {
  const safeClassName = className ? className.replace(/[^a-zA-Z0-9 _-]/g, '') : 'Kelas';
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Simpan Leger Nilai Excel',
    defaultPath: `Leger_Nilai_${safeClassName}.xlsx`,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  });
  if (mainWindow) { mainWindow.focus(); mainWindow.webContents.focus(); }

  if (filePath) {
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Leger Nilai");
    xlsx.writeFile(wb, filePath);
    return true;
  }
  return false;
});
