import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Question, QuestionType, Subject, User, Exam, Class } from '../../types'; // Added Exam and Class
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ICONS } from '../../constants';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { formatDate, formatDuration } from '../../utils/helpers';
import KatexRenderer from '../../components/common/KatexRenderer'; // Changed import

type ActiveView = 'soal' | 'ujian';

const ValidateQuestionsPage: React.FC = () => {
  const { 
    questions: allQuestions, validateQuestion, 
    subjects, users, 
    exams, validateExam, classes 
  } = useData();
  
  const [activeView, setActiveView] = useState<ActiveView>('soal');
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [pendingExams, setPendingExams] = useState<Exam[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  useEffect(() => {
    setPendingQuestions(allQuestions.filter(q => !q.isValidated));
    setPendingExams(exams.filter(ex => ex.status === 'pending_validation'));
  }, [allQuestions, exams]);

  const handleQuestionValidation = (questionId: string, isValid: boolean) => {
    validateQuestion(questionId, isValid);
    const action = isValid ? "disetujui" : "ditolak";
    setSuccessMessage(`Soal berhasil ${action}.`);
    setSelectedQuestion(null); // Close modal
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleExamValidation = (examId: string, isValidating: boolean) => {
    const examToValidate = exams.find(ex => ex.id === examId);
    if (!examToValidate) {
        setErrorMessage("Ujian tidak ditemukan.");
        setTimeout(() => setErrorMessage(null), 3000);
        setSelectedExam(null);
        return;
    }

    if (isValidating) { // Trying to approve and make active
        const questionsInExamDetails = examToValidate.questions.map(eq => allQuestions.find(q => q.id === eq.questionId));
        const unvalidatedQuestionsInExam = questionsInExamDetails.filter(q => q && !q.isValidated);

        if (unvalidatedQuestionsInExam.length > 0) {
            const unvalidatedQuestionTexts = unvalidatedQuestionsInExam.map(q => `"${q!.text.substring(0, 30)}..."`).join(', ');
            setErrorMessage(`Ujian tidak dapat diaktifkan karena soal berikut belum divalidasi: ${unvalidatedQuestionTexts}. Harap validasi soal tersebut atau minta guru untuk memperbarui daftar soal dalam ujian ini.`);
            setSelectedExam(null); 
            setTimeout(() => setErrorMessage(null), 7000); // Longer timeout for more complex message
            return;
        }
        // All questions are validated, proceed to activate
        validateExam(examId, true); // True means approve
        setSuccessMessage(`Ujian "${examToValidate.title}" berhasil disetujui dan diaktifkan.`);
    } else { // Rejecting
        validateExam(examId, false); // False means reject (status to draft)
        setSuccessMessage(`Ujian "${examToValidate.title}" berhasil ditolak (status kembali ke draft).`);
    }
    setSelectedExam(null); // Close modal
    setTimeout(() => {
        setSuccessMessage(null);
    }, 3000);
  };


  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || 'N/A';
  const getCreatorName = (creatorId?: string) => users.find(u => u.id === creatorId)?.name || 'N/A';
  const getClassNames = (classIds: string[] | undefined) => classIds?.map(cid => classes.find(c => c.id === cid)?.name).join(', ') || 'N/A';
  const getQuestionText = (questionId: string) => allQuestions.find(q => q.id === questionId)?.text || 'Teks Soal Tidak Ditemukan';


  const renderSoalValidation = () => (
    <Card title={`Daftar Soal Menunggu Validasi (${pendingQuestions.length})`}>
      {pendingQuestions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Tidak ada soal yang menunggu validasi saat ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-smkn-blue text-white">
              <tr>
                <th className="py-3 px-4 text-left w-2/5">Teks Soal</th>
                <th className="py-3 px-4 text-left">Mapel</th>
                <th className="py-3 px-4 text-left">Tipe</th>
                <th className="py-3 px-4 text-left">Dibuat Oleh</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {pendingQuestions.map(q => (
                <tr key={q.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                  <td className="py-3 px-4">{q.text.substring(0, 100)}{q.text.length > 100 ? '...' : ''}</td>
                  <td className="py-3 px-4">{getSubjectName(q.subjectId)}</td>
                  <td className="py-3 px-4">{q.type}</td>
                  <td className="py-3 px-4">{getCreatorName(q.createdBy)}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedQuestion(q)} leftIcon={ICONS.view} className="text-blue-600 hover:text-blue-800 mr-2">Detail & Validasi</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderUjianValidation = () => (
     <Card title={`Daftar Ujian Menunggu Validasi (${pendingExams.length})`}>
      {pendingExams.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Tidak ada ujian yang menunggu validasi saat ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-smkn-blue text-white">
              <tr>
                <th className="py-3 px-4 text-left">Judul Ujian</th>
                <th className="py-3 px-4 text-left">Mapel</th>
                <th className="py-3 px-4 text-left">Tahun Ajaran</th>
                <th className="py-3 px-4 text-left">Pembuat</th>
                <th className="py-3 px-4 text-left">Kelas Target</th>
                <th className="py-3 px-4 text-left">Jml Soal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {pendingExams.map(ex => (
                <tr key={ex.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                  <td className="py-3 px-4">{ex.title}</td>
                  <td className="py-3 px-4">{getSubjectName(ex.subjectId)}</td>
                  <td className="py-3 px-4">{ex.academicYear || '-'}</td>
                  <td className="py-3 px-4">{getCreatorName(ex.creatorId)}</td>
                  <td className="py-3 px-4">{getClassNames(ex.classIds)}</td>
                  <td className="py-3 px-4">{ex.questions.length}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedExam(ex)} leftIcon={ICONS.view} className="text-blue-600 hover:text-blue-800 mr-2">Detail & Validasi</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Validasi Soal & Ujian</h1>
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage(null)} />}

      <div className="mb-6 border-b border-gray-300">
        <nav className="flex space-x-1 -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveView('soal')}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none
              ${activeView === 'soal' 
                ? 'border-smkn-blue text-smkn-blue' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Validasi Soal ({pendingQuestions.length})
          </button>
          <button
            onClick={() => setActiveView('ujian')}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none
              ${activeView === 'ujian' 
                ? 'border-smkn-blue text-smkn-blue' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Validasi Ujian ({pendingExams.length})
          </button>
        </nav>
      </div>

      {activeView === 'soal' && renderSoalValidation()}
      {activeView === 'ujian' && renderUjianValidation()}


      {selectedQuestion && (
        <Modal isOpen={!!selectedQuestion} onClose={() => setSelectedQuestion(null)} title="Detail Soal & Validasi" size="lg">
          <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto pr-2">
            <p><strong>Teks Soal:</strong> {selectedQuestion.text}</p>
            <p><strong>Mata Pelajaran:</strong> {getSubjectName(selectedQuestion.subjectId)}</p>
            <p><strong>Tipe Soal:</strong> {selectedQuestion.type}</p>
            <p><strong>Target Kelas:</strong> {getClassNames(selectedQuestion.targetClassIds)}</p>
            <p><strong>Dibuat Oleh:</strong> {getCreatorName(selectedQuestion.createdBy)}</p>
            <p><strong>Poin:</strong> {selectedQuestion.points}</p>
            <p><strong>KKM:</strong> {selectedQuestion.kkm}</p>
            {selectedQuestion.imageUrl && <p><strong>Gambar:</strong> <a href={selectedQuestion.imageUrl} target="_blank" rel="noopener noreferrer" className="text-smkn-blue hover:underline">Lihat Gambar</a></p>}
            {selectedQuestion.audioUrl && <p><strong>Audio:</strong> <a href={selectedQuestion.audioUrl} target="_blank" rel="noopener noreferrer" className="text-smkn-blue hover:underline">Dengarkan Audio</a></p>}
            {selectedQuestion.mathFormula && <p><strong>Formula:</strong> <KatexRenderer latex={selectedQuestion.mathFormula} /></p>}
            
            {selectedQuestion.type === QuestionType.MULTIPLE_CHOICE && selectedQuestion.options && (
              <div>
                <strong>Opsi Jawaban:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {selectedQuestion.options.map(opt => (
                    <li key={opt.id} className={opt.isCorrect ? 'font-semibold text-green-600' : ''}>
                      {opt.text} {opt.isCorrect && '(Jawaban Benar)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedQuestion.type === QuestionType.ESSAY && selectedQuestion.correctAnswer && (
              <p><strong>Referensi Jawaban Essai:</strong> {selectedQuestion.correctAnswer}</p>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="danger" onClick={() => handleQuestionValidation(selectedQuestion.id, false)} leftIcon={ICONS.delete}>Tolak Soal</Button>
            <Button variant="success" onClick={() => handleQuestionValidation(selectedQuestion.id, true)} leftIcon={ICONS.validate}>Setujui Soal</Button>
          </div>
        </Modal>
      )}

      {selectedExam && (
        <Modal isOpen={!!selectedExam} onClose={() => setSelectedExam(null)} title={`Detail Ujian: ${selectedExam.title}`} size="xl">
          <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-2">
            <p><strong>Judul:</strong> {selectedExam.title}</p>
            <p><strong>Mata Pelajaran:</strong> {getSubjectName(selectedExam.subjectId)}</p>
            <p><strong>Tahun Ajaran:</strong> {selectedExam.academicYear || 'Tidak ditentukan'}</p>
            <p><strong>Pembuat:</strong> {getCreatorName(selectedExam.creatorId)}</p>
            <p><strong>Target Kelas Utama:</strong> {getClassNames(selectedExam.classIds)}</p>
            <p><strong>Target Sub Kelas:</strong> {selectedExam.subClassIds.length > 0 ? selectedExam.subClassIds.map(scId => users.find(u => u.id === scId)?.name || scId).join(', ') : 'Semua Sub Kelas dari Kelas Target'}</p>
            <p><strong>Durasi:</strong> {formatDuration(selectedExam.durationMinutes)}</p>
            <p><strong>KKM Ujian:</strong> {selectedExam.kkm}</p>
            <p><strong>Acak Soal:</strong> {selectedExam.randomizeQuestions ? 'Ya' : 'Tidak'}</p>
            <p><strong>Acak Jawaban (PG):</strong> {selectedExam.randomizeAnswers ? 'Ya' : 'Tidak'}</p>
            <p><strong>Waktu Mulai:</strong> {selectedExam.startTime ? formatDate(selectedExam.startTime) : 'Tidak ditentukan (fleksibel)'}</p>
            <p><strong>Waktu Selesai:</strong> {selectedExam.endTime ? formatDate(selectedExam.endTime) : 'Tidak ditentukan (fleksibel)'}</p>
            {selectedExam.showPrerequisites && <p><strong>Prasyarat:</strong> {selectedExam.prerequisitesText || 'Tidak ada.'}</p>}
            <hr className="my-3"/>
            <h4 className="font-semibold">Daftar Soal dalam Ujian ({selectedExam.questions.length}):</h4>
            <ul className="list-decimal list-inside space-y-2">
                {selectedExam.questions.map(eq => {
                    const qDetail = allQuestions.find(q => q.id === eq.questionId);
                    return (
                        <li key={eq.questionId} className={`text-xs p-2 rounded ${qDetail && !qDetail.isValidated ? 'bg-red-100 border border-red-300' : 'bg-gray-100'}`}>
                           ({qDetail?.type === QuestionType.MULTIPLE_CHOICE ? "PG" : "Essai"}, {eq.points} Poin) {qDetail?.text.substring(0,150)}{qDetail && qDetail.text.length > 150 ? "..." : ""}
                           {qDetail?.mathFormula && <div className="ml-4 my-1"><KatexRenderer latex={qDetail.mathFormula} inline/></div>}
                           {qDetail && !qDetail.isValidated && <span className="ml-2 font-bold text-red-600">(Belum Divalidasi)</span>}
                        </li>
                    );
                })}
            </ul>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="danger" onClick={() => handleExamValidation(selectedExam.id, false)} leftIcon={ICONS.delete}>Tolak Ujian</Button>
            <Button variant="success" onClick={() => handleExamValidation(selectedExam.id, true)} leftIcon={ICONS.validate}>Setujui & Aktifkan Ujian</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ValidateQuestionsPage;