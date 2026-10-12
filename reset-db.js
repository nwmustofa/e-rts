const fs = require('fs');
const path = require('path');
const os = require('os');

const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'e-rapor-sementara', 'database.sqlite');

if (fs.existsSync(appDataPath)) {
  fs.unlinkSync(appDataPath);
  console.log('✅ Database berhasil dihapus! Silakan buka kembali aplikasi untuk simulasi dari awal.');
} else {
  console.log('⚠️ Database tidak ditemukan (mungkin sudah kosong atau belum terbuat).');
}

