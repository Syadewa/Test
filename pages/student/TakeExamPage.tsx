
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Exam, Question, QuestionType, StudentAnswer, StudentSubmission, MultipleChoiceOption, ActivityAction } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ICONS, APP_NAME } from '../../constants';
import { shuffleArray, formatDate, generateId } from '../../utils/helpers';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import KatexRenderer from '../../components/common/KatexRenderer';

const TakeExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getExamById, questions: allQuestions, addSubmission, getSubmission, updateSubmission, addActivityLog } = useData();

  const [exam, setExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null); 
  
  const [showPrerequisitesModal, setShowPrerequisitesModal] = useState(false);
  const [hasAgreedToPrerequisites, setHasAgreedToPrerequisites] = useState(false);
  
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [enteredToken, setEnteredToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isTokenValidated, setIsTokenValidated] = useState(false);

  const [activeTab, setActiveTab] = useState<'mcq' | 'essay'>('mcq');
  
  const [examTakingSetupDone, setExamTakingSetupDone] = useState(false);

  const [isSubmitConfirmModalOpen, setIsSubmitConfirmModalOpen] = useState(false);
  const [unansweredWarningContent, setUnansweredWarningContent] = useState<React.ReactNode | null>(null);
  const [showUnansweredWarningModal, setShowUnansweredWarningModal] = useState(false);


  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const mcqQuestions = useMemo(() => examQuestions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE), [examQuestions]);
  const essayQuestions = useMemo(() => examQuestions.filter(q => q.type === QuestionType.ESSAY), [examQuestions]);
  
  const currentQuestionList = activeTab === 'mcq' ? mcqQuestions : essayQuestions;
  const currentActualQuestion = currentQuestionList[currentQuestionIndex];

  const [showTabWarningModal, setShowTabWarningModal] = useState(false);
  const autoSaveTimeoutRef = useRef<number | null>(null);

  const hasMcqQuestions = useMemo(() => mcqQuestions.length > 0, [mcqQuestions]);
  const hasEssayQuestions = useMemo(() => essayQuestions.length > 0, [essayQuestions]);
  const showTabs = useMemo(() => hasMcqQuestions && hasEssayQuestions, [hasMcqQuestions, hasEssayQuestions]);

  useEffect(() => {
    if (!examId || !user) {
      navigate('/student/dashboard');
      return;
    }
    setIsLoading(true);
    setError(null);

    const fetchedExam = getExamById(examId);

    if (!fetchedExam) {
      setError("Ujian tidak ditemukan.");
      setIsLoading(false);
      return;
    }
    if (fetchedExam.status !== 'active') {
      setError("Ujian ini tidak aktif atau sudah berakhir.");
      setIsLoading(false);
      return;
    }
    
    const now = new Date();
    if (fetchedExam.startTime && now < new Date(fetchedExam.startTime)) {
        setError(`Ujian ini belum dimulai. Akan dimulai pada: ${formatDate(fetchedExam.startTime)}.`);
        setIsLoading(false);
        return;
    }
    if (fetchedExam.endTime && now > new Date(fetchedExam.endTime)) {
        setError("Waktu untuk mengerjakan ujian ini sudah berakhir.");
        setIsLoading(false);
        return;
    }
    
    if (!exam || exam.id !== fetchedExam.id) {
        setExam(fetchedExam);
        setExamQuestions([]); 
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setExamTakingSetupDone(false); 
        setSubmission(null);
        setHasAgreedToPrerequisites(false);
        setIsTokenValidated(false);
        setIsFinished(false); 
        setTimeLeft(0); 
    }
  }, [examId, user, getExamById, navigate, exam]); 

  useEffect(() => {
    if (!exam || !user || examTakingSetupDone) { 
      if (examTakingSetupDone) setIsLoading(false); 
      return;
    }

    setIsLoading(true); 

    const setupExamEnvironment = () => {
      let currentLocalSubmission = getSubmission(exam.id, user.id);

      if (currentLocalSubmission && currentLocalSubmission.endTime) {
        setIsFinished(true);
        setAnswers(currentLocalSubmission.answers);
        setSubmission(currentLocalSubmission);
        setError("Anda sudah menyelesaikan ujian ini.");
        setIsLoading(false);
        setExamTakingSetupDone(true);
        return;
      }

      if (!currentLocalSubmission) {
        const newSubmissionData: StudentSubmission = {
          id: generateId('sub'),
          examId: exam.id,
          studentId: user.id,
          answers: [],
          startTime: new Date(),
          isGraded: false,
        };
        addSubmission(newSubmissionData);
        currentLocalSubmission = newSubmissionData;
      }
      setSubmission(currentLocalSubmission);

      if (exam.showPrerequisites && !hasAgreedToPrerequisites) {
        setShowPrerequisitesModal(true);
        setIsLoading(false);
        return;
      }
      if (exam.accessType === 'token_required' && !isTokenValidated) {
        setShowTokenModal(true);
        setIsLoading(false);
        return;
      }
      
      let questionsForExamList = exam.questions.map(eq => {
        const fullQ = allQuestions.find(q => q.id === eq.questionId);
        return fullQ ? { ...fullQ, points: eq.points } : null;
      }).filter(q => q !== null) as Question[];

      if (exam.randomizeQuestions) {
        questionsForExamList = shuffleArray(questionsForExamList);
      }
      questionsForExamList = questionsForExamList.map(q => {
        if (q.type === QuestionType.MULTIPLE_CHOICE && q.options && exam.randomizeAnswers) {
          return { ...q, options: shuffleArray(q.options) };
        }
        return q;
      });
      setExamQuestions(questionsForExamList);
      
      if (currentLocalSubmission && currentLocalSubmission.answers.length > 0) {
        const reconciledAnswers = questionsForExamList.map(q_shuffled => {
          const existingAns = currentLocalSubmission!.answers.find(ea => ea.questionId === q_shuffled.id);
          return existingAns || { questionId: q_shuffled.id };
        });
        setAnswers(reconciledAnswers);
      } else {
        setAnswers(questionsForExamList.map(q => ({ questionId: q.id })));
      }
      
      if (currentLocalSubmission) {
        const timeElapsed = (Date.now() - new Date(currentLocalSubmission.startTime).getTime()) / 1000;
        setTimeLeft(Math.max(0, exam.durationMinutes * 60 - timeElapsed));
      }
      
      setExamTakingSetupDone(true);
      setIsLoading(false);
    };

    setupExamEnvironment();

  }, [exam, user, examTakingSetupDone, getSubmission, addSubmission, hasAgreedToPrerequisites, isTokenValidated, allQuestions]);

  useEffect(() => {
    if (examTakingSetupDone && examQuestions.length > 0) {
        if (hasMcqQuestions) {
            setActiveTab('mcq');
        } else if (hasEssayQuestions) {
            setActiveTab('essay');
        } else {
             setActiveTab('mcq');
        }
        setCurrentQuestionIndex(0);
    }
  }, [examTakingSetupDone, examQuestions.length, hasMcqQuestions, hasEssayQuestions]);


  const finalizeAnswersAndSubmit = useCallback(() => {
    if (!exam || !user || !submission || isFinished) return; 
    
    setIsFinished(true); 

    const finalAnswers = answers.map(ans => {
      const question = examQuestions.find(q => q.id === ans.questionId);
      if (question && question.type === QuestionType.MULTIPLE_CHOICE && question.options) {
        const selectedOption = question.options.find(opt => opt.id === ans.answer);
        return { ...ans, isCorrect: selectedOption?.isCorrect || false };
      }
      return ans;
    });
    
    if(submission) { 
        updateSubmission({
          ...submission,
          answers: finalAnswers,
          endTime: new Date(),
          submittedAt: new Date(),
        });
    }
  }, [exam, user, submission, answers, examQuestions, updateSubmission, isFinished]);

  const handleAutoSubmit = useCallback(() => {
    if(!isFinished) { 
        finalizeAnswersAndSubmit();
    }
  }, [finalizeAnswersAndSubmit, isFinished]);

  useEffect(() => {
    if (timeLeft <= 0 || isFinished || isLoading || showPrerequisitesModal || showTokenModal || !submission) return;
    
    if (!isTokenValidated && exam?.accessType === 'token_required' && !isFinished) {
        return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, isLoading, showPrerequisitesModal, showTokenModal, submission, handleAutoSubmit, isTokenValidated, exam]); 
  
  const handleAnswerChange = (questionId: string, answerValue: string) => {
    if (isFinished) return;
    setAnswers(prevAnswers =>
      prevAnswers.map(ans =>
        ans.questionId === questionId ? { ...ans, answer: answerValue } : ans
      )
    );
  };
  
  useEffect(() => {
    if (isFinished || isLoading || !submission || answers.length === 0 || showPrerequisitesModal || showTokenModal || (!isTokenValidated && exam?.accessType === 'token_required')) {
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        return;
    }

    if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(() => {
        const currentLocalSubmission = getSubmission(examId!, user!.id); 
        if (currentLocalSubmission && !currentLocalSubmission.endTime) { 
            const answersToSave = answers.map(ans => { 
                const question = examQuestions.find(q => q.id === ans.questionId);
                if (question && question.type === QuestionType.MULTIPLE_CHOICE && question.options && ans.answer) {
                  const selectedOption = question.options.find(opt => opt.id === ans.answer);
                  return { ...ans, isCorrect: selectedOption?.isCorrect || false };
                }
                return ans;
              });
            updateSubmission({ ...currentLocalSubmission, answers: answersToSave });
            setSubmission({ ...currentLocalSubmission, answers: answersToSave }); 
        }
    }, 2500); 

    return () => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
    };
  }, [answers, isFinished, isLoading, submission, examId, user, updateSubmission, getSubmission, showPrerequisitesModal, showTokenModal, isTokenValidated, exam, examQuestions]);

  const openSubmitConfirmationModal = () => {
    if (isFinished || examQuestions.length === 0) return;

    const unanswered: { number: number, type: 'PG' | 'Esai' }[] = [];
    examQuestions.forEach((q, index) => {
        const answerEntry = answers.find(a => a.questionId === q.id);
        const answerText = answerEntry?.answer?.trim();
        if (!answerText) {
            const questionTypeLabel = q.type === QuestionType.MULTIPLE_CHOICE ? 'PG' : 'Esai';
            // Determine actual number based on active tab and combined index
            let actualNumber = 0;
            if (q.type === QuestionType.MULTIPLE_CHOICE) {
                actualNumber = mcqQuestions.findIndex(mcq => mcq.id === q.id) + 1;
            } else {
                actualNumber = essayQuestions.findIndex(esq => esq.id === q.id) + 1;
            }
            unanswered.push({ number: actualNumber, type: questionTypeLabel });
        }
    });

    if (unanswered.length > 0) {
        const questionWord = unanswered.length === 1 ? "soal" : "soal-soal";
        const formattedUnanswered = unanswered.map(item => `Soal ${item.number} (${item.type})`).join(', ');
        setUnansweredWarningContent(
            <>
                <p>Anda belum menjawab {unanswered.length} {questionWord} berikut:</p>
                <p className="font-semibold my-2 text-red-600">{formattedUnanswered}.</p>
                <p>Apakah Anda yakin ingin menyelesaikan ujian dengan jawaban yang kosong?</p>
            </>
        );
        setShowUnansweredWarningModal(true);
    } else {
        setIsSubmitConfirmModalOpen(true);
    }
  };
  
  const handleProceedToFinalSubmit = () => {
    setShowUnansweredWarningModal(false);
    setIsSubmitConfirmModalOpen(true);
  };


  const handleConfirmSubmit = () => {
    finalizeAnswersAndSubmit();
    setIsSubmitConfirmModalOpen(false);
  };
  
  const handleAgreeToPrerequisites = () => {
    setHasAgreedToPrerequisites(true);
    setShowPrerequisitesModal(false);
  };

  const handleTokenSubmit = () => {
    if (!exam) return;
    if (enteredToken === exam.examToken) {
        setTokenError(null);
        setShowTokenModal(false);
        setIsTokenValidated(true);
    } else {
        setTokenError("Token ujian salah. Silakan coba lagi.");
    }
  };
  
  const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

  const jumpToQuestion = (index: number) => {
      if (isFinished) return;
      const list = activeTab === 'mcq' ? mcqQuestions : essayQuestions;
      if (index >= 0 && index < list.length) {
          setCurrentQuestionIndex(index);
      }
      if (isMobileNavOpen) {
          setIsMobileNavOpen(false);
      }
  };

  const navigateQuestion = useCallback((direction: 'next' | 'prev') => {
    if (isFinished) return;
    setCurrentQuestionIndex(prev => {
        const list = activeTab === 'mcq' ? mcqQuestions : essayQuestions;
        const newIndex = direction === 'next' ? prev + 1 : prev - 1;
        if (newIndex >= 0 && newIndex < list.length) {
            return newIndex;
        }
        return prev;
    });
  }, [activeTab, mcqQuestions, essayQuestions, isFinished]);
  
  const switchTab = (tab: 'mcq' | 'essay') => {
      if (isFinished || !showTabs) return;
      setActiveTab(tab);
      setCurrentQuestionIndex(0); 
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!isFinished && examQuestions.length > 0 && submission) {
            event.preventDefault();
            event.returnValue = 'Perubahan mungkin tidak tersimpan. Apakah Anda yakin ingin keluar?';
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFinished, examQuestions, submission]);

  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden && !isFinished && examQuestions.length > 0 && submission && !showTabWarningModal) {
            setShowTabWarningModal(true);
            if (user && exam) { 
                 addActivityLog({
                     action: ActivityAction.STUDENT_LEFT_EXAM_TAB,
                     targetId: exam.id,
                     targetName: exam.title,
                     targetType: "Ujian",
                     details: `Siswa ${user.name} meninggalkan tab saat mengerjakan ujian.`
                 }, user);
             }
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isFinished, examQuestions, submission, showTabWarningModal, user, exam, addActivityLog]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (isFinished || currentQuestionList.length === 0 || showPrerequisitesModal || showTokenModal || showTabWarningModal || isSubmitConfirmModalOpen || isMobileNavOpen) return;
        
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return; 
        }

        if (event.key === 'ArrowRight') {
            navigateQuestion('next');
        } else if (event.key === 'ArrowLeft') {
            navigateQuestion('prev');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, currentQuestionList, navigateQuestion, showPrerequisitesModal, showTokenModal, showTabWarningModal, isSubmitConfirmModalOpen, isMobileNavOpen]);


  if (isLoading) {
    return <div className="min-h-screen bg-smkn-gray flex justify-center items-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-smkn-blue"></div><p className="ml-3 text-smkn-text">Memuat ujian...</p></div>;
  }
  if (error && !isFinished) { 
    return (
      <div className="min-h-screen bg-smkn-gray flex flex-col items-center justify-center p-4">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/student/exams')} variant="secondary" className="mt-4">Kembali ke Daftar Ujian</Button>
      </div>
    );
  }
  if (!exam && !isLoading) { 
    return <div className="min-h-screen bg-smkn-gray flex items-center justify-center p-4"><Alert type="warning" message="Gagal memuat detail ujian. Silakan coba lagi atau hubungi pengawas." /></div>;
  }

  if (showPrerequisitesModal && exam) {
    return (
        <Modal isOpen={showPrerequisitesModal} onClose={() => navigate('/student/exams')} title="Prasyarat Ujian">
            <h2 className="text-xl font-semibold mb-2 text-smkn-text">{exam.title}</h2>
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{exam.prerequisitesText || "Tidak ada prasyarat khusus."}</p>
            <Button onClick={handleAgreeToPrerequisites} variant="primary" className="w-full">Saya Mengerti dan Setuju</Button>
        </Modal>
    );
  }

  if (showTokenModal && exam) {
    return (
        <Modal isOpen={showTokenModal} onClose={() => navigate('/student/exams')} title="Masukkan Token Ujian" size="sm">
            <p className="text-sm text-gray-700 mb-2">Ujian "<strong>{exam.title}</strong>" ini memerlukan token untuk memulai.</p>
            {tokenError && <Alert type="error" message={tokenError} onClose={() => setTokenError(null)} />}
            <Input 
                label="Token Ujian"
                id="examToken"
                type="text"
                value={enteredToken}
                onChange={(e) => setEnteredToken(e.target.value)}
                placeholder="Masukkan token..."
                containerClassName="mb-1"
            />
            <div className="mt-6 flex justify-end">
                <Button onClick={handleTokenSubmit} variant="primary">Mulai Ujian</Button>
            </div>
        </Modal>
    );
  }
  
  if (!currentActualQuestion && currentQuestionList.length === 0 && examQuestions.length > 0 && !isFinished && !isLoading) {
     return <div className="min-h-screen bg-smkn-gray flex justify-center items-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-smkn-blue"></div><p className="ml-3 text-smkn-text">Memuat soal...</p></div>;
  }

  const currentAnswerValue = currentActualQuestion ? (answers.find(a => a.questionId === currentActualQuestion.id)?.answer || '') : '';

  const renderNavigationContent = (questionsToDisplay: Question[]) => (
    <>
      <div className="flex-1 overflow-y-auto space-y-1 sm:space-y-2 pr-1">
        {questionsToDisplay.map((q, index) => {
          const isAnswered = answers.find(a => a.questionId === q.id)?.answer;
          const isCurrent = q.id === currentActualQuestion?.id && index === currentQuestionIndex; 

          return (
            <button
              key={q.id}
              onClick={() => jumpToQuestion(index)}
              className={`w-full text-left p-1.5 sm:p-2 rounded text-xs sm:text-sm font-medium border transition-colors flex items-center
                ${isCurrent ? 'bg-smkn-blue text-white border-smkn-blue ring-2 ring-smkn-blue-dark' : 
                (isAnswered ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200')}`}
              title={`Soal ${index + 1}`}
            >
              <span className={`inline-block w-5 h-5 sm:w-6 sm:h-6 leading-5 sm:leading-6 text-center rounded-full mr-2 text-xs sm:text-sm flex-shrink-0 ${isCurrent ? 'bg-white text-smkn-blue' : (isAnswered ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700')}`}>
                {index + 1}
              </span>
              <span className="truncate flex-1">Soal {index + 1}</span>
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-smkn-gray flex flex-col text-smkn-text">
      {showTabWarningModal && (
        <Modal isOpen={showTabWarningModal} onClose={() => setShowTabWarningModal(false)} title="Peringatan">
            <p className="text-gray-700">Anda terdeteksi meninggalkan tab ujian. Harap tetap fokus pada pengerjaan ujian.</p>
            <div className="mt-4 flex justify-end">
                <Button onClick={() => setShowTabWarningModal(false)} variant="primary">Saya Mengerti</Button>
            </div>
        </Modal>
      )}
      <div className="bg-smkn-blue text-white p-3 flex justify-between items-center shadow-md sticky top-0 z-30">
        <h2 className="text-lg sm:text-xl font-semibold truncate pr-2">{exam?.title || APP_NAME}</h2>
        <div className="flex items-center">
          {!isFinished && (
            <div className="text-md sm:text-lg font-mono bg-white text-smkn-blue px-3 py-1 rounded shadow mr-2">
              <i className={`${ICONS.time} mr-1 sm:mr-2`}></i>
              {Math.floor(timeLeft / 3600).toString().padStart(2, '0')}:
              {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:
              {Math.floor(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          {!isFinished && examQuestions.length > 0 && (
            <button
                className="md:hidden text-white focus:outline-none p-2"
                onClick={toggleMobileNav}
                aria-label="Buka Navigasi Soal"
                aria-expanded={isMobileNavOpen}
                aria-controls="mobile-question-navigation"
            >
                <i className="fas fa-bars text-xl"></i>
            </button>
          )}
        </div>
      </div>

      {isFinished ? (
        <div className="flex-1 flex items-center justify-center p-4">
            <Card title="Ujian Selesai" className="w-full max-w-lg text-center">
                <div className="py-10">
                    <i className={`${ICONS.success} text-5xl text-green-500 mb-4 inline-block`}></i>
                    <h2 className="text-2xl font-semibold text-smkn-text mb-2">Ujian Telah Selesai Dikerjakan!</h2>
                    <p className="text-gray-600 mb-6">
                    Jawaban Anda telah berhasil dikirim. Hasil ujian akan diumumkan sesuai jadwal.
                    </p>
                    <div className="flex justify-center">
                        <Button onClick={() => navigate('/student/dashboard')} variant="primary" className="mt-8">
                            Kembali ke Dashboard
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row p-2 sm:p-4 gap-2 sm:gap-4 overflow-y-auto md:overflow-hidden relative">
          <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
            { showTabs && (hasMcqQuestions || hasEssayQuestions) && (
              <div className="flex border-b sticky top-0 bg-white z-10">
                  {hasMcqQuestions && (
                    <button 
                        onClick={() => switchTab('mcq')}
                        className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center text-sm sm:text-base font-medium ${activeTab === 'mcq' ? 'border-b-2 border-smkn-blue text-smkn-blue bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Pilihan Ganda ({mcqQuestions.length})
                    </button>
                  )}
                  {hasEssayQuestions && (
                    <button 
                        onClick={() => switchTab('essay')}
                        className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center text-sm sm:text-base font-medium ${activeTab === 'essay' ? 'border-b-2 border-smkn-blue text-smkn-blue bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Essai ({essayQuestions.length})
                    </button>
                  )}
              </div>
            )}

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              {currentActualQuestion ? (
                  <>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">
                       Soal {currentQuestionIndex + 1}
                  </p>
                  <div className="prose max-w-none mb-4 text-sm sm:text-base text-gray-800" dangerouslySetInnerHTML={{ __html: currentActualQuestion.text }}></div>
                  {currentActualQuestion.imageUrl && <img src={currentActualQuestion.imageUrl} alt="Soal" className="my-3 max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg max-h-64 object-contain border rounded"/>}
                  {currentActualQuestion.audioUrl && <audio controls src={currentActualQuestion.audioUrl} className="my-3 w-full max-w-md">Browser Anda tidak mendukung tag audio.</audio>}
                  {currentActualQuestion.mathFormula && <div className="my-3"><KatexRenderer latex={currentActualQuestion.mathFormula} /></div>}

                  {currentActualQuestion.type === QuestionType.MULTIPLE_CHOICE && currentActualQuestion.options && (
                      <div className="space-y-3 mt-4">
                      {currentActualQuestion.options.map((opt: MultipleChoiceOption) => (
                          <label key={opt.id} className={`flex items-start sm:items-center p-3 border rounded-lg cursor-pointer hover:border-smkn-blue transition-all text-sm sm:text-base
                              ${currentAnswerValue === opt.id ? 'bg-blue-100 border-smkn-blue ring-2 ring-smkn-blue' : 'bg-white border-gray-300'}`}>
                          <input
                              type="radio"
                              name={`question-${currentActualQuestion.id}`}
                              value={opt.id}
                              checked={currentAnswerValue === opt.id}
                              onChange={() => handleAnswerChange(currentActualQuestion.id, opt.id)}
                              className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-smkn-blue focus:ring-smkn-blue mr-3 mt-1 sm:mt-0 flex-shrink-0"
                          />
                          <span className="text-gray-700 flex-1">{opt.text}</span>
                          </label>
                      ))}
                      </div>
                  )}

                  {currentActualQuestion.type === QuestionType.ESSAY && (
                      <textarea
                      value={currentAnswerValue}
                      onChange={(e) => handleAnswerChange(currentActualQuestion.id, e.target.value)}
                      rows={8}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-smkn-blue focus:border-smkn-blue mt-4 text-sm sm:text-base"
                      placeholder="Ketik jawaban essai Anda di sini..."
                      />
                  )}
                  </>
              ) : (
                  <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
                      {examQuestions.length === 0 && !isLoading ? 'Tidak ada soal dalam ujian ini.' : 
                       (activeTab === 'mcq' && mcqQuestions.length === 0 ? 'Tidak ada soal pilihan ganda dalam ujian ini.' : 
                       (activeTab === 'essay' && essayQuestions.length === 0 ? 'Tidak ada soal essai dalam ujian ini.' :
                       'Memuat soal...'))
                      }
                  </p>
              )}
            </div>
            
            <div className="p-3 sm:p-4 bg-gray-50 border-t mt-auto">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <Button onClick={() => navigateQuestion('prev')} disabled={currentQuestionIndex === 0 || currentQuestionList.length === 0} variant="secondary" leftIcon={ICONS.back} size="sm">
                      Sebelumnya
                  </Button>
                  <Button onClick={() => navigateQuestion('next')} disabled={currentQuestionIndex === currentQuestionList.length - 1 || currentQuestionList.length === 0} variant="secondary" rightIcon="fas fa-arrow-right" size="sm">
                      Berikutnya
                  </Button>
              </div>
              <Button onClick={openSubmitConfirmationModal} variant="success" className="w-full py-2 sm:py-3 text-sm sm:text-base" leftIcon={ICONS.save} disabled={examQuestions.length === 0}>
                Selesaikan Ujian
              </Button>
            </div>
          </div>

          {examQuestions.length > 0 && (
            <div className="hidden md:flex w-full md:w-64 lg:w-72 bg-white shadow-lg rounded-lg p-3 sm:p-4 flex-col">
                 <div className="pb-2 mb-2 border-b">
                    <h3 className="text-base font-semibold text-smkn-blue">
                        Navigasi Soal ({activeTab === 'mcq' ? 'PG' : 'Essai'})
                    </h3>
                  </div>
              {renderNavigationContent(currentQuestionList)}
            </div>
          )}
          
          {isMobileNavOpen && examQuestions.length > 0 && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={toggleMobileNav}
                aria-hidden="true"
              ></div>
              <aside 
                id="mobile-question-navigation"
                className="fixed top-0 right-0 h-full w-64 sm:w-72 bg-white shadow-xl z-50 p-4 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col
                           data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full"
                data-state={isMobileNavOpen ? 'open' : 'closed'}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-nav-title"
              >
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 id="mobile-nav-title" className="text-lg font-semibold text-smkn-blue">
                        Navigasi Soal ({activeTab === 'mcq' ? 'PG' : 'Essai'})
                    </h3>
                    <button 
                        onClick={toggleMobileNav} 
                        className="text-gray-500 hover:text-gray-700 p-1 -mr-1"
                        aria-label="Tutup Navigasi Soal"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {renderNavigationContent(currentQuestionList)}
                </div>
              </aside>
            </>
          )}
        </div>
      )}

      {showUnansweredWarningModal && (
        <ConfirmationModal
            isOpen={showUnansweredWarningModal}
            onClose={() => setShowUnansweredWarningModal(false)}
            onConfirm={handleProceedToFinalSubmit}
            title="Peringatan Jawaban Kosong"
            message={unansweredWarningContent}
            confirmButtonText="Tetap Kirim"
            cancelButtonText="Kembali Mengerjakan"
            confirmButtonVariant="warning"
        />
      )}

      {isSubmitConfirmModalOpen && (
        <ConfirmationModal
            isOpen={isSubmitConfirmModalOpen}
            onClose={() => setIsSubmitConfirmModalOpen(false)}
            onConfirm={handleConfirmSubmit}
            title="Konfirmasi Pengiriman Ujian"
            message="Apakah Anda yakin ingin menyelesaikan dan mengirimkan ujian ini?"
            confirmButtonText="Ya, Kirim Ujian"
            cancelButtonText="Batal"
            confirmButtonVariant="success"
            confirmButtonIcon={ICONS.save}
        />
      )}
    </div>
  );
};

export default TakeExamPage;
