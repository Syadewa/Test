import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/common/Card';
import { StudentSubmission, Exam, Question, QuestionType } from '../../types';
import { calculateScore, formatDate } from '../../utils/helpers';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { ICONS } from '../../constants';
import KatexRenderer from '../../components/common/KatexRenderer'; // Changed import

const ViewExamResultsPage: React.FC = () => {
  const { user } = useAuth();
  const { submissions, exams, questions: allQuestions, subjects, gradesReleasedGlobally } = useData();
  
  const [myResults, setMyResults] = useState<any[]>([]); // Define proper type
  const [selectedResultDetails, setSelectedResultDetails] = useState<any | null>(null); // Define proper type

  useEffect(() => {
    if (!user) return;

    const studentSubmissions = submissions.filter(sub => sub.studentId === user.id && sub.submittedAt);
    
    const resultsData = studentSubmissions.map(submission => {
      const exam = exams.find(ex => ex.id === submission.examId);
      if (!exam) return null;

      const examQuestionsDetails = exam.questions.map(eq => {
        const fullQ = allQuestions.find(q => q.id === eq.questionId);
        return { ...fullQ!, points: eq.points }; // Combine with exam-specific points
      });

      const { totalScore, maxScore } = calculateScore(submission.answers, examQuestionsDetails);
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      
      let statusText = 'Belum Dikoreksi';
      if (submission.isGraded) {
          statusText = percentage >= exam.kkm ? 'Lulus' : 'Tidak Lulus';
      }

      return {
        submissionId: submission.id,
        examId: exam.id,
        examTitle: exam.title,
        subjectName: subjects.find(s => s.id === exam.subjectId)?.name || 'N/A',
        academicYear: exam.academicYear || 'N/A', // Add academicYear
        submittedDate: formatDate(submission.submittedAt!),
        score: submission.isGraded ? totalScore : null,
        maxScore: maxScore,
        percentage: submission.isGraded ? percentage : null,
        kkm: exam.kkm,
        status: statusText,
        isGraded: submission.isGraded,
        // gradesReleasedForThisExam: exam.gradesReleased, // This line is no longer primary factor for percentage visibility
        answers: submission.answers,
        examQuestions: examQuestionsDetails,
      };
    }).filter(result => result !== null).sort((a,b) => new Date(b!.submittedDate).getTime() - new Date(a!.submittedDate).getTime());
    
    setMyResults(resultsData as any[]);

  }, [user, submissions, exams, allQuestions, subjects]);


  const viewDetails = (result: any) => {
    setSelectedResultDetails(result);
  };


  if (!user) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Hasil Ujian Saya</h1>

      {!gradesReleasedGlobally && myResults.every(r => !r.isGraded) && ( // Show only if global is off AND no results are graded yet
        <Alert type="info" message="Nilai ujian belum dirilis secara resmi oleh Admin atau belum ada ujian yang selesai dikoreksi. Harap tunggu pengumuman dari sekolah." />
      )}

      {myResults.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-10">Anda belum mengerjakan ujian apapun, atau hasil ujian belum tersedia.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myResults.map(result => (
            <Card key={result.submissionId} title={result.examTitle} className="flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mapel: {result.subjectName}</p>
                <p className="text-sm text-gray-600 mb-1">Tahun Ajaran: {result.academicYear}</p>
                <p className="text-sm text-gray-600 mb-1">Tanggal Ujian: {result.submittedDate}</p>
                
                {gradesReleasedGlobally && result.isGraded ? (
                  <>
                    <p className="text-lg font-semibold text-smkn-blue my-2">
                      Persentase Akhir: {result.percentage?.toFixed(2)}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-yellow-600 bg-yellow-100 p-2 rounded-md my-2">
                    <i className={`${ICONS.pending} mr-1`}></i>
                    Nilai belum dirilis secara global oleh Admin atau ujian ini belum selesai dikoreksi.
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                {gradesReleasedGlobally && result.isGraded ? (
                    <Button variant="primary" onClick={() => viewDetails(result)} className="w-full" leftIcon={ICONS.view}>Lihat Detail Jawaban</Button>
                ) : (
                    <Button variant="secondary" disabled className="w-full">Detail Belum Tersedia</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedResultDetails && (
        <Modal isOpen={!!selectedResultDetails} onClose={() => setSelectedResultDetails(null)} title={`Detail Hasil: ${selectedResultDetails.examTitle}`} size="xl">
            <div className="max-h-[70vh] overflow-y-auto pr-2">
                <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm">
                    <p><strong>Siswa:</strong> {user.name}</p>
                    <p><strong>Mapel:</strong> {selectedResultDetails.subjectName}</p>
                    <p><strong>Tahun Ajaran:</strong> {selectedResultDetails.academicYear}</p>
                    <p><strong>Skor Total:</strong> {selectedResultDetails.score?.toFixed(2)} / {selectedResultDetails.maxScore} ({selectedResultDetails.percentage?.toFixed(2)}%)</p>
                    <p><strong>Status:</strong> <span className={`font-semibold ${selectedResultDetails.status === 'Lulus' ? 'text-green-600' : 'text-red-600'}`}>{selectedResultDetails.status}</span> (KKM: {selectedResultDetails.kkm})</p>
                </div>

                {selectedResultDetails.examQuestions.map((question: Question, index: number) => {
                    const studentAnswer = selectedResultDetails.answers.find((ans: StudentSubmission['answers'][0]) => ans.questionId === question.id);
                    if (!studentAnswer) return null;
                    
                    let answerFeedback = '';
                    let answerColor = 'text-gray-700';
                    if (question.type === QuestionType.MULTIPLE_CHOICE) {
                        if (studentAnswer.isCorrect) {
                            answerFeedback = ' (Benar)';
                            answerColor = 'text-green-600';
                        } else {
                            answerFeedback = ' (Salah)';
                            answerColor = 'text-red-600';
                        }
                    }

                    return (
                        <div key={question.id} className="mb-4 p-3 border rounded-md bg-gray-50">
                            <p className="font-semibold text-smkn-text">Soal {index + 1}: <span dangerouslySetInnerHTML={{__html: question.text}}></span></p>
                            {question.imageUrl && <img src={question.imageUrl} alt="Soal" className="my-2 max-w-xs max-h-40 object-contain border rounded"/>}
                            {question.mathFormula && <div className="my-1"><KatexRenderer latex={question.mathFormula} /></div>}
                            
                            <p className={`mt-1 text-sm ${answerColor}`}>
                                <strong>Jawaban Anda:</strong> 
                                {question.type === QuestionType.MULTIPLE_CHOICE ? 
                                    (question.options?.find(opt => opt.id === studentAnswer.answer)?.text || 'Tidak dijawab') : 
                                    (studentAnswer.answer || 'Tidak dijawab')
                                }
                                <span className="font-semibold">{answerFeedback}</span>
                            </p>

                            {question.type === QuestionType.MULTIPLE_CHOICE && !studentAnswer.isCorrect && (
                                <p className="text-sm text-blue-600">
                                    <strong>Jawaban Benar:</strong> {question.options?.find(opt => opt.isCorrect)?.text}
                                </p>
                            )}
                            
                            {question.type === QuestionType.ESSAY && studentAnswer.score !== undefined && (
                                 <p className="text-sm text-blue-600">
                                    <strong>Skor Essai:</strong> {studentAnswer.score} / {question.points}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">Poin Soal: {question.points}</p>
                        </div>
                    );
                })}
            </div>
             <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={() => setSelectedResultDetails(null)}>Tutup</Button>
            </div>
        </Modal>
      )}

    </div>
  );
};

export default ViewExamResultsPage;