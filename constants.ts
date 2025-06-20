
export const APP_NAME = "Sistem Ujian Daring SMKN 73";

export const DEFAULT_EXAM_DURATION = 90; // minutes
export const DEFAULT_KKM = 75; // default passing grade

export const MOCK_PASSWORD = "password123"; // For mock data generation

export const ROLE_DASHBOARD_PATHS: { [key: string]: string } = {
  Admin: '/admin/dashboard',
  'Guru Mata Pelajaran': '/teacher/dashboard',
  'Wakil Kurikulum': '/curriculum/dashboard',
  'Wali Kelas': '/homeroom/dashboard',
  'Kepala Sekolah': '/principal/dashboard',
  Siswa: '/student/dashboard',
};

export const ICONS: { [key: string]: string } = {
  dashboard: "fas fa-tachometer-alt",
  users: "fas fa-users",
  subjects: "fas fa-book",
  stats: "fas fa-chart-line",
  questions: "fas fa-question-circle",
  exams: "fas fa-file-alt",
  grades: "fas fa-graduation-cap",
  validate: "fas fa-check-circle",
  overview: "fas fa-eye",
  logout: "fas fa-sign-out-alt",
  settings: "fas fa-cog",
  add: "fas fa-plus-circle",
  edit: "fas fa-edit",
  delete: "fas fa-trash",
  view: "fas fa-eye",
  upload: "fas fa-upload",
  download: "fas fa-download",
  time: "fas fa-clock",
  info: "fas fa-info-circle",
  warning: "fas fa-exclamation-triangle",
  success: "fas fa-check-double",
  pending: "fas fa-hourglass-half",
  start_exam: "fas fa-play-circle",
  ai_generate: "fas fa-robot",
  key: "fas fa-key", 
  profile: "fas fa-user-circle", 
  change_password: "fas fa-lock", 
  back: "fas fa-arrow-left",
  save: "fas fa-save",
  activity_log: "fas fa-history", // New icon for activity log
  filter: "fas fa-filter", // New icon for filter
  calendar: "fas fa-calendar-alt", // New icon for date picker // Added trailing comma
};