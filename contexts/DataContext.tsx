
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  User, Subject, Class, SubClass, Question, Exam, StudentSubmission, QuestionType, UserRole, ExamStatus,
  ActivityLog, ActivityAction 
} from '../types';
import { 
  MOCK_USERS, MOCK_CLASSES, MOCK_SUBCLASSES, MOCK_SUBJECTS, 
  MOCK_QUESTIONS, MOCK_EXAMS, MOCK_SUBMISSIONS 
} from '../utils/mockData'; 
import { generateId } from '../utils/helpers';

interface DataContextType {
  // Users
  users: User[];
  addUser: (user: User, actor?: User) => void;
  updateUser: (user: User, actor?: User) => void;
  deleteUser: (userId: string, actor?: User) => void;
  // Classes & SubClasses
  classes: Class[];
  addClass: (newClass: Omit<Class, 'id'>, actor?: User) => void; 
  updateClass: (updatedClass: Class, actor?: User) => void; 
  deleteClass: (classId: string, actor?: User) => void; 
  subClasses: SubClass[]; // Added missing subClasses state array
  addSubClass: (newSubClass: Omit<SubClass, 'id'>, actor?: User) => void; 
  updateSubClass: (updatedSubClass: SubClass, actor?: User) => void; 
  deleteSubClass: (subClassId: string, actor?: User) => void; 
  // Subjects
  subjects: Subject[];
  addSubject: (subject: Subject, actor?: User) => void;
  updateSubject: (subject: Subject, actor?: User) => void;
  deleteSubject: (subjectId: string, actor?: User) => void; 
  // Questions
  questions: Question[];
  addQuestion: (question: Question, actor?: User) => void;
  updateQuestion: (question: Question, actor?: User) => void;
  deleteQuestion: (questionId: string, actor?: User) => void;
  getQuestionsBySubject: (subjectId: string) => Question[];
  getQuestionsForValidation: () => Question[];
  validateQuestion: (questionId: string, isValid: boolean, actor?: User) => void;
  // Exams
  exams: Exam[];
  addExam: (exam: Exam, actor?: User) => void;
  updateExam: (exam: Exam, actor?: User) => void;
  deleteExam: (examId: string, actor?: User) => void; 
  getExamById: (examId: string) => Exam | undefined;
  getExamsForStudent: (studentId: string) => Exam[];
  getExamsByCreator: (creatorId: string) => Exam[];
  validateExam: (examId: string, isValid: boolean, actor?: User) => void; 
  // Submissions
  submissions: StudentSubmission[];
  addSubmission: (submission: StudentSubmission, actor?: User) => void;
  updateSubmission: (submission: StudentSubmission, actor?: User) => void;
  getSubmission: (examId: string, studentId: string) => StudentSubmission | undefined;
  getSubmissionsForExam: (examId: string) => StudentSubmission[];
  getSubmissionsByStudent: (studentId: string) => StudentSubmission[];
  // Global settings
  gradesReleasedGlobally: boolean;
  setGradesReleasedGlobally: (released: boolean, actor?: User) => void;
  // Activity Logs
  activityLogs: ActivityLog[];
  addActivityLog: (logEntry: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>, actor: User) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const loadState = <T,>(key: string, fallback: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : fallback;
    }
  } catch (e) {
    console.error(`Failed to load or parse state for ${key} from localStorage:`, e);
  }
  return fallback;
};

const loadActivityLogs = (key: string, fallback: ActivityLog[]): ActivityLog[] => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.map(log => ({ ...log, timestamp: new Date(log.timestamp) }));
            }
            return fallback;
        }
    } catch (e) {
        console.error(`Failed to load or parse state for ${key} from localStorage:`, e);
    }
    return fallback;
};


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => loadState<User>('app_users', MOCK_USERS));
  const [classes, setClasses] = useState<Class[]>(() => loadState<Class>('app_classes', MOCK_CLASSES));
  const [subClasses, setSubClasses] = useState<SubClass[]>(() => loadState<SubClass>('app_subclasses', MOCK_SUBCLASSES));
  const [subjects, setSubjects] = useState<Subject[]>(() => loadState<Subject>('app_subjects', MOCK_SUBJECTS));
  const [questions, setQuestions] = useState<Question[]>(() => loadState<Question>('app_questions', MOCK_QUESTIONS));
  
  const [exams, setExams] = useState<Exam[]>(() => {
    const loadedExams = loadState<Exam>('app_exams', MOCK_EXAMS);
    return loadedExams.map((exam: any) => ({
        ...exam,
        startTime: exam.startTime ? new Date(exam.startTime) : undefined,
        endTime: exam.endTime ? new Date(exam.endTime) : undefined,
        createdAt: exam.createdAt ? new Date(exam.createdAt) : new Date(),
    }));
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    const loadedSubmissions = loadState<StudentSubmission>('app_submissions', MOCK_SUBMISSIONS);
    return loadedSubmissions.map((sub: any) => ({
        ...sub,
        startTime: sub.startTime ? new Date(sub.startTime) : new Date(),
        endTime: sub.endTime ? new Date(sub.endTime) : undefined,
        submittedAt: sub.submittedAt ? new Date(sub.submittedAt) : undefined,
    }));
  });

  const [gradesReleasedGlobally, setGradesReleasedGloballyState] = useState<boolean>(() => {
    const stored = localStorage.getItem('app_grades_released_globally');
    try { return stored ? JSON.parse(stored) : false; } 
    catch (e) { console.error('Failed to parse gradesReleasedGlobally from localStorage:', e); return false; }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadActivityLogs('app_activity_logs', []));

  useEffect(() => { try { localStorage.setItem('app_users', JSON.stringify(users)); } catch(e) { console.error("Error saving users to localStorage:", e); }}, [users]);
  useEffect(() => { try { localStorage.setItem('app_classes', JSON.stringify(classes)); } catch(e) { console.error("Error saving classes to localStorage:", e); }}, [classes]);
  useEffect(() => { try { localStorage.setItem('app_subclasses', JSON.stringify(subClasses)); } catch(e) { console.error("Error saving subClasses to localStorage:", e); }}, [subClasses]);
  useEffect(() => { try { localStorage.setItem('app_subjects', JSON.stringify(subjects)); } catch(e) { console.error("Error saving subjects to localStorage:", e); }}, [subjects]);
  useEffect(() => { try { localStorage.setItem('app_questions', JSON.stringify(questions)); } catch(e) { console.error("Error saving questions to localStorage:", e); }}, [questions]);
  useEffect(() => { try { localStorage.setItem('app_exams', JSON.stringify(exams)); } catch(e) { console.error("Error saving exams to localStorage:", e); }}, [exams]);
  useEffect(() => { try { localStorage.setItem('app_submissions', JSON.stringify(submissions)); } catch(e) { console.error("Error saving submissions to localStorage:", e); }}, [submissions]);
  useEffect(() => { try { localStorage.setItem('app_grades_released_globally', JSON.stringify(gradesReleasedGlobally)); } catch(e) { console.error("Error saving gradesReleasedGlobally to localStorage:", e); }}, [gradesReleasedGlobally]);
  useEffect(() => { try { localStorage.setItem('app_activity_logs', JSON.stringify(activityLogs)); } catch(e) { console.error("Error saving activityLogs to localStorage:", e); }}, [activityLogs]);


  const addActivityLog = useCallback((logEntry: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>, actor: User) => {
    const newLog: ActivityLog = {
      ...logEntry,
      id: generateId('log'),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      timestamp: new Date(),
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 500)); // Keep last 500 logs
  }, []);

  // User Management
  const addUser = useCallback((user: User, actor?: User) => {
    const newUser = { ...user, id: generateId('user') };
    setUsers(prev => [...prev, newUser]);
    if(actor) addActivityLog({ action: ActivityAction.CREATE_USER, targetId: newUser.id, targetName: newUser.name, targetType: 'Pengguna' }, actor);
  }, [addActivityLog]);

  const updateUser = useCallback((updatedUser: User, actor?: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (actor) {
        const action = updatedUser.password && !users.find(u => u.id === updatedUser.id)?.password // If password being set for first time (likely reset)
            ? ActivityAction.PASSWORD_RESET_ADMIN
            : ActivityAction.UPDATE_USER;
        addActivityLog({ action, targetId: updatedUser.id, targetName: updatedUser.name, targetType: 'Pengguna' }, actor);
    }
  }, [addActivityLog, users]);
  
  const deleteUser = useCallback((userId: string, actor?: User) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    if(actor) addActivityLog({ action: ActivityAction.DELETE_USER, targetId: userId, targetName: userToDelete.name, targetType: 'Pengguna' }, actor);

    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    if (userToDelete.role === UserRole.SISWA) setSubmissions(prevSubmissions => prevSubmissions.filter(sub => sub.studentId !== userId));
    if (userToDelete.role === UserRole.WALI_KELAS) setSubClasses(prevSubClasses => prevSubClasses.map(sc => sc.waliKelasId === userId ? { ...sc, waliKelasId: undefined } : sc));
    if (userToDelete.role === UserRole.GURU_MAPEL) setSubjects(prevSubjects => prevSubjects.map(s => s.guruMapelId === userId ? { ...s, guruMapelId: undefined } : s));
  }, [users, addActivityLog]);


  // SubClass Management
  const addSubClass = useCallback((newSubClassData: Omit<SubClass, 'id'>, actor?: User) => {
    const newSubClassWithId = { ...newSubClassData, id: generateId('subclass') };
    setSubClasses(prev => [...prev, newSubClassWithId]);
    if (actor) addActivityLog({ action: ActivityAction.CREATE_SUBCLASS, targetId: newSubClassWithId.id, targetName: newSubClassWithId.name, targetType: 'Sub Kelas', details: `Untuk Kelas: ${classes.find(c=>c.id === newSubClassWithId.classId)?.name}` }, actor);
    
    if (newSubClassWithId.waliKelasId) {
      setUsers(prevUsers => prevUsers.map(u => (u.id === newSubClassWithId.waliKelasId && (u.role === UserRole.WALI_KELAS || u.role === UserRole.GURU_MAPEL) ) ? { ...u, subClassId: newSubClassWithId.id, classId: newSubClassWithId.classId } : u ));
    }
  }, [addActivityLog, classes]);

  const updateSubClass = useCallback((updatedSubClass: SubClass, actor?: User) => {
    let oldWaliKelasId: string | undefined = undefined;
    const newWaliKelasId: string | undefined = updatedSubClass.waliKelasId;

    setSubClasses(prevSubClasses => {
      const oldSubClass = prevSubClasses.find(sc => sc.id === updatedSubClass.id);
      if (oldSubClass) oldWaliKelasId = oldSubClass.waliKelasId;
      return prevSubClasses.map(sc => sc.id === updatedSubClass.id ? updatedSubClass : sc);
    });
    if (actor) addActivityLog({ action: ActivityAction.UPDATE_SUBCLASS, targetId: updatedSubClass.id, targetName: updatedSubClass.name, targetType: 'Sub Kelas' }, actor);

    if (oldWaliKelasId !== newWaliKelasId) {
      setUsers(prevUsers => {
        let newUsersState = [...prevUsers];
        if (oldWaliKelasId) newUsersState = newUsersState.map(u => (u.id === oldWaliKelasId && (u.role === UserRole.WALI_KELAS || u.role === UserRole.GURU_MAPEL) && u.subClassId === updatedSubClass.id) ? { ...u, subClassId: undefined } : u );
        if (newWaliKelasId) newUsersState = newUsersState.map(u => (u.id === newWaliKelasId && (u.role === UserRole.WALI_KELAS || u.role === UserRole.GURU_MAPEL)) ? { ...u, subClassId: updatedSubClass.id, classId: updatedSubClass.classId } : u );
        return newUsersState;
      });
    }
  }, [addActivityLog, setSubClasses, setUsers]);
  
  const deleteSubClass = useCallback((subClassId: string, actor?: User) => {
    const subClassToDelete = subClasses.find(sc => sc.id === subClassId);
    if (!subClassToDelete) return;
    if (actor) addActivityLog({ action: ActivityAction.DELETE_SUBCLASS, targetId: subClassId, targetName: subClassToDelete.name, targetType: 'Sub Kelas' }, actor);

    setSubClasses(prev => prev.filter(sc => sc.id !== subClassId));
    setUsers(prevUsers => prevUsers.map(u => u.subClassId === subClassId ? { ...u, subClassId: undefined } : u));
    setExams(prevExams => prevExams.map(e => ({...e, subClassIds: e.subClassIds.filter(scId => scId !== subClassId)})));
  }, [subClasses, addActivityLog, setSubClasses, setUsers, setExams]);

  // Class Management
  const addClass = useCallback((newClassData: Omit<Class, 'id'>, actor?: User) => {
    const newClassWithId = { ...newClassData, id: generateId('class') };
    setClasses(prev => [...prev, newClassWithId]);
    if (actor) addActivityLog({ action: ActivityAction.CREATE_CLASS, targetId: newClassWithId.id, targetName: newClassWithId.name, targetType: 'Kelas Utama' }, actor);
  }, [addActivityLog]);
  
  const updateClass = useCallback((updatedClass: Class, actor?: User) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? { ...c, name: updatedClass.name } : c));
    if (actor) addActivityLog({ action: ActivityAction.UPDATE_CLASS, targetId: updatedClass.id, targetName: updatedClass.name, targetType: 'Kelas Utama' }, actor);
  }, [addActivityLog]);

  const deleteClass = useCallback((classId: string, actor?: User) => {
    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;
    if (actor) addActivityLog({ action: ActivityAction.DELETE_CLASS, targetId: classId, targetName: classToDelete.name, targetType: 'Kelas Utama' }, actor);
    
    setClasses(prev => prev.filter(c => c.id !== classId));
    const subClassesToDelete = subClasses.filter(sc => sc.classId === classId);
    subClassesToDelete.forEach(sc => deleteSubClass(sc.id, actor)); // Pass actor for chained logs
    setSubjects(prev => prev.map(s => ({...s, classIds: s.classIds.filter(cid => cid !== classId)})));
    setExams(prev => prev.map(e => ({...e, classIds: e.classIds.filter(cid => cid !== classId)})));
    setUsers(prev => prev.map(u => u.classId === classId && u.role === UserRole.SISWA ? {...u, classId: undefined, subClassId: undefined} : u)); 
  }, [classes, subClasses, deleteSubClass, addActivityLog, setSubjects, setExams, setUsers, setClasses]);
  
  // Subject Management
  const addSubject = useCallback((subjectData: Subject, actor?: User) => {
    const newSubject = { ...subjectData, id: generateId('subject') };
    setSubjects(prev => [...prev, newSubject]);
    if(actor) addActivityLog({ action: ActivityAction.CREATE_SUBJECT, targetId: newSubject.id, targetName: newSubject.name, targetType: 'Mata Pelajaran' }, actor);
  }, [addActivityLog]);

  const updateSubject = useCallback((updatedSubject: Subject, actor?: User) => {
    setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    if(actor) addActivityLog({ action: ActivityAction.UPDATE_SUBJECT, targetId: updatedSubject.id, targetName: updatedSubject.name, targetType: 'Mata Pelajaran' }, actor);
  }, [addActivityLog]);

  const deleteSubject = useCallback((subjectId: string, actor?: User) => {
    const subjectToDelete = subjects.find(s => s.id === subjectId);
    if (!subjectToDelete) return;
    if(actor) addActivityLog({ action: ActivityAction.DELETE_SUBJECT, targetId: subjectId, targetName: subjectToDelete.name, targetType: 'Mata Pelajaran' }, actor);

    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    setQuestions(prev => prev.filter(q => q.subjectId !== subjectId));
    setExams(prev => prev.filter(e => e.subjectId !== subjectId));
    setUsers(prev => prev.map(u => ({...u, subjectIds: u.subjectIds?.filter(sid => sid !== subjectId)})));
  }, [subjects, addActivityLog]);
  
  // Question Management
  const addQuestion = useCallback((questionData: Question, actor?: User) => {
    const newQuestion = { ...questionData, id: generateId('question') };
    setQuestions(prev => [...prev, newQuestion]);
    if (actor) addActivityLog({ action: ActivityAction.CREATE_QUESTION, targetId: newQuestion.id, targetName: newQuestion.text.substring(0,50)+'...', targetType: 'Soal', details: `Mapel: ${subjects.find(s=>s.id === newQuestion.subjectId)?.name}` }, actor);
  }, [addActivityLog, subjects]);

  const updateQuestion = useCallback((updatedQuestion: Question, actor?: User) => {
    setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
     if (actor) addActivityLog({ action: ActivityAction.UPDATE_QUESTION, targetId: updatedQuestion.id, targetName: updatedQuestion.text.substring(0,50)+'...', targetType: 'Soal' }, actor);
  }, [addActivityLog]);

  const deleteQuestion = useCallback((questionId: string, actor?: User) => {
    const questionToDelete = questions.find(q => q.id === questionId);
    if (!questionToDelete) return;
    if (actor) addActivityLog({ action: ActivityAction.DELETE_QUESTION, targetId: questionId, targetName: questionToDelete.text.substring(0,50)+'...', targetType: 'Soal' }, actor);
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }, [questions, addActivityLog]);
  
  const getQuestionsBySubject = useCallback((subjectId: string) => questions.filter(q => q.subjectId === subjectId), [questions]);
  const getQuestionsForValidation = useCallback(() => questions.filter(q => !q.isValidated), [questions]);
  
  const validateQuestion = useCallback((questionId: string, isValid: boolean, actor?: User) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !actor) return;
    const action = isValid ? ActivityAction.VALIDATE_QUESTION : ActivityAction.REJECT_QUESTION;
    addActivityLog({ action, targetId: questionId, targetName: question.text.substring(0,50)+'...', targetType: 'Soal', details: `Status: ${isValid ? 'Disetujui' : 'Ditolak'}` }, actor);
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, isValidated: isValid } : q));
  }, [questions, addActivityLog]);

  // Exam Management
  const addExam = useCallback((examData: Exam, actor?: User) => {
    const newExam = { ...examData, id: generateId('exam'), createdAt: new Date() };
    setExams(prev => [...prev, newExam]);
    if (actor) addActivityLog({ action: ActivityAction.CREATE_EXAM, targetId: newExam.id, targetName: newExam.title, targetType: 'Ujian' }, actor);
  }, [addActivityLog]);

  const updateExam = useCallback((updatedExam: Exam, actor?: User) => {
    setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
    if (actor) addActivityLog({ action: ActivityAction.UPDATE_EXAM, targetId: updatedExam.id, targetName: updatedExam.title, targetType: 'Ujian' }, actor);
  }, [addActivityLog]);

  const deleteExam = useCallback((examId: string, actor?: User) => {
    const examToDelete = exams.find(e => e.id === examId);
    if (!examToDelete || !actor) return;
    addActivityLog({ action: ActivityAction.DELETE_EXAM, targetId: examId, targetName: examToDelete.title, targetType: 'Ujian' }, actor);
    setExams(prev => prev.filter(e => e.id !== examId));
    setSubmissions(prev => prev.filter(s => s.examId !== examId));
  }, [exams, addActivityLog]);
  
  const getExamById = useCallback((examId: string) => exams.find(e => e.id === examId), [exams]);

  const getExamsForStudent = useCallback((studentId: string): Exam[] => {
    const student = users.find(u => u.id === studentId && u.role === UserRole.SISWA);
    if (!student || !student.classId) return []; 
    return exams.filter(exam => 
      exam.status === ExamStatus.ACTIVE &&
      exam.classIds.includes(student.classId!) && 
      (exam.subClassIds.length === 0 || (student.subClassId && exam.subClassIds.includes(student.subClassId)))
    );
  }, [users, exams]);

  const getExamsByCreator = useCallback((creatorId: string) => exams.filter(e => e.creatorId === creatorId), [exams]);
  
  const validateExam = useCallback((examId: string, isValid: boolean, actor?: User) => {
    const exam = exams.find(ex => ex.id === examId);
    if(!exam || !actor) return;
    const action = isValid ? ActivityAction.VALIDATE_EXAM : ActivityAction.REJECT_EXAM;
    addActivityLog({ action, targetId: examId, targetName: exam.title, targetType: 'Ujian', details: `Status: ${isValid ? 'Disetujui & Aktif' : 'Ditolak (Draft)'}` }, actor);
    setExams(prev => prev.map(ex => ex.id === examId ? { ...ex, status: isValid ? ExamStatus.ACTIVE : ExamStatus.DRAFT } : ex));
  }, [exams, addActivityLog]);


  // Submission Management
  const addSubmission = useCallback((submissionData: StudentSubmission, actor?: User) => {
    const newSubmission = { ...submissionData, id: generateId('submission') };
    setSubmissions(prev => [...prev, newSubmission]);
    const exam = exams.find(ex => ex.id === newSubmission.examId);
    if (actor && exam) addActivityLog({ action: ActivityAction.START_EXAM_ATTEMPT, targetId: exam.id, targetName: exam.title, targetType: 'Ujian', details: `Submisi ID: ${newSubmission.id}` }, actor);
  }, [addActivityLog, exams]);

  const updateSubmission = useCallback((updatedSubmission: StudentSubmission, actor?: User) => {
    setSubmissions(prev => prev.map(s => s.id === updatedSubmission.id ? updatedSubmission : s));
    if (actor && updatedSubmission.submittedAt && !submissions.find(s=>s.id === updatedSubmission.id)?.submittedAt) { // Log only on first actual submit
        const exam = exams.find(ex => ex.id === updatedSubmission.examId);
        if (exam) addActivityLog({ action: ActivityAction.SUBMIT_EXAM, targetId: exam.id, targetName: exam.title, targetType: 'Ujian', details: `Submisi ID: ${updatedSubmission.id}` }, actor);
    } else if (actor && updatedSubmission.isGraded && !submissions.find(s=>s.id === updatedSubmission.id)?.isGraded) {
        const exam = exams.find(ex => ex.id === updatedSubmission.examId);
        const student = users.find(u => u.id === updatedSubmission.studentId);
        if (exam && student) addActivityLog({ action: ActivityAction.FINALIZE_SUBMISSION_GRADING, targetId: student.id, targetName: student.name, targetType: 'Siswa', details: `Ujian: ${exam.title}, Submisi ID: ${updatedSubmission.id}` }, actor);
    }
  }, [addActivityLog, exams, submissions, users]);
  
  const getSubmission = useCallback((examId: string, studentId: string) => submissions.find(s => s.examId === examId && s.studentId === studentId), [submissions]);
  const getSubmissionsForExam = useCallback((examId: string) => submissions.filter(s => s.examId === examId), [submissions]);
  const getSubmissionsByStudent = useCallback((studentId: string) => submissions.filter(s => s.studentId === studentId), [submissions]);
  
  // Global grade release
  const setGradesReleasedGlobally = useCallback((released: boolean, actor?: User) => {
    setGradesReleasedGloballyState(released);
    if (actor) addActivityLog({ action: released ? ActivityAction.GLOBAL_GRADES_RELEASE_ON : ActivityAction.GLOBAL_GRADES_RELEASE_OFF, targetType: 'Pengaturan Sistem' }, actor);
  }, [addActivityLog]);


  return (
    <DataContext.Provider value={{
      users, addUser, updateUser, deleteUser,
      classes, addClass, updateClass, deleteClass, 
      subClasses, addSubClass, updateSubClass, deleteSubClass,
      subjects, addSubject, updateSubject, deleteSubject,
      questions, addQuestion, updateQuestion, deleteQuestion, getQuestionsBySubject, getQuestionsForValidation, validateQuestion,
      exams, addExam, updateExam, deleteExam, getExamById, getExamsForStudent, getExamsByCreator, validateExam,
      submissions, addSubmission, updateSubmission, getSubmission, getSubmissionsForExam, getSubmissionsByStudent,
      gradesReleasedGlobally, setGradesReleasedGlobally,
      activityLogs, addActivityLog
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
