const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSchoolInfo: () => ipcRenderer.invoke('get-school-info'),
  saveSchoolInfo: (data) => ipcRenderer.invoke('save-school-info', data),
  getStudents: () => ipcRenderer.invoke('get-students'),
  addStudent: (data) => ipcRenderer.invoke('add-student', data),
  updateStudent: (data) => ipcRenderer.invoke('update-student', data),
  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),
  resetStudents: () => ipcRenderer.invoke('reset-students'),
  scanExcelClasses: () => ipcRenderer.invoke('scan-excel-classes'),
  importStudentsExcel: (data) => ipcRenderer.invoke('import-students-excel', data),
  getSubjects: () => ipcRenderer.invoke('get-subjects'),
  addSubject: (data) => ipcRenderer.invoke('add-subject', data),
  updateSubject: (data) => ipcRenderer.invoke('update-subject', data),
  deleteSubject: (id) => ipcRenderer.invoke('delete-subject', id),
  getScoresBySubject: (subjectId) => ipcRenderer.invoke('get-scores-by-subject', subjectId),
  saveScoresBySubject: (data) => ipcRenderer.invoke('save-scores-by-subject', data),
  exportExcel: (data) => ipcRenderer.invoke('export-excel', data),
  importExcel: () => ipcRenderer.invoke('import-excel'),
  getStudentReport: (studentId) => ipcRenderer.invoke('get-student-report', studentId),
  getAttendance: () => ipcRenderer.invoke('get-attendance'),
  saveAttendance: (data) => ipcRenderer.invoke('save-attendance', data),
  getAttendanceByStudent: (studentId) => ipcRenderer.invoke('get-attendance-by-student', studentId),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  openLink: (url) => ipcRenderer.invoke('open-link', url)
});

