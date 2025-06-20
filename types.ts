
export enum UserRole {
  ADMIN = 'Admin', // Super Admin
  GURU_MAPEL = 'Guru Mata Pelajaran',
  WAKIL_KURIKULUM = 'Wakil Kurikulum',
  WALI_KELAS = 'Wali Kelas',
  KEPALA_SEKOLAH = 'Kepala Sekolah',
  SISWA = 'Siswa',
}

export interface User {
  id: string;
  username: string; // For Admin: username/email; Others: NIP/NIS/NISN
  name: string;
  role: UserRole;
  password?: string; // Only for creation/mocking, don't store plaintext
  classId?: string; // For Siswa & Wali Kelas (refers to Kelas Utama)
  subClassId?: string; // For Siswa & Wali Kelas (primary sub-class they are responsible for)
  subjectIds?: string[]; // For Guru Mapel
}

export interface Class {
  id: string;
  name: string; 
}

export interface SubClass {
  id: string;
  name: string; // e.g., X TKJ 1, XI RPL 2
  classId: string; // ID Kelas Utama
  waliKelasId?: string; // ID User yang menjadi Wali Kelas untuk Sub Kelas ini
}

export interface Subject {
  id: string;
  name: string;
  guruMapelId?: string;
  classIds: string[]; // Kelas Utama where this subject is taught
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'Multiple Choice',
  ESSAY = 'Essay',
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  subjectId: string;
  type: QuestionType;
  text: string; 
  imageUrl?: string; 
  audioUrl?: string; 
  mathFormula?: string; 
  options?: MultipleChoiceOption[]; 
  correctAnswer?: string; 
  points: number;
  createdBy: string; 
  isValidated: boolean; 
  kkm: number; 
  targetClassIds?: string[]; 
}

export interface ExamQuestion {
  questionId: string;
  points: number; 
}

export enum ExamStatus {
  DRAFT = 'draft',
  PENDING_VALIDATION = 'pending_validation',
  ACTIVE = 'active',
  COMPLETED = 'completed', 
  ARCHIVED = 'archived',
}

export type ExamAccessType = 'open' | 'token_required';

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  classIds: string[]; 
  subClassIds: string[]; 
  creatorId: string; 
  questions: ExamQuestion[];
  durationMinutes: number;
  kkm: number; 
  randomizeQuestions: boolean;
  randomizeAnswers: boolean; 
  status: ExamStatus;
  gradesReleased: boolean; 
  createdAt: Date;
  startTime?: Date; 
  endTime?: Date;   
  showPrerequisites?: boolean;
  prerequisitesText?: string;
  mcqCount?: number; 
  essayCount?: number; 
  academicYear: string; 
  accessType: ExamAccessType;
  examToken?: string; 
}

export interface StudentAnswer {
  questionId: string;
  answer?: string; 
  isCorrect?: boolean; 
  score?: number; 
}

export interface StudentSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: StudentAnswer[];
  startTime: Date;
  endTime?: Date; 
  totalScore?: number;
  isGraded: boolean; 
  submittedAt?: Date; 
}

export enum ActivityAction {
  // Auth
  LOGIN = 'Login',
  LOGOUT = 'Logout',
  PASSWORD_CHANGE_SELF = 'Ganti Password Sendiri',
  PASSWORD_RESET_ADMIN = 'Reset Password oleh Admin',
  FORGOT_PASSWORD_REQUEST = 'Permintaan Reset Password',

  // User Management
  CREATE_USER = 'Buat Pengguna',
  UPDATE_USER = 'Update Pengguna',
  DELETE_USER = 'Hapus Pengguna',
  IMPORT_USERS_EXCEL = 'Import Pengguna via Excel',

  // Academic Management
  CREATE_CLASS = 'Buat Kelas Utama',
  UPDATE_CLASS = 'Update Kelas Utama',
  DELETE_CLASS = 'Hapus Kelas Utama',
  CREATE_SUBCLASS = 'Buat Sub Kelas',
  UPDATE_SUBCLASS = 'Update Sub Kelas',
  DELETE_SUBCLASS = 'Hapus Sub Kelas',
  CREATE_SUBJECT = 'Buat Mata Pelajaran',
  UPDATE_SUBJECT = 'Update Mata Pelajaran',
  DELETE_SUBJECT = 'Hapus Mata Pelajaran',

  // Question Management
  CREATE_QUESTION = 'Buat Soal',
  UPDATE_QUESTION = 'Update Soal',
  DELETE_QUESTION = 'Hapus Soal',
  VALIDATE_QUESTION = 'Validasi Soal (Setuju)',
  REJECT_QUESTION = 'Validasi Soal (Tolak)',
  REQUEST_QUESTION_VALIDATION = 'Minta Validasi Ulang Soal',
  AI_GENERATE_QUESTION = 'Buat Soal dengan AI',
  IMPORT_QUESTIONS_EXCEL = 'Import Soal via Excel',

  // Exam Management
  CREATE_EXAM = 'Buat Ujian',
  UPDATE_EXAM = 'Update Ujian',
  DELETE_EXAM = 'Hapus Ujian',
  VALIDATE_EXAM = 'Validasi Ujian (Setuju & Aktifkan)',
  REJECT_EXAM = 'Validasi Ujian (Tolak)',
  
  // Exam Taking
  START_EXAM_ATTEMPT = 'Mulai Mengerjakan Ujian',
  SUBMIT_EXAM = 'Submit Ujian',
  VIEW_EXAM_RESULTS = 'Lihat Hasil Ujian',
  STUDENT_LEFT_EXAM_TAB = 'Siswa Meninggalkan Tab Ujian', // New action

  // Grading
  FINALIZE_SUBMISSION_GRADING = 'Finalisasi Koreksi Submisi',

  // Admin Global
  GLOBAL_GRADES_RELEASE_ON = 'Aktifkan Rilis Nilai Global',
  GLOBAL_GRADES_RELEASE_OFF = 'Nonaktifkan Rilis Nilai Global',

  // Page/Dashboard Views
  VIEW_ADMIN_DASHBOARD = 'Lihat Dashboard Admin',
  VIEW_TEACHER_DASHBOARD = 'Lihat Dashboard Guru Mapel',
  VIEW_CURRICULUM_DASHBOARD = 'Lihat Dashboard Kurikulum',
  VIEW_HOMEROOM_DASHBOARD = 'Lihat Dashboard Wali Kelas',
  VIEW_PRINCIPAL_DASHBOARD = 'Lihat Dashboard Kepala Sekolah',
  VIEW_STUDENT_DASHBOARD = 'Lihat Dashboard Siswa',
  VIEW_GLOBAL_STATS = 'Lihat Statistik Global', // Admin
  VIEW_SCHOOL_OVERVIEW = 'Lihat Pantauan Aktivitas Sekolah', // Principal
  VIEW_CLASS_GRADES = 'Lihat Nilai Siswa Kelas', // Homeroom
  VIEW_MY_QUESTIONS = 'Lihat Bank Soal Saya', // Teacher
  VIEW_CREATE_EXAM_PAGE = 'Akses Halaman Buat/Edit Ujian', // Teacher
  VIEW_GRADE_ESSAYS_PAGE = 'Akses Halaman Koreksi Essai', // Teacher
  VIEW_VALIDATE_PAGE = 'Akses Halaman Validasi', // Curriculum
  VIEW_MY_EXAMS_PAGE = 'Lihat Daftar Ujian Saya', // Student
  VIEW_ACTIVITY_LOG = 'Lihat Log Aktivitas', // Admin, Principal
  VIEW_STUDENT_ACTIVITY_LOG = 'Lihat Log Aktivitas Siswa', // Teacher, Homeroom
  VIEW_MANAGE_USERS_PAGE = 'Akses Kelola Pengguna', // Admin
  VIEW_MANAGE_SUBJECTS_PAGE = 'Akses Kelola Mapel & Kelas', // Admin
}

export interface ActivityLog {
  id: string;
  userId: string; 
  userName: string; 
  userRole: UserRole; 
  action: ActivityAction; 
  targetType?: string; 
  targetId?: string; 
  targetName?: string; 
  details?: string; 
  timestamp: Date;
}
