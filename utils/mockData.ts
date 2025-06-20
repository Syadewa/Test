
import { User, UserRole, Class, SubClass, Subject, Question, QuestionType, Exam, StudentSubmission, MultipleChoiceOption, ExamStatus } from '../types';
import { MOCK_PASSWORD } from '../constants';

// Mock Users
export const MOCK_USERS: User[] = [
  { id: 'admin1', username: 'admin@smkn73.id', name: 'Admin Utama', role: UserRole.ADMIN, password: MOCK_PASSWORD },
  { id: 'guru1', username: '198001012005011001', name: 'Budi Santoso (Matematika)', role: UserRole.GURU_MAPEL, password: MOCK_PASSWORD, subjectIds: ['subject1'] },
  { id: 'guru2', username: '198202022006022002', name: 'Citra Lestari (B. Indo)', role: UserRole.GURU_MAPEL, password: MOCK_PASSWORD, subjectIds: ['subject2'] },
  { id: 'kurikulum1', username: '197503032000031003', name: 'Dewi Anggraini', role: UserRole.WAKIL_KURIKULUM, password: MOCK_PASSWORD },
  { id: 'wali1', username: '198504042008041004', name: 'Eko Prasetyo', role: UserRole.WALI_KELAS, password: MOCK_PASSWORD, classId: 'class1', subClassId: 'subclass1_1' }, // Eko wali X TKJ 1
  { id: 'wali2', username: '199001012015011001', name: 'Siti Aminah', role: UserRole.GURU_MAPEL, password: MOCK_PASSWORD, classId: 'class2', subClassId: 'subclass2_1' }, // Siti juga Wali Kelas XI RPL 1
  { id: 'kepsek1', username: '197005051995051005', name: 'Fajar Nugroho', role: UserRole.KEPALA_SEKOLAH, password: MOCK_PASSWORD },
  { id: 'siswa1', username: 'NISN001', name: 'Agus Setiawan', role: UserRole.SISWA, password: MOCK_PASSWORD, classId: 'class1', subClassId: 'subclass1_1' },
  { id: 'siswa2', username: 'NISN002', name: 'Bella Permata', role: UserRole.SISWA, password: MOCK_PASSWORD, classId: 'class1', subClassId: 'subclass1_1' },
  { id: 'siswa3', username: 'NISN003', name: 'Charlie Wijaya', role: UserRole.SISWA, password: MOCK_PASSWORD, classId: 'class1', subClassId: 'subclass1_2' },
  { id: 'siswa4', username: 'NISN004', name: 'Diana Putri', role: UserRole.SISWA, password: MOCK_PASSWORD, classId: 'class2', subClassId: 'subclass2_1' },
];

// Mock Classes (Kelas Utama)
export const MOCK_CLASSES: Class[] = [
  { id: 'class1', name: 'X' }, 
  { id: 'class2', name: 'XI' },
  { id: 'class3', name: 'XII' },
];

// Mock SubClasses
export const MOCK_SUBCLASSES: SubClass[] = [
  { id: 'subclass1_1', name: 'X TKJ 1', classId: 'class1', waliKelasId: 'wali1' }, 
  { id: 'subclass1_2', name: 'X TKJ 2', classId: 'class1' }, 
  { id: 'subclass2_1', name: 'XI RPL 1', classId: 'class2', waliKelasId: 'wali2' }, 
  { id: 'subclass3_1', name: 'XII AKL 1', classId: 'class3' },
];

// Mock Subjects
export const MOCK_SUBJECTS: Subject[] = [
  { id: 'subject1', name: 'Matematika', guruMapelId: 'guru1', classIds: ['class1', 'class2'] },
  { id: 'subject2', name: 'Bahasa Indonesia', guruMapelId: 'guru2', classIds: ['class1', 'class3'] },
  { id: 'subject3', name: 'Bahasa Inggris', classIds: ['class1', 'class2', 'class3'] },
  { id: 'subject4', name: 'Dasar Desain Grafis', classIds: ['class1'] },
];

// Mock Questions
const mcqOptions1: MultipleChoiceOption[] = [
  { id: 'opt1_1', text: '4', isCorrect: false }, { id: 'opt1_2', text: '6', isCorrect: true },
  { id: 'opt1_3', text: '8', isCorrect: false }, { id: 'opt1_4', text: '10', isCorrect: false },
];
const mcqOptions2: MultipleChoiceOption[] = [
  { id: 'opt2_1', text: 'Jakarta', isCorrect: true }, { id: 'opt2_2', text: 'Bandung', isCorrect: false },
  { id: 'opt2_3', text: 'Surabaya', isCorrect: false }, { id: 'opt2_4', text: 'Medan', isCorrect: false },
];

const mcqOptionsImage: MultipleChoiceOption[] = [
  { id: 'opt_img_1', text: 'Kucing', isCorrect: true},
  { id: 'opt_img_2', text: 'Anjing', isCorrect: false},
  { id: 'opt_img_3', text: 'Burung', isCorrect: false},
  { id: 'opt_img_4', text: 'Ikan', isCorrect: false},
];

const mcqOptionsAudio: MultipleChoiceOption[] = [
  { id: 'opt_aud_1', text: 'Suara Kiri', isCorrect: false},
  { id: 'opt_aud_2', text: 'Suara Kanan', isCorrect: false},
  { id: 'opt_aud_3', text: 'Suara Kiri lalu Kanan', isCorrect: true},
  { id: 'opt_aud_4', text: 'Tidak ada suara', isCorrect: false},
];


export const MOCK_QUESTIONS: Question[] = [
  { id: 'q1', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Berapakah hasil dari 2 + 4?', options: mcqOptions1, correctAnswer: 'opt1_2', points: 10, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1'] },
  { id: 'q2', subjectId: 'subject1', type: QuestionType.ESSAY, text: 'Jelaskan teorema Pythagoras!', correctAnswer: 'Teorema Pythagoras menyatakan bahwa...', points: 20, createdBy: 'guru1', isValidated: true, kkm: 75, targetClassIds: ['class1', 'class2'] },
  { id: 'q3', subjectId: 'subject2', type: QuestionType.MULTIPLE_CHOICE, text: 'Apa ibu kota Indonesia?', options: mcqOptions2, correctAnswer: 'opt2_1', points: 10, createdBy: 'guru2', isValidated: true, kkm: 70, mathFormula: 'E=mc^2', targetClassIds: ['class1'] }, // Made q3 validated for easier testing
  { id: 'q4', subjectId: 'subject2', type: QuestionType.ESSAY, text: 'Buatlah sebuah pantun dengan tema pendidikan!', correctAnswer: 'Contoh pantun...', points: 15, createdBy: 'guru2', isValidated: true, kkm: 75, imageUrl: 'https://picsum.photos/seed/pantun/300/200', targetClassIds: ['class3'] },
  { id: 'q5', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Jika x = 5, maka x^2 adalah?', options: [{id:'opt5_1', text:'10', isCorrect:false}, {id:'opt5_2', text:'25', isCorrect:true}, {id:'opt5_3', text:'15', isCorrect:false}], correctAnswer: 'opt5_2', points: 10, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class2'] },
  { id: 'q6', subjectId: 'subject1', type: QuestionType.ESSAY, text: 'Sebutkan 3 jenis segitiga berdasarkan panjang sisinya.', points: 15, createdBy: 'guru1', isValidated: true, kkm: 75, targetClassIds: ['class1'] },
  
  // MCQs for Math X (Target 10 total: q1 is 1st)
  { id: 'q_mtk_x_mcq_1', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Hasil dari 3 * (4 + 2) adalah?', options: [{id: 'opt_a1', text: '18', isCorrect: true}, {id: 'opt_a2', text: '14', isCorrect: false}, {id: 'opt_a3', text: '9', isCorrect: false}, {id: 'opt_a4', text: '24', isCorrect: false}], correctAnswer: 'opt_a1', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mtk_x_mcq_2', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Bentuk sederhana dari 2a + 3a - a adalah?', options: [{id: 'opt_b1', text: '4a', isCorrect: true}, {id: 'opt_b2', text: '5a', isCorrect: false}, {id: 'opt_b3', text: '6a', isCorrect: false}, {id: 'opt_b4', text: '3a', isCorrect: false}], correctAnswer: 'opt_b1', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mtk_x_mcq_3', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Nilai dari 2^3 adalah?', options: [{id: 'opt_c1', text: '6', isCorrect: false}, {id: 'opt_c2', text: '8', isCorrect: true}, {id: 'opt_c3', text: '5', isCorrect: false}, {id: 'opt_c4', text: '9', isCorrect: false}], correctAnswer: 'opt_c2', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mtk_x_mcq_4', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Sebuah persegi memiliki sisi 5 cm. Luasnya adalah?', options: [{id: 'opt_d1', text: '20 cm²', isCorrect: false}, {id: 'opt_d2', text: '10 cm²', isCorrect: false}, {id: 'opt_d3', text: '25 cm²', isCorrect: true}, {id: 'opt_d4', text: '15 cm²', isCorrect: false}], correctAnswer: 'opt_d3', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mtk_x_mcq_5', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Urutan bilangan dari terkecil ke terbesar: -5, 0, 2, -1?', options: [{id: 'opt_e1', text: '-5, -1, 0, 2', isCorrect: true}, {id: 'opt_e2', text: '-1, -5, 0, 2', isCorrect: false}, {id: 'opt_e3', text: '0, -1, -5, 2', isCorrect: false}, {id: 'opt_e4', text: '2, 0, -1, -5', isCorrect: false}], correctAnswer: 'opt_e1', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mtk_x_mcq_6', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Pecahan yang senilai dengan 1/2 adalah?', options: [{id: 'opt_f1', text: '2/3', isCorrect: false}, {id: 'opt_f2', text: '1/3', isCorrect: false}, {id: 'opt_f3', text: '3/5', isCorrect: false}, {id: 'opt_f4', text: '2/4', isCorrect: true}], correctAnswer: 'opt_f4', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mtk_x_mcq_7', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Sudut siku-siku besarnya... derajat', options: [{id: 'opt_g1', text: '45', isCorrect: false}, {id: 'opt_g2', text: '90', isCorrect: true}, {id: 'opt_g3', text: '180', isCorrect: false}, {id: 'opt_g4', text: '60', isCorrect: false}], correctAnswer: 'opt_g2', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mtk_x_mcq_8', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Keliling segitiga sama sisi dengan panjang sisi 6 cm adalah...', options: [{id: 'opt_h1', text: '12 cm', isCorrect: false}, {id: 'opt_h2', text: '36 cm', isCorrect: false}, {id: 'opt_h3', text: '18 cm', isCorrect: true}, {id: 'opt_h4', text: '24 cm', isCorrect: false}], correctAnswer: 'opt_h3', points: 10, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']}, // Higher points
  { id: 'q_mtk_x_mcq_9', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Variabel pada bentuk aljabar 2x - 5 adalah...', options: [{id: 'opt_i1', text: '2', isCorrect: false}, {id: 'opt_i2', text: 'x', isCorrect: true}, {id: 'opt_i3', text: '-5', isCorrect: false}, {id: 'opt_i4', text: '2x', isCorrect: false}], correctAnswer: 'opt_i2', points: 5, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},

  // Essays for Math X (Target 5 total: q2 and q6 are 1st and 2nd)
  { id: 'q_mtk_x_essay_1', subjectId: 'subject1', type: QuestionType.ESSAY, text: 'Apa yang dimaksud dengan bilangan prima? Berikan 3 contoh.', points: 15, createdBy: 'guru1', isValidated: true, kkm: 75, targetClassIds: ['class1']},
  { id: 'q_mtk_x_essay_2', subjectId: 'subject1', type: QuestionType.ESSAY, text: 'Jelaskan perbedaan antara persegi dan persegi panjang.', points: 10, createdBy: 'guru1', isValidated: true, kkm: 75, targetClassIds: ['class1']},
  { id: 'q_mtk_x_essay_3', subjectId: 'subject1', type: QuestionType.ESSAY, text: 'Sebuah toko memberikan diskon 20% untuk baju seharga Rp 150.000. Berapa harga baju setelah diskon?', points: 10, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},

  // New multimedia questions
  { id: 'q_mcq_img_1', subjectId: 'subject1', type: QuestionType.MULTIPLE_CHOICE, text: 'Perhatikan gambar berikut. Hewan apakah ini?', imageUrl: 'https://picsum.photos/seed/catquestion/300/200', options: mcqOptionsImage, correctAnswer: 'opt_img_1', points: 10, createdBy: 'guru1', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_mcq_audio_1', subjectId: 'subject2', type: QuestionType.MULTIPLE_CHOICE, text: 'Dengarkan audio berikut. Bagaimana urutan suara yang terdengar?', audioUrl: 'https://www.kozco.com/tech/LRMonoPhase4.wav', options: mcqOptionsAudio, correctAnswer: 'opt_aud_3', points: 10, createdBy: 'guru2', isValidated: true, kkm: 70, targetClassIds: ['class1']},
  { id: 'q_essay_audio_1', subjectId: 'subject1', type: QuestionType.ESSAY, text: 'Setelah mendengarkan audio, jelaskan konsep utama yang dibahas dalam instrumen musik tersebut.', audioUrl: 'https://www.kozco.com/tech/piano2-CoolEdit.mp3', points: 15, createdBy: 'guru1', isValidated: true, kkm: 75, targetClassIds: ['class1']},
];

// Mock Exams
export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam1', title: 'Ujian Tengah Semester Matematika X', subjectId: 'subject1', classIds: ['class1'], subClassIds: ['subclass1_1', 'subclass1_2'], creatorId: 'guru1',
    questions: [ // 11 MCQs, 6 Essays
      { questionId: 'q1', points: 10 }, { questionId: 'q_mtk_x_mcq_1', points: 5 }, { questionId: 'q_mtk_x_mcq_2', points: 5 },
      { questionId: 'q_mtk_x_mcq_3', points: 5 }, { questionId: 'q_mtk_x_mcq_4', points: 5 }, { questionId: 'q_mtk_x_mcq_5', points: 5 },
      { questionId: 'q_mtk_x_mcq_6', points: 5 }, { questionId: 'q_mtk_x_mcq_7', points: 5 }, { questionId: 'q_mtk_x_mcq_8', points: 10 },
      { questionId: 'q_mtk_x_mcq_9', points: 5 }, 
      { questionId: 'q_mcq_img_1', points: 10},
      { questionId: 'q2', points: 20 }, { questionId: 'q6', points: 15 }, { questionId: 'q_mtk_x_essay_1', points: 15 },
      { questionId: 'q_mtk_x_essay_2', points: 10 }, { questionId: 'q_mtk_x_essay_3', points: 10 },
      { questionId: 'q_essay_audio_1', points: 15 },
    ], 
    durationMinutes: 90, kkm: 70, randomizeQuestions: true, randomizeAnswers: true, status: ExamStatus.ACTIVE, gradesReleased: false,
    createdAt: new Date('2024-05-01T09:00:00Z'), startTime: new Date('2024-07-20T08:00:00Z'), endTime: new Date('2024-08-30T17:00:00Z'),
    academicYear: "2024/2025", accessType: 'token_required', examToken: 'TOKEN123',
    mcqCount: 11, 
    essayCount: 6  
  },
  {
    id: 'exam2', title: 'Latihan Harian Bahasa Indonesia X', subjectId: 'subject2', classIds: ['class1'], subClassIds: ['subclass1_1'], creatorId: 'guru2',
    questions: [
        { questionId: 'q3', points: 10 }, 
        { questionId: 'q4', points: 15 }, 
        { questionId: 'q_mcq_audio_1', points: 10 } 
    ],
    durationMinutes: 45, kkm: 75, randomizeQuestions: false, randomizeAnswers: false, status: ExamStatus.ACTIVE, gradesReleased: false,
    createdAt: new Date('2024-05-10T10:00:00Z'), academicYear: "2024/2025", accessType: 'open',
    mcqCount: 2, 
    essayCount: 1 
  },
  {
    id: 'exam3', title: 'Ujian Akhir Semester Matematika XI (Essay Only)', subjectId: 'subject1', classIds: ['class2'], subClassIds: ['subclass2_1'], creatorId: 'guru1',
    questions: [ 
        { questionId: 'q2', points: 20 }, 
        { questionId: 'q6', points: 15 },
        { questionId: 'q_essay_audio_1', points: 15}
    ],
    durationMinutes: 60, kkm: 65, randomizeQuestions: true, randomizeAnswers: true, status: ExamStatus.ACTIVE, gradesReleased: false,
    createdAt: new Date('2024-05-15T11:00:00Z'), academicYear: "2024/2025", accessType: 'open',
    mcqCount: 0, 
    essayCount: 3 
  },
   {
    id: 'exam4', title: 'Latihan Soal Matematika X (MCQ Only)', subjectId: 'subject1', classIds: ['class1'], subClassIds: ['subclass1_1'], creatorId: 'guru1',
    questions: [ 
      { questionId: 'q1', points: 10 }, 
      { questionId: 'q_mtk_x_mcq_1', points: 5 },
      { questionId: 'q_mcq_img_1', points: 10},
    ],
    durationMinutes: 30, kkm: 70, randomizeQuestions: true, randomizeAnswers: true, status: ExamStatus.ACTIVE, gradesReleased: false,
    createdAt: new Date('2024-05-18T14:00:00Z'), academicYear: "2024/2025", accessType: 'open',
    mcqCount: 3,
    essayCount: 0
  }
];

// Mock Student Submissions
export const MOCK_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub1', examId: 'exam1', studentId: 'siswa2', // Bella's submission for Exam 1
    answers: [
      { questionId: 'q1', answer: 'opt1_2', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_1', answer: 'opt_a1', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_2', answer: 'opt_b1', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_3', answer: 'opt_c2', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_4', answer: 'opt_d3', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_5', answer: 'opt_e1', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_6', answer: 'opt_f4', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_7', answer: 'opt_g2', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_8', answer: 'opt_h3', isCorrect: true }, 
      { questionId: 'q_mtk_x_mcq_9', answer: 'opt_i1', isCorrect: false }, // incorrect
      { questionId: 'q_mcq_img_1', answer: 'opt_img_1', isCorrect: true}, 
      { questionId: 'q2', answer: 'Dalam segitiga siku-siku, kuadrat sisi miring sama dengan jumlah kuadrat sisi lainnya.', score: 15 }, 
      { questionId: 'q6', answer: 'Sama sisi, sama kaki, sembarang.', score: 10 }, 
      { questionId: 'q_mtk_x_essay_1', answer: 'Bilangan yang hanya punya 2 faktor. Contoh: 2, 3, 5.', score: 7 }, 
      { questionId: 'q_mtk_x_essay_2', answer: 'Persegi semua sisi sama, persegi panjang sisi berhadapan sama.', score: 6 }, 
      { questionId: 'q_mtk_x_essay_3', answer: 'Rp 120.000', score: 5 }, 
      { questionId: 'q_essay_audio_1', answer: 'Instrumen membahas melodi piano yang kompleks.', score: 12}, 
    ],
    startTime: new Date('2024-07-20T08:00:00Z'),
    endTime: new Date('2024-07-20T09:25:00Z'),
    submittedAt: new Date('2024-07-20T09:25:00Z'),
    totalScore: (55-5+10) + (15+10+7+6+5+12), // (MCQ score) + (Essay score) = 60 + 55 = 115
    isGraded: true,
  },
  {
    id: 'sub2', examId: 'exam2', studentId: 'siswa1', // Agus's submission for Exam 2
    answers: [
      { questionId: 'q3', answer: 'opt2_2', isCorrect: false }, 
      { questionId: 'q4', answer: 'Jalan-jalan ke pasar baru, jangan lupa beli buah-buahan. Rajinlah belajar wahai anakku, agar tercapai semua tujuan.', score: 12 }, 
      { questionId: 'q_mcq_audio_1', answer: 'opt_aud_3', isCorrect: true }, 
    ],
    startTime: new Date('2024-05-31T17:00:00Z'),
    endTime: new Date('2024-05-31T17:32:00Z'),
    submittedAt: new Date('2024-05-31T17:32:00Z'),
    totalScore: 0 + 12 + 10, // 22
    isGraded: true,
  },
  { // New submission for siswa1 (Agus) for exam1 (Ujian Tengah Semester Matematika X)
    id: 'sub3', examId: 'exam1', studentId: 'siswa1', 
    answers: [
      { questionId: 'q1', answer: 'opt1_2', isCorrect: true }, // Correct, 10 pts
      { questionId: 'q_mtk_x_mcq_1', answer: 'opt_a1', isCorrect: true }, // Correct, 5 pts
      // ... (add more answers for other MCQs if desired, or leave them unanswered)
      { questionId: 'q_mcq_img_1', answer: 'opt_img_2', isCorrect: false }, // Incorrect, 0 pts
      { questionId: 'q2', answer: 'Ini adalah jawaban esai singkat dari Agus.', score: 10 }, // Essay 1, 10/20 pts
      { questionId: 'q6', answer: 'Segitiga sama sisi, sama kaki, dan siku-siku.', score: 8 }, // Essay 2, 8/15 pts
      // ... (add more essay answers if desired)
    ],
    startTime: new Date('2024-07-21T10:00:00Z'),
    endTime: new Date('2024-07-21T11:20:00Z'),
    submittedAt: new Date('2024-07-21T11:20:00Z'),
    totalScore: 10 + 5 + 0 + 10 + 8, // Example score: 33 (out of potential for answered questions)
    isGraded: true, // Assuming it's graded for simplicity
  }
];
