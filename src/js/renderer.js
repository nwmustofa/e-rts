(async () => {
  const initApp = async () => {
    const mainContent = document.getElementById('main-content');
    const toastContainer = document.getElementById('toast-container');
    const modalContainer = document.getElementById('modal-container');

    let schoolInfoCache = null;
    let trakteerTimer = null;
    let initialSetupJustCompleted = false;

    // --- HELPER: TOAST NOTIFICATIONS (Item 8) ---
    function showToast(message, type = 'success', duration = 3200) {
      if (!toastContainer) return;

      const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      let bgClass = 'bg-emerald-600 text-white';
      let iconName = 'check-circle-2';

      if (type === 'error') {
        bgClass = 'bg-rose-600 text-white';
        iconName = 'alert-circle';
      } else if (type === 'warning') {
        bgClass = 'bg-amber-500 text-white';
        iconName = 'alert-triangle';
      } else if (type === 'info') {
        bgClass = 'bg-blue-600 text-white';
        iconName = 'info';
      }

      const toastEl = document.createElement('div');
      toastEl.id = toastId;
      toastEl.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${bgClass} transform transition-all duration-300 translate-x-8 opacity-0 text-sm font-medium max-w-md`;
      toastEl.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
        <div class="flex-1">${message}</div>
        <button type="button" class="text-white hover:opacity-80 p-1 flex-shrink-0" onclick="this.parentElement.remove()">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      `;

      toastContainer.appendChild(toastEl);
      if (window.lucide) lucide.createIcons({ root: toastEl });

      // Animate in
      requestAnimationFrame(() => {
        toastEl.classList.remove('translate-x-8', 'opacity-0');
      });

      // Auto dismiss
      setTimeout(() => {
        toastEl.classList.add('translate-x-8', 'opacity-0');
        setTimeout(() => toastEl.remove(), 300);
      }, duration);
    }

    // --- HELPER: IN-APP MODAL (CONFIRM & ALERT) (Item 4 & 5 - Anti Freeze) ---
    function showConfirmModal({ title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', isDanger = false }) {
      return new Promise((resolve) => {
        if (!modalContainer) return resolve(false);

        const btnConfirmClass = isDanger 
          ? 'bg-red-600 hover:bg-red-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white';

        const modalHtml = `
          <div id="active-inapp-modal" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
              <div class="flex items-center gap-3 mb-3">
                <div class="p-2.5 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}">
                  <i data-lucide="${isDanger ? 'alert-triangle' : 'help-circle'}" class="w-6 h-6"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-900">${title}</h3>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed mb-6">${message}</p>
              <div class="flex justify-end gap-2.5">
                <button id="modal-btn-cancel" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                  ${cancelText}
                </button>
                <button id="modal-btn-confirm" class="px-4 py-2 ${btnConfirmClass} rounded-lg text-sm font-semibold shadow-sm transition-colors">
                  ${confirmText}
                </button>
              </div>
            </div>
          </div>
        `;

        modalContainer.innerHTML = modalHtml;
        if (window.lucide) lucide.createIcons({ root: modalContainer });

        const modalEl = document.getElementById('active-inapp-modal');
        const btnConfirm = document.getElementById('modal-btn-confirm');
        const btnCancel = document.getElementById('modal-btn-cancel');

        const cleanup = () => {
          modalContainer.innerHTML = '';
        };

        btnConfirm.addEventListener('click', () => {
          cleanup();
          resolve(true);
        });

        btnCancel.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });
      });
    }

    // --- HELPER: TRAKTEER POPUP MODAL (Item 3) ---
    function showTrakteerModal() {
      if (!modalContainer) return;
      if (document.getElementById('trakteer-modal')) return; // Hindari duplikat

      const modalHtml = `
        <div id="trakteer-modal" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center relative border border-gray-100">
            <div class="bg-gradient-to-r from-red-500 to-amber-500 p-6 text-white relative">
              <button id="btn-close-trakteer-x" class="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
              <div class="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-inner">
                <i data-lucide="coffee" class="w-9 h-9 text-white"></i>
              </div>
              <h3 class="text-xl font-bold tracking-tight">Dukung Developer e-RTS</h3>
              <p class="text-xs text-red-100 mt-1">SIGIE Lab by Nur Wahid Mustofa</p>
            </div>
            <div class="p-6">
              <p class="text-gray-700 text-sm leading-relaxed mb-4">
                Terima kasih telah menggunakan aplikasi <strong>e-RTS (e-Rapor Tengah Semester)</strong>!
              </p>
              <p class="text-xs text-gray-500 leading-relaxed mb-6">
                Aplikasi ini dikembangkan secara mandiri untuk mempermudah Bapak/Ibu Guru & Wali Kelas. Jika aplikasi ini membantu, dukung kelanjutan & pembaruan fitur dengan mentraktir segelas kopi / cendol.
              </p>
              <div class="flex flex-col gap-2.5">
                <button id="btn-action-trakteer" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm">
                  <i data-lucide="heart" class="w-4 h-4 fill-current"></i> Traktir Cendol di Trakteer
                </button>
                <button id="btn-close-trakteer" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-4 rounded-xl text-xs transition-colors">
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      modalContainer.innerHTML = modalHtml;
      if (window.lucide) lucide.createIcons({ root: modalContainer });

      const closeTrakteer = () => {
        modalContainer.innerHTML = '';
      };

      document.getElementById('btn-close-trakteer-x').addEventListener('click', closeTrakteer);
      document.getElementById('btn-close-trakteer').addEventListener('click', closeTrakteer);

      document.getElementById('btn-action-trakteer').addEventListener('click', () => {
        if (window.api && window.api.openLink) {
          window.api.openLink('https://trakteer.id/nur_wahid_musthofa/gift');
        }
        closeTrakteer();
      });
    }

    // --- SETUP GUARD CHECKER (Item 1 & 2) ---
    function isSetupComplete(info) {
      if (!info) return false;
      const s = info;
      const hasSchool = Boolean(s.school_name && s.school_name.trim() && s.headmaster_name && s.headmaster_name.trim() && s.academic_year && s.academic_year.trim() && s.semester && s.semester.trim());
      const hasPrint = Boolean(s.homeroom_name && s.homeroom_name.trim() && s.class_name && s.class_name.trim() && s.print_place && s.print_place.trim() && s.print_date && s.print_date.trim());
      return hasSchool && hasPrint;
    }

    const navIds = ['nav-dashboard', 'nav-students', 'nav-subjects', 'nav-scores', 'nav-attendance', 'nav-leger', 'nav-print', 'nav-settings'];

    function updateSidebarLockState() {
      const isComplete = isSetupComplete(schoolInfoCache);

      navIds.forEach(id => {
        if (id === 'nav-settings') return; // Pengaturan selalu dapat diakses
        const el = document.getElementById(id);
        if (!el) return;

        if (!isComplete) {
          el.classList.add('opacity-40', 'cursor-not-allowed');
          el.setAttribute('title', 'Lengkapi Data Sekolah & Pengaturan Cetak terlebih dahulu');
        } else {
          el.classList.remove('opacity-40', 'cursor-not-allowed');
          el.removeAttribute('title');
        }
      });
    }

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

    function guardNavigation(targetFn, activeId) {
      if (!isSetupComplete(schoolInfoCache)) {
        showToast('Harap lengkapi Data Sekolah dan Pengaturan Cetak terlebih dahulu!', 'warning');
        renderSetupForm();
        return;
      }
      setActiveNav(activeId);
      targetFn();
    }

    // --- NAVIGATION EVENT LISTENERS ---
    const navDashboard = document.getElementById('nav-dashboard');
    const navStudents = document.getElementById('nav-students');
    const navSettings = document.getElementById('nav-settings');

    if (navDashboard) navDashboard.addEventListener('click', (e) => { e.preventDefault(); guardNavigation(renderDashboard, 'nav-dashboard'); });
    if (navStudents) navStudents.addEventListener('click', (e) => { e.preventDefault(); guardNavigation(renderStudents, 'nav-students'); });
    if (navSettings) navSettings.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('nav-settings'); renderSetupForm(); });

    document.addEventListener('click', (e) => {
      if (e.target.id === 'nav-subjects' || e.target.closest('#nav-subjects')) {
        e.preventDefault();
        guardNavigation(renderSubjects, 'nav-subjects');
      } else if (e.target.id === 'nav-scores' || e.target.closest('#nav-scores')) {
        e.preventDefault();
        guardNavigation(renderScores, 'nav-scores');
      } else if (e.target.id === 'nav-attendance' || e.target.closest('#nav-attendance')) {
        e.preventDefault();
        guardNavigation(renderAttendance, 'nav-attendance');
      } else if (e.target.id === 'nav-leger' || e.target.closest('#nav-leger')) {
        e.preventDefault();
        guardNavigation(renderLeger, 'nav-leger');
      } else if (e.target.id === 'nav-print' || e.target.closest('#nav-print')) {
        e.preventDefault();
        guardNavigation(renderPrint, 'nav-print');
      }
    });

    function updateTopbarTitle(title) {
      const el = document.getElementById('topbar-title');
      if (el) el.innerText = title;
    }

    // --- INITIALIZE APPLICATION ---
    async function init() {
      try {
        schoolInfoCache = await window.api.getSchoolInfo();
        const topbarInfo = document.getElementById('topbar-school-info');
        
        if (schoolInfoCache && (schoolInfoCache.academic_year || schoolInfoCache.semester)) {
          topbarInfo.innerText = `${schoolInfoCache.academic_year || '-'} - ${schoolInfoCache.semester || '-'}`;
        } else {
          topbarInfo.innerText = 'Belum disetup';
        }

        updateSidebarLockState();

        if (!isSetupComplete(schoolInfoCache)) {
          renderSetupForm();
        } else {
          renderDashboard();
          // Munculkan popup Trakteer saat awal membuka aplikasi (jika sudah disetup)
          setTimeout(showTrakteerModal, 1500);
        }

        // Interval Trakteer setiap 1 jam (60 * 60 * 1000 ms) (Item 3)
        if (trakteerTimer) clearInterval(trakteerTimer);
        trakteerTimer = setInterval(() => {
          showTrakteerModal();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('Error loading school info:', error);
        showToast('Gagal memuat informasi sekolah: ' + error.message, 'error');
      }
    }

    // ==========================================
    // 1. DASHBOARD MODULE (Item 7)
    // ==========================================
    async function renderDashboard() {
      setActiveNav('nav-dashboard');
      updateTopbarTitle('Dashboard');
      if (!isSetupComplete(schoolInfoCache)) {
        renderSetupForm();
        return;
      }

      mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Memuat Data Dashboard...</p></div>`;
      if (window.lucide) lucide.createIcons();

      const stats = await window.api.getDashboardStats();

      // Item 7: Keterangan mapel lengkap dan belum lengkap
      let mapelStatusHtml = '';

      const completeList = stats.subjectsComplete || [];
      const needsInputList = stats.subjectsNeedsInput || [];

      if (completeList.length > 0 || needsInputList.length > 0) {
        mapelStatusHtml = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <!-- Mapel Lengkap (Hijau) -->
            <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-xs">
              <div class="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i> Mapel Selesai Diinput (${completeList.length}):
              </div>
              ${completeList.length > 0 
                ? `<div class="flex flex-wrap gap-1.5 mt-2">
                    ${completeList.map(s => `<span class="bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-md text-xs font-semibold">${s}</span>`).join('')}
                   </div>`
                : `<p class="text-xs text-emerald-700 italic">Belum ada mata pelajaran yang 100% lengkap.</p>`
              }
            </div>

            <!-- Mapel Belum Lengkap (Kuning/Amber) -->
            <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-xs">
              <div class="flex items-center gap-2 text-amber-800 font-bold mb-2">
                <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600"></i> Mapel Belum Lengkap Nilai (${needsInputList.length}):
              </div>
              ${needsInputList.length > 0 
                ? `<div class="flex flex-wrap gap-1.5 mt-2">
                    ${needsInputList.map(s => `<span class="bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-md text-xs font-semibold">${s}</span>`).join('')}
                   </div>`
                : `<p class="text-xs text-amber-700 italic">Hebat! Semua mata pelajaran telah lengkap nilainya.</p>`
              }
            </div>
          </div>
        `;
      }

      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-xs">
          <h2 class="text-2xl font-bold mb-6 text-gray-800">Ringkasan Data Sekolah</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-5 rounded-xl border border-blue-100 flex items-center gap-4 shadow-xs">
              <div class="bg-blue-500 p-3 rounded-xl text-white"><i data-lucide="users" class="w-6 h-6"></i></div>
              <div>
                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Siswa</p>
                <p class="font-bold text-2xl text-gray-800">${stats.totalStudents}</p>
                <p class="text-xs text-gray-500">L: ${stats.totalBoys} | P: ${stats.totalGirls}</p>
              </div>
            </div>
            <div class="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex items-center gap-4 shadow-xs">
              <div class="bg-emerald-500 p-3 rounded-xl text-white"><i data-lucide="book-open" class="w-6 h-6"></i></div>
              <div>
                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Mapel</p>
                <p class="font-bold text-2xl text-gray-800">${stats.totalSubjects}</p>
                <p class="text-xs text-gray-500">${completeList.length} selesai diinput</p>
              </div>
            </div>
            <div class="bg-purple-50 p-5 rounded-xl border border-purple-100 flex items-center gap-4 shadow-xs">
              <div class="bg-purple-500 p-3 rounded-xl text-white"><i data-lucide="check-circle" class="w-6 h-6"></i></div>
              <div>
                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider">Nilai Diinput</p>
                <p class="font-bold text-2xl text-gray-800">${stats.totalScoresEntered} <span class="text-xs font-normal text-gray-500">/ ${stats.totalScoresExpected}</span></p>
                <p class="text-xs text-gray-500">${stats.totalScoresExpected > 0 ? Math.round((stats.totalScoresEntered / stats.totalScoresExpected) * 100) : 0}% terisi</p>
              </div>
            </div>
            <div class="bg-orange-50 p-5 rounded-xl border border-orange-100 flex items-center gap-4 shadow-xs">
              <div class="bg-orange-500 p-3 rounded-xl text-white"><i data-lucide="file-edit" class="w-6 h-6"></i></div>
              <div>
                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider">Nilai Remidi</p>
                <p class="font-bold text-2xl text-gray-800">${stats.totalRemedialEntered}</p>
                <p class="text-xs text-gray-500">Peserta remidi terdata</p>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 border border-slate-200 p-6 rounded-xl mb-6">
            <h3 class="font-bold text-base mb-3 text-slate-800 flex items-center gap-2">
              <i data-lucide="school" class="w-5 h-5 text-blue-600"></i> Informasi Aktif Sekolah & Rombel
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 text-sm text-slate-700">
              <div><span class="font-semibold w-32 inline-block text-gray-500">Nama Sekolah</span>: <strong>${schoolInfoCache.school_name}</strong></div>
              <div><span class="font-semibold w-32 inline-block text-gray-500">Kepala Sekolah</span>: <strong>${schoolInfoCache.headmaster_name}</strong></div>
              <div><span class="font-semibold w-32 inline-block text-gray-500">Tahun Ajaran</span>: ${schoolInfoCache.academic_year}</div>
              <div><span class="font-semibold w-32 inline-block text-gray-500">Wali Kelas</span>: ${schoolInfoCache.homeroom_name || '-'}</div>
              <div><span class="font-semibold w-32 inline-block text-gray-500">Semester</span>: ${schoolInfoCache.semester}</div>
              <div><span class="font-semibold w-32 inline-block text-gray-500">Kelas / Rombel</span>: <span class="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">${schoolInfoCache.class_name || '-'}</span></div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button id="btn-to-students" class="bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors">
              <i data-lucide="users" class="w-4 h-4"></i> Data Siswa
            </button>
            <button id="btn-to-subjects" class="bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors">
              <i data-lucide="book-open" class="w-4 h-4"></i> Mata Pelajaran
            </button>
            <button id="btn-to-scores" class="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Input Nilai
            </button>
            <button id="btn-to-leger" class="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors">
              <i data-lucide="table-properties" class="w-4 h-4"></i> Leger Nilai
            </button>
          </div>

          ${mapelStatusHtml}
        </div>
      `;

      if (window.lucide) lucide.createIcons();

      document.getElementById('btn-to-students').addEventListener('click', renderStudents);
      document.getElementById('btn-to-subjects').addEventListener('click', renderSubjects);
      document.getElementById('btn-to-scores').addEventListener('click', renderScores);
      document.getElementById('btn-to-leger').addEventListener('click', renderLeger);
    }

    // ==========================================
    // 2. SETTINGS MODULE (Item 1, 2, 8, 10)
    // ==========================================
    function renderSetupForm(defaultTab = 'data-sekolah') {
      setActiveNav('nav-settings');
      updateTopbarTitle('Pengaturan');
      const isComplete = isSetupComplete(schoolInfoCache);

      let guardBanner = '';
      if (!isComplete) {
        guardBanner = `
          <div class="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <div class="flex items-center gap-2 text-amber-800 font-bold mb-1">
              <i data-lucide="lock" class="w-5 h-5 text-amber-600"></i> Pengaturan Wajib Diisi
            </div>
            <p class="text-sm text-amber-700">
              Silakan lengkapi formulir pada tab <strong>Data Sekolah</strong> dan <strong>Pengaturan Cetak</strong> di bawah ini, kemudian klik <strong>Simpan Pengaturan</strong> untuk membuka semua menu aplikasi.
            </p>
          </div>
        `;
      }

      mainContent.innerHTML = `
        <div class="bg-white rounded-xl shadow-xs">
          ${guardBanner}
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px px-6 overflow-x-auto" aria-label="Tabs">
              <button id="tab-data-sekolah" class="text-blue-600 border-blue-600 font-semibold border-b-2 py-4 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2"><i data-lucide="building-2" class="w-4 h-4"></i> 1. Data Sekolah</div>
              </button>
              <button id="tab-cetak-rapor" class="text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2"><i data-lucide="printer" class="w-4 h-4"></i> 2. Pengaturan Cetak</div>
              </button>
              <button id="tab-backup" class="text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2"><i data-lucide="database" class="w-4 h-4"></i> 3. Backup & Restore</div>
              </button>
              <button id="tab-tentang" class="text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2"><i data-lucide="info" class="w-4 h-4"></i> 4. Tentang Aplikasi</div>
              </button>
            </nav>
          </div>
          
          <form id="setup-form" class="p-8 space-y-6">
            
            <!-- TAB 1: DATA SEKOLAH -->
            <div id="section-data-sekolah" class="space-y-4">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Informasi Utama Sekolah</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Nama Sekolah <span class="text-red-500">*</span></label>
                  <input type="text" id="schoolName" value="${schoolInfoCache ? schoolInfoCache.school_name || '' : ''}" placeholder="Contoh: SMP Negeri 1 Contoh" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Nama Kepala Sekolah <span class="text-red-500">*</span></label>
                  <input type="text" id="headmasterName" value="${schoolInfoCache ? schoolInfoCache.headmaster_name || '' : ''}" placeholder="Nama lengkap & gelar" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">ID Kepala Sekolah</label>
                  <div class="flex">
                    <select id="headmasterIdType" class="border rounded-l-lg w-24 py-2 px-2 text-gray-700 bg-gray-50 border-r-0 outline-none text-sm font-semibold">
                      <option value="NUPTK" ${schoolInfoCache?.headmaster_id_type === 'NUPTK' ? 'selected' : (!schoolInfoCache?.headmaster_id_type ? 'selected' : '')}>NUPTK</option>
                      <option value="NIP" ${schoolInfoCache?.headmaster_id_type === 'NIP' ? 'selected' : ''}>NIP</option>
                    </select>
                    <input type="text" id="headmasterNuptk" value="${schoolInfoCache ? schoolInfoCache.headmaster_nuptk || '' : ''}" placeholder="Nomor ID" class="border rounded-r-lg w-full py-2 px-3 text-gray-700 outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Tahun Ajaran <span class="text-red-500">*</span></label>
                  <input type="text" id="academicYear" placeholder="Contoh: 2026/2027" value="${schoolInfoCache ? schoolInfoCache.academic_year || '' : ''}" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Semester <span class="text-red-500">*</span></label>
                  <select id="semester" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="Ganjil" ${schoolInfoCache?.semester === 'Ganjil' ? 'selected' : ''}>Ganjil</option>
                    <option value="Genap" ${schoolInfoCache?.semester === 'Genap' ? 'selected' : ''}>Genap</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- TAB 2: PENGATURAN CETAK -->
            <div id="section-cetak-rapor" class="space-y-4 hidden">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Atribut Rapor & Wali Kelas</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Nama Wali Kelas <span class="text-red-500">*</span></label>
                  <input type="text" id="homeroomName" value="${schoolInfoCache ? schoolInfoCache.homeroom_name || '' : ''}" placeholder="Nama lengkap & gelar" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">ID Wali Kelas</label>
                  <div class="flex">
                    <select id="homeroomIdType" class="border rounded-l-lg w-24 py-2 px-2 text-gray-700 bg-gray-50 border-r-0 outline-none text-sm font-semibold">
                      <option value="NUPTK" ${schoolInfoCache?.homeroom_id_type === 'NUPTK' ? 'selected' : (!schoolInfoCache?.homeroom_id_type ? 'selected' : '')}>NUPTK</option>
                      <option value="NIP" ${schoolInfoCache?.homeroom_id_type === 'NIP' ? 'selected' : ''}>NIP</option>
                    </select>
                    <input type="text" id="homeroomNuptk" value="${schoolInfoCache ? schoolInfoCache.homeroom_nuptk || '' : ''}" placeholder="Nomor ID" class="border rounded-r-lg w-full py-2 px-3 text-gray-700 outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Nama Kelas / Rombel <span class="text-red-500">*</span></label>
                  <input type="text" id="className" value="${schoolInfoCache ? schoolInfoCache.class_name || '' : ''}" placeholder="Contoh: VII-A atau X-1" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Tempat Cetak Rapor <span class="text-red-500">*</span></label>
                  <input type="text" id="printPlace" value="${schoolInfoCache ? schoolInfoCache.print_place || '' : ''}" placeholder="Contoh: Yogyakarta" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Tanggal Cetak Rapor <span class="text-red-500">*</span></label>
                  <input type="text" id="printDate" value="${schoolInfoCache ? schoolInfoCache.print_date || '' : ''}" placeholder="Contoh: 15 Oktober 2026" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required>
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-bold mb-2">Tampilkan Peringkat di Rapor</label>
                  <select id="showRank" class="border rounded-lg w-full py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="1" ${schoolInfoCache?.show_rank !== 0 ? 'selected' : ''}>Ya, Tampilkan Peringkat (Default)</option>
                    <option value="0" ${schoolInfoCache?.show_rank === 0 ? 'selected' : ''}>Tidak, Sembunyikan Peringkat</option>
                  </select>
                </div>
              </div>
              
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4 mt-8 border-t pt-6">Logo & Tanda Tangan (Opsional)</h3>
              <p class="text-xs text-gray-500 mb-4">Jika file gambar tidak diunggah, rapor akan dikosongkan untuk tanda tangan basah secara manual.</p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Logo Sekolah -->
                <div class="border p-4 rounded-xl bg-gray-50 flex flex-col items-center">
                  <label class="block text-gray-700 text-sm font-bold mb-2 text-center">Logo Sekolah</label>
                  <div class="w-32 h-32 border-2 border-dashed border-gray-300 bg-white mb-3 flex items-center justify-center overflow-hidden rounded-lg">
                    <img id="preview-logo" src="${schoolInfoCache && schoolInfoCache.logo_path ? 'file:///' + schoolInfoCache.logo_path.replace(/\\/g, '/') : ''}" class="${schoolInfoCache && schoolInfoCache.logo_path ? 'w-full h-full object-contain' : 'hidden'}" alt="Logo">
                    <span id="placeholder-logo" class="text-xs text-gray-400 text-center ${schoolInfoCache && schoolInfoCache.logo_path ? 'hidden' : ''}">Belum ada logo</span>
                  </div>
                  <input type="hidden" id="logoPath" value="${schoolInfoCache ? schoolInfoCache.logo_path || '' : ''}">
                  <button type="button" id="btn-pick-logo" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-2 px-4 rounded-lg w-full font-semibold">Pilih File Logo</button>
                  <button type="button" id="btn-clear-logo" class="text-red-500 hover:text-red-700 text-xs mt-2 font-medium">Hapus</button>
                </div>

                <!-- Tanda Tangan Kepala Sekolah -->
                <div class="border p-4 rounded-xl bg-gray-50 flex flex-col items-center">
                  <label class="block text-gray-700 text-sm font-bold mb-2 text-center">Ttd. Kepala Sekolah</label>
                  <div class="w-full h-24 border-2 border-dashed border-gray-300 bg-white mb-3 flex items-center justify-center overflow-hidden rounded-lg">
                    <img id="preview-kepsek" src="${schoolInfoCache && schoolInfoCache.headmaster_sign_path ? 'file:///' + schoolInfoCache.headmaster_sign_path.replace(/\\/g, '/') : ''}" class="${schoolInfoCache && schoolInfoCache.headmaster_sign_path ? 'w-full h-full object-contain' : 'hidden'}" alt="Ttd Kepsek">
                    <span id="placeholder-kepsek" class="text-xs text-gray-400 text-center ${schoolInfoCache && schoolInfoCache.headmaster_sign_path ? 'hidden' : ''}">Belum ada TTD</span>
                  </div>
                  <input type="hidden" id="headmasterSignPath" value="${schoolInfoCache ? schoolInfoCache.headmaster_sign_path || '' : ''}">
                  <button type="button" id="btn-pick-kepsek" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-2 px-4 rounded-lg w-full font-semibold">Pilih File TTD</button>
                  <button type="button" id="btn-clear-kepsek" class="text-red-500 hover:text-red-700 text-xs mt-2 font-medium">Hapus</button>
                </div>

                <!-- Tanda Tangan Wali Kelas -->
                <div class="border p-4 rounded-xl bg-gray-50 flex flex-col items-center">
                  <label class="block text-gray-700 text-sm font-bold mb-2 text-center">Ttd. Wali Kelas</label>
                  <div class="w-full h-24 border-2 border-dashed border-gray-300 bg-white mb-3 flex items-center justify-center overflow-hidden rounded-lg">
                    <img id="preview-walikelas" src="${schoolInfoCache && schoolInfoCache.homeroom_sign_path ? 'file:///' + schoolInfoCache.homeroom_sign_path.replace(/\\/g, '/') : ''}" class="${schoolInfoCache && schoolInfoCache.homeroom_sign_path ? 'w-full h-full object-contain' : 'hidden'}" alt="Ttd Wali Kelas">
                    <span id="placeholder-walikelas" class="text-xs text-gray-400 text-center ${schoolInfoCache && schoolInfoCache.homeroom_sign_path ? 'hidden' : ''}">Belum ada TTD</span>
                  </div>
                  <input type="hidden" id="homeroomSignPath" value="${schoolInfoCache ? schoolInfoCache.homeroom_sign_path || '' : ''}">
                  <button type="button" id="btn-pick-walikelas" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-2 px-4 rounded-lg w-full font-semibold">Pilih File TTD</button>
                  <button type="button" id="btn-clear-walikelas" class="text-red-500 hover:text-red-700 text-xs mt-2 font-medium">Hapus</button>
                </div>
              </div>
            </div>

            <!-- TAB 3: BACKUP & RESTORE (Item 10) -->
            <div id="section-backup" class="space-y-6 hidden">
              <div>
                <h3 class="text-lg font-medium leading-6 text-gray-900 mb-2">Cadangkan & Pulihkan Data (Backup & Restore)</h3>
                <p class="text-sm text-gray-600">Amankan seluruh data sekolah, siswa, nilai, dan kehadiran dalam satu file database terenkripsi lokal.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Backup Box -->
                <div class="border border-blue-200 bg-blue-50/60 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div class="flex items-center gap-3 text-blue-900 font-bold text-base mb-2">
                      <div class="p-2 bg-blue-500 text-white rounded-lg"><i data-lucide="download" class="w-5 h-5"></i></div>
                      Cadangkan Data (Backup)
                    </div>
                    <p class="text-xs text-blue-800 leading-relaxed mb-4">
                      Simpan salinan database aplikasi ke lokasi yang Anda inginkan (misal: Flashdisk, Google Drive lokal, atau folder cadangan).
                    </p>
                  </div>
                  <button type="button" id="btn-do-backup" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors">
                    <i data-lucide="save" class="w-4 h-4"></i> Simpan Cadangan Database (.sqlite)
                  </button>
                </div>

                <!-- Restore Box -->
                <div class="border border-amber-200 bg-amber-50/60 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div class="flex items-center gap-3 text-amber-900 font-bold text-base mb-2">
                      <div class="p-2 bg-amber-500 text-white rounded-lg"><i data-lucide="upload" class="w-5 h-5"></i></div>
                      Pulihkan Data (Restore)
                    </div>
                    <p class="text-xs text-amber-800 leading-relaxed mb-4">
                      Pulihkan data dari file cadangan sebelumnya. <strong>Perhatian:</strong> Data aktif saat ini akan ditimpa dengan data dari file cadangan.
                    </p>
                  </div>
                  <button type="button" id="btn-do-restore" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors">
                    <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Pilih File untuk Dipulihkan
                  </button>
                </div>
              </div>
            </div>

            <!-- TAB 4: TENTANG APLIKASI -->
            <div id="section-tentang" class="space-y-4 hidden">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Tentang Aplikasi</h3>
              <div class="bg-blue-50 border border-blue-100 p-8 rounded-2xl text-center max-w-xl mx-auto">
                <i data-lucide="graduation-cap" class="w-16 h-16 text-blue-600 mx-auto mb-3"></i>
                <h4 class="text-2xl font-bold text-gray-800">e-Rapor Tengah Semester (e-RTS)</h4>
                <p class="text-sm font-semibold text-blue-700 mb-2">Versi 1.1.0 (Pembaruan Fitur & Perbaikan Bug)</p>
                
                <div class="text-xs text-gray-600 mb-6 space-y-1 bg-white p-3 rounded-lg border border-blue-100">
                  <p><strong>Developer:</strong> SIGIE Lab by Nur Wahid Mustofa</p>
                  <p><strong>Lisensi:</strong> Freeware untuk Dunia Pendidikan Indonesia</p>
                  <p><strong>Basis Data:</strong> SQLite Native Embedded (100% Offline)</p>
                </div>

                <div class="bg-white p-5 rounded-xl border shadow-xs text-left">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 bg-red-100 text-red-600 rounded-lg"><i data-lucide="coffee" class="w-5 h-5"></i></div>
                    <div>
                      <h5 class="font-bold text-gray-800 text-sm">Dukung Developer ❤️</h5>
                      <p class="text-xs text-gray-500">Traktir kopi / cendol untuk kelanjutan update aplikasi.</p>
                    </div>
                  </div>
                  <button type="button" id="btn-trakteer-tab" class="mt-3 w-full inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors justify-center text-sm shadow-xs">
                    <i data-lucide="external-link" class="w-4 h-4"></i> Buka Halaman Trakteer Developer
                  </button>
                </div>
              </div>
            </div>

            <div id="save-settings-container" class="pt-4 flex justify-end border-t border-gray-200 mt-6">
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-bold py-2.5 px-6 rounded-xl shadow-sm text-sm transition-colors">
                <i data-lucide="save" class="w-4 h-4"></i> Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>
      `;

      if (window.lucide) lucide.createIcons();

      // Tab switching
      const tabData = document.getElementById('tab-data-sekolah');
      const tabCetak = document.getElementById('tab-cetak-rapor');
      const tabBackup = document.getElementById('tab-backup');
      const tabTentang = document.getElementById('tab-tentang');

      const secData = document.getElementById('section-data-sekolah');
      const secCetak = document.getElementById('section-cetak-rapor');
      const secBackup = document.getElementById('section-backup');
      const secTentang = document.getElementById('section-tentang');
      const saveContainer = document.getElementById('save-settings-container');

      function switchTab(activeTab, activeSec, showSave = true) {
        [secData, secCetak, secBackup, secTentang].forEach(s => s.classList.add('hidden'));
        activeSec.classList.remove('hidden');

        [tabData, tabCetak, tabBackup, tabTentang].forEach(t => {
          t.className = "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 font-medium border-b-2 py-4 px-4 whitespace-nowrap";
        });
        activeTab.className = "text-blue-600 border-blue-600 font-semibold border-b-2 py-4 px-4 whitespace-nowrap";

        if (showSave) saveContainer.classList.remove('hidden');
        else saveContainer.classList.add('hidden');
      }

      tabData.addEventListener('click', (e) => { e.preventDefault(); switchTab(tabData, secData, true); });
      tabCetak.addEventListener('click', (e) => { e.preventDefault(); switchTab(tabCetak, secCetak, true); });
      tabBackup.addEventListener('click', (e) => { e.preventDefault(); switchTab(tabBackup, secBackup, false); });
      tabTentang.addEventListener('click', (e) => { e.preventDefault(); switchTab(tabTentang, secTentang, false); });

      // Jika dibuka dari pintasan pengaturan cetak
      if (defaultTab === 'cetak-rapor') {
        switchTab(tabCetak, secCetak, true);
      }

      document.getElementById('btn-trakteer-tab').addEventListener('click', () => {
        if (window.api && window.api.openLink) {
          window.api.openLink('https://trakteer.id/nur_wahid_musthofa/gift');
        }
      });

      // Backup & Restore handlers
      document.getElementById('btn-do-backup').addEventListener('click', async () => {
        const result = await window.api.backupDatabase();
        if (result.success) {
          showToast(`Cadangan database berhasil disimpan!`, 'success');
        } else if (!result.canceled) {
          showToast(`Gagal mencadangkan database: ${result.error || ''}`, 'error');
        }
      });

      document.getElementById('btn-do-restore').addEventListener('click', async () => {
        const confirmRestore = await showConfirmModal({
          title: 'Konfirmasi Pemulihan Database',
          message: 'Apakah Anda yakin ingin memulihkan database dari file cadangan? Seluruh data yang sedang aktif akan ditimpa dengan data dari file cadangan tersebut.',
          confirmText: 'Ya, Pulihkan Data',
          isDanger: true
        });

        if (confirmRestore) {
          const result = await window.api.restoreDatabase();
          if (result.success) {
            showToast('Database berhasil dipulihkan! Memperbarui data...', 'success');
            schoolInfoCache = await window.api.getSchoolInfo();
            updateSidebarLockState();
            setTimeout(() => {
              renderDashboard();
            }, 1000);
          } else if (!result.canceled) {
            showToast(`Gagal memulihkan database: ${result.error || ''}`, 'error');
          }
        }
      });

      // Images Pick & Clear
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

      // Form Submit
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
          showRank: parseInt(document.getElementById('showRank').value)
        };

        try {
          const wasCompleteBefore = isSetupComplete(schoolInfoCache);
          await window.api.saveSchoolInfo(data);
          schoolInfoCache = await window.api.getSchoolInfo();
          
          if (schoolInfoCache) {
            document.getElementById('topbar-school-info').innerText = `${schoolInfoCache.academic_year || '-'} - ${schoolInfoCache.semester || '-'}`;
          }

          updateSidebarLockState();

          // Cek apakah setup lengkap
          if (isSetupComplete(schoolInfoCache)) {
            showToast('Pengaturan berhasil disimpan! Membuka Dashboard...', 'success');
            
            // Item 3: Popup trakteer setelah mengisi pengaturan awal
            if (!wasCompleteBefore) {
              setTimeout(() => {
                showTrakteerModal();
              }, 1200);
            }

            // Item 2: Langsung membuka menu dashboard
            setTimeout(() => {
              renderDashboard();
            }, 800);
          } else {
            showToast('Pengaturan disimpan, tetapi data belum lengkap. Harap lengkapi semua isian bertanda bintang (*).', 'warning');
          }

        } catch (error) {
          showToast('Gagal menyimpan data: ' + error.message, 'error');
        }
      });
    }

    // ==========================================
    // 3. STUDENTS MODULE
    // ==========================================
    async function renderStudents() {
      setActiveNav('nav-students');
      updateTopbarTitle('Data Siswa');
      mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Memuat Data Siswa...</p></div>`;
      if (window.lucide) lucide.createIcons();

      const students = await window.api.getStudents();
      
      let rows = students.map((s, index) => `
        <tr class="border-b hover:bg-gray-50 transition-colors">
          <td class="py-2.5 px-4 text-center font-medium text-gray-500">${index + 1}</td>
          <td class="py-2.5 px-4 font-mono text-sm">${s.nisn}</td>
          <td class="py-2.5 px-4 font-semibold text-gray-800">${s.name}</td>
          <td class="py-2.5 px-4 text-center"><span class="px-2 py-0.5 rounded text-xs font-bold ${s.gender === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}">${s.gender || '-'}</span></td>
          <td class="py-2.5 px-4 text-center whitespace-nowrap">
            <button class="text-blue-600 hover:text-blue-800 edit-student-btn mr-3 font-semibold text-xs inline-flex items-center gap-1" data-id="${s.id}" data-nisn="${s.nisn}" data-name="${s.name}" data-gender="${s.gender}">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
            </button>
            <button class="text-red-500 hover:text-red-700 delete-student-btn font-semibold text-xs inline-flex items-center gap-1" data-id="${s.id}" data-name="${s.name}">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Hapus
            </button>
          </td>
        </tr>
      `).join('');

      if (students.length === 0) {
        rows = `<tr><td colspan="5" class="py-8 text-center text-gray-400">Belum ada data siswa. Silakan tambahkan manual atau impor dari Dapodik (Excel).</td></tr>`;
      }

      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-xs">
          <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">Kelola Data Siswa</h2>
              <p class="text-xs text-gray-500 mt-0.5">Total ${students.length} siswa terdaftar di rombel ini.</p>
            </div>
            <div class="flex gap-2">
              <button id="btn-reset-students" class="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i> Reset Siswa
              </button>
              <button id="btn-import-dapodik" class="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold shadow-xs transition-colors">
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Impor Data Dapodik (Excel)
              </button>
            </div>
          </div>
          
          <form id="add-student-form" class="flex flex-wrap md:flex-nowrap gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 items-end">
            <input type="hidden" id="studentId" value="">
            <div class="w-full md:w-48">
              <label class="block text-xs font-bold text-gray-700 mb-1">NISN <span class="text-red-500">*</span></label>
              <input type="text" id="studentNisn" placeholder="10 digit NISN" class="border rounded-lg p-2 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
            </div>
            <div class="w-full md:flex-1">
              <label class="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Siswa <span class="text-red-500">*</span></label>
              <input type="text" id="studentName" placeholder="Nama lengkap" class="border rounded-lg p-2 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
            </div>
            <div class="w-full md:w-36">
              <label class="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin</label>
              <select id="studentGender" class="border rounded-lg p-2 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div class="flex gap-2 w-full md:w-auto">
              <button type="submit" id="btn-submit-student" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-bold text-sm shadow-xs transition-colors">Simpan</button>
              <button type="button" id="btn-cancel-edit" class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold text-sm hidden transition-colors">Batal</button>
            </div>
          </form>

          <div class="overflow-x-auto border border-gray-100 rounded-xl">
            <table class="min-w-full bg-white text-sm">
              <thead class="bg-slate-100/70 border-b border-gray-200 text-slate-700">
                <tr>
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4 text-left w-36">NISN</th>
                  <th class="py-3 px-4 text-left">Nama Siswa</th>
                  <th class="py-3 px-4 w-24 text-center">L/P</th>
                  <th class="py-3 px-4 w-32 text-center">Aksi</th>
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

      // Form student submit
      document.getElementById('add-student-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('studentId').value;
        const nisn = document.getElementById('studentNisn').value.trim();
        const name = document.getElementById('studentName').value.trim();
        const gender = document.getElementById('studentGender').value;

        try {
          if (id) {
            await window.api.updateStudent({ id, nisn, name, gender });
            showToast(`Data siswa "${name}" berhasil diperbarui`, 'success');
          } else {
            await window.api.addStudent({ nisn, name, gender });
            showToast(`Siswa "${name}" berhasil ditambahkan`, 'success');
          }
          renderStudents();
        } catch (err) {
          showToast('Gagal menyimpan siswa: ' + err.message, 'error');
        }
      });

      document.getElementById('btn-cancel-edit').addEventListener('click', () => {
        document.getElementById('studentId').value = '';
        document.getElementById('studentNisn').value = '';
        document.getElementById('studentName').value = '';
        document.getElementById('studentGender').value = 'L';
        document.getElementById('btn-submit-student').innerText = 'Simpan';
        document.getElementById('btn-submit-student').className = 'bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-bold text-sm shadow-xs transition-colors';
        document.getElementById('btn-cancel-edit').classList.add('hidden');
      });

      document.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget;
          const id = target.getAttribute('data-id');
          const nisn = target.getAttribute('data-nisn');
          const name = target.getAttribute('data-name');
          const gender = target.getAttribute('data-gender');
          
          document.getElementById('studentId').value = id;
          document.getElementById('studentNisn').value = nisn;
          document.getElementById('studentName').value = name;
          document.getElementById('studentGender').value = gender || 'L';
          
          document.getElementById('btn-submit-student').innerText = 'Update';
          document.getElementById('btn-submit-student').className = 'bg-amber-500 hover:bg-amber-600 text-white py-2 px-6 rounded-lg font-bold text-sm shadow-xs transition-colors';
          document.getElementById('btn-cancel-edit').classList.remove('hidden');
          
          const inputName = document.getElementById('studentName');
          inputName.focus();
          inputName.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });

      document.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const target = e.currentTarget;
          const id = target.getAttribute('data-id');
          const name = target.getAttribute('data-name');

          const ok = await showConfirmModal({
            title: 'Hapus Siswa',
            message: `Apakah Anda yakin ingin menghapus data siswa "${name}"? Seluruh nilai dan kehadiran siswa ini juga akan ikut terhapus.`,
            confirmText: 'Ya, Hapus Siswa',
            isDanger: true
          });

          if (ok) {
            await window.api.deleteStudent(id);
            showToast(`Siswa "${name}" berhasil dihapus`, 'success');
            renderStudents();
          }
        });
      });

      // Reset siswa
      document.getElementById('btn-reset-students').addEventListener('click', async () => {
        const ok = await showConfirmModal({
          title: 'Reset Seluruh Data Siswa',
          message: 'Tindakan ini akan menghapus SEMUA siswa beserta seluruh nilai mata pelajaran dan catatan kehadiran yang telah diinput! Apakah Anda yakin?',
          confirmText: 'Ya, Reset Semua Data',
          isDanger: true
        });

        if (ok) {
          await window.api.resetStudents();
          showToast('Seluruh data siswa berhasil direset!', 'info');
          renderStudents();
        }
      });

      // Import Dapodik
      const doImport = async (filePath, selectedClass) => {
        showToast('Memproses impor file Dapodik...', 'info');
        const count = await window.api.importStudentsExcel({ filePath, selectedClass });
        if (count && count > 0) {
          showToast(`Berhasil mengimpor ${count} siswa baru dari Excel!`, 'success');
          renderStudents();
        } else {
          showToast('Tidak ada data siswa baru yang diimpor.', 'warning');
        }
      };

      document.getElementById('btn-import-dapodik').addEventListener('click', async () => {
        const scanResult = await window.api.scanExcelClasses();
        if (!scanResult) return;
        
        const { filePath, classes } = scanResult;
        if (!classes || classes.length === 0) {
          doImport(filePath, null);
          return;
        }

        const modalHtml = `
          <div id="import-modal" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <h3 class="text-lg font-bold text-gray-900 mb-2">Pilih Rombel / Kelas</h3>
              <p class="text-xs text-gray-500 mb-4">File Excel memiliki data dari beberapa Rombel. Silakan pilih kelas yang ingin diimpor:</p>
              <select id="import-class-select" class="w-full border rounded-lg p-2.5 mb-5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Impor Semua Kelas --</option>
                ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
              <div class="flex justify-end gap-2">
                <button id="btn-cancel-import" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold">Batal</button>
                <button id="btn-confirm-import" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">Impor Sekarang</button>
              </div>
            </div>
          </div>
        `;
        modalContainer.innerHTML = modalHtml;

        document.getElementById('btn-cancel-import').addEventListener('click', () => {
          modalContainer.innerHTML = '';
        });

        document.getElementById('btn-confirm-import').addEventListener('click', () => {
          const selectedClass = document.getElementById('import-class-select').value;
          modalContainer.innerHTML = '';
          doImport(filePath, selectedClass || null);
        });
      });
    }

    // ==========================================
    // 4. SUBJECTS MODULE
    // ==========================================
    async function renderSubjects() {
      setActiveNav('nav-subjects');
      updateTopbarTitle('Mata Pelajaran');
      mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Memuat Mata Pelajaran...</p></div>`;
      if (window.lucide) lucide.createIcons();

      const subjects = await window.api.getSubjects();
      
      let rows = subjects.map((s, index) => `
        <tr class="border-b hover:bg-gray-50 transition-colors">
          <td class="py-2.5 px-4 text-center font-medium text-gray-500">${index + 1}</td>
          <td class="py-2.5 px-4 font-semibold text-gray-800">${s.name}</td>
          <td class="py-2.5 px-4 text-center">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.category === 'Wajib' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}">
              ${s.category || 'Wajib'}
            </span>
          </td>
          <td class="py-2.5 px-4 text-center whitespace-nowrap">
            <button class="text-blue-600 hover:text-blue-800 edit-subject-btn mr-3 font-semibold text-xs inline-flex items-center gap-1" data-id="${s.id}" data-name="${s.name}" data-category="${s.category}">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
            </button>
            <button class="text-red-500 hover:text-red-700 delete-subject-btn font-semibold text-xs inline-flex items-center gap-1" data-id="${s.id}" data-name="${s.name}">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Hapus
            </button>
          </td>
        </tr>
      `).join('');

      if (subjects.length === 0) {
        rows = `<tr><td colspan="4" class="py-8 text-center text-gray-400">Belum ada mata pelajaran. Silakan generate standar atau tambah manual.</td></tr>`;
      }

      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-xs">
          <h2 class="text-2xl font-bold mb-4 text-gray-800">Kelola Mata Pelajaran</h2>
          
          <div class="mb-6 bg-blue-50/70 p-5 rounded-2xl border border-blue-200">
            <h3 class="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-blue-600"></i> Generate Mata Pelajaran Standar
            </h3>
            <p class="text-xs text-blue-700 mb-4">Tambahkan daftar mata pelajaran resmi Kurikulum Merdeka atau K13 sesuai jenjang sekolah Anda secara instan.</p>
            <div class="flex flex-wrap md:flex-nowrap gap-3 items-end mb-4">
              <div class="w-full md:flex-1">
                <label class="block text-xs font-bold text-gray-700 mb-1">Kurikulum</label>
                <select id="sel-kurikulum" class="border rounded-lg p-2 w-full text-sm outline-none bg-white">
                  <option value="">-- Pilih Kurikulum --</option>
                  <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                  <option value="K13">Kurikulum 2013 (K13)</option>
                </select>
              </div>
              <div class="w-full md:flex-1">
                <label class="block text-xs font-bold text-gray-700 mb-1">Jenjang Pendidikan</label>
                <select id="sel-jenjang" class="border rounded-lg p-2 w-full text-sm outline-none bg-white">
                  <option value="">-- Pilih Jenjang --</option>
                  <option value="SD">SD/MI</option>
                  <option value="SMP">SMP/MTs</option>
                  <option value="SMA">SMA/MA</option>
                  <option value="SMK">SMK/MAK</option>
                </select>
              </div>
              <button id="btn-show-standard-subjects" class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg font-bold text-sm shadow-xs transition-colors">Tampilkan</button>
            </div>
            
            <div id="standard-subjects-container" class="hidden bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
              <p class="text-xs text-gray-600 mb-3 font-semibold">Centang mata pelajaran yang ingin ditambahkan:</p>
              <div id="standard-subjects-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-52 overflow-y-auto p-2 border bg-gray-50 rounded-lg"></div>
              <button id="btn-add-selected-subjects" class="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 rounded-lg font-bold text-xs w-full shadow-xs transition-colors">Tambahkan Mapel Terpilih</button>
            </div>
          </div>

          <h3 class="font-bold text-gray-800 mb-2">Tambah / Edit Manual</h3>
          <form id="add-subject-form" class="flex flex-wrap md:flex-nowrap gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 items-end">
            <input type="hidden" id="subjectId" value="">
            <div class="w-full md:flex-2">
              <label class="block text-xs font-bold text-gray-700 mb-1">Nama Mata Pelajaran <span class="text-red-500">*</span></label>
              <input type="text" id="subjectName" placeholder="Contoh: Pendidikan Pancasila" class="border rounded-lg p-2 w-full text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500" required>
            </div>
            <div class="w-full md:flex-1">
              <label class="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
              <select id="subjectCategory" class="border rounded-lg p-2 w-full text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500" required>
                <option value="Wajib">Mata Pelajaran Wajib</option>
                <option value="Muatan Lokal">Muatan Lokal</option>
              </select>
            </div>
            <div class="flex gap-2 w-full md:w-auto">
              <button type="submit" id="btn-submit-subject" class="bg-slate-800 hover:bg-slate-900 text-white py-2 px-6 rounded-lg font-bold text-sm shadow-xs transition-colors">Tambah</button>
              <button type="button" id="btn-cancel-edit-subject" class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold text-sm hidden transition-colors">Batal</button>
            </div>
          </form>

          <div class="overflow-x-auto border border-gray-100 rounded-xl">
            <table class="min-w-full bg-white text-sm">
              <thead class="bg-slate-100/70 border-b border-gray-200 text-slate-700">
                <tr>
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4 text-left">Nama Mata Pelajaran</th>
                  <th class="py-3 px-4 w-40 text-center">Kategori</th>
                  <th class="py-3 px-4 w-28 text-center">Aksi</th>
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
          showToast('Silakan pilih Kurikulum dan Jenjang terlebih dahulu!', 'warning');
          return;
        }

        if (typeof CURRICULUM_DATA === 'undefined' || !CURRICULUM_DATA[kurikulum] || !CURRICULUM_DATA[kurikulum][jenjang]) {
          showToast('Data kurikulum belum tersedia.', 'error');
          return;
        }

        const standardSubjects = CURRICULUM_DATA[kurikulum][jenjang];
        const listContainer = document.getElementById('standard-subjects-list');
        
        listContainer.innerHTML = standardSubjects.map(s => `
          <label class="flex items-center gap-2 text-xs p-2 hover:bg-gray-200 rounded cursor-pointer border border-transparent">
            <input type="checkbox" class="std-subject-chk w-4 h-4 rounded text-blue-600" value="${s.name}" data-category="${s.category}" checked>
            <span class="truncate font-medium text-gray-800">${s.name} <span class="text-gray-400">(${s.category})</span></span>
          </label>
        `).join('');

        document.getElementById('standard-subjects-container').classList.remove('hidden');
      });

      document.getElementById('btn-add-selected-subjects').addEventListener('click', async () => {
        const checkboxes = document.querySelectorAll('.std-subject-chk:checked');
        if (checkboxes.length === 0) {
          showToast('Pilih minimal satu mata pelajaran.', 'warning');
          return;
        }
        
        let addedCount = 0;
        for (const chk of checkboxes) {
          const name = chk.value;
          const category = chk.getAttribute('data-category');
          if (!subjects.some(sub => sub.name.toLowerCase() === name.toLowerCase())) {
            await window.api.addSubject({ name, category });
            addedCount++;
          }
        }
        
        showToast(`Berhasil menambahkan ${addedCount} mata pelajaran standar!`, 'success');
        renderSubjects();
      });

      document.getElementById('add-subject-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('subjectId').value;
        const name = document.getElementById('subjectName').value.trim();
        const category = document.getElementById('subjectCategory').value;
        
        if (id) {
          await window.api.updateSubject({ id, name, category });
          showToast(`Mata pelajaran "${name}" diperbarui`, 'success');
        } else {
          await window.api.addSubject({ name, category });
          showToast(`Mata pelajaran "${name}" ditambahkan`, 'success');
        }
        renderSubjects();
      });

      document.getElementById('btn-cancel-edit-subject').addEventListener('click', () => {
        document.getElementById('subjectId').value = '';
        document.getElementById('subjectName').value = '';
        document.getElementById('subjectCategory').value = 'Wajib';
        document.getElementById('btn-submit-subject').innerText = 'Tambah';
        document.getElementById('btn-submit-subject').className = 'bg-slate-800 hover:bg-slate-900 text-white py-2 px-6 rounded-lg font-bold text-sm shadow-xs transition-colors';
        document.getElementById('btn-cancel-edit-subject').classList.add('hidden');
      });

      document.querySelectorAll('.edit-subject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget;
          const id = target.getAttribute('data-id');
          const name = target.getAttribute('data-name');
          const category = target.getAttribute('data-category');
          
          document.getElementById('subjectId').value = id;
          document.getElementById('subjectName').value = name;
          document.getElementById('subjectCategory').value = category || 'Wajib';
          
          document.getElementById('btn-submit-subject').innerText = 'Update';
          document.getElementById('btn-submit-subject').className = 'bg-amber-500 hover:bg-amber-600 text-white py-2 px-6 rounded-lg font-bold text-sm shadow-xs transition-colors';
          document.getElementById('btn-cancel-edit-subject').classList.remove('hidden');
          
          const inputName = document.getElementById('subjectName');
          inputName.focus();
          inputName.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });

      document.querySelectorAll('.delete-subject-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const target = e.currentTarget;
          const id = target.getAttribute('data-id');
          const name = target.getAttribute('data-name');

          const ok = await showConfirmModal({
            title: 'Hapus Mata Pelajaran',
            message: `Apakah Anda yakin ingin menghapus "${name}"? Seluruh nilai siswa untuk mata pelajaran ini juga akan ikut terhapus.`,
            confirmText: 'Ya, Hapus Mapel',
            isDanger: true
          });

          if (ok) {
            await window.api.deleteSubject(id);
            showToast(`Mata pelajaran "${name}" dihapus`, 'success');
            renderSubjects();
          }
        });
      });
    }

    // ==========================================
    // 5. SCORES MODULE (Item 6 & 9 - Nilai 0 & Tidak Remedi)
    // ==========================================
    async function renderScores() {
      setActiveNav('nav-scores');
      updateTopbarTitle('Input Nilai');
      mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Memuat Mata Pelajaran...</p></div>`;
      if (window.lucide) lucide.createIcons();

      const subjects = await window.api.getSubjects();

      if (subjects.length === 0) {
        mainContent.innerHTML = `
          <div class="bg-white p-8 rounded-xl shadow-xs text-center">
            <p class="mb-4 text-red-500 font-semibold">Belum ada data mata pelajaran.</p>
            <button id="btn-add-subject-now" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Tambah Mapel Sekarang</button>
          </div>
        `;
        document.getElementById('btn-add-subject-now').addEventListener('click', renderSubjects);
        return;
      }

      const options = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-xs">
          <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">Input Nilai Siswa</h2>
              <p class="text-xs text-gray-500">Mendukung nilai desimal dan nilai nol (0).</p>
            </div>
            <div class="w-full md:w-72">
              <label class="block text-gray-700 text-xs font-bold mb-1">Pilih Mata Pelajaran:</label>
              <select id="score-subject-select" class="border rounded-lg p-2.5 w-full text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
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

      // Muat mata pelajaran pertama
      if (subjects.length > 0) {
        loadScoresTable(subjects[0].id, subjects[0].name);
      }
    }

    async function loadScoresTable(subjectId, subjectName) {
      const container = document.getElementById('scores-container');
      container.innerHTML = `<div class="p-6 text-center"><i data-lucide="loader-2" class="animate-spin w-6 h-6 mx-auto text-blue-600 mb-2"></i><p class="text-sm text-gray-500">Memuat data nilai...</p></div>`;
      if (window.lucide) lucide.createIcons();
      
      let scores = await window.api.getScoresBySubject(subjectId);
      
      if (scores.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">Belum ada data siswa. Silakan tambahkan siswa terlebih dahulu di menu Data Siswa.</div>`;
        return;
      }

      // Item 6: Nilai 0 tetap tampil sebagai '0', bukan string kosong
      let rows = scores.map((s, index) => {
        const origVal = (s.original_score !== null && s.original_score !== undefined) ? s.original_score : '';
        const remVal = (s.remedial_score !== null && s.remedial_score !== undefined) ? s.remedial_score : '';
        
        return `
          <tr class="border-b hover:bg-gray-50 score-row transition-colors" data-studentid="${s.student_id}">
            <td class="py-2.5 px-4 text-center font-medium text-gray-500">${index + 1}</td>
            <td class="py-2.5 px-4 font-mono text-sm">${s.nisn}</td>
            <td class="py-2.5 px-4 font-semibold text-gray-800">${s.name}</td>
            <td class="py-2.5 px-4 text-center">
              <input type="number" class="border rounded-lg p-1.5 w-24 text-center font-bold text-gray-800 orig-score focus:ring-2 focus:ring-blue-500 outline-none" value="${origVal}" step="0.01" min="0" max="100" placeholder="-">
            </td>
            <td class="py-2.5 px-4 text-center">
              <input type="number" class="border rounded-lg p-1.5 w-24 text-center font-bold text-emerald-700 remidi-score focus:ring-2 focus:ring-emerald-500 outline-none" value="${remVal}" step="0.01" min="0" max="100" placeholder="-">
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div class="flex flex-wrap justify-between items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Mapel:</span>
            <span class="font-bold text-blue-900">${subjectName}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <!-- Item 9: Tombol Tidak Remedi -->
            <button id="btn-no-remedi" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors">
              <i data-lucide="copy-check" class="w-4 h-4"></i> Tidak Remedi (Samakan Nilai)
            </button>
            <button id="btn-export-excel" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors">
              <i data-lucide="download" class="w-4 h-4"></i> Download Template Excel
            </button>
            <button id="btn-import-excel" class="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors">
              <i data-lucide="upload" class="w-4 h-4"></i> Import Excel
            </button>
          </div>
        </div>

        <div class="overflow-x-auto border border-gray-100 rounded-xl mb-4">
          <table class="min-w-full bg-white text-sm">
            <thead class="bg-slate-100/70 border-b border-gray-200 text-slate-700">
              <tr>
                <th class="py-3 px-4 w-12 text-center">No</th>
                <th class="py-3 px-4 text-left w-36">NISN</th>
                <th class="py-3 px-4 text-left">Nama Siswa</th>
                <th class="py-3 px-4 w-36 text-center">Nilai Asli</th>
                <th class="py-3 px-4 w-36 text-center">Nilai Remidi</th>
              </tr>
            </thead>
            <tbody id="scores-tbody">
              ${rows}
            </tbody>
          </table>
        </div>

        <div class="flex justify-between items-center pt-2">
          <p class="text-xs text-gray-500 italic">* Nilai 0 diakui sebagai nilai sah. Kosongkan kolom jika siswa belum dinilai.</p>
          <button id="btn-save-scores" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-xs flex items-center gap-2 text-sm transition-colors">
            <i data-lucide="save" class="w-4 h-4"></i> Simpan Nilai
          </button>
        </div>
      `;

      if (window.lucide) lucide.createIcons();

      // Item 9: Tombol "Tidak Remedi"
      document.getElementById('btn-no-remedi').addEventListener('click', () => {
        const rowsEl = document.querySelectorAll('.score-row');
        let filledCount = 0;

        rowsEl.forEach(row => {
          const orig = row.querySelector('.orig-score').value.trim();
          if (orig !== '') {
            row.querySelector('.remidi-score').value = orig;
            filledCount++;
          }
        });

        showToast(`${filledCount} nilai remidi berhasil disamakan dengan nilai asli. Klik "Simpan Nilai" untuk menyimpan!`, 'info');
      });

      // Simpan Nilai (Item 6: Simpan nilai 0 dengan benar)
      document.getElementById('btn-save-scores').addEventListener('click', async () => {
        const scoreRows = document.querySelectorAll('.score-row');
        const dataToSave = [];

        scoreRows.forEach(row => {
          const studentId = row.getAttribute('data-studentid');
          const origStr = row.querySelector('.orig-score').value.trim();
          const remStr = row.querySelector('.remidi-score').value.trim();

          dataToSave.push({
            student_id: studentId,
            original_score: origStr !== '' ? parseFloat(origStr) : null,
            remedial_score: remStr !== '' ? parseFloat(remStr) : null
          });
        });

        try {
          await window.api.saveScoresBySubject({ subjectId, scores: dataToSave });
          showToast(`Nilai mata pelajaran "${subjectName}" berhasil disimpan!`, 'success');
        } catch (err) {
          showToast('Gagal menyimpan nilai: ' + err.message, 'error');
        }
      });

      // Export Template
      document.getElementById('btn-export-excel').addEventListener('click', async () => {
        const schoolInfo = schoolInfoCache || await window.api.getSchoolInfo();
        const className = schoolInfo ? (schoolInfo.class_name || 'Kelas') : 'Kelas';
        
        // Ambil data nilai terkini dari input layar
        const scoreRows = document.querySelectorAll('.score-row');
        const currentData = [];
        scoreRows.forEach(row => {
          const studentId = row.getAttribute('data-studentid');
          const nisn = row.querySelector('td:nth-child(2)').innerText.trim();
          const name = row.querySelector('td:nth-child(3)').innerText.trim();
          const origStr = row.querySelector('.orig-score').value.trim();
          const remStr = row.querySelector('.remidi-score').value.trim();

          currentData.push({
            student_id: studentId,
            nisn,
            name,
            original_score: origStr !== '' ? parseFloat(origStr) : null,
            remedial_score: remStr !== '' ? parseFloat(remStr) : null
          });
        });

        const success = await window.api.exportExcel({ subjectName, className, scores: currentData });
        if (success) {
          showToast(`Template Excel untuk "${subjectName}" berhasil diekspor!`, 'success');
        }
      });

      // Import Excel
      document.getElementById('btn-import-excel').addEventListener('click', async () => {
        const importedData = await window.api.importExcel();
        if (importedData) {
          const scoreRows = document.querySelectorAll('.score-row');
          let updateCount = 0;
          
          scoreRows.forEach(row => {
            const nisn = row.querySelector('td:nth-child(2)').innerText.trim();
            const name = row.querySelector('td:nth-child(3)').innerText.trim();
            
            const match = importedData.find(d => (d.nisn && d.nisn === nisn) || (d.name && d.name.toLowerCase() === name.toLowerCase()));
            if (match) {
              row.querySelector('.orig-score').value = (match.original_score !== null && match.original_score !== undefined) ? match.original_score : '';
              row.querySelector('.remidi-score').value = (match.remedial_score !== null && match.remedial_score !== undefined) ? match.remedial_score : '';
              updateCount++;
            }
          });
          showToast(`Berhasil mengimpor nilai untuk ${updateCount} siswa. Klik "Simpan Nilai" untuk menyimpan perubahan.`, 'success');
        }
      });
    }

    // ==========================================
    // 6. ATTENDANCE MODULE
    // ==========================================
    async function renderAttendance() {
      setActiveNav('nav-attendance');
      updateTopbarTitle('Kehadiran & Catatan');
      mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Memuat Data Kehadiran...</p></div>`;
      if (window.lucide) lucide.createIcons();
      
      let attendanceData = await window.api.getAttendance();
      
      if (attendanceData.length === 0) {
        mainContent.innerHTML = `
          <div class="bg-white p-8 rounded-xl shadow-xs text-center text-red-500 bg-red-50 border border-red-200">
            Belum ada data siswa. Silakan tambahkan siswa terlebih dahulu di menu Data Siswa.
          </div>
        `;
        return;
      }

      let rows = attendanceData.map((s, index) => `
        <tr class="border-b hover:bg-gray-50 attendance-row transition-colors" data-studentid="${s.student_id}">
          <td class="py-2.5 px-4 text-center font-medium text-gray-500">${index + 1}</td>
          <td class="py-2.5 px-4 font-mono text-sm">${s.nisn}</td>
          <td class="py-2.5 px-4 font-semibold text-gray-800 whitespace-nowrap">${s.name}</td>
          <td class="py-2.5 px-2 text-center">
            <input type="number" min="0" class="border rounded-lg p-1.5 w-16 text-center font-bold att-sakit focus:ring-2 focus:ring-blue-500 outline-none" value="${s.sakit || 0}">
          </td>
          <td class="py-2.5 px-2 text-center">
            <input type="number" min="0" class="border rounded-lg p-1.5 w-16 text-center font-bold att-izin focus:ring-2 focus:ring-blue-500 outline-none" value="${s.izin || 0}">
          </td>
          <td class="py-2.5 px-2 text-center">
            <input type="number" min="0" class="border rounded-lg p-1.5 w-16 text-center font-bold att-alpa focus:ring-2 focus:ring-blue-500 outline-none" value="${s.tanpa_keterangan || 0}">
          </td>
          <td class="py-2.5 px-4">
            <textarea class="border rounded-lg p-2 w-full text-xs att-catatan focus:ring-2 focus:ring-blue-500 outline-none" rows="2" placeholder="Catatan perkembangan atau motivasi siswa...">${s.catatan || ''}</textarea>
          </td>
        </tr>
      `).join('');

      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-xs">
          <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">Kehadiran & Catatan Wali Kelas</h2>
              <p class="text-xs text-gray-500">Rekap ketidakhadiran (S/I/A) dan evaluasi perkembangan per siswa.</p>
            </div>
            <button id="btn-save-attendance" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs flex items-center gap-2 text-sm transition-colors">
              <i data-lucide="save" class="w-4 h-4"></i> Simpan Kehadiran
            </button>
          </div>
          
          <div class="overflow-x-auto border border-gray-100 rounded-xl mb-4">
            <table class="min-w-full bg-white text-sm">
              <thead class="bg-slate-100/70 border-b border-gray-200 text-slate-700">
                <tr>
                  <th class="py-3 px-4 w-12 text-center" rowspan="2">No</th>
                  <th class="py-3 px-4 text-left w-36" rowspan="2">NISN</th>
                  <th class="py-3 px-4 text-left" rowspan="2">Nama Siswa</th>
                  <th class="py-2 px-4 text-center border-b border-gray-200" colspan="3">Ketidakhadiran</th>
                  <th class="py-3 px-4 text-left w-96" rowspan="2">Catatan Wali Kelas</th>
                </tr>
                <tr>
                  <th class="py-1.5 px-2 text-center text-xs font-semibold text-gray-600 w-20">Sakit</th>
                  <th class="py-1.5 px-2 text-center text-xs font-semibold text-gray-600 w-20">Izin</th>
                  <th class="py-1.5 px-2 text-center text-xs font-semibold text-gray-600 w-20">Alpa</th>
                </tr>
              </thead>
              <tbody id="attendance-tbody">
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;

      if (window.lucide) lucide.createIcons();

      document.getElementById('btn-save-attendance').addEventListener('click', async () => {
        const rowsEl = document.querySelectorAll('.attendance-row');
        const dataToSave = [];

        rowsEl.forEach(row => {
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
          showToast('Data kehadiran & catatan wali kelas berhasil disimpan!', 'success');
        } catch (err) {
          showToast('Gagal menyimpan data kehadiran: ' + err.message, 'error');
        }
      });
    }

    // ==========================================
    // 7. LEGER NILAI MODULE (Item 11)
    // ==========================================
    async function renderLeger() {
      setActiveNav('nav-leger');
      updateTopbarTitle('Leger Nilai');
      mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Menghitung Leger Nilai & Ranking...</p></div>`;
      if (window.lucide) lucide.createIcons();

      const legerData = await window.api.getLegerData();
      const { students, subjects, totalStudents } = legerData;

      if (!students || students.length === 0) {
        mainContent.innerHTML = `
          <div class="bg-white p-8 rounded-xl shadow-xs text-center text-red-500 bg-red-50 border border-red-200">
            Belum ada data siswa untuk menyusun leger nilai.
          </div>
        `;
        return;
      }

      // Header kolom mata pelajaran
      const subjectHeaders = subjects.map(s => `
        <th class="py-2.5 px-3 border border-gray-300 text-center text-xs font-bold" title="${s.name} (${s.category})">
          <div class="w-16 truncate mx-auto">${s.name}</div>
        </th>
      `).join('');

      // Urutkan siswa berdasarkan peringkat (rank 1, 2, 3...)
      const sortedStudents = [...students].sort((a, b) => a.rank - b.rank);

      let rows = sortedStudents.map((item, index) => {
        const { student, subjectScores, totalScore, averageScore, rank } = item;
        
        let rankBadge = `<span class="font-bold text-gray-700">${rank}</span>`;
        if (rank === 1) rankBadge = `<span class="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">🥇 1</span>`;
        else if (rank === 2) rankBadge = `<span class="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">🥈 2</span>`;
        else if (rank === 3) rankBadge = `<span class="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-full border border-amber-300">🥉 3</span>`;

        const scoresCells = subjects.map(subj => {
          const sc = subjectScores[subj.id];
          const val = sc && sc.final !== null ? sc.final : '-';
          return `<td class="py-2 px-2 border border-gray-200 text-center text-xs font-mono font-semibold ${val === '-' ? 'text-gray-300' : 'text-gray-800'}">${val}</td>`;
        }).join('');

        return `
          <tr class="hover:bg-blue-50/40 transition-colors">
            <td class="py-2 px-3 border border-gray-200 text-center font-medium text-gray-500">${index + 1}</td>
            <td class="py-2 px-3 border border-gray-200 font-mono text-xs text-gray-600">${student.nisn}</td>
            <td class="py-2 px-3 border border-gray-200 font-semibold text-gray-800 whitespace-nowrap">${student.name}</td>
            ${scoresCells}
            <td class="py-2 px-3 border border-gray-200 text-center font-bold text-blue-700 bg-blue-50/50">${totalScore}</td>
            <td class="py-2 px-3 border border-gray-200 text-center font-bold text-emerald-700 bg-emerald-50/50">${averageScore}</td>
            <td class="py-2 px-3 border border-gray-200 text-center whitespace-nowrap">${rankBadge}</td>
          </tr>
        `;
      }).join('');

      mainContent.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-xs">
          <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">Leger Nilai & Peringkat Kelas</h2>
              <p class="text-xs text-gray-500">Nilai akhir dihitung dari nilai remidi (jika ada) atau nilai asli. Peringkat diurutkan dari total nilai tertinggi.</p>
            </div>
            <button id="btn-export-leger" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs flex items-center gap-2 text-xs transition-colors">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Export Leger ke Excel
            </button>
          </div>

          <div class="overflow-x-auto border border-gray-300 rounded-xl mb-4">
            <table class="min-w-full bg-white text-sm border-collapse">
              <thead class="bg-slate-100 text-slate-800">
                <tr>
                  <th class="py-3 px-3 border border-gray-300 w-12 text-center" rowspan="2">No</th>
                  <th class="py-3 px-3 border border-gray-300 w-32 text-left" rowspan="2">NISN</th>
                  <th class="py-3 px-3 border border-gray-300 text-left min-w-[180px]" rowspan="2">Nama Siswa</th>
                  <th class="py-2 px-3 border border-gray-300 text-center font-bold bg-slate-200/60" colspan="${subjects.length}">Mata Pelajaran</th>
                  <th class="py-3 px-3 border border-gray-300 w-24 text-center bg-blue-100 text-blue-900" rowspan="2">Total Nilai</th>
                  <th class="py-3 px-3 border border-gray-300 w-24 text-center bg-emerald-100 text-emerald-900" rowspan="2">Rata-Rata</th>
                  <th class="py-3 px-3 border border-gray-300 w-24 text-center bg-amber-100 text-amber-900" rowspan="2">Peringkat</th>
                </tr>
                <tr>
                  ${subjectHeaders}
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

      // Export Leger to Excel
      document.getElementById('btn-export-leger').addEventListener('click', async () => {
        const schoolInfo = schoolInfoCache || await window.api.getSchoolInfo();
        const className = schoolInfo ? (schoolInfo.class_name || 'Kelas') : 'Kelas';

        // Susun baris excel
        const excelRows = sortedStudents.map((item, idx) => {
          const rowObj = {
            'No': idx + 1,
            'NISN': item.student.nisn,
            'Nama Siswa': item.student.name,
            'L/P': item.student.gender || '-'
          };

          subjects.forEach(subj => {
            const sc = item.subjectScores[subj.id];
            rowObj[subj.name] = (sc && sc.final !== null) ? sc.final : '';
          });

          rowObj['Total Nilai'] = item.totalScore;
          rowObj['Rata-Rata'] = item.averageScore;
          rowObj['Peringkat'] = item.rank;

          return rowObj;
        });

        const success = await window.api.exportLegerExcel({ className, data: excelRows });
        if (success) {
          showToast('Leger Nilai berhasil diekspor ke Excel!', 'success');
        }
      });
    }

    // ==========================================
    // 8. PRINT MODULE (Item 6 & 12 - Nilai 0, Total & Ranking di Rapor)
    // ==========================================
    async function renderPrint() {
      setActiveNav('nav-print');
      updateTopbarTitle('Cetak Rapor');
      mainContent.innerHTML = `<div class="p-8 text-center"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4"></i><p>Memuat Siswa...</p></div>`;
      if (window.lucide) lucide.createIcons();

      const students = await window.api.getStudents();
      
      if (students.length === 0) {
        mainContent.innerHTML = `
          <div class="bg-white p-8 rounded-xl shadow-xs text-center text-red-500 bg-red-50 border border-red-200">
            Belum ada data siswa untuk dicetak.
          </div>
        `;
        return;
      }

      const options = students.map(s => `<option value="${s.id}">${s.nisn} - ${s.name}</option>`).join('');

      mainContent.innerHTML = `
        <style>
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm 18.5mm 12.5mm 18.5mm; /* Presisi sesuai acuan: Atas 1.2cm, Kiri 1.85cm, Bawah 1.25cm, Kanan 1.85cm */
            }
            html, body {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            aside, header, #toast-container, #modal-container, .no-print {
              display: none !important;
            }
            main, #main-content, #print-area {
              display: block !important;
              width: 100% !important;
              height: 100% !important;
              min-height: 100% !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
            }
            .report-page {
              width: 100% !important; /* Memenuhi area cetak 173mm secara presisi (488pt) */
              height: 272mm !important; /* 297mm - 24.5mm margin vertikal - 0.5mm safe buffer = 272mm (771pt presisi) */
              min-height: 272mm !important;
              max-height: 272mm !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              overflow: hidden !important;
            }
            .report-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }
        </style>
        <div class="bg-white p-8 rounded-xl shadow-xs no-print">
          <h2 class="text-2xl font-bold mb-4 text-gray-800">Cetak Rapor Tengah Semester</h2>
          <p class="text-xs text-gray-500 mb-6">Format cetak A4 presisi sesuai acuan dokumen resmi (Margin Kiri/Kanan: 1.85 cm, Atas/Bawah: 1.2 cm). Tepat satu halaman penuh.</p>
          
          <div class="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div class="w-full md:flex-1">
              <label class="block text-gray-700 text-xs font-bold mb-1">Pilih Siswa:</label>
              <select id="print-student-select" class="border rounded-lg p-2.5 w-full text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                ${options}
              </select>
            </div>
            <div class="flex flex-wrap gap-2 w-full md:w-auto">
              <button id="btn-load-report" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5">
                <i data-lucide="eye" class="w-4 h-4"></i> Preview Rapor
              </button>
              <button id="btn-do-print" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-xs hidden transition-colors flex items-center gap-1.5">
                <i data-lucide="printer" class="w-4 h-4"></i> Cetak Siswa Ini
              </button>
              <button id="btn-do-print-all" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5">
                <i data-lucide="layers" class="w-4 h-4"></i> Cetak Semua Siswa
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
            <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 shadow-xs">
              <input type="checkbox" id="chk-print-show-rank" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" ${schoolInfoCache?.show_rank !== 0 ? 'checked' : ''}>
              <span>Tampilkan Peringkat Kelas di Lembar Rapor</span>
            </label>
            <button type="button" id="btn-shortcut-settings-print" class="bg-white hover:bg-gray-100 text-slate-700 font-semibold py-1.5 px-3.5 rounded-lg text-xs border border-gray-200 flex items-center gap-1.5 shadow-xs transition-colors" title="Buka Pengaturan Cetak Rapor">
              <i data-lucide="settings-2" class="w-3.5 h-3.5 text-blue-600"></i> Pintasan Pengaturan Cetak
            </button>
          </div>
        </div>
        
        <div id="print-area" class="mt-4 hidden"></div>
      `;

      if (window.lucide) lucide.createIcons();

      // Dapatkan data peringkat dari leger
      const legerData = await window.api.getLegerData();
      const rankMap = legerData.rankMap || {};
      const totalStudentsCount = legerData.totalStudents || students.length;

      async function generateStudentReportHtml(studentId, studentName, studentNisn, shouldShowRank = true) {
        const reportData = await window.api.getStudentReport(studentId);
        const schoolInfo = schoolInfoCache || await window.api.getSchoolInfo();
        const attendance = await window.api.getAttendanceByStudent(studentId);
        const studentRankInfo = rankMap[studentId] || { rank: '-', totalScore: 0, averageScore: 0 };
        
        const wajib = reportData.filter(r => r.category !== 'Muatan Lokal');
        const mulok = reportData.filter(r => r.category === 'Muatan Lokal');

        // Item 6: Nilai 0 tetap tampil sebagai '0'
        const formatScore = (val) => (val !== null && val !== undefined) ? val : '-';

        let rowsWajib = wajib.map((r, i) => `
          <tr>
            <td class="border border-black px-2.5 py-0.5 text-center font-medium">${i + 1}</td>
            <td class="border border-black px-2.5 py-0.5">${r.subject_name}</td>
            <td class="border border-black px-2.5 py-0.5 text-center font-mono">${formatScore(r.original_score)}</td>
            <td class="border border-black px-2.5 py-0.5 text-center font-mono font-semibold">${formatScore(r.remedial_score)}</td>
          </tr>
        `).join('');

        if (wajib.length === 0) {
          rowsWajib = `<tr><td colspan="4" class="border border-black px-3 py-1 text-center text-gray-400">Belum ada nilai yang diinput.</td></tr>`;
        }

        let rowsMulok = '';
        if (mulok.length > 0) {
          rowsMulok = `
            <tr>
              <td colspan="4" class="border border-black px-2.5 py-0.5 font-bold bg-gray-50">B. Muatan Lokal</td>
            </tr>
          ` + mulok.map((r, i) => `
            <tr>
              <td class="border border-black px-2.5 py-0.5 text-center font-medium">${i + 1}</td>
              <td class="border border-black px-2.5 py-0.5">${r.subject_name}</td>
              <td class="border border-black px-2.5 py-0.5 text-center font-mono">${formatScore(r.original_score)}</td>
              <td class="border border-black px-2.5 py-0.5 text-center font-mono font-semibold">${formatScore(r.remedial_score)}</td>
            </tr>
          `).join('');
        }

        // Peringkat kondisional sesuai preferensi wali kelas
        const rankRow = shouldShowRank ? `
          <tr class="bg-gray-50 font-bold">
            <td colspan="2" class="border border-black px-2.5 py-0.5 text-center">Peringkat Kelas</td>
            <td colspan="2" class="border border-black px-2.5 py-0.5 text-center text-blue-900 whitespace-nowrap text-xs">
              Peringkat ke-<strong>${studentRankInfo.rank}</strong> dari ${totalStudentsCount} Siswa
            </td>
          </tr>
        ` : '';

        // Item 12: Baris Total Nilai, Rata-rata, dan Peringkat di Rapor
        const summaryRows = `
          <tr class="bg-gray-50 font-bold">
            <td colspan="2" class="border border-black px-2.5 py-0.5 text-center">Jumlah Nilai (Total)</td>
            <td colspan="2" class="border border-black px-2.5 py-0.5 text-center font-mono text-sm">${studentRankInfo.totalScore}</td>
          </tr>
          <tr class="bg-gray-50 font-bold">
            <td colspan="2" class="border border-black px-2.5 py-0.5 text-center">Rata-Rata Nilai</td>
            <td colspan="2" class="border border-black px-2.5 py-0.5 text-center font-mono">${studentRankInfo.averageScore}</td>
          </tr>
          ${rankRow}
        `;

        const printHtml = `
          <div class="report-page bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-[210mm] min-h-[297mm] mx-auto mb-8 text-black flex flex-col justify-between">
            <!-- Blok Konten Atas: Kop, Identitas, Tabel Nilai, Kehadiran & Catatan -->
            <div>
              <!-- Kop Sekolah -->
              <div class="flex items-center justify-between pb-1 mb-1">
                <div class="w-20 h-16 flex items-center justify-center text-black font-bold text-center flex-shrink-0">
                  ${schoolInfo.logo_path ? 
                    `<img src="file:///${schoolInfo.logo_path.replace(/\\/g, '/')}" class="max-w-full max-h-full object-contain" />` :
                    `<div class="w-14 h-14 border border-black flex items-center justify-center rounded-full p-1"><span class="text-[9px] font-bold">LOGO</span></div>`
                  }
                </div>
                <div class="flex-1 text-center px-3">
                  <h1 class="text-lg md:text-xl font-bold uppercase tracking-wide leading-tight">${schoolInfo.school_name || 'NAMA SEKOLAH'}</h1>
                  <h2 class="text-sm md:text-base font-bold tracking-wide mt-0.5">LAPORAN HASIL BELAJAR TENGAH SEMESTER</h2>
                  <p class="text-xs text-gray-700 mt-1">Tahun Ajaran: ${schoolInfo.academic_year || '-'} &nbsp;|&nbsp; Semester: ${schoolInfo.semester || '-'}</p>
                </div>
                <div class="w-20 h-16 flex-shrink-0"></div>
              </div>
              <hr class="border-t-2 border-black mb-2" />
              
              <!-- Identitas Siswa (Sesuai Acuan: Sisi Kanan Hanya Baris 1 'Kelas') -->
              <div class="mb-2">
                <table class="w-full text-left text-xs">
                  <tr>
                    <th class="w-24 py-0.5 font-bold">Nama Siswa</th>
                    <td>: <span class="font-bold uppercase">${studentName}</span></td>
                    <th class="w-16 py-0.5 text-right pr-2 font-bold">Kelas</th>
                    <td class="w-24">: <strong>${schoolInfo.class_name || '-'}</strong></td>
                  </tr>
                  <tr>
                    <th class="w-24 py-0.5 font-bold">NISN</th>
                    <td>: <span class="font-mono font-medium">${studentNisn}</span></td>
                    <th class="w-16 py-0.5 text-right pr-2"></th>
                    <td class="w-24"></td>
                  </tr>
                </table>
              </div>

              <!-- Tabel Nilai Mata Pelajaran -->
              <table class="w-full border-collapse border border-black mb-1.5 text-xs">
                <thead class="bg-gray-100 font-bold">
                  <tr>
                    <th class="border border-black px-2 py-1 w-10 text-center">No</th>
                    <th class="border border-black px-2 py-1 text-left">Mata Pelajaran</th>
                    <th class="border border-black px-2 py-1 w-24 text-center">Nilai Asli</th>
                    <th class="border border-black px-2 py-1 w-24 text-center">Nilai Remidi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="4" class="border border-black px-2.5 py-0.5 font-bold bg-gray-50">A. Mata Pelajaran Wajib</td>
                  </tr>
                  ${rowsWajib}
                  ${rowsMulok}
                  ${summaryRows}
                </tbody>
              </table>

              <!-- Kehadiran & Catatan (Terkoneksi rapat di bawah tabel nilai) -->
              <div class="flex gap-2 text-xs" style="page-break-inside: avoid; break-inside: avoid;">
                <div class="w-1/3">
                  <table class="w-full border-collapse border border-black text-xs">
                    <tr><th colspan="2" class="border border-black px-2 py-0.5 text-center bg-gray-50 font-bold">Ketidakhadiran</th></tr>
                    <tr><td class="border border-black px-2.5 py-0.5">Sakit</td><td class="border border-black px-2 py-0.5 text-center font-bold w-10">${attendance.sakit || 0}</td></tr>
                    <tr><td class="border border-black px-2.5 py-0.5">Izin</td><td class="border border-black px-2 py-0.5 text-center font-bold">${attendance.izin || 0}</td></tr>
                    <tr><td class="border border-black px-2.5 py-0.5">Tanpa Keterangan</td><td class="border border-black px-2.5 py-0.5 text-center font-bold">${attendance.tanpa_keterangan || 0}</td></tr>
                  </table>
                </div>
                <div class="w-2/3 flex flex-col gap-1">
                  <table class="w-full border-collapse border border-black text-xs flex-1">
                    <tr><th class="border border-black px-2.5 py-0.5 bg-gray-50 text-left font-bold">Catatan Wali Kelas</th></tr>
                    <tr><td class="border border-black px-2.5 py-1 align-top h-10 leading-tight">${attendance.catatan || '-'}</td></tr>
                  </table>
                  <table class="w-full border-collapse border border-black text-xs flex-1">
                    <tr><th class="border border-black px-2.5 py-0.5 bg-gray-50 text-left font-bold">Tanggapan Orang Tua / Wali</th></tr>
                    <tr><td class="border border-black px-2.5 py-1 align-top h-8"></td></tr>
                  </table>
                </div>
              </div>
            </div>

            <!-- Blok Tanda Tangan: Posisi & Garis Presisi Sesuai Acuan -->
            <div class="pt-2" style="page-break-inside: avoid; break-inside: avoid;">
              <div class="flex justify-between px-6 text-xs">
                <div class="text-center">
                  <p class="mb-0.5 text-xs text-transparent select-none">&nbsp;</p>
                  <p class="mb-2 text-xs font-semibold">Orang Tua/Wali</p>
                  <div class="h-16 flex items-center justify-center"></div>
                  <p class="font-bold border-b-2 border-black inline-block px-4 min-w-[160px]">&nbsp;</p>
                  <p class="text-[11px] mt-0.5 text-transparent select-none">&nbsp;</p>
                </div>
                <div class="text-center relative z-0">
                  <p class="mb-0.5 text-xs text-gray-800 relative z-10">${schoolInfo.print_place || '....................'}, ${schoolInfo.print_date || '....................'}</p>
                  <p class="mb-2 text-xs font-semibold relative z-10">Wali Kelas</p>
                  <div class="h-16 flex justify-center items-center -mt-1 -mb-3 relative z-0">
                    ${schoolInfo.homeroom_sign_path ? 
                      `<img src="file:///${schoolInfo.homeroom_sign_path.replace(/\\/g, '/')}" class="h-20 max-w-[190px] object-contain mix-blend-multiply pointer-events-none" />` : 
                      `<div class="h-16"></div>`
                    }
                  </div>
                  <p class="font-bold border-b-2 border-black inline-block px-4 min-w-[160px] relative z-10 text-xs mt-0.5">${schoolInfo.homeroom_name || '________________'}</p>
                  <p class="text-[11px] mt-0.5 text-gray-800 relative z-10">${schoolInfo.homeroom_id_type || 'NUPTK'}: ${schoolInfo.homeroom_nuptk || '-'}</p>
                </div>
              </div>

              <div class="text-center mt-2.5 text-xs relative z-0">
                <p class="mb-0.5 text-xs font-medium relative z-10">Mengetahui,</p>
                <p class="mb-2 text-xs font-semibold relative z-10">Kepala Sekolah</p>
                <div class="h-20 flex justify-center items-center -mt-1 -mb-5 relative z-0">
                  ${schoolInfo.headmaster_sign_path ? 
                    `<img src="file:///${schoolInfo.headmaster_sign_path.replace(/\\/g, '/')}" class="h-24 max-w-[220px] object-contain mix-blend-multiply pointer-events-none" />` : 
                    `<div class="h-20"></div>`
                  }
                </div>
                <p class="font-bold border-b-2 border-black inline-block px-6 min-w-[210px] relative z-10 text-xs mt-0.5">${schoolInfo.headmaster_name || '________________'}</p>
                <p class="text-[11px] mt-0.5 text-gray-800 relative z-10">${schoolInfo.headmaster_id_type || 'NUPTK'}: ${schoolInfo.headmaster_nuptk || '-'}</p>
              </div>
            </div>
          </div>
        `;

        return printHtml;
      }

      const renderCurrentReport = async () => {
        const selectEl = document.getElementById('print-student-select');
        const studentId = selectEl.value;
        const textParts = selectEl.options[selectEl.selectedIndex].text.split(' - ');
        const studentNisn = textParts[0];
        const studentName = textParts[1];
        const chkRank = document.getElementById('chk-print-show-rank');
        const shouldShowRank = chkRank ? chkRank.checked : (schoolInfoCache?.show_rank !== 0);
        
        const printHtml = await generateStudentReportHtml(studentId, studentName, studentNisn, shouldShowRank);
        
        const printArea = document.getElementById('print-area');
        printArea.innerHTML = printHtml;
        printArea.classList.remove('hidden');
        document.getElementById('btn-do-print').classList.remove('hidden');
      };

      document.getElementById('btn-load-report').addEventListener('click', renderCurrentReport);

      // Live toggle preview jika centang ranking diubah
      const chkRank = document.getElementById('chk-print-show-rank');
      if (chkRank) {
        chkRank.addEventListener('change', () => {
          const printArea = document.getElementById('print-area');
          if (!printArea.classList.contains('hidden') && printArea.innerHTML.trim() !== '') {
            renderCurrentReport();
          }
        });
      }

      // Pintasan ke Pengaturan Cetak Rapor
      const btnShortcut = document.getElementById('btn-shortcut-settings-print');
      if (btnShortcut) {
        btnShortcut.addEventListener('click', () => {
          renderSetupForm('cetak-rapor');
        });
      }

      document.getElementById('btn-do-print-all').addEventListener('click', async () => {
        const printArea = document.getElementById('print-area');
        printArea.innerHTML = '<div class="p-8 text-center no-print"><i data-lucide="loader-2" class="animate-spin w-8 h-8 mx-auto text-blue-600 mb-3"></i><p>Mempersiapkan rapor semua siswa...</p></div>';
        printArea.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();

        const chkRankAll = document.getElementById('chk-print-show-rank');
        const shouldShowRank = chkRankAll ? chkRankAll.checked : (schoolInfoCache?.show_rank !== 0);

        let allHtml = '';
        for (let i = 0; i < students.length; i++) {
          const s = students[i];
          const studentHtml = await generateStudentReportHtml(s.id, s.name, s.nisn, shouldShowRank);
          allHtml += studentHtml;
        }

        printArea.innerHTML = allHtml;
        document.getElementById('btn-do-print').classList.remove('hidden');
        
        setTimeout(() => {
          window.print();
        }, 600);
      });

      document.getElementById('btn-do-print').addEventListener('click', () => {
        window.print();
      });
    }

    // Jalankan aplikasi
    init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
