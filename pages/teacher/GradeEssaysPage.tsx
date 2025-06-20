import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Exam, StudentSubmission, Question, QuestionType, User, StudentAnswer } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Select, Textarea } from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { ICONS } from '../../constants';
import { calculateScore } from '../../utils/helpers';

const GradeEssaysPage: React.FC = () => {
  const { user } = useAuth();
  const { exams, submissions, questions: allQuestions, updateSubmission, users: allUsers, subjects, classes, subClasses } = useData();

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubClassId, setSelectedSubClassId] = useState<string>('');
  const [examSubmissions, setExamSubmissions] = useState<StudentSubmission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);
  const [currentEssayAnswers, setCurrentEssayAnswers] = useState<StudentAnswer[]>([]);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const teacherExams = useMemo(() => {
    if (!user) return [];
    return exams.filter(ex => ex.creatorId === user.id && ex.questions.some(q => allQuestions.find(aq => aq.id === q.questionId)?.type === QuestionType.ESSAY));
  }, [user, exams, allQuestions]);

  const examOptions = teacherExams.map(ex => ({ value: ex.id, label: `${ex.title} (${subjects.find(s=>s.id === ex.subjectId)?.name || ''})` }));
  
  const subClassOptionsForExam = useMemo(() => {
    if (!selectedExamId) return [];
    const exam = exams.find(ex => ex.id === selectedExamId);
    if (!exam) return [];
    // If exam has specific subclasses, use them. Otherwise, use all subclasses from the exam's main classes.
    if (exam.subClassIds && exam.subClassIds.length > 0) {
        return subClasses.filter(sc => exam.subClassIds.includes(sc.id)).map(sc => ({ value: sc.id, label: sc.name }));
    }
    return subClasses.filter(sc => exam.classIds.includes(sc.classId)).map(sc => ({ value: sc.id, label: sc.name }));
  }, [selectedExamId, exams, subClasses]);


  useEffect(() => {
    if (selectedExamId && selectedSubClassId) {
      const subs = submissions.filter(s => 
          s.examId === selectedExamId && 
          allUsers.find(u => u.id === s.studentId)?.subClassId === selectedSubClassId
      );
      setExamSubmissions(subs);
      setCurrentSubmission(null); // Reset current submission when filter changes
    } else {
      setExamSubmissions([]);
    }
  }, [selectedExamId, selectedSubClassId, submissions, allUsers]);

  const selectSubmissionForGrading = (submission: StudentSubmission) => {
    setCurrentSubmission(submission);
    const examDetails = exams.find(ex => ex.id === submission.examId);
    if (!examDetails) return;

    const essayQsInExam = examDetails.questions.filter(eq => allQuestions.find(q => q.id === eq.questionId)?.type === QuestionType.ESSAY);
    
    const essaysToGrade = submission.answers
        .filter(ans => essayQsInExam.some(eq => eq.questionId === ans.questionId))
        .map(ans => ({...ans, score: ans.score === undefined ? 0 : ans.score})); // Initialize score if undefined
    setCurrentEssayAnswers(essaysToGrade);
  };

  const handleScoreChange = (questionId: string, score: number) => {
    const questionDetails = allQuestions.find(q => q.id === questionId);
    if (!questionDetails) return;
    const maxPoints = exams.find(ex => ex.id === selectedExamId)?.questions.find(eq => eq.questionId === questionId)?.points || questionDetails.points;

    setCurrentEssayAnswers(prev => 
      prev.map(ans => ans.questionId === questionId ? { ...ans, score: Math.max(0, Math.min(score, maxPoints)) } : ans)
    );
  };

  const saveGrading = () => {
    if (!currentSubmission || !currentEssayAnswers) {
        setErrorMessage("Tidak ada data submisi atau jawaban untuk disimpan.");
        return;
    }
    setErrorMessage(null);

    const updatedAnswers = currentSubmission.answers.map(originalAnswer => {
        const gradedEssay = currentEssayAnswers.find(ea => ea.questionId === originalAnswer.questionId);
        return gradedEssay ? { ...originalAnswer, score: gradedEssay.score } : originalAnswer;
    });
    
    const examQuestions = exams.find(e => e.id === currentSubmission.examId)?.questions.map(eq => {
        const fullQ = allQuestions.find(q => q.id === eq.questionId);
        return { ...fullQ!, points: eq.points }; // Combine with exam-specific points
    }) || [];

    const { totalScore } = calculateScore(updatedAnswers, examQuestions);

    const allEssaysGraded = updatedAnswers
      .filter(ans => allQuestions.find(q => q.id === ans.questionId)?.type === QuestionType.ESSAY)
      .every(ans => ans.score !== undefined);

    const updatedSubmissionData: StudentSubmission = {
      ...currentSubmission,
      answers: updatedAnswers,
      totalScore: totalScore,
      isGraded: allEssaysGraded,
    };
    
    updateSubmission(updatedSubmissionData);
    setSuccessMessage(`Nilai untuk siswa ${allUsers.find(u => u.id === currentSubmission.studentId)?.name} berhasil disimpan.`);
    setCurrentSubmission(null); // Go back to list
    setCurrentEssayAnswers([]);
     // Refresh submissions list
    const subs = submissions.filter(s => 
        s.examId === selectedExamId && 
        allUsers.find(u => u.id === s.studentId)?.subClassId === selectedSubClassId
    );
    setExamSubmissions(subs.map(s => s.id === updatedSubmissionData.id ? updatedSubmissionData : s));

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getQuestionText = (questionId: string) => allQuestions.find(q => q.id === questionId)?.text || 'Teks soal tidak ditemukan';
  const getQuestionPoints = (questionId: string) => {
    const exam = exams.find(e => e.id === selectedExamId);
    const examQ = exam?.questions.find(q => q.questionId === questionId);
    return examQ?.points || allQuestions.find(q => q.id === questionId)?.points || 0;
  };


  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Koreksi Jawaban Essai</h1>
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage(null)} />}

      {!currentSubmission ? (
        <Card title="Pilih Ujian dan Sub Kelas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Select label="Pilih Ujian" options={examOptions} value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setSelectedSubClassId(''); }} />
            <Select label="Pilih Sub Kelas" options={subClassOptionsForExam} value={selectedSubClassId} onChange={e => setSelectedSubClassId(e.target.value)} disabled={!selectedExamId} />
          </div>
          {selectedExamId && selectedSubClassId && (
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Daftar Submisi Siswa</h3>
              {examSubmissions.length === 0 && <p className="text-gray-500">Tidak ada submisi untuk ujian dan sub kelas ini, atau semua sudah dikoreksi.</p>}
              <div className="space-y-3">
                {examSubmissions.map(sub => {
                  const student = allUsers.find(u => u.id === sub.studentId);
                  const essaysInSubmission = sub.answers.filter(ans => allQuestions.find(q=>q.id === ans.questionId)?.type === QuestionType.ESSAY);
                  const essaysNeedingGrading = essaysInSubmission.filter(ans => ans.score === undefined).length;
                  return (
                    <div key={sub.id} className="p-4 bg-white shadow rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-smkn-text">{student?.name || 'Siswa Tidak Dikenal'}</p>
                        <p className="text-sm text-gray-600">Total Skor Sementara: {sub.totalScore === undefined ? 'N/A' : sub.totalScore.toFixed(2)}</p>
                        <p className={`text-xs ${sub.isGraded ? 'text-green-600' : 'text-yellow-600'}`}>
                          Status Koreksi: {sub.isGraded ? 'Selesai Dikoreksi' : `Belum Selesai (${essaysNeedingGrading} essai menunggu)`}
                        </p>
                      </div>
                      <Button onClick={() => selectSubmissionForGrading(sub)} leftIcon={ICONS.edit} variant={sub.isGraded ? "secondary" : "primary"}>
                        {sub.isGraded ? 'Lihat/Ubah Nilai' : 'Koreksi Essai'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card title={`Koreksi Essai untuk: ${allUsers.find(u => u.id === currentSubmission.studentId)?.name}`}>
          <Button onClick={() => setCurrentSubmission(null)} variant="secondary" leftIcon={ICONS.back || 'fas fa-arrow-left'} className="mb-4">Kembali ke Daftar</Button>
          {currentEssayAnswers.map(answer => {
            const question = allQuestions.find(q => q.id === answer.questionId);
            if (!question) return null;
            const maxPoints = getQuestionPoints(answer.questionId);
            return (
              <div key={answer.questionId} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-smkn-text mb-1">Soal: {question.text}</h4>
                {question.correctAnswer ? 
                  <p className="text-xs text-gray-500 mb-1"><i>Kunci Jawaban Referensi: {question.correctAnswer}</i></p> :
                  <p className="text-xs text-gray-600 italic mb-1">Referensi jawaban tidak diisi untuk soal ini.</p>
                }
                <p className="text-sm text-gray-500 mb-2">Max Poin: {maxPoints}</p>
                <Textarea label="Jawaban Siswa:" value={answer.answer || 'Tidak dijawab'} rows={3} readOnly className="bg-gray-100" />
                <div className="mt-2">
                  <label htmlFor={`score-${answer.questionId}`} className="block text-sm font-medium text-gray-700 mb-1">Skor (0 - {maxPoints}):</label>
                  <input
                    id={`score-${answer.questionId}`}
                    type="number"
                    value={answer.score === undefined ? '' : answer.score}
                    onChange={(e) => handleScoreChange(answer.questionId, parseInt(e.target.value))}
                    min="0"
                    max={maxPoints}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-smkn-blue focus:border-smkn-blue sm:text-sm bg-white text-gray-900"
                  />
                </div>
              </div>
            );
          })}
          <div className="mt-6 flex justify-end">
            <Button onClick={saveGrading} variant="primary" leftIcon={ICONS.save}>Simpan Nilai Essai</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GradeEssaysPage;