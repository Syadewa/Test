import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Link } from 'react-router-dom'; // Link no longer needed for tutorial page
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Question, QuestionType, MultipleChoiceOption, Subject, Class, ActivityAction } from '../../types'; // Added ActivityAction
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input, { Select, Textarea } from '../../components/common/Input';
import { ICONS, DEFAULT_KKM } from '../../constants';
import Alert from '../../components/common/Alert';
import { generateId } from '../../utils/helpers';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import * as XLSX from 'xlsx';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import KatexRenderer from '../../components/common/KatexRenderer'; // Changed import

const API_KEY = process.env.API_KEY;
const MAX_QUESTION_TEXT_LENGTH = 1000;
const MAX_OPTION_TEXT_LENGTH = 255;

interface AiPromptDetails {
  subjectId: string;
  questionType: QuestionType;
  topic: string;
}

const MyQuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const { questions, addQuestion, updateQuestion, deleteQuestion, subjects, classes, validateQuestion, addActivityLog } = useData();

  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedSubjectContextId, setSelectedSubjectContextId] = useState<string>('');

  const [filterType, setFilterType] = useState<QuestionType | ''>('');
  const [filterValidation, setFilterValidation] = useState<string>('');

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPromptDetails, setAiPromptDetails] = useState<AiPromptDetails>({ subjectId: '', questionType: QuestionType.MULTIPLE_CHOICE, topic: '' });
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  const [isExcelQuestionUploadModalOpen, setIsExcelQuestionUploadModalOpen] = useState(false);
  const [excelQuestionFile, setExcelQuestionFile] = useState<File | null>(null);
  const [excelQuestionUploadError, setExcelQuestionUploadError] = useState<string | null>(null);
  const [excelQuestionUploadSuccess, setExcelQuestionUploadSuccess] = useState<string | null>(null);
  const [processingExcelQuestionsErrors, setProcessingExcelQuestionsErrors] = useState<string[]>([]);
  const [isProcessingExcelQuestions, setIsProcessingExcelQuestions] = useState(false);

  const [isConfirmDeleteQuestionModalOpen, setIsConfirmDeleteQuestionModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  const [showFormulaHint, setShowFormulaHint] = useState(false); // Renamed state variable

  const modalInputClassName = 'bg-gray-700 text-white placeholder-gray-300 border-gray-600 focus:border-smkn-blue';
  const modalFileInputClassName =
    'block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-smkn-blue file:text-white hover:file:bg-smkn-blue-dark cursor-pointer';
  const modalSelectClassName = 'bg-gray-700 text-white border-gray-600 focus:border-smkn-blue';
  const modalTextareaClassName = 'bg-gray-700 text-white placeholder-gray-300 border-gray-600 focus:border-smkn-blue';
  const modalLabelClassName = 'text-gray-300';

  const allClassesOptions = classes.map((c) => ({ value: c.id, label: c.name }));

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (API_KEY) {
      try {
        setAi(new GoogleGenAI({ apiKey: API_KEY }));
      } catch (e) {
        console.error('Failed to initialize GoogleGenAI:', e);
        setAiError('Gagal menginisialisasi layanan AI.');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const taughtSubjects = subjects.filter((s) => (user.subjectIds && user.subjectIds.includes(s.id)) || s.guruMapelId === user.id);
      setTeacherSubjects(taughtSubjects);

      if (taughtSubjects.length > 0 && !aiPromptDetails.subjectId) {
        setAiPromptDetails((prev) => ({ ...prev, subjectId: prev.subjectId || taughtSubjects[0].id }));
      }
    }
  }, [user, subjects, aiPromptDetails.subjectId]);

  useEffect(() => {
    if (user) {
      let filtered = questions.filter((q) => q.createdBy === user.id);
      if (selectedSubjectContextId && selectedSubjectContextId !== '') {
        filtered = filtered.filter((q) => q.subjectId === selectedSubjectContextId);
      }
      if (filterType) filtered = filtered.filter((q) => q.type === filterType);
      if (filterValidation === 'validated') filtered = filtered.filter((q) => q.isValidated);
      else if (filterValidation === 'not_validated') filtered = filtered.filter((q) => !q.isValidated);
      setMyQuestions(filtered);
    }
  }, [user, questions, selectedSubjectContextId, filterType, filterValidation]);

  const openModal = (question: Partial<Question> | null = null) => {
    if (teacherSubjects.length === 0) {
      setFormError('Anda harus terdaftar sebagai guru mata pelajaran untuk dapat menambah/mengedit soal.');
      return;
    }

    const defaultSubject = selectedSubjectContextId || teacherSubjects[0]?.id || '';

    setCurrentQuestion(
      question
        ? { ...question, options: question.options ? [...question.options.map((opt) => ({ ...opt }))] : [], targetClassIds: question.targetClassIds || [] }
        : {
            subjectId: defaultSubject,
            type: QuestionType.MULTIPLE_CHOICE,
            points: 10,
            kkm: DEFAULT_KKM,
            isValidated: false,
            targetClassIds: [],
            options: [
              { id: generateId('opt'), text: '', isCorrect: true },
              { id: generateId('opt'), text: '', isCorrect: false },
            ],
          }
    );
    setFormError(null);
    setShowFormulaHint(false); // Close hint when opening modal
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowFormulaHint(false); // Close hint when closing modal
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const targetInput = e.target as HTMLInputElement;

    setCurrentQuestion((prev) => {
      if (!prev) return null;
      const updatedQuestion = { ...prev };

      if (name === 'type') {
        updatedQuestion.type = value as QuestionType;
        if (value === QuestionType.ESSAY) {
          updatedQuestion.options = [];
        } else if (value === QuestionType.MULTIPLE_CHOICE && (!updatedQuestion.options || updatedQuestion.options.length < 2)) {
          updatedQuestion.options = [
            { id: generateId('opt'), text: '', isCorrect: true },
            { id: generateId('opt'), text: '', isCorrect: false },
          ];
        }
      } else if (name === 'points' || name === 'kkm') {
        updatedQuestion[name] = parseFloat(value) || undefined;
      } else if (targetInput.type === 'checkbox' && name === 'isValidated') {
        updatedQuestion.isValidated = targetInput.checked;
      } else {
        (updatedQuestion as any)[name] = value;
      }
      return updatedQuestion;
    });
  };

  const handleTargetClassMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setCurrentQuestion((prev) => (prev ? { ...prev, targetClassIds: selectedOptions } : null));
  };

  const handleOptionChange = (index: number, field: keyof MultipleChoiceOption, value: string | boolean) => {
    setCurrentQuestion((prev) => {
      if (!prev || !prev.options) return prev;
      const newOptions = [...prev.options];
      if (field === 'isCorrect') {
        newOptions.forEach((opt, i) => (opt.isCorrect = i === index));
      }
      (newOptions[index] as any)[field] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setCurrentQuestion((prev) => (prev ? { ...prev, options: [...(prev.options || []), { id: generateId('opt'), text: '', isCorrect: false }] } : null));
  };

  const removeOption = (index: number) => {
    setCurrentQuestion((prev) => {
      if (!prev || !prev.options || prev.options.length <= 2) return prev;
      const newOptions = prev.options.filter((_, i) => i !== index);
      if (newOptions.length > 0 && !newOptions.some((opt) => opt.isCorrect)) {
        newOptions[0].isCorrect = true;
      }
      return { ...prev, options: newOptions };
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'audio') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentQuestion((prev) => {
          if (!prev) return null;
          if (fileType === 'image') return { ...prev, imageUrl: reader.result as string };
          if (fileType === 'audio') return { ...prev, audioUrl: reader.result as string };
          return prev;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (fileType: 'image' | 'audio') => {
    setCurrentQuestion((prev) => {
      if (!prev) return null;
      if (fileType === 'image') {
        if (imageInputRef.current) imageInputRef.current.value = '';
        return { ...prev, imageUrl: undefined };
      }
      if (fileType === 'audio') {
        if (audioInputRef.current) audioInputRef.current.value = '';
        return { ...prev, audioUrl: undefined };
      }
      return prev;
    });
  };

  const handleSubmit = () => {
    setFormError(null);
    if (!currentQuestion || !currentQuestion.text || !currentQuestion.subjectId || !currentQuestion.type || !user) {
      setFormError('Teks Soal, Mata Pelajaran, dan Tipe Soal harus diisi.');
      return;
    }
    if (currentQuestion.text.length > MAX_QUESTION_TEXT_LENGTH) {
      setFormError(`Teks Soal tidak boleh melebihi ${MAX_QUESTION_TEXT_LENGTH} karakter.`);
      return;
    }

    if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
      if (!currentQuestion.options || currentQuestion.options.length < 2 || !currentQuestion.options.some((opt) => opt.isCorrect)) {
        setFormError('Soal Pilihan Ganda harus memiliki minimal 2 opsi dan satu jawaban yang benar.');
        return;
      }
      for (const opt of currentQuestion.options) {
        if (opt.text.length > MAX_OPTION_TEXT_LENGTH) {
          setFormError(`Teks Opsi tidak boleh melebihi ${MAX_OPTION_TEXT_LENGTH} karakter.`);
          return;
        }
      }
    }

    const questionToSave: Question = {
      ...currentQuestion,
      id: currentQuestion.id || generateId('q'),
      createdBy: user.id,
      points: currentQuestion.points ?? 10,
      kkm: currentQuestion.kkm ?? DEFAULT_KKM,
      isValidated: currentQuestion.isValidated || false,
      text: currentQuestion.text!,
      subjectId: currentQuestion.subjectId!,
      type: currentQuestion.type!,
      options: currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? currentQuestion.options : undefined,
      correctAnswer: currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? currentQuestion.options?.find((opt) => opt.isCorrect)?.id : currentQuestion.correctAnswer,
      targetClassIds: currentQuestion.targetClassIds || [],
      imageUrl: currentQuestion.imageUrl,
      audioUrl: currentQuestion.audioUrl,
      mathFormula: currentQuestion.mathFormula,
    };

    if (currentQuestion.id) {
      updateQuestion(questionToSave, user);
      setSuccessMessage('Soal berhasil diperbarui.');
    } else {
      addQuestion(questionToSave, user);
      setSuccessMessage('Soal baru berhasil ditambahkan.');
    }
    closeModal();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteRequest = (question: Question) => {
    setQuestionToDelete(question);
    setIsConfirmDeleteQuestionModalOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (!questionToDelete || !user) return;
    try {
      deleteQuestion(questionToDelete.id, user);
      setSuccessMessage(`Soal "${questionToDelete.text.substring(0, 30)}..." berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setFormError(e.message || 'Gagal menghapus soal.');
      setTimeout(() => setFormError(null), 3000);
    }
    setIsConfirmDeleteQuestionModalOpen(false);
    setQuestionToDelete(null);
  };

  const handleRequestValidation = (questionId: string) => {
    const questionToValidate = questions.find((q) => q.id === questionId);
    if (questionToValidate && user) {
      updateQuestion({ ...questionToValidate, isValidated: false }, user);
      addActivityLog({ action: ActivityAction.REQUEST_QUESTION_VALIDATION, targetId: questionId, targetName: questionToValidate.text.substring(0, 50) + '...', targetType: 'Soal' }, user);
      setSuccessMessage('Permintaan validasi ulang untuk soal telah dikirim.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const openAiModal = () => {
    if (!API_KEY || !ai) {
      setAiError(`Layanan AI ${!API_KEY ? 'membutuhkan API Key.' : 'belum siap.'} Harap hubungi admin.`);
      setIsAiModalOpen(true);
      return;
    }
    setAiError(null);
    const defaultSubjectIdForAI = selectedSubjectContextId || teacherSubjects[0]?.id || '';
    setAiPromptDetails({ subjectId: defaultSubjectIdForAI, questionType: QuestionType.MULTIPLE_CHOICE, topic: '' });
    setShowFormulaHint(false); // Close hint when opening AI modal
    setIsAiModalOpen(true);
  };

  const closeAiModal = () => {
    setIsAiModalOpen(false);
    setShowFormulaHint(false); // Ensure hint is also closed
  };

  const handleAiInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAiPromptDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateAiQuestion = async () => {
    if (!ai || !user || !aiPromptDetails.subjectId || !aiPromptDetails.topic) {
      setAiError('Layanan AI, Mata Pelajaran, dan Topik Soal harus diisi.');
      return;
    }
    setIsGeneratingAi(true);
    setAiError(null);

    const subjectName = teacherSubjects.find((s) => s.id === aiPromptDetails.subjectId)?.name || 'umum';
    let prompt = `Buat satu soal ujian ${aiPromptDetails.questionType === QuestionType.MULTIPLE_CHOICE ? 'pilihan ganda' : 'esai'} dalam Bahasa Indonesia untuk mata pelajaran ${subjectName} dengan topik "${
      aiPromptDetails.topic
    }". Jangan sertakan nomor soal atau label seperti "Soal:", "Jawaban:", dll. `;

    if (aiPromptDetails.questionType === QuestionType.MULTIPLE_CHOICE) {
      prompt += `Soal harus memiliki 4 pilihan jawaban. Setiap pilihan adalah objek dengan "id" (string, unik, contoh: "opt_ai_1"), "text" (string, isi pilihan jawaban, maksimal ${MAX_OPTION_TEXT_LENGTH} karakter), dan "isCorrect" (boolean, true jika pilihan tersebut adalah jawaban yang benar, false jika salah). Hanya satu pilihan yang boleh memiliki "isCorrect": true. Sertakan juga properti 'kkm': 75 (numerik) dan 'points': 10 (numerik) untuk soal tersebut. Teks soal utama maksimal ${MAX_QUESTION_TEXT_LENGTH} karakter. Format output harus berupa objek JSON tunggal yang valid seperti ini: {"text": "Isi pertanyaan soal...", "options": [{"id": "opt_ai_1", "text": "Pilihan A", "isCorrect": true}, {"id": "opt_ai_2", "text": "Pilihan B", "isCorrect": false}, ...], "kkm": 75, "points": 10}. Pastikan nilai boolean untuk 'isCorrect' adalah true atau false, bukan string "true" atau "false".`;
    } else {
      prompt += `Sertakan juga properti "correctAnswer" (string, berisi referensi jawaban esai), 'kkm': 75 (numerik), dan 'points': 15 (numerik) untuk soal tersebut. Teks soal utama maksimal ${MAX_QUESTION_TEXT_LENGTH} karakter. Format output harus berupa objek JSON tunggal yang valid seperti ini: {"text": "Isi pertanyaan soal...", "correctAnswer": "Referensi jawaban esai...", "kkm": 75, "points": 15}.`;
    }
    prompt += ` PENTING: Output harus berupa objek JSON tunggal yang valid sesuai struktur yang diminta, tanpa teks atau markdown tambahan di sekitarnya. Semua nilai string dalam JSON harus diapit oleh tanda kutip ganda (").`;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const generatedData = JSON.parse(jsonStr);

      const newQuestion: Partial<Question> = {
        subjectId: aiPromptDetails.subjectId,
        type: aiPromptDetails.questionType,
        text: String(generatedData.text || '').substring(0, MAX_QUESTION_TEXT_LENGTH),
        points: parseFloat(String(generatedData.points ?? (aiPromptDetails.questionType === QuestionType.MULTIPLE_CHOICE ? 10 : 15))),
        kkm: parseFloat(String(generatedData.kkm ?? DEFAULT_KKM)),
        isValidated: false,
        createdBy: user.id,
        targetClassIds: [],
      };

      if (aiPromptDetails.questionType === QuestionType.MULTIPLE_CHOICE && generatedData.options && Array.isArray(generatedData.options)) {
        newQuestion.options = (generatedData.options as any[]).map((opt, index) => ({
          id: opt.id || generateId(`opt-ai-${index}`),
          text: String(opt.text || '').substring(0, MAX_OPTION_TEXT_LENGTH),
          isCorrect: Boolean(opt.isCorrect === true || String(opt.isCorrect).toLowerCase() === 'true'),
        }));
        const correctOptions = newQuestion.options.filter((opt) => opt.isCorrect);
        if (correctOptions.length === 0 && newQuestion.options.length > 0) {
          if (newQuestion.options[0]) newQuestion.options[0].isCorrect = true;
        } else if (correctOptions.length > 1) {
          let firstCorrectFound = false;
          newQuestion.options.forEach((opt) => {
            if (opt.isCorrect) {
              if (firstCorrectFound) opt.isCorrect = false;
              else firstCorrectFound = true;
            }
          });
        }
      } else if (aiPromptDetails.questionType === QuestionType.ESSAY) {
        newQuestion.correctAnswer = generatedData.correctAnswer;
      }

      addActivityLog({ action: ActivityAction.AI_GENERATE_QUESTION, targetType: 'Soal', details: `Topik: ${aiPromptDetails.topic}, Mapel: ${subjectName}` }, user);
      closeAiModal();
      openModal(newQuestion);
    } catch (e: any) {
      console.error('Error generating AI question:', e);
      addActivityLog({ action: ActivityAction.AI_GENERATE_QUESTION, targetType: 'Soal', details: `Error: ${e.message}` }, user);
      setAiError(`Gagal memproses respon dari AI: ${e.message || 'Format JSON tidak sesuai atau error tidak diketahui.'}. Detail: ${e.toString()}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const openExcelQuestionUploadModal = () => {
    if (teacherSubjects.length === 0) {
      setFormError('Anda harus terdaftar sebagai guru mata pelajaran untuk dapat mengunggah soal.');
      return;
    }
    setExcelQuestionFile(null);
    setExcelQuestionUploadError(null);
    setExcelQuestionUploadSuccess(null);
    setProcessingExcelQuestionsErrors([]);
    setShowFormulaHint(false); // Close hint
    setIsExcelQuestionUploadModalOpen(true);
  };
  const closeExcelQuestionUploadModal = () => {
    setIsExcelQuestionUploadModalOpen(false);
    setShowFormulaHint(false); // Ensure hint is closed
  };

  const handleExcelQuestionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelQuestionFile(e.target.files[0]);
      setExcelQuestionUploadError(null); // Clear previous error on new file selection
    }
  };

  const handleDownloadQuestionTemplate = () => {
    const headers = [
      'NamaMapel (Wajib)',
      'Kelas (Opsional, Info)',
      'TargetKelas (Opsional, pisah koma)',
      'TipeSoal (Wajib: Multiple Choice/Essay)',
      'TeksSoal (Wajib)',
      'Poin (Wajib)',
      'KKM (Wajib)',
      'ImageUrl',
      'AudioUrl',
      'MathFormula',
      'Opsi1_Teks',
      'Opsi1_Benar (BENAR/SALAH)',
      'Opsi2_Teks',
      'Opsi2_Benar',
      'Opsi3_Teks',
      'Opsi3_Benar',
      'Opsi4_Teks',
      'Opsi4_Benar',
      'Opsi5_Teks',
      'Opsi5_Benar',
      'JawabanEsai',
    ];
    const sampleMCQ = [
      teacherSubjects[0]?.name || 'Matematika',
      'X',
      'X, XI',
      'Multiple Choice',
      `Pertanyaan pilihan ganda contoh? (max ${MAX_QUESTION_TEXT_LENGTH} karakter)`,
      10,
      75,
      '',
      '',
      '',
      `Teks Opsi 1 (max ${MAX_OPTION_TEXT_LENGTH} karakter)`,
      'SALAH',
      'Teks Opsi 2',
      'BENAR',
      'Teks Opsi 3',
      'SALAH',
      'Teks Opsi 4',
      'SALAH',
      '',
      '',
      '',
    ];
    const sampleEssay = [
      teacherSubjects[0]?.name || 'Bahasa Indonesia',
      'XI',
      'XI',
      'Essay',
      `Pertanyaan esai contoh? (max ${MAX_QUESTION_TEXT_LENGTH} karakter)`,
      15,
      70,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Ini adalah contoh jawaban esai.',
    ];
    const data = [headers, sampleMCQ, sampleEssay];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal');
    XLSX.writeFile(workbook, 'template_soal_smkn73.xlsx');
  };

  const handleProcessExcelQuestionsFile = async () => {
    if (!excelQuestionFile || !user) {
      setExcelQuestionUploadError('Silakan pilih file Excel terlebih dahulu.');
      return;
    }
    setIsProcessingExcelQuestions(true);
    setExcelQuestionUploadError(null);
    setExcelQuestionUploadSuccess(null);
    setProcessingExcelQuestionsErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Gagal membaca file.');
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        let addedCount = 0;
        const currentErrors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowIndex = i + 2;
          let isRowInvalid = false;

          const { NamaMapel, Kelas: KelasValidasiExcel, TargetKelas, TipeSoal, TeksSoal, Poin, KKM, ImageUrl, AudioUrl, MathFormula, JawabanEsai } = row;

          if (!NamaMapel || !TipeSoal || !TeksSoal || Poin === '' || KKM === '') {
            currentErrors.push(`Baris ${rowIndex}: NamaMapel, TipeSoal, TeksSoal, Poin, dan KKM wajib diisi.`);
            continue;
          }

          const teksSoalStr = String(TeksSoal).trim();
          if (teksSoalStr.length > MAX_QUESTION_TEXT_LENGTH) {
            currentErrors.push(`Baris ${rowIndex}: TeksSoal melebihi ${MAX_QUESTION_TEXT_LENGTH} karakter.`);
            isRowInvalid = true;
          }

          const subject = teacherSubjects.find((s) => s.name.toLowerCase() === String(NamaMapel).trim().toLowerCase());
          if (!subject) {
            currentErrors.push(`Baris ${rowIndex}: Mata Pelajaran "${NamaMapel}" tidak ditemukan atau Anda tidak mengajar mapel ini.`);
            continue;
          }

          let targetClassIdsExcel: string[] = [];
          if (TargetKelas && String(TargetKelas).trim() !== '') {
            const targetClassNames = String(TargetKelas)
              .split(',')
              .map((cn) => cn.trim().toLowerCase());
            let allTargetClassNamesFound = true;
            for (const cn of targetClassNames) {
              const foundCls = classes.find((c) => c.name.toLowerCase() === cn);
              if (foundCls) {
                targetClassIdsExcel.push(foundCls.id);
              } else {
                currentErrors.push(`Baris ${rowIndex}: Nama Kelas di kolom TargetKelas ("${cn}") tidak ditemukan.`);
                allTargetClassNamesFound = false;
                break;
              }
            }
            if (!allTargetClassNamesFound) {
              isRowInvalid = true;
            } else if (targetClassIdsExcel.length > 0) {
              const invalidTargetClassesForSubject = targetClassIdsExcel.filter((tcId) => !subject.classIds.includes(tcId));
              if (invalidTargetClassesForSubject.length > 0) {
                const invalidNames = invalidTargetClassesForSubject.map((id) => classes.find((c) => c.id === id)?.name || id).join(', ');
                currentErrors.push(`Baris ${rowIndex}: Mata Pelajaran "${subject.name}" tidak diajarkan di kelas target berikut: ${invalidNames}.`);
                isRowInvalid = true;
              }
            }
          }

          if (KelasValidasiExcel && String(KelasValidasiExcel).trim() !== '') {
            const excelClassName = String(KelasValidasiExcel).trim().toLowerCase();
            const foundClassForValidation = classes.find((c) => c.name.toLowerCase() === excelClassName);
            if (!foundClassForValidation) {
              currentErrors.push(`Baris ${rowIndex}: Nama Kelas di kolom 'Kelas' ("${KelasValidasiExcel}") tidak ditemukan.`);
              isRowInvalid = true;
            } else if (!subject.classIds.includes(foundClassForValidation.id)) {
              currentErrors.push(`Baris ${rowIndex}: Mata Pelajaran "${subject.name}" tidak diajarkan di Kelas "${KelasValidasiExcel}" (sesuai kolom 'Kelas').`);
              isRowInvalid = true;
            }
          }

          const questionType = String(TipeSoal).trim() as QuestionType;
          if (questionType !== QuestionType.MULTIPLE_CHOICE && questionType !== QuestionType.ESSAY) {
            currentErrors.push(`Baris ${rowIndex}: TipeSoal "${TipeSoal}" tidak valid. Gunakan "Multiple Choice" atau "Essay".`);
            isRowInvalid = true;
          }

          const points = parseFloat(String(Poin));
          const kkm = parseFloat(String(KKM));
          if (isNaN(points) || points <= 0 || isNaN(kkm) || kkm < 0 || kkm > 100) {
            currentErrors.push(`Baris ${rowIndex}: Poin harus angka lebih dari 0, dan KKM antara 0-100.`);
            isRowInvalid = true;
          }

          if (isRowInvalid) continue;

          const newQuestion: Partial<Question> = {
            subjectId: subject.id,
            type: questionType,
            text: teksSoalStr,
            points: points,
            kkm: kkm,
            imageUrl: ImageUrl ? String(ImageUrl).trim() : undefined,
            audioUrl: AudioUrl ? String(AudioUrl).trim() : undefined,
            mathFormula: MathFormula ? String(MathFormula).trim() : undefined,
            createdBy: user.id,
            isValidated: false,
            targetClassIds: targetClassIdsExcel,
          };

          if (questionType === QuestionType.MULTIPLE_CHOICE) {
            const options: MultipleChoiceOption[] = [];
            let mcqRowInvalid = false;

            for (let j = 1; j <= 5; j++) {
              const optTextVal = row[`Opsi${j}_Teks`];
              const optBenarVal = row[`Opsi${j}_Benar`];
              const optTextStr = String(optTextVal).trim();
              const optBenarStr = String(optBenarVal).trim().toUpperCase();

              if (optTextStr) {
                if (optTextStr.length > MAX_OPTION_TEXT_LENGTH) {
                  currentErrors.push(`Baris ${rowIndex}: Teks Opsi${j} melebihi ${MAX_OPTION_TEXT_LENGTH} karakter.`);
                  mcqRowInvalid = true;
                }
                if (!optBenarStr || (optBenarStr !== 'BENAR' && optBenarStr !== 'SALAH')) {
                  currentErrors.push(`Baris ${rowIndex}: Opsi${j} memiliki teks, tetapi status Benar/Salah ("${optBenarVal}") tidak valid. Harus "BENAR" atau "SALAH".`);
                  mcqRowInvalid = true;
                } else {
                  options.push({
                    id: generateId(`opt-excel-${i}-${j}`),
                    text: optTextStr,
                    isCorrect: optBenarStr === 'BENAR',
                  });
                }
              } else if (optBenarStr) {
                currentErrors.push(`Baris ${rowIndex}: Opsi${j} tidak memiliki teks, tetapi status Benar/Salah ("${optBenarVal}") diisi.`);
                mcqRowInvalid = true;
              }
            }
            if (mcqRowInvalid) continue;

            if (options.length < 2) {
              currentErrors.push(`Baris ${rowIndex}: Soal Pilihan Ganda harus memiliki minimal 2 opsi dengan teks dan status Benar/Salah yang valid.`);
              continue;
            }

            let correctCount = options.filter((opt) => opt.isCorrect).length;
            if (correctCount === 0) {
              currentErrors.push(`Baris ${rowIndex}: Soal Pilihan Ganda harus memiliki minimal 1 jawaban yang ditandai "BENAR".`);
              continue;
            }
            if (correctCount > 1) {
              currentErrors.push(`Baris ${rowIndex}: Peringatan - Lebih dari satu opsi ditandai "BENAR". Hanya yang pertama akan digunakan.`);
              let firstCorrectMarked = false;
              options.forEach((opt) => {
                if (opt.isCorrect) {
                  if (firstCorrectMarked) opt.isCorrect = false;
                  else firstCorrectMarked = true;
                }
              });
            }
            newQuestion.options = options;
          } else {
            newQuestion.correctAnswer = JawabanEsai ? String(JawabanEsai).trim() : undefined;
          }

          addQuestion(newQuestion as Question, user);
          addedCount++;
        }

        if (addedCount > 0) {
          addActivityLog({ action: ActivityAction.IMPORT_QUESTIONS_EXCEL, details: `Berhasil menambah ${addedCount} soal dari Excel. Kesalahan: ${currentErrors.length}.`, targetType: 'Sistem' }, user);
          setExcelQuestionUploadSuccess(`${addedCount} soal berhasil ditambahkan dari file.`);
        }
        setProcessingExcelQuestionsErrors(currentErrors);
        if (currentErrors.length > 0) {
          setExcelQuestionUploadError(`Selesai dengan ${currentErrors.length} kesalahan/peringatan. Silakan periksa detail di bawah.`);
        }
        if (addedCount === 0 && currentErrors.length === 0 && jsonData.length > 0) {
          setExcelQuestionUploadError('Tidak ada soal yang dapat diproses dari file. Pastikan format sesuai dan data terisi.');
        } else if (jsonData.length === 0) {
          setExcelQuestionUploadError('File Excel kosong atau tidak ada data soal yang ditemukan.');
        }
      } catch (error: any) {
        console.error('Error processing Excel file for questions:', error);
        addActivityLog({ action: ActivityAction.IMPORT_QUESTIONS_EXCEL, details: `Gagal memproses file: ${error.message}`, targetType: 'Sistem' }, user);
        setExcelQuestionUploadError(`Gagal memproses file Excel: ${error.message}`);
        setProcessingExcelQuestionsErrors([]);
      } finally {
        setIsProcessingExcelQuestions(false);
      }
    };
    reader.readAsBinaryString(excelQuestionFile);
  };

  const toggleFormulaHint = () => {
    // Renamed function
    setShowFormulaHint((prev) => !prev);
  };

  const subjectContextOptions = [{ value: '', label: 'Semua Mapel Saya' }, ...teacherSubjects.map((s) => ({ value: s.id, label: s.name }))];
  const modalSubjectOptions = teacherSubjects.map((s) => ({ value: s.id, label: s.name }));
  const typeOptions: { value: QuestionType | ''; label: string }[] = [
    { value: '', label: 'Semua Tipe' },
    { value: QuestionType.MULTIPLE_CHOICE, label: 'Pilihan Ganda' },
    { value: QuestionType.ESSAY, label: 'Essai' },
  ];
  const validationOptions = [
    { value: '', label: 'Semua Validasi' },
    { value: 'validated', label: 'Disetujui' },
    { value: 'not_validated', label: 'Menunggu' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Bank Soal Saya</h1>
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Select
              options={subjectContextOptions}
              value={selectedSubjectContextId}
              onChange={(e) => setSelectedSubjectContextId(e.target.value)}
              containerClassName="w-full sm:w-48 mb-0"
              label="Filter Mata Pelajaran"
              disabled={teacherSubjects.length === 0}
            />
            <Select options={typeOptions} value={filterType} onChange={(e) => setFilterType(e.target.value as QuestionType | '')} containerClassName="w-full sm:w-40 mb-0" label="Filter Tipe" />
            <Select options={validationOptions} value={filterValidation} onChange={(e) => setFilterValidation(e.target.value)} containerClassName="w-full sm:w-48 mb-0" label="Filter Validasi" />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end pt-4 sm:pt-0">
            {API_KEY && ai && teacherSubjects.length > 0 && (
              <Button onClick={openAiModal} leftIcon={ICONS.ai_generate} variant="warning" size="sm">
                {' '}
                Buat Soal AI{' '}
              </Button>
            )}
            <Button onClick={openExcelQuestionUploadModal} leftIcon={ICONS.upload} variant="secondary" disabled={teacherSubjects.length === 0} size="sm">
              {' '}
              Unggah Soal Excel{' '}
            </Button>
            <Button onClick={() => openModal(null)} leftIcon={ICONS.add} variant="primary" disabled={teacherSubjects.length === 0} size="sm">
              {' '}
              Tambah Soal Manual{' '}
            </Button>
          </div>
        </div>

        {teacherSubjects.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Anda belum terdaftar sebagai guru mata pelajaran atau belum ada mata pelajaran yang ditugaskan kepada Anda.</p>
        ) : myQuestions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Tidak ada soal yang cocok dengan filter yang Anda pilih.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-smkn-blue text-white">
                <tr>
                  <th className="py-3 px-4 text-left w-2/5">Teks Soal</th>
                  <th className="py-3 px-4 text-left">Mapel</th>
                  <th className="py-3 px-4 text-left">Target Kelas</th>
                  <th className="py-3 px-4 text-left">Tipe</th>
                  <th className="py-3 px-4 text-left">Poin</th>
                  <th className="py-3 px-4 text-left">Status Validasi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {myQuestions.map((q) => (
                  <tr key={q.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                    <td className="py-3 px-4">
                      {q.text.substring(0, 100)}
                      {q.text.length > 100 ? '...' : ''}
                    </td>
                    <td className="py-3 px-4">{subjects.find((s) => s.id === q.subjectId)?.name || 'N/A'}</td>
                    <td className="py-3 px-4">{q.targetClassIds && q.targetClassIds.length > 0 ? q.targetClassIds.map((cid) => classes.find((c) => c.id === cid)?.name).join(', ') : 'Umum'}</td>
                    <td className="py-3 px-4">{q.type}</td>
                    <td className="py-3 px-4">{q.points}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${q.isValidated ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{q.isValidated ? 'Disetujui' : 'Menunggu Validasi'}</span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openModal(q)} leftIcon={ICONS.edit} className="text-blue-600 hover:text-blue-800 mr-1">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteRequest(q)} leftIcon={ICONS.delete} className="text-red-600 hover:text-red-800 mr-1">
                        Hapus
                      </Button>
                      {!q.isValidated && (
                        <Button size="sm" variant="ghost" onClick={() => handleRequestValidation(q.id)} leftIcon={ICONS.validate} className="text-orange-600 hover:text-orange-800">
                          Minta Validasi
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isModalOpen && currentQuestion && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={currentQuestion.id ? 'Edit Soal' : 'Tambah Soal Baru'} size="xl">
          {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <Select label="Mata Pelajaran" name="subjectId" options={modalSubjectOptions} value={currentQuestion.subjectId || ''} onChange={handleInputChange} required className={modalSelectClassName} labelClassName={modalLabelClassName} />
            <Select
              label="Tipe Soal"
              name="type"
              options={typeOptions.filter((opt) => opt.value !== '') as { value: QuestionType; label: string }[]}
              value={currentQuestion.type || QuestionType.MULTIPLE_CHOICE}
              onChange={handleInputChange}
              required
              className={modalSelectClassName}
              labelClassName={modalLabelClassName}
            />
          </div>

          <div className="mt-3 mb-4">
            <label className={`block text-sm font-medium mb-1 ${modalLabelClassName}`}>Target Kelas Soal (Opsional)</label>
            <select
              multiple
              name="targetClassIds"
              value={currentQuestion.targetClassIds || []}
              onChange={handleTargetClassMultiSelectChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue sm:text-sm h-24 ${modalSelectClassName}`}
            >
              {allClassesOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-white bg-gray-600 p-1">
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Pilih satu atau lebih kelas spesifik untuk soal ini. Jika tidak dipilih, soal akan dianggap umum.</p>
          </div>

          <Textarea
            label="Teks Soal"
            name="text"
            value={currentQuestion.text || ''}
            onChange={handleInputChange}
            rows={3}
            required
            className={modalTextareaClassName}
            labelClassName={modalLabelClassName}
            maxLength={MAX_QUESTION_TEXT_LENGTH}
          />

          <div className="my-4">
            <label htmlFor="imageFile" className={`block text-sm font-medium mb-1 ${modalLabelClassName}`}>
              Unggah Gambar (Opsional)
            </label>
            <input type="file" id="imageFile" name="imageFile" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} className={modalFileInputClassName} />
            {currentQuestion.imageUrl && (
              <div className="mt-2">
                <img src={currentQuestion.imageUrl} alt="Preview" className="max-w-xs max-h-32 object-contain border rounded border-gray-600" />
                <Button size="sm" variant="ghost" onClick={() => removeFile('image')} className="text-red-400 hover:text-red-300 mt-1">
                  Hapus Gambar
                </Button>
              </div>
            )}
          </div>

          <div className="my-4">
            <label htmlFor="audioFile" className={`block text-sm font-medium mb-1 ${modalLabelClassName}`}>
              Unggah Audio (Opsional)
            </label>
            <input type="file" id="audioFile" name="audioFile" accept="audio/*" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} className={modalFileInputClassName} />
            {currentQuestion.audioUrl && (
              <div className="mt-2">
                <audio controls src={currentQuestion.audioUrl} className="w-full max-w-xs" />
                <Button size="sm" variant="ghost" onClick={() => removeFile('audio')} className="text-red-400 hover:text-red-300 mt-1">
                  Hapus Audio
                </Button>
              </div>
            )}
          </div>

          <div className="mb-1">
            <div
              className="flex items-center justify-between cursor-pointer group rounded-t-md p-2 hover:bg-gray-700"
              onClick={toggleFormulaHint}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleFormulaHint();
              }}
              aria-expanded={showFormulaHint}
              aria-controls="formula-hint-content"
            >
              <label htmlFor="mathFormula" className={`block text-sm font-medium ${modalLabelClassName} group-hover:text-smkn-blue transition-colors`}>
                Formula Matematika (Opsional, gunakan LaTeX)
              </label>
              <i className={`fas ${showFormulaHint ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs ${modalLabelClassName} group-hover:text-smkn-blue transition-transform`}></i>
            </div>
            <Input id="mathFormula" name="mathFormula" value={currentQuestion.mathFormula || ''} onChange={handleInputChange} className={modalInputClassName} containerClassName="mb-0" placeholder="Misal: \\frac{a}{b} atau x^2" />
          </div>

          {showFormulaHint && (
            <div id="formula-hint-content" className="p-4 mt-0 mb-3 bg-smkn-blue-dark text-gray-200 border border-gray-600 rounded-b-md text-xs space-y-2 shadow-lg">
              <p>Gunakan sintaks LaTeX untuk menulis rumus. KaTeX akan merendernya.</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  Inline: <code>$rumus$</code>. Contoh: <KatexRenderer latex="E=mc^2" inline className="text-gray-200" />
                </li>
                <li>
                  Block/Display: <code>$$rumus$$</code>. Contoh: <KatexRenderer latex="\sum_{i=1}^n i = \frac{n(n+1)}{2}" className="text-gray-200" />
                </li>
              </ul>
              <p className="font-semibold mt-2">Contoh Umum:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  Pecahan:{' '}
                  <code>
                    \frac{'{'}a{'}'}
                    {'{'}b{'}'}
                  </code>{' '}
                  <KatexRenderer latex="\frac{a}{b}" inline className="text-gray-200" />
                </div>
                <div>
                  Pangkat: <code>x^2</code> <KatexRenderer latex="x^2" inline className="text-gray-200" />
                </div>
                <div>
                  Indeks: <code>H_2O</code> <KatexRenderer latex="H_2O" inline className="text-gray-200" />
                </div>
                <div>
                  Akar:{' '}
                  <code>
                    \sqrt{'{'}x{'}'}
                  </code>{' '}
                  <KatexRenderer latex="\sqrt{x}" inline className="text-gray-200" />
                </div>
                <div>
                  Integral: <code>\int_a^b f(x)dx</code> <KatexRenderer latex="\int_a^b f(x)dx" inline className="text-gray-200" />
                </div>
                <div>
                  Sigma:{' '}
                  <code>
                    \sum_{'{'}i=1{'}'}^{'{'}k{'}'}
                  </code>{' '}
                  <KatexRenderer latex="\sum_{i=1}^{k}" inline className="text-gray-200" />
                </div>
                <div>
                  Limit:{' '}
                  <code>
                    \lim_{'{'}x\to\infty{'}'}
                  </code>{' '}
                  <KatexRenderer latex="\lim_{x\to\infty}" inline className="text-gray-200" />
                </div>
                <div>
                  Alpha: <code>\alpha</code> <KatexRenderer latex="\alpha" inline className="text-gray-200" />, Beta: <code>\beta</code> <KatexRenderer latex="\beta" inline className="text-gray-200" />
                </div>
              </div>
              <p className="mt-2">Cari "Simbol LaTeX KaTeX" online untuk daftar lengkap. Klik label di atas untuk menutup panduan ini.</p>
            </div>
          )}

          {currentQuestion.mathFormula && currentQuestion.mathFormula.trim() !== '' && !showFormulaHint && (
            <div className="mt-2 p-2 border border-gray-600 rounded bg-gray-800 min-h-[40px]">
              <p className={`text-xs mb-1 ${modalLabelClassName}`}>
                Input Formula: <code className="text-yellow-300 bg-gray-700 px-1 rounded text-xs">{currentQuestion.mathFormula}</code>
              </p>
              <p className={`text-xs mb-1 ${modalLabelClassName}`}>Preview Formula:</p>
              <KatexRenderer latex={currentQuestion.mathFormula || ''} className="katex-renderer-preview" />
            </div>
          )}

          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
            <div className="mt-4 space-y-3">
              <h4 className={`text-sm font-medium mb-1 ${modalLabelClassName}`}>Opsi Jawaban Pilihan Ganda:</h4>
              {(currentQuestion.options || []).map((opt, index) => (
                <div key={opt.id || index} className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
                  <input type="radio" name="correctOption" checked={opt.isCorrect} onChange={() => handleOptionChange(index, 'isCorrect', true)} className="form-radio h-5 w-5 text-smkn-blue focus:ring-smkn-blue" />
                  <Input
                    value={opt.text ?? ''}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`Opsi ${index + 1}`}
                    className={`flex-grow ${modalInputClassName}`}
                    containerClassName="mb-0 flex-grow"
                    maxLength={MAX_OPTION_TEXT_LENGTH}
                  />
                  {(currentQuestion.options || []).length > 2 && <Button size="sm" variant="danger" onClick={() => removeOption(index)} leftIcon={ICONS.delete}></Button>}
                </div>
              ))}
              {(currentQuestion.options || []).length < 5 && (
                <Button size="sm" variant="ghost" onClick={addOption} leftIcon={ICONS.add} className="text-smkn-blue hover:text-smkn-blue-dark">
                  Tambah Opsi
                </Button>
              )}
            </div>
          )}

          {currentQuestion.type === QuestionType.ESSAY && (
            <Textarea
              label="Referensi Jawaban Essai (Opsional)"
              name="correctAnswer"
              value={currentQuestion.correctAnswer || ''}
              onChange={handleInputChange}
              rows={3}
              className={modalTextareaClassName}
              labelClassName={modalLabelClassName}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-3">
            <Input label="Poin Soal" name="points" type="number" value={currentQuestion.points ?? ''} onChange={handleInputChange} required className={modalInputClassName} labelClassName={modalLabelClassName} />
            <Input label="KKM Soal" name="kkm" type="number" value={currentQuestion.kkm ?? ''} onChange={handleInputChange} required className={modalInputClassName} labelClassName={modalLabelClassName} />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Simpan Soal
            </Button>
          </div>
        </Modal>
      )}

      {isAiModalOpen && (
        <Modal isOpen={isAiModalOpen} onClose={closeAiModal} title="Buat Soal dengan Bantuan AI">
          {aiError && <Alert type="error" message={aiError} onClose={() => setAiError(null)} />}
          {!API_KEY && <Alert type="warning" message="API Key untuk layanan AI belum dikonfigurasi. Fitur ini tidak dapat digunakan." />}
          {API_KEY && !ai && <Alert type="warning" message="Layanan AI gagal dimuat. Pastikan API Key valid dan koneksi internet stabil." />}

          <Select
            label="Mata Pelajaran"
            name="subjectId"
            options={teacherSubjects.map((s) => ({ value: s.id, label: s.name }))}
            value={aiPromptDetails.subjectId}
            onChange={handleAiInputChange}
            required
            className={modalSelectClassName}
            labelClassName={modalLabelClassName}
            disabled={!API_KEY || !ai}
          />
          <Select
            label="Tipe Soal"
            name="questionType"
            options={typeOptions.filter((opt) => opt.value !== '') as { value: QuestionType; label: string }[]}
            value={aiPromptDetails.questionType}
            onChange={handleAiInputChange}
            required
            className={modalSelectClassName}
            labelClassName={modalLabelClassName}
            disabled={!API_KEY || !ai}
          />
          <Textarea
            label="Topik / Kata Kunci Soal"
            name="topic"
            value={aiPromptDetails.topic}
            onChange={handleAiInputChange}
            rows={3}
            required
            placeholder="Contoh: Teorema Pythagoras, Struktur teks deskripsi, Perang Dunia II"
            className={modalTextareaClassName}
            labelClassName={modalLabelClassName}
            disabled={!API_KEY || !ai}
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={closeAiModal}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleGenerateAiQuestion} isLoading={isGeneratingAi} disabled={isGeneratingAi || !API_KEY || !ai || !aiPromptDetails.subjectId || !aiPromptDetails.topic}>
              Buat Soal
            </Button>
          </div>
        </Modal>
      )}

      {isExcelQuestionUploadModalOpen && (
        <Modal isOpen={isExcelQuestionUploadModalOpen} onClose={closeExcelQuestionUploadModal} title="Unggah Soal Massal via Excel" size="xl">
          {excelQuestionUploadError && <Alert type="error" message={excelQuestionUploadError} onClose={() => setExcelQuestionUploadError(null)} />}
          {excelQuestionUploadSuccess && <Alert type="success" message={excelQuestionUploadSuccess} onClose={() => setExcelQuestionUploadSuccess(null)} />}
          {processingExcelQuestionsErrors.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto p-2 border border-red-300 bg-red-50 rounded">
              <p className="font-semibold text-red-700">Detail Kesalahan/Peringatan:</p>
              <ul className="list-disc list-inside text-xs text-red-600">
                {processingExcelQuestionsErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="excelQuestionFile" className="block text-sm font-medium text-gray-700 mb-1">
                Pilih File Excel (.xlsx, .xls):
              </label>
              <input
                type="file"
                id="excelQuestionFile"
                accept=".xlsx, .xls"
                onChange={handleExcelQuestionFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-smkn-blue file:text-white hover:file:bg-smkn-blue-dark"
              />
            </div>

            <div className="p-3 bg-gray-100 rounded-md text-xs">
              <h4 className="font-semibold text-smkn-text mb-1">Panduan Format Excel:</h4>
              <p>Baris pertama adalah header. Kolom yang dibutuhkan (perhatikan nama kolom dan validasi):</p>
              <ul className="list-disc list-inside ml-4 space-y-0.5">
                <li>
                  <strong>NamaMapel</strong> (Teks, Wajib): Harus sesuai dengan nama mapel yang Anda ajar.
                </li>
                <li>
                  <strong>Kelas</strong> (Teks, Opsional): Nama kelas utama (e.g., X, XI, XII). Untuk validasi tambahan, sistem akan cek apakah mapel diajarkan di kelas ini.
                </li>
                <li>
                  <strong>TargetKelas</strong> (Teks, Opsional): Nama kelas target spesifik untuk soal ini, pisahkan dengan koma jika lebih dari satu (e.g., "X", atau "X, XI"). Setiap kelas target harus merupakan kelas dimana mapel ini
                  diajarkan. Jika kosong, soal dianggap umum.
                </li>
                <li>
                  <strong>TipeSoal</strong> (Teks, Wajib): "Multiple Choice" atau "Essay".
                </li>
                <li>
                  <strong>TeksSoal</strong> (Teks, Wajib, max ${MAX_QUESTION_TEXT_LENGTH} karakter).
                </li>
                <li>
                  <strong>Poin</strong> (Angka, Wajib,{'>'} 0).
                </li>
                <li>
                  <strong>KKM</strong> (Angka, Wajib, 0-100).
                </li>
                <li>
                  <strong>ImageUrl</strong>, <strong>AudioUrl</strong>, <strong>MathFormula</strong> (Teks, Opsional).
                </li>
                <li>
                  Untuk <strong>Multiple Choice</strong> (minimal 2 opsi, maksimal 5):
                  <ul className="list-circle list-inside ml-4">
                    <li>
                      <strong>OpsiX_Teks</strong> (Teks, Wajib jika baris opsi diisi, max ${MAX_OPTION_TEXT_LENGTH} karakter).
                    </li>
                    <li>
                      <strong>OpsiX_Benar</strong> (Teks, Wajib: "BENAR" atau "SALAH". Minimal 1 opsi harus "BENAR").
                    </li>
                  </ul>
                </li>
                <li>
                  Untuk <strong>Essay</strong>: <strong>JawabanEsai</strong> (Teks, Opsional, berisi referensi jawaban).
                </li>
              </ul>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleDownloadQuestionTemplate} disabled={teacherSubjects.length === 0}>
                <i className={`${ICONS.download} mr-1`}></i> Unduh Template Soal Excel
              </Button>
              {teacherSubjects.length === 0 && <p className="text-red-500 text-xs mt-1">Anda harus menjadi guru mapel untuk mengunduh template.</p>}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={closeExcelQuestionUploadModal} disabled={isProcessingExcelQuestions}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleProcessExcelQuestionsFile} isLoading={isProcessingExcelQuestions} disabled={!excelQuestionFile || isProcessingExcelQuestions}>
                Unggah dan Proses Soal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {questionToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteQuestionModalOpen}
          onClose={() => {
            setIsConfirmDeleteQuestionModalOpen(false);
            setQuestionToDelete(null);
          }}
          onConfirm={confirmDeleteQuestion}
          title="Konfirmasi Hapus Soal"
          message={
            <>
              <p>Apakah Anda yakin ingin menghapus soal ini?</p>
              <p className="font-medium mt-2">
                "{questionToDelete.text.substring(0, 100)}
                {questionToDelete.text.length > 100 ? '...' : ''}"
              </p>
              <p className="mt-2 text-sm text-red-700">Tindakan ini tidak dapat diurungkan.</p>
            </>
          }
          confirmButtonText="Ya, Hapus Soal"
          confirmButtonVariant="danger"
          confirmButtonIcon={ICONS.delete}
        />
      )}
    </div>
  );
};
export default MyQuestionsPage;
