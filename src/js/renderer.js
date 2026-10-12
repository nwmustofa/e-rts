(async () => {
  const initApp = async () => {
  const mainContent = document.getElementById('main-content');
  
  const navDashboard = document.getElementById('nav-dashboard');
  const navStudents = document.getElementById('nav-students');
  const navSettings = document.getElementById('nav-settings');
  
  let schoolInfoCache = null;

  async function init() {
    try {
      schoolInfoCache = await window.api.getSchoolInfo();
      if (schoolInfoCache) {
        document.getElementById('topbar-school-info').innerText = (schoolInfoCache.academic_year || '-') + ' - ' + (schoolInfoCache.semester || '-');
      }
      if (!schoolInfoCache) {
        renderSetupForm();
      } else {
        renderDashboard();
      }
    } catch (error) {
      console.error('Error loading school info:', error);
    }
  }

  const navIds = ['nav-dashboard', 'nav-students', 'nav-subjects', 'nav-scores', 'nav-attendance', 'nav-print', 'nav-settings'];
  
  function setActiveNav(activeId) {
    navIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeId) {
          el.classList.add('bg-blue-600', 'text-white');
          el.classList.remove('text-slate-300', 'hover:bg-slate-800');
        } else {
          el.classList.remove('bg-blue-600', 'text-white');
          el.classList.add('text-slate-300', 'hover:bg-slate-800');
        }
      }
    });
  }

  // --- Navigation Listeners ---
  if(navDashboard) navDashboard.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('nav-dashboard'); renderDashboard(); });
  if(navStudents) navStudents.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('nav-students'); renderStudents(); });
  if(navSettings) navSettings.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('nav-settings'); renderSetupForm(); });
  
  document.addEventListener('click', (e) => {
    if (e.target.id === 'nav-subjects' || e.target.closest('#nav-subjects')) {
      e.preventDefault();
      setActiveNav('nav-subjects');
      renderSubjects();
    } else if (e.target.id === 'nav-scores' || e.target.closest('#nav-scores')) {
      e.preventDefault();
      setActiveNav('nav-scores');
      renderScores();
    } else if (e.target.id === 'nav-attendance' || e.target.closest('#nav-attendance')) {
      e.preventDefault();
      setActiveNav('nav-attendance');
      renderAttendance();
    } else if (e.target.id === 'nav-print' || e.target.closest('#nav-print')) {
      e.preventDefault();
      setActiveNav('nav-print');
      renderPrint();
    }
  });

  // --- Render Functions ---

  async function renderDashboard() {
    setActiveNav('nav-dashboard');
    updateTopbarTitle('Dashboard');
    if(!schoolInfoCache) {
      renderSetupForm();
      return;
    }
    
    mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Memuat Data Dashboard...</p></div>`;
    lucide.createIcons();

    const stats = await window.api.getDashboardStats();
    
    const missingScores = stats.totalScoresExpected - stats.totalScoresEntered;
    let missingAlert = '';
    if (stats.subjectsNeedsInput.length > 0) {
      missingAlert = `
        <div class="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
          <div class="flex items-center gap-2 text-amber-800 font-bold mb-2">
            <i data-lucide="alert-triangle" class="w-5 h-5"></i> Mapel yang belum lengkap nilai:
          </div>
          <ul class="list-disc pl-8 text-amber-700 text-sm">
            ${stats.subjectsNeedsInput.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    mainContent.innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-sm">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Ringkasan Data Sekolah</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 p-5 rounded-lg border border-blue-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="bg-blue-500 p-3 rounded-full text-white"><i data-lucide="users" class="w-6 h-6"></i></div>
            <div>
              <p class="text-sm text-gray-500 font-semibold">Total Siswa</p>
              <p class="font-bold text-2xl text-gray-800">${stats.totalStudents}</p>
              <p class="text-xs text-gray-500">L: ${stats.totalBoys} | P: ${stats.totalGirls}</p>
            </div>
          </div>
          <div class="bg-emerald-50 p-5 rounded-lg border border-emerald-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="bg-emerald-500 p-3 rounded-full text-white"><i data-lucide="book-open" class="w-6 h-6"></i></div>
            <div>
              <p class="text-sm text-gray-500 font-semibold">Total Mapel</p>
              <p class="font-bold text-2xl text-gray-800">${stats.totalSubjects}</p>
            </div>
          </div>
          <div class="bg-purple-50 p-5 rounded-lg border border-purple-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="bg-purple-500 p-3 rounded-full text-white"><i data-lucide="check-circle" class="w-6 h-6"></i></div>
            <div>
              <p class="text-sm text-gray-500 font-semibold">Nilai Diinput</p>
              <p class="font-bold text-2xl text-gray-800">${stats.totalScoresEntered} <span class="text-sm font-normal text-gray-500">/ ${stats.totalScoresExpected}</span></p>
            </div>
          </div>
          <div class="bg-orange-50 p-5 rounded-lg border border-orange-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="bg-orange-500 p-3 rounded-full text-white"><i data-lucide="file-edit" class="w-6 h-6"></i></div>
            <div>
              <p class="text-sm text-gray-500 font-semibold">Nilai Remidi</p>
              <p class="font-bold text-2xl text-gray-800">${stats.totalRemedialEntered}</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-50 border border-slate-200 p-6 rounded-lg mb-6">
          <h3 class="font-bold text-lg mb-2 text-slate-800">Informasi Sekolah</h3>
          <div class="grid grid-cols-2 gap-y-2 text-sm text-slate-700">
            <div><span class="font-semibold w-32 inline-block">Nama Sekolah</span>: ${schoolInfoCache.school_name}</div>
            <div><span class="font-semibold w-32 inline-block">Kepala Sekolah</span>: ${schoolInfoCache.headmaster_name}</div>
            <div><span class="font-semibold w-32 inline-block">Tahun Ajaran</span>: ${schoolInfoCache.academic_year}</div>
            <div><span class="font-semibold w-32 inline-block">Wali Kelas</span>: ${schoolInfoCache.homeroom_name || '-'}</div>
            <div><span class="font-semibold w-32 inline-block">Semester</span>: ${schoolInfoCache.semester}</div>
            <div><span class="font-semibold w-32 inline-block">Kelas</span>: ${schoolInfoCache.class_name || '-'}</div>
          </div>
        </div>

        <div class="flex space-x-4">
          <button id="btn-to-students" class="bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-5 rounded-md flex items-center gap-2 shadow-sm font-medium transition-colors">
            <i data-lucide="users" class="w-4 h-4"></i> Data Siswa
          </button>
          <button id="btn-to-subjects" class="bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-5 rounded-md flex items-center gap-2 shadow-sm font-medium transition-colors">
            <i data-lucide="book-open" class="w-4 h-4"></i> Mata Pelajaran
          </button>
          <button id="btn-to-scores" class="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-md flex items-center gap-2 shadow-sm font-medium transition-colors">
            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Input Nilai
          </button>
        </div>

        ${missingAlert}
      </div>
    `;

    lucide.createIcons();

    document.getElementById('btn-to-students').addEventListener('click', renderStudents);
    document.getElementById('btn-to-subjects').addEventListener('click', renderSubjects);
    document.getElementById('btn-to-scores').addEventListener('click', renderScores);
  }

  function updateTopbarTitle(title) {
    const el = document.getElementById('topbar-title');
    if (el) el.innerText = title;
  }

  function renderSetupForm() {
    setActiveNav('nav-settings');
    updateTopbarTitle('Pengaturan');
    mainContent.innerHTML = `
      <div class="bg-white rounded-lg shadow-sm">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px px-6" aria-label="Tabs">
            <button id="tab-data-sekolah" class="text-blue-600 border-blue-600 font-semibold border-b-2 py-4 px-4">
              <div class="flex items-center gap-2"><i data-lucide="building-2" class="w-4 h-4"></i> Data Sekolah</div>
            </button>
            <button id="tab-cetak-rapor" class="text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4">
              <div class="flex items-center gap-2"><i data-lucide="printer" class="w-4 h-4"></i> Pengaturan Cetak</div>
            </button>
            <button id="tab-tentang" class="text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4">
              <div class="flex items-center gap-2"><i data-lucide="info" class="w-4 h-4"></i> Tentang Aplikasi</div>
            </button>
          </nav>
        </div>
        
        <form id="setup-form" class="p-8 space-y-6">
          
          <!-- TAB 1: DATA SEKOLAH -->
          <div id="section-data-sekolah" class="space-y-4">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Informasi Utama Sekolah</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Nama Sekolah</label>
                <input type="text" id="schoolName" value="${schoolInfoCache ? schoolInfoCache.school_name || '' : ''}" class="border rounded w-full py-2 px-3 text-gray-700" required>
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Nama Kepala Sekolah</label>
                <input type="text" id="headmasterName" value="${schoolInfoCache ? schoolInfoCache.headmaster_name || '' : ''}" class="border rounded w-full py-2 px-3 text-gray-700" required>
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">ID Kepala Sekolah</label>
                <div class="flex">
                  <select id="headmasterIdType" class="border rounded-l w-24 py-2 px-2 text-gray-700 bg-gray-50 border-r-0 outline-none">
                    <option value="NUPTK" ${schoolInfoCache?.headmaster_id_type === 'NUPTK' ? 'selected' : (!schoolInfoCache?.headmaster_id_type ? 'selected' : '')}>NUPTK</option>
                    <option value="NIP" ${schoolInfoCache?.headmaster_id_type === 'NIP' ? 'selected' : ''}>NIP</option>
                  </select>
                  <input type="text" id="headmasterNuptk" value="${schoolInfoCache ? schoolInfoCache.headmaster_nuptk || '' : ''}" class="border rounded-r w-full py-2 px-3 text-gray-700 outline-none">
                </div>
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Tahun Ajaran</label>
                <input type="text" id="academicYear" placeholder="2023/2024" value="${schoolInfoCache ? schoolInfoCache.academic_year || '' : ''}" class="border rounded w-full py-2 px-3 text-gray-700" required>
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Semester</label>
                <select id="semester" class="border rounded w-full py-2 px-3 text-gray-700">
                  <option value="Ganjil" ${schoolInfoCache?.semester === 'Ganjil' ? 'selected' : ''}>Ganjil</option>
                  <option value="Genap" ${schoolInfoCache?.semester === 'Genap' ? 'selected' : ''}>Genap</option>
                </select>
              </div>
            </div>
          </div>

          <!-- TAB 2: PENGATURAN CETAK -->
          <div id="section-cetak-rapor" class="space-y-4 hidden">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Atribut Rapor & Wali Kelas</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Nama Wali Kelas</label>
                <input type="text" id="homeroomName" value="${schoolInfoCache ? schoolInfoCache.homeroom_name || '' : ''}" class="border rounded w-full py-2 px-3 text-gray-700">
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">ID Wali Kelas</label>
                <div class="flex">
                  <select id="homeroomIdType" class="border rounded-l w-24 py-2 px-2 text-gray-700 bg-gray-50 border-r-0 outline-none">
                    <option value="NUPTK" ${schoolInfoCache?.homeroom_id_type === 'NUPTK' ? 'selected' : (!schoolInfoCache?.homeroom_id_type ? 'selected' : '')}>NUPTK</option>
                    <option value="NIP" ${schoolInfoCache?.homeroom_id_type === 'NIP' ? 'selected' : ''}>NIP</option>
                  </select>
                  <input type="text" id="homeroomNuptk" value="${schoolInfoCache ? schoolInfoCache.homeroom_nuptk || '' : ''}" class="border rounded-r w-full py-2 px-3 text-gray-700 outline-none">
                </div>
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Nama Kelas (Contoh: VII-A)</label>
                <input type="text" id="className" value="${schoolInfoCache ? schoolInfoCache.class_name || '' : ''}" class="border rounded w-full py-2 px-3 text-gray-700">
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Tempat Cetak (Contoh: Jakarta)</label>
                <input type="text" id="printPlace" value="${schoolInfoCache ? schoolInfoCache.print_place || '' : ''}" class="border rounded w-full py-2 px-3 text-gray-700">
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Tanggal Cetak (Contoh: 15 Oktober 2026)</label>
                <input type="text" id="printDate" value="${schoolInfoCache ? schoolInfoCache.print_date || '' : ''}" class="border rounded w-full py-2 px-3 text-gray-700">
              </div>
            </div>
            
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4 mt-8 border-t pt-6">Logo & Tanda Tangan</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Logo Sekolah -->
              <div class="border p-4 rounded bg-gray-50 flex flex-col items-center">
                <label class="block text-gray-700 text-sm font-bold mb-2 text-center">Logo Sekolah</label>
                <div class="w-32 h-32 border-2 border-dashed border-gray-300 bg-white mb-3 flex items-center justify-center overflow-hidden">
                  <img id="preview-logo" src="${schoolInfoCache && schoolInfoCache.logo_path ? 'file:///' + schoolInfoCache.logo_path.replace(/\\/g, '/') : ''}" class="${schoolInfoCache && schoolInfoCache.logo_path ? 'w-full h-full object-contain' : 'hidden'}" alt="Logo">
                  <span id="placeholder-logo" class="text-xs text-gray-400 text-center ${schoolInfoCache && schoolInfoCache.logo_path ? 'hidden' : ''}">Belum ada logo</span>
                </div>
                <input type="hidden" id="logoPath" value="${schoolInfoCache ? schoolInfoCache.logo_path || '' : ''}">
                <button type="button" id="btn-pick-logo" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-2 px-4 rounded w-full font-semibold">Pilih File Logo</button>
                <button type="button" id="btn-clear-logo" class="text-red-500 hover:text-red-700 text-xs mt-2 font-medium">Hapus</button>
              </div>

              <!-- Tanda Tangan Kepala Sekolah -->
              <div class="border p-4 rounded bg-gray-50 flex flex-col items-center">
                <label class="block text-gray-700 text-sm font-bold mb-2 text-center">Ttd. Kepala Sekolah</label>
                <div class="w-full h-24 border-2 border-dashed border-gray-300 bg-white mb-3 flex items-center justify-center overflow-hidden">
                  <img id="preview-kepsek" src="${schoolInfoCache && schoolInfoCache.headmaster_sign_path ? 'file:///' + schoolInfoCache.headmaster_sign_path.replace(/\\/g, '/') : ''}" class="${schoolInfoCache && schoolInfoCache.headmaster_sign_path ? 'w-full h-full object-contain' : 'hidden'}" alt="Ttd Kepsek">
                  <span id="placeholder-kepsek" class="text-xs text-gray-400 text-center ${schoolInfoCache && schoolInfoCache.headmaster_sign_path ? 'hidden' : ''}">Belum ada TTD</span>
                </div>
                <input type="hidden" id="headmasterSignPath" value="${schoolInfoCache ? schoolInfoCache.headmaster_sign_path || '' : ''}">
                <button type="button" id="btn-pick-kepsek" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-2 px-4 rounded w-full font-semibold">Pilih File TTD</button>
                <button type="button" id="btn-clear-kepsek" class="text-red-500 hover:text-red-700 text-xs mt-2 font-medium">Hapus</button>
              </div>

              <!-- Tanda Tangan Wali Kelas -->
              <div class="border p-4 rounded bg-gray-50 flex flex-col items-center">
                <label class="block text-gray-700 text-sm font-bold mb-2 text-center">Ttd. Wali Kelas</label>
                <div class="w-full h-24 border-2 border-dashed border-gray-300 bg-white mb-3 flex items-center justify-center overflow-hidden">
                  <img id="preview-walikelas" src="${schoolInfoCache && schoolInfoCache.homeroom_sign_path ? 'file:///' + schoolInfoCache.homeroom_sign_path.replace(/\\/g, '/') : ''}" class="${schoolInfoCache && schoolInfoCache.homeroom_sign_path ? 'w-full h-full object-contain' : 'hidden'}" alt="Ttd Wali Kelas">
                  <span id="placeholder-walikelas" class="text-xs text-gray-400 text-center ${schoolInfoCache && schoolInfoCache.homeroom_sign_path ? 'hidden' : ''}">Belum ada TTD</span>
                </div>
                <input type="hidden" id="homeroomSignPath" value="${schoolInfoCache ? schoolInfoCache.homeroom_sign_path || '' : ''}">
                <button type="button" id="btn-pick-walikelas" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-2 px-4 rounded w-full font-semibold">Pilih File TTD</button>
                <button type="button" id="btn-clear-walikelas" class="text-red-500 hover:text-red-700 text-xs mt-2 font-medium">Hapus</button>
              </div>
            </div>
          </div>

          <!-- TAB 3: TENTANG APLIKASI -->
          <div id="section-tentang" class="space-y-4 hidden">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Tentang Aplikasi</h3>
            <div class="bg-blue-50 border border-blue-100 p-6 rounded-lg text-center">
              <i data-lucide="graduation-cap" class="w-16 h-16 text-blue-500 mx-auto mb-4"></i>
              <h4 class="text-2xl font-bold text-gray-800">e-Rapor Tengah Semester</h4>
              <p class="text-gray-600 mb-4">Versi 1.0.0</p>
              
              <div class="text-sm text-gray-700 mb-6 space-y-2">
                <p><strong>Developer:</strong> SIGIE Lab by Nur Wahid Mustofa</p>
                <p><strong>Lisensi:</strong> Freeware</p>
              </div>

              <div class="bg-white p-4 rounded-lg inline-block border shadow-sm w-full max-w-md">
                <p class="font-bold text-gray-800 mb-2">Dukung Developer ❤️</p>
                <p class="text-sm text-gray-600 mb-4">Traktir Cendol untuk dukungan pengembangan dan update fitur selanjutnya:</p>
                <button type="button" id="btn-trakteer" class="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-colors w-full justify-center">
                  <i data-lucide="coffee" class="w-4 h-4"></i> Traktir Cendol di Trakteer
                </button>
              </div>
            </div>
          </div>

          <div id="save-settings-container" class="pt-4 flex justify-end border-t border-gray-200 mt-6">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-bold py-2 px-6 rounded shadow-sm">
              <i data-lucide="save" class="w-4 h-4"></i> Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    `;

    // Tab switching logic
    document.getElementById('tab-data-sekolah').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('section-data-sekolah').classList.remove('hidden');
      document.getElementById('section-cetak-rapor').classList.add('hidden');
      document.getElementById('section-tentang').classList.add('hidden');
      document.getElementById('save-settings-container').classList.remove('hidden');
      
      document.getElementById('tab-data-sekolah').className = "text-blue-600 border-blue-600 font-semibold border-b-2 py-4 px-4";
      document.getElementById('tab-cetak-rapor').className = "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4";
      document.getElementById('tab-tentang').className = "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4";
    });

    document.getElementById('tab-cetak-rapor').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('section-data-sekolah').classList.add('hidden');
      document.getElementById('section-cetak-rapor').classList.remove('hidden');
      document.getElementById('section-tentang').classList.add('hidden');
      document.getElementById('save-settings-container').classList.remove('hidden');
      
      document.getElementById('tab-cetak-rapor').className = "text-blue-600 border-blue-600 font-semibold border-b-2 py-4 px-4";
      document.getElementById('tab-data-sekolah').className = "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4";
      document.getElementById('tab-tentang').className = "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4";
    });

    document.getElementById('tab-tentang').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('section-data-sekolah').classList.add('hidden');
      document.getElementById('section-cetak-rapor').classList.add('hidden');
      document.getElementById('section-tentang').classList.remove('hidden');
      document.getElementById('save-settings-container').classList.add('hidden');
      
      document.getElementById('tab-tentang').className = "text-blue-600 border-blue-600 font-semibold border-b-2 py-4 px-4";
      document.getElementById('tab-data-sekolah').className = "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4";
      document.getElementById('tab-cetak-rapor').className = "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4";
    });

    document.getElementById('btn-trakteer').addEventListener('click', () => {
      if (window.api && window.api.openLink) {
        window.api.openLink('https://trakteer.id/nur_wahid_musthofa/gift');
      }
    });

    const handlePickImage = async (previewId, placeholderId, inputId) => {
      const path = await window.api.pickImage();
      if (path) {
        document.getElementById(inputId).value = path;
        document.getElementById(previewId).src = 'file:///' + path.replace(/\\/g, '/');
        document.getElementById(previewId).classList.remove('hidden');
        document.getElementById(placeholderId).classList.add('hidden');
      }
    };

    const handleClearImage = (previewId, placeholderId, inputId) => {
      document.getElementById(inputId).value = '';
      document.getElementById(previewId).src = '';
      document.getElementById(previewId).classList.add('hidden');
      document.getElementById(placeholderId).classList.remove('hidden');
    };

    document.getElementById('btn-pick-logo').addEventListener('click', () => handlePickImage('preview-logo', 'placeholder-logo', 'logoPath'));
    document.getElementById('btn-clear-logo').addEventListener('click', () => handleClearImage('preview-logo', 'placeholder-logo', 'logoPath'));
    
    document.getElementById('btn-pick-kepsek').addEventListener('click', () => handlePickImage('preview-kepsek', 'placeholder-kepsek', 'headmasterSignPath'));
    document.getElementById('btn-clear-kepsek').addEventListener('click', () => handleClearImage('preview-kepsek', 'placeholder-kepsek', 'headmasterSignPath'));
    
    document.getElementById('btn-pick-walikelas').addEventListener('click', () => handlePickImage('preview-walikelas', 'placeholder-walikelas', 'homeroomSignPath'));
    document.getElementById('btn-clear-walikelas').addEventListener('click', () => handleClearImage('preview-walikelas', 'placeholder-walikelas', 'homeroomSignPath'));

    document.getElementById('setup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        schoolName: document.getElementById('schoolName').value,
        headmasterName: document.getElementById('headmasterName').value,
        headmasterNuptk: document.getElementById('headmasterNuptk').value,
        academicYear: document.getElementById('academicYear').value,
        semester: document.getElementById('semester').value,
        homeroomName: document.getElementById('homeroomName').value,
        homeroomNuptk: document.getElementById('homeroomNuptk').value,
        className: document.getElementById('className').value,
        printPlace: document.getElementById('printPlace').value,
        printDate: document.getElementById('printDate').value,
        logoPath: document.getElementById('logoPath').value,
        headmasterSignPath: document.getElementById('headmasterSignPath').value,
        homeroomSignPath: document.getElementById('homeroomSignPath').value,
        headmasterIdType: document.getElementById('headmasterIdType').value,
        homeroomIdType: document.getElementById('homeroomIdType').value,
      };

      try {
        await window.api.saveSchoolInfo(data);
        
        schoolInfoCache = await window.api.getSchoolInfo();
        if (schoolInfoCache) {
          document.getElementById('topbar-school-info').innerText = schoolInfoCache.academic_year + ' - ' + schoolInfoCache.semester;
        }
        
        // Ubah tombol jadi indikator sukses agar tidak pakai alert() yang bikin bug focus di Electron
        const btn = document.querySelector('#setup-form button[type="submit"]');
        const origHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Tersimpan!`;
        btn.classList.replace('bg-blue-600', 'bg-green-600');
        btn.classList.replace('hover:bg-blue-700', 'hover:bg-green-700');
        if(window.lucide) lucide.createIcons();
        
        setTimeout(() => {
          btn.innerHTML = origHtml;
          btn.classList.replace('bg-green-600', 'bg-blue-600');
          btn.classList.replace('hover:bg-green-700', 'hover:bg-blue-700');
          if(window.lucide) lucide.createIcons();
        }, 2000);
        
      } catch (error) {
        alert('Gagal menyimpan data: ' + error.message);
      }
    });
  }

  async function renderStudents() {
    setActiveNav('nav-students');
    updateTopbarTitle('Data Siswa');
    mainContent.innerHTML = `<div class="p-8 text-center"><p>Loading...</p></div>`;
    const students = await window.api.getStudents();
    
    let rows = students.map((s, index) => `
      <tr class="border-b hover:bg-gray-50">
        <td class="py-2 px-4 text-center">${index + 1}</td>
        <td class="py-2 px-4">${s.nisn}</td>
        <td class="py-2 px-4">${s.name}</td>
        <td class="py-2 px-4 text-center">${s.gender || '-'}</td>
        <td class="py-2 px-4 text-center">
          <button class="text-blue-500 hover:text-blue-700 edit-student-btn mr-2" data-id="${s.id}" data-nisn="${s.nisn}" data-name="${s.name}" data-gender="${s.gender}">Edit</button>
          <button class="text-red-500 hover:text-red-700 delete-student-btn" data-id="${s.id}">Hapus</button>
        </td>
      </tr>
    `).join('');

    if(students.length === 0) {
      rows = `<tr><td colspan="5" class="py-4 text-center text-gray-500">Belum ada data siswa.</td></tr>`;
    }

    mainContent.innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold">Kelola Data Siswa</h2>
          <div class="flex gap-2">
            <button id="btn-reset-students" class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center gap-2 text-sm font-bold">
              <i data-lucide="trash-2" class="w-4 h-4"></i> Reset Data Siswa
            </button>
            <button id="btn-import-dapodik" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center gap-2 text-sm font-bold">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Impor Data Dapodik (Excel)
            </button>
          </div>
        </div>
        
        <form id="add-student-form" class="flex gap-4 mb-6 bg-gray-50 p-4 rounded border items-end">
          <input type="hidden" id="studentId" value="">
          <div class="flex-1">
            <label class="block text-xs font-bold text-gray-700 mb-1">NISN</label>
            <input type="text" id="studentNisn" placeholder="NISN" class="border p-2 rounded w-full" required>
          </div>
          <div class="flex-[2]">
            <label class="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Siswa</label>
            <input type="text" id="studentName" placeholder="Nama Lengkap" class="border p-2 rounded w-full" required>
          </div>
          <div class="flex-1">
            <label class="block text-xs font-bold text-gray-700 mb-1">L/P</label>
            <select id="studentGender" class="border p-2 rounded w-full" required>
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button type="submit" id="btn-submit-student" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded font-bold">Simpan</button>
            <button type="button" id="btn-cancel-edit" class="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded font-bold hidden">Batal</button>
          </div>
        </form>

        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-2 px-4 border-b w-16">No</th>
                <th class="py-2 px-4 border-b text-left">NISN</th>
                <th class="py-2 px-4 border-b text-left">Nama Siswa</th>
                <th class="py-2 px-4 border-b w-24">L/P</th>
                <th class="py-2 px-4 border-b w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    lucide.createIcons();

    document.getElementById('btn-import-dapodik').addEventListener('click', async () => {
      const scanResult = await window.api.scanExcelClasses();
      if (!scanResult) return; 
      
      const { filePath, classes } = scanResult;
      if (classes.length === 0) {
        doImport(filePath, null);
        return;
      }
      
      const modalHtml = `
        <div id="import-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 class="text-lg font-bold mb-4">Pilih Kelas</h3>
            <p class="text-sm text-gray-600 mb-4">File Excel Dapodik ini memiliki data dari beberapa Rombel. Silakan pilih kelas yang ingin diimpor:</p>
            <select id="import-class-select" class="w-full border p-2 rounded mb-6">
              <option value="">-- Impor Semua Kelas --</option>
              ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <div class="flex justify-end gap-2">
              <button id="btn-cancel-import" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium">Batal</button>
              <button id="btn-confirm-import" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">Impor Data</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      document.getElementById('btn-cancel-import').addEventListener('click', () => {
        document.getElementById('import-modal').remove();
      });
      
      document.getElementById('btn-confirm-import').addEventListener('click', () => {
        const selectedClass = document.getElementById('import-class-select').value;
        document.getElementById('import-modal').remove();
        doImport(filePath, selectedClass || null);
      });
    });

    document.getElementById('btn-reset-students').addEventListener('click', () => {
      const modalHtml = `
        <div id="reset-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl p-6 w-[400px]">
            <div class="flex items-center gap-3 text-red-600 mb-4">
              <i data-lucide="alert-triangle" class="w-8 h-8"></i>
              <h3 class="text-xl font-bold">Peringatan Reset Data</h3>
            </div>
            <p class="text-sm text-gray-700 mb-4">
              Apakah Anda yakin ingin mereset <strong>seluruh data siswa</strong>? 
              Tindakan ini juga akan menghapus semua <strong>nilai</strong> dan <strong>data kehadiran</strong> yang telah dimasukkan.
            </p>
            <div class="flex justify-end gap-2 mt-6">
              <button id="btn-cancel-reset" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium">Batal</button>
              <button id="btn-confirm-reset" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium flex items-center gap-2">
                <i data-lucide="trash-2" class="w-4 h-4"></i> Ya, Reset Data
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      if (window.lucide) lucide.createIcons();
      
      document.getElementById('btn-cancel-reset').addEventListener('click', () => {
        document.getElementById('reset-modal').remove();
      });
      
      document.getElementById('btn-confirm-reset').addEventListener('click', async () => {
        const btn = document.getElementById('btn-confirm-reset');
        btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Mereset...`;
        if (window.lucide) lucide.createIcons();
        
        await window.api.resetStudents();
        document.getElementById('reset-modal').remove();
        renderStudents();
      });
    });

    async function doImport(filePath, selectedClass) {
      const btn = document.getElementById('btn-import-dapodik');
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Memproses...`;
      if (window.lucide) lucide.createIcons();
      
      const count = await window.api.importStudentsExcel({ filePath, selectedClass });
      if (count !== null) {
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Berhasil: ${count} Siswa`;
        btn.classList.replace('bg-green-600', 'bg-blue-600');
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          renderStudents();
        }, 1500);
      } else {
        btn.innerHTML = origHtml;
        if (window.lucide) lucide.createIcons();
      }
    }

    document.getElementById('add-student-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('studentId').value;
      const nisn = document.getElementById('studentNisn').value;
      const name = document.getElementById('studentName').value;
      const gender = document.getElementById('studentGender').value;
      
      if (id) {
        await window.api.updateStudent({ id, nisn, name, gender });
      } else {
        await window.api.addStudent({ nisn, name, gender });
      }
      renderStudents();
    });

    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
      document.getElementById('studentId').value = '';
      document.getElementById('studentNisn').value = '';
      document.getElementById('studentName').value = '';
      document.getElementById('studentGender').value = 'L';
      document.getElementById('btn-submit-student').innerText = 'Simpan';
      document.getElementById('btn-submit-student').className = 'bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded font-bold';
      document.getElementById('btn-cancel-edit').classList.add('hidden');
    });

    document.querySelectorAll('.edit-student-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const nisn = e.target.getAttribute('data-nisn');
        const name = e.target.getAttribute('data-name');
        const gender = e.target.getAttribute('data-gender');
        
        document.getElementById('studentId').value = id;
        document.getElementById('studentNisn').value = nisn;
        document.getElementById('studentName').value = name;
        document.getElementById('studentGender').value = gender || 'L';
        
        document.getElementById('btn-submit-student').innerText = 'Update';
        document.getElementById('btn-submit-student').className = 'bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-6 rounded font-bold';
        document.getElementById('btn-cancel-edit').classList.remove('hidden');
        
        const inputName = document.getElementById('studentName');
        inputName.focus();
        inputName.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    document.querySelectorAll('.delete-student-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(confirm('Yakin ingin menghapus siswa ini?')) {
          await window.api.deleteStudent(e.target.getAttribute('data-id'));
          renderStudents();
        }
      });
    });
  }

  async function renderSubjects() {
    setActiveNav('nav-subjects');
    updateTopbarTitle('Mata Pelajaran');
    mainContent.innerHTML = `<div class="p-8 text-center"><p>Loading...</p></div>`;
    const subjects = await window.api.getSubjects();
    
    let rows = subjects.map((s, index) => `
      <tr class="border-b hover:bg-gray-50">
        <td class="py-2 px-4 text-center">${index + 1}</td>
        <td class="py-2 px-4">${s.name}</td>
        <td class="py-2 px-4 text-center"><span class="px-2 py-1 rounded text-xs font-semibold ${s.category === 'Wajib' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${s.category || 'Wajib'}</span></td>
        <td class="py-2 px-4 text-center">
          <button class="text-blue-500 hover:text-blue-700 edit-subject-btn mr-2" data-id="${s.id}" data-name="${s.name}" data-category="${s.category}">Edit</button>
          <button class="text-red-500 hover:text-red-700 delete-subject-btn" data-id="${s.id}">Hapus</button>
        </td>
      </tr>
    `).join('');

    if(subjects.length === 0) {
      rows = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Belum ada data mata pelajaran.</td></tr>`;
    }

    mainContent.innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-sm">
        <h2 class="text-2xl font-semibold mb-4">Kelola Mata Pelajaran</h2>
        
        <div class="mb-6 bg-blue-50 p-4 rounded border border-blue-200">
          <h3 class="font-bold text-blue-800 mb-2">Generate Mata Pelajaran Standar</h3>
          <div class="flex gap-4 items-end mb-4">
            <div class="flex-1">
              <label class="block text-xs font-bold text-gray-700 mb-1">Kurikulum</label>
              <select id="sel-kurikulum" class="border p-2 rounded w-full">
                <option value="">-- Pilih Kurikulum --</option>
                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                <option value="K13">Kurikulum 2013 (K13)</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-bold text-gray-700 mb-1">Jenjang</label>
              <select id="sel-jenjang" class="border p-2 rounded w-full">
                <option value="">-- Pilih Jenjang --</option>
                <option value="SD">SD/MI</option>
                <option value="SMP">SMP/MTs</option>
                <option value="SMA">SMA/MA</option>
                <option value="SMK">SMK/MAK</option>
              </select>
            </div>
            <button id="btn-show-standard-subjects" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-bold">Tampilkan</button>
          </div>
          
          <div id="standard-subjects-container" class="hidden bg-white p-4 rounded border shadow-inner">
            <p class="text-sm text-gray-600 mb-2 font-semibold">Pilih mata pelajaran yang ingin ditambahkan:</p>
            <div id="standard-subjects-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto p-2 border bg-gray-50 rounded">
            </div>
            <button id="btn-add-selected-subjects" class="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded font-bold text-sm w-full">Tambahkan Mapel Terpilih</button>
          </div>
        </div>

        <h3 class="font-bold text-gray-800 mb-2">Tambah / Edit Manual</h3>
        <form id="add-subject-form" class="flex gap-4 mb-6 bg-gray-50 p-4 rounded border items-end">
          <input type="hidden" id="subjectId" value="">
          <div class="flex-[2]">
            <label class="block text-xs font-bold text-gray-700 mb-1">Nama Mata Pelajaran</label>
            <input type="text" id="subjectName" placeholder="Contoh: Matematika" class="border p-2 rounded w-full" required>
          </div>
          <div class="flex-1">
            <label class="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
            <select id="subjectCategory" class="border p-2 rounded w-full" required>
              <option value="Wajib">Mata Pelajaran Wajib</option>
              <option value="Muatan Lokal">Muatan Lokal</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button type="submit" id="btn-submit-subject" class="bg-slate-800 hover:bg-slate-900 text-white py-2 px-6 rounded font-bold">Tambah</button>
            <button type="button" id="btn-cancel-edit-subject" class="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded font-bold hidden">Batal</button>
          </div>
        </form>

        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-2 px-4 border-b w-16">No</th>
                <th class="py-2 px-4 border-b text-left">Nama Mata Pelajaran</th>
                <th class="py-2 px-4 border-b w-48 text-center">Kategori</th>
                <th class="py-2 px-4 border-b w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    document.getElementById('btn-show-standard-subjects').addEventListener('click', () => {
      const kurikulum = document.getElementById('sel-kurikulum').value;
      const jenjang = document.getElementById('sel-jenjang').value;
      if (!kurikulum || !jenjang) {
        alert('Silakan pilih Kurikulum dan Jenjang terlebih dahulu!');
        return;
      }

      if (typeof CURRICULUM_DATA === 'undefined') {
        alert('Data kurikulum tidak ditemukan. Coba refresh aplikasi (Ctrl+R).');
        return;
      }

      const standardSubjects = CURRICULUM_DATA[kurikulum][jenjang];
      const listContainer = document.getElementById('standard-subjects-list');
      
      listContainer.innerHTML = standardSubjects.map((s, idx) => `
        <label class="flex items-center gap-2 text-sm p-2 hover:bg-gray-200 rounded cursor-pointer border border-transparent hover:border-gray-300">
          <input type="checkbox" class="std-subject-chk w-4 h-4" value="${s.name}" data-category="${s.category}" checked>
          <span class="truncate" title="${s.name}">${s.name} <br/><span class="text-xs text-gray-500">(${s.category})</span></span>
        </label>
      `).join('');

      document.getElementById('standard-subjects-container').classList.remove('hidden');
    });

    document.getElementById('btn-add-selected-subjects').addEventListener('click', async () => {
      const checkboxes = document.querySelectorAll('.std-subject-chk:checked');
      if (checkboxes.length === 0) return;
      
      const btn = document.getElementById('btn-add-selected-subjects');
      btn.innerHTML = 'Menambahkan...';
      btn.disabled = true;

      for (const chk of checkboxes) {
        const name = chk.value;
        const category = chk.getAttribute('data-category');
        // Prevent duplicate insertions
        if (!subjects.some(sub => sub.name.toLowerCase() === name.toLowerCase())) {
          await window.api.addSubject({ name, category });
        }
      }
      
      renderSubjects();
    });

    document.getElementById('btn-cancel-edit-subject').addEventListener('click', () => {
      document.getElementById('subjectId').value = '';
      document.getElementById('subjectName').value = '';
      document.getElementById('subjectCategory').value = 'Wajib';
      document.getElementById('btn-submit-subject').innerText = 'Tambah';
      document.getElementById('btn-submit-subject').className = 'bg-slate-800 hover:bg-slate-900 text-white py-2 px-6 rounded font-bold';
      document.getElementById('btn-cancel-edit-subject').classList.add('hidden');
    });

    document.querySelectorAll('.edit-subject-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const name = e.target.getAttribute('data-name');
        const category = e.target.getAttribute('data-category');
        
        document.getElementById('subjectId').value = id;
        document.getElementById('subjectName').value = name;
        document.getElementById('subjectCategory').value = category || 'Wajib';
        
        document.getElementById('btn-submit-subject').innerText = 'Update';
        document.getElementById('btn-submit-subject').className = 'bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-6 rounded font-bold';
        document.getElementById('btn-cancel-edit-subject').classList.remove('hidden');
        
        const inputName = document.getElementById('subjectName');
        inputName.focus();
        inputName.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    document.getElementById('add-subject-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('subjectId').value;
      const name = document.getElementById('subjectName').value;
      const category = document.getElementById('subjectCategory').value;
      
      if (id) {
        await window.api.updateSubject({ id, name, category });
      } else {
        await window.api.addSubject({ name, category });
      }
      renderSubjects();
    });

    document.querySelectorAll('.delete-subject-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(confirm('Yakin ingin menghapus mata pelajaran ini?')) {
          await window.api.deleteSubject(e.target.getAttribute('data-id'));
          renderSubjects();
        }
      });
    });
  }

  // --- SCORE MODULE ---
  async function renderScores() {
    setActiveNav('nav-scores');
    mainContent.innerHTML = `<div class="p-8 text-center"><p>Loading Mata Pelajaran...</p></div>`;
    const subjects = await window.api.getSubjects();

    if (subjects.length === 0) {
      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-sm text-center">
          <p class="mb-4 text-red-500">Belum ada data mata pelajaran.</p>
          <button id="btn-add-subject-now" class="bg-blue-600 text-white px-4 py-2 rounded">Tambah Mapel</button>
        </div>
      `;
      document.getElementById('btn-add-subject-now').addEventListener('click', renderSubjects);
      return;
    }

    const options = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    mainContent.innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-sm">
        <h2 class="text-2xl font-semibold mb-4">Input Nilai Siswa</h2>
        
        <div class="flex items-end gap-4 mb-6 bg-gray-50 p-4 rounded border">
          <div class="flex-1">
            <label class="block text-gray-700 text-sm font-bold mb-2">Pilih Mata Pelajaran:</label>
            <select id="score-subject-select" class="border p-2 rounded w-full">
              ${options}
            </select>
          </div>
        </div>

        <div id="scores-container"></div>
      </div>
    `;

    document.getElementById('score-subject-select').addEventListener('change', (e) => {
      const subjectId = e.target.value;
      const subjectName = e.target.options[e.target.selectedIndex].text;
      loadScoresTable(subjectId, subjectName);
    });

    // Auto load first subject
    if (subjects.length > 0) {
      loadScoresTable(subjects[0].id, subjects[0].name);
    }
  }

  async function loadScoresTable(subjectId, subjectName) {
    const container = document.getElementById('scores-container');
    container.innerHTML = `<p class="text-center">Memuat data siswa...</p>`;
    
    let scores = await window.api.getScoresBySubject(subjectId);
    
    if (scores.length === 0) {
      container.innerHTML = `<p class="text-center text-red-500">Belum ada data siswa. Silakan tambahkan siswa terlebih dahulu.</p>`;
      return;
    }

    let rows = scores.map((s, index) => `
      <tr class="border-b hover:bg-gray-50 score-row" data-studentid="${s.student_id}">
        <td class="py-2 px-4 text-center">${index + 1}</td>
        <td class="py-2 px-4">${s.nisn}</td>
        <td class="py-2 px-4">${s.name}</td>
        <td class="py-2 px-4">
          <input type="number" class="border rounded p-1 w-24 text-center orig-score" value="${s.original_score || ''}" step="0.01">
        </td>
        <td class="py-2 px-4">
          <input type="number" class="border rounded p-1 w-24 text-center remidi-score" value="${s.remedial_score || ''}" step="0.01">
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold">Mata Pelajaran: ${subjectName}</h3>
        <div class="space-x-2">
          <button id="btn-export-excel" class="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded">1. Export Excel (Template)</button>
          <button id="btn-import-excel" class="text-sm py-2 px-3 rounded" style="background-color: #eab308; color: white; font-weight: bold;">2. Import Excel</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-2 px-4 border-b w-12">No</th>
              <th class="py-2 px-4 border-b text-left">NISN</th>
              <th class="py-2 px-4 border-b text-left">Nama Siswa</th>
              <th class="py-2 px-4 border-b w-32">Nilai Asli</th>
              <th class="py-2 px-4 border-b w-32">Nilai Remidi</th>
            </tr>
          </thead>
          <tbody id="scores-tbody">
            ${rows}
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex justify-end">
        <button id="btn-save-scores" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">Simpan Nilai</button>
      </div>
    `;

    document.getElementById('btn-save-scores').addEventListener('click', async () => {
      const scoreRows = document.querySelectorAll('.score-row');
      const dataToSave = [];
      scoreRows.forEach(row => {
        const studentId = row.getAttribute('data-studentid');
        const orig = row.querySelector('.orig-score').value;
        const remidi = row.querySelector('.remidi-score').value;
        dataToSave.push({
          student_id: studentId,
          original_score: orig ? parseFloat(orig) : null,
          remedial_score: remidi ? parseFloat(remidi) : null
        });
      });

      try {
        await window.api.saveScoresBySubject({ subjectId, scores: dataToSave });
        const btn = document.getElementById('btn-save-scores');
        const origText = btn.innerText;
        btn.innerText = '✓ Berhasil Disimpan';
        btn.classList.replace('bg-blue-600', 'bg-green-600');
        setTimeout(() => {
          btn.innerText = origText;
          btn.classList.replace('bg-green-600', 'bg-blue-600');
        }, 2000);
      } catch (err) {
        alert('Gagal menyimpan nilai: ' + err.message);
      }
    });

    document.getElementById('btn-export-excel').addEventListener('click', async () => {
      // Gather current data
      const dataToExport = scores.map(s => {
        // use what's on screen if edited, or original? Let's use the DB data directly for simplicity, 
        // since it's a template export.
        return s;
      });
      const schoolInfo = schoolInfoCache || await window.api.getSchoolInfo();
      const className = schoolInfo ? (schoolInfo.class_name || 'TanpaKelas') : 'TanpaKelas';
      
      const success = await window.api.exportExcel({ subjectName, className, scores: dataToExport });
      if(success) {
        const btn = document.getElementById('btn-export-excel');
        const origText = btn.innerText;
        btn.innerText = '✓ Template Diekspor';
        setTimeout(() => {
          btn.innerText = origText;
        }, 2000);
      }
    });

    document.getElementById('btn-import-excel').addEventListener('click', async () => {
      const importedData = await window.api.importExcel();
      if (importedData) {
        const scoreRows = document.querySelectorAll('.score-row');
        let updateCount = 0;
        
        scoreRows.forEach(row => {
          const nisn = row.querySelector('td:nth-child(2)').innerText.trim();
          const name = row.querySelector('td:nth-child(3)').innerText.trim();
          
          // Find match in Excel (by NISN or Name)
          const match = importedData.find(d => (d.nisn && d.nisn === nisn) || (d.name && d.name === name));
          if (match) {
            row.querySelector('.orig-score').value = match.original_score || '';
            row.querySelector('.remidi-score').value = match.remedial_score || '';
            updateCount++;
          }
        });
        alert(`Berhasil mengimpor data untuk ${updateCount} siswa. Jangan lupa klik "Simpan Nilai" untuk memperbarui database.`);
      }
    });
  }

  // --- ATTENDANCE MODULE ---
  async function renderAttendance() {
    setActiveNav('nav-attendance');
    updateTopbarTitle('Kehadiran & Catatan');
    mainContent.innerHTML = `<div class="p-8 text-center"><p>Loading Data Kehadiran...</p></div>`;
    
    let attendanceData = await window.api.getAttendance();
    
    if (attendanceData.length === 0) {
      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-sm text-center">
          <p class="mb-4 text-red-500">Belum ada data siswa. Silakan tambahkan siswa terlebih dahulu di menu Data Siswa.</p>
        </div>
      `;
      return;
    }

    let rows = attendanceData.map((s, index) => `
      <tr class="border-b hover:bg-gray-50 attendance-row" data-studentid="${s.student_id}">
        <td class="py-2 px-4 text-center">${index + 1}</td>
        <td class="py-2 px-4">${s.nisn}</td>
        <td class="py-2 px-4 whitespace-nowrap">${s.name}</td>
        <td class="py-2 px-4">
          <input type="number" min="0" class="border rounded p-1 w-16 text-center att-sakit" value="${s.sakit || 0}">
        </td>
        <td class="py-2 px-4">
          <input type="number" min="0" class="border rounded p-1 w-16 text-center att-izin" value="${s.izin || 0}">
        </td>
        <td class="py-2 px-4">
          <input type="number" min="0" class="border rounded p-1 w-16 text-center att-alpa" value="${s.tanpa_keterangan || 0}">
        </td>
        <td class="py-2 px-4">
          <textarea class="border rounded p-1 w-full text-sm att-catatan" rows="2">${s.catatan || ''}</textarea>
        </td>
      </tr>
    `).join('');

    mainContent.innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold">Kehadiran & Catatan Wali Kelas</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-2 px-4 border-b w-12 text-center" rowspan="2">No</th>
                <th class="py-2 px-4 border-b text-left" rowspan="2">NISN</th>
                <th class="py-2 px-4 border-b text-left" rowspan="2">Nama Siswa</th>
                <th class="py-2 px-4 border-b text-center" colspan="3">Ketidakhadiran</th>
                <th class="py-2 px-4 border-b text-left" rowspan="2">Catatan Wali Kelas</th>
              </tr>
              <tr>
                <th class="py-2 px-2 border-b text-center text-xs">Sakit</th>
                <th class="py-2 px-2 border-b text-center text-xs">Izin</th>
                <th class="py-2 px-2 border-b text-center text-xs">Tanpa Ket.</th>
              </tr>
            </thead>
            <tbody id="attendance-tbody">
              ${rows}
            </tbody>
          </table>
        </div>
        <div class="mt-4 flex justify-end">
          <button id="btn-save-attendance" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">Simpan Data</button>
        </div>
      </div>
    `;

    document.getElementById('btn-save-attendance').addEventListener('click', async () => {
      const rows = document.querySelectorAll('.attendance-row');
      const dataToSave = [];
      rows.forEach(row => {
        const studentId = row.getAttribute('data-studentid');
        const sakit = row.querySelector('.att-sakit').value;
        const izin = row.querySelector('.att-izin').value;
        const alpa = row.querySelector('.att-alpa').value;
        const catatan = row.querySelector('.att-catatan').value;
        
        dataToSave.push({
          student_id: studentId,
          sakit: parseInt(sakit) || 0,
          izin: parseInt(izin) || 0,
          tanpa_keterangan: parseInt(alpa) || 0,
          catatan: catatan,
          tanggapan_ortu: ''
        });
      });

      try {
        await window.api.saveAttendance(dataToSave);
        const btn = document.getElementById('btn-save-attendance');
        const origText = btn.innerText;
        btn.innerText = '✓ Berhasil Disimpan';
        btn.classList.replace('bg-blue-600', 'bg-green-600');
        setTimeout(() => {
          btn.innerText = origText;
          btn.classList.replace('bg-green-600', 'bg-blue-600');
        }, 2000);
      } catch (err) {
        alert('Gagal menyimpan data: ' + err.message);
      }
    });
  }

  // --- PRINT MODULE ---
  async function renderPrint() {
    setActiveNav('nav-print');
    mainContent.innerHTML = `<div class="p-8 text-center"><p>Loading Siswa...</p></div>`;
    const students = await window.api.getStudents();
    
    if (students.length === 0) {
      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-sm text-center">
          <p class="mb-4 text-red-500">Belum ada data siswa.</p>
        </div>
      `;
      return;
    }

    const options = students.map(s => `<option value="${s.id}">${s.nisn} - ${s.name}</option>`).join('');

    mainContent.innerHTML = `
      <style>
        @media print {
          @page { size: A4; margin: 1cm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
          nav, .no-print { display: none !important; }
        }
      </style>
      <div class="bg-white p-8 rounded-lg shadow-sm no-print">
        <h2 class="text-2xl font-semibold mb-4">Cetak Rapor Tengah Semester</h2>
        
        <div class="flex items-end gap-4 mb-6 bg-gray-50 p-4 rounded border">
          <div class="flex-1">
            <label class="block text-gray-700 text-sm font-bold mb-2">Pilih Siswa:</label>
            <select id="print-student-select" class="border p-2 rounded w-full">
              ${options}
            </select>
          </div>
          <div class="flex gap-2">
            <button id="btn-load-report" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">Tampilkan Rapor</button>
            <button id="btn-do-print" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded hidden">Cetak (Print)</button>
            <button id="btn-do-print-all" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded hidden">Cetak Semua Siswa</button>
          </div>
        </div>
      </div>
      
      <div id="print-area" class="bg-white p-8 rounded-lg shadow-sm mt-4 hidden"></div>
    `;

    async function generateStudentReportHtml(studentId, studentName, studentNisn) {
      const reportData = await window.api.getStudentReport(studentId);
      const schoolInfo = schoolInfoCache || await window.api.getSchoolInfo();
      const attendance = await window.api.getAttendanceByStudent(studentId);
      
      const wajib = reportData.filter(r => r.category !== 'Muatan Lokal');
      const mulok = reportData.filter(r => r.category === 'Muatan Lokal');

      let rowsWajib = wajib.map((r, i) => `
        <tr>
          <td class="border border-black px-4 py-2 text-center">${i + 1}</td>
          <td class="border border-black px-4 py-2">${r.subject_name}</td>
          <td class="border border-black px-4 py-2 text-center">${r.original_score || '-'}</td>
          <td class="border border-black px-4 py-2 text-center">${r.remedial_score || '-'}</td>
        </tr>
      `).join('');

      if(wajib.length === 0) {
        rowsWajib = `<tr><td colspan="4" class="border border-black px-4 py-2 text-center">Belum ada nilai yang diinput.</td></tr>`;
      }

      let rowsMulok = '';
      if(mulok.length > 0) {
        rowsMulok = `
          <tr>
            <td colspan="4" class="border border-black px-4 py-2 font-bold bg-gray-50">B. Muatan Lokal</td>
          </tr>
        ` + mulok.map((r, i) => `
          <tr>
            <td class="border border-black px-4 py-2 text-center">${i + 1}</td>
            <td class="border border-black px-4 py-2">${r.subject_name}</td>
            <td class="border border-black px-4 py-2 text-center">${r.original_score || '-'}</td>
            <td class="border border-black px-4 py-2 text-center">${r.remedial_score || '-'}</td>
          </tr>
        `).join('');
      }

      const printHtml = `
        <div class="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
          <div class="w-28 h-28 flex items-center justify-center text-black font-bold text-center">
            ${schoolInfo.logo_path ? 
              `<img src="file:///${schoolInfo.logo_path.replace(/\\/g, '/')}" class="w-full h-full object-contain" />` :
              `<div class="w-full h-full border-2 border-black flex items-center justify-center rounded-full p-2"><span class="text-xs">LOGO<br>SEKOLAH</span></div>`
            }
          </div>
          <div class="flex-1 text-center px-4">
            <h1 class="text-2xl font-bold uppercase">${schoolInfo.school_name || 'NAMA SEKOLAH'}</h1>
            <h2 class="text-xl font-semibold">LAPORAN HASIL BELAJAR TENGAH SEMESTER</h2>
            <p>Tahun Ajaran: ${schoolInfo.academic_year || '-'} | Semester: ${schoolInfo.semester || '-'}</p>
          </div>
          <div class="w-28 h-28"></div>
        </div>
        
        <div class="mb-6">
          <table class="w-full text-left text-sm">
            <tr>
              <th class="w-32 py-1">Nama Siswa</th>
              <td>: <span class="font-semibold">${studentName}</span></td>
              <th class="w-24 py-1 text-right pr-2">Kelas</th>
              <td class="w-32">: ${schoolInfo.class_name || '-'}</td>
            </tr>
            <tr>
              <th class="w-32 py-1">NISN</th>
              <td>: ${studentNisn}</td>
              <th class="w-24 py-1"></th>
              <td class="w-32"></td>
            </tr>
          </table>
        </div>

        <table class="w-full border-collapse border border-black mb-6 text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="border border-black px-4 py-2 w-12">No</th>
              <th class="border border-black px-4 py-2">Mata Pelajaran</th>
              <th class="border border-black px-4 py-2 w-24">Nilai Asli</th>
              <th class="border border-black px-4 py-2 w-24">Nilai Remidi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4" class="border border-black px-4 py-2 font-bold bg-gray-50">A. Mata Pelajaran Wajib</td>
            </tr>
            ${rowsWajib}
            ${rowsMulok}
          </tbody>
        </table>

        <div style="page-break-inside: avoid; break-inside: avoid;">
          <div class="flex gap-6 mb-6">
            <div class="w-1/3">
              <table class="w-full border-collapse border border-black text-sm">
                <tr><th colspan="2" class="border border-black px-4 py-2 text-center bg-gray-50">Ketidakhadiran</th></tr>
                <tr><td class="border border-black px-4 py-1">Sakit</td><td class="border border-black px-2 py-1 text-center w-12">${attendance.sakit || 0}</td></tr>
                <tr><td class="border border-black px-4 py-1">Izin</td><td class="border border-black px-2 py-1 text-center">${attendance.izin || 0}</td></tr>
                <tr><td class="border border-black px-4 py-1">Tanpa Keterangan</td><td class="border border-black px-2 py-1 text-center">${attendance.tanpa_keterangan || 0}</td></tr>
              </table>
            </div>
            <div class="w-2/3 flex flex-col gap-4">
              <table class="w-full border-collapse border border-black text-sm flex-1">
                <tr><th class="border border-black px-4 py-1 bg-gray-50 text-left">Catatan Wali Kelas</th></tr>
                <tr><td class="border border-black px-4 py-2 align-top min-h-[4rem] h-16">${attendance.catatan || '-'}</td></tr>
              </table>
              <table class="w-full border-collapse border border-black text-sm flex-1">
                <tr><th class="border border-black px-4 py-1 bg-gray-50 text-left">Tanggapan Orang Tua / Wali</th></tr>
                <tr><td class="border border-black px-4 py-2 align-top min-h-[4rem] h-16"></td></tr>
              </table>
            </div>
          </div>

          <div class="flex justify-between mt-8 px-8 text-sm">
            <div class="text-center">
              <p class="mb-2 mt-5">Orang Tua/Wali</p>
              <div class="h-20"></div>
              <p class="font-semibold border-b border-black inline-block px-12 min-w-[150px]">&nbsp;</p>
            </div>
            <div class="text-center relative z-0">
              <p class="mb-1 relative z-10">${schoolInfo.print_place || '....................'}, ${schoolInfo.print_date || '....................'}</p>
              <p class="mb-2 relative z-10">Wali Kelas</p>
              ${schoolInfo.homeroom_sign_path ? 
                `<div class="flex justify-center -my-4 relative z-0">
                   <img src="file:///${schoolInfo.homeroom_sign_path.replace(/\\/g, '/')}" class="h-28 object-contain mix-blend-multiply pointer-events-none" />
                 </div>` : 
                `<div class="h-20"></div>`
              }
              <p class="font-semibold border-b border-black inline-block px-8 min-w-[150px] relative z-10 mt-2">${schoolInfo.homeroom_name || '________________'}</p>
              <p class="relative z-10">${schoolInfo.homeroom_id_type || 'NUPTK'}: ${schoolInfo.homeroom_nuptk || '-'}</p>
            </div>
          </div>
          <div class="text-center mt-6 text-sm relative z-0">
            <p class="mb-2 relative z-10">Mengetahui,</p>
            <p class="mb-2 relative z-10">Kepala Sekolah</p>
            ${schoolInfo.headmaster_sign_path ? 
              `<div class="flex justify-center -my-8 relative z-0">
                 <img src="file:///${schoolInfo.headmaster_sign_path.replace(/\\/g, '/')}" class="h-40 object-contain mix-blend-multiply pointer-events-none" />
               </div>` : 
              `<div class="h-24"></div>`
            }
            <p class="font-semibold border-b border-black inline-block px-8 min-w-[200px] relative z-10 mt-2">${schoolInfo.headmaster_name || '________________'}</p>
            <p class="relative z-10">${schoolInfo.headmaster_id_type || 'NUPTK'}: ${schoolInfo.headmaster_nuptk || '-'}</p>
          </div>
        </div>
      `;

      return printHtml;
    }

    document.getElementById('btn-load-report').addEventListener('click', async () => {
      const selectEl = document.getElementById('print-student-select');
      const studentId = selectEl.value;
      const textParts = selectEl.options[selectEl.selectedIndex].text.split(' - ');
      const studentNisn = textParts[0];
      const studentName = textParts[1];
      
      const printHtml = await generateStudentReportHtml(studentId, studentName, studentNisn);
      
      const printArea = document.getElementById('print-area');
      printArea.innerHTML = printHtml;
      printArea.classList.remove('hidden');
      document.getElementById('btn-do-print').classList.remove('hidden');
      document.getElementById('btn-do-print-all').classList.remove('hidden');
    });

    document.getElementById('btn-do-print-all').addEventListener('click', async () => {
      const printArea = document.getElementById('print-area');
      printArea.innerHTML = '<p class="text-center p-8">Mempersiapkan rapor semua siswa...</p>';
      printArea.classList.remove('hidden');
      document.getElementById('btn-do-print').classList.add('hidden');
      document.getElementById('btn-do-print-all').classList.add('hidden');

      let allHtml = '';
      for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const studentHtml = await generateStudentReportHtml(s.id, s.name, s.nisn);
        allHtml += `<div style="${i < students.length - 1 ? 'page-break-after: always;' : ''}">${studentHtml}</div>`;
      }

      printArea.innerHTML = allHtml;
      document.getElementById('btn-do-print').classList.remove('hidden');
      document.getElementById('btn-do-print-all').classList.remove('hidden');
      
      setTimeout(() => {
        window.print();
      }, 500);
    });

    document.getElementById('btn-do-print').addEventListener('click', () => {
      window.print();
    });
  }

  // Start app
  init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
