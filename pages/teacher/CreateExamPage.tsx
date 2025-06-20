
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom'; 
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Exam, Question, Subject, Class, SubClass, ExamQuestion, QuestionType, ExamStatus, ActivityAction } from '../../types'; // Added ActivityAction
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input, { Select, Textarea } from '../../components/common/Input';
import { ICONS, DEFAULT_EXAM_DURATION, DEFAULT_KKM } from '../../constants';
import Alert from '../../components/common/Alert';
import { shuffleArray, generateId } from '../../utils/helpers';

const CreateExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    addExam, updateExam, getExamById, questions: allQuestions, 
    subjects, classes, subClasses, addActivityLog // Added addActivityLog
  } = useData();

  const [examDetails, setExamDetails] = useState<Partial<Exam>>({
    title: '',
    subjectId: '',
    classIds: [], 
    subClassIds: [],
    questions: [],
    durationMinutes: DEFAULT_EXAM_DURATION,
    kkm: DEFAULT_KKM,
    randomizeQuestions: true,
    randomizeAnswers: true,
    status: ExamStatus.DRAFT,
    gradesReleased: false,
    showPrerequisites: false,
    prerequisitesText: 'Pastikan koneksi internet stabil dan Anda sudah siap sebelum memulai ujian.',
    mcqCount: 0,
    essayCount: 0,
    startTime: undefined,
    endTime: undefined,
    academicYear: '',
    accessType: 'open', 
    examToken: '', 
  });
  
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<ExamQuestion[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [showToken, setShowToken] = useState(false); 

  const teacherSubjects = user ? subjects.filter(s => (user.subjectIds && user.subjectIds.includes(s.id)) || s.guruMapelId === user.id) : [];
  const subjectOptions = teacherSubjects.map(s => ({ value: s.id, label: s.name }));
  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));
  const subClassOptionsForSelectedClasses = subClasses.filter(sc => examDetails.classIds?.includes(sc.classId))
                                              .map(sc => ({ value: sc.id, label: `${sc.name} (Kelas ${classes.find(c=>c.id === sc.classId)?.name})` }));
  
  const accessTypeOptions = [
    { value: 'open', label: 'Akses Terbuka' },
    { value: 'token_required', label: 'Perlu Token' }
  ];
                                              
  useEffect(() => {
    if (examId) {
      const existingExam = getExamById(examId);
      if (existingExam && existingExam.creatorId === user?.id) {
        const examDataToSet = {
            ...existingExam,
            startTime: existingExam.startTime ? new Date(existingExam.startTime) : undefined,
            endTime: existingExam.endTime ? new Date(existingExam.endTime) : undefined,
            academicYear: existingExam.academicYear || '',
            accessType: existingExam.accessType || 'open',
            examToken: existingExam.examToken || '',
        };
        setExamDetails(examDataToSet);
        setSelectedQuestions(existingExam.questions);
        if (existingExam.startTime) {
          const start = new Date(existingExam.startTime);
          setStartDate(start.toISOString().split('T')[0]);
          setStartTimeStr(start.toTimeString().split(' ')[0].substring(0,5));
        } else { setStartDate(''); setStartTimeStr(''); }
        if (existingExam.endTime) {
          const end = new Date(existingExam.endTime);
          setEndDate(end.toISOString().split('T')[0]);
          setEndTimeStr(end.toTimeString().split(' ')[0].substring(0,5));
        } else { setEndDate(''); setEndTimeStr('');}
      } else { navigate('/teacher/dashboard', { replace: true }); }
    } else {
      if (teacherSubjects.length > 0 && teacherSubjects[0]) { 
        setExamDetails(prev => ({ ...prev, subjectId: teacherSubjects[0]!.id }));
      }
      const currentYear = new Date().getFullYear();
      setExamDetails(prev => ({ ...prev, academicYear: `${currentYear}/${currentYear + 1}` }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, user, getExamById, navigate]); 

  useEffect(() => {
    if (!examId && teacherSubjects.length > 0 && !examDetails.subjectId && teacherSubjects[0]) {
      setExamDetails(prev => ({ ...prev, subjectId: teacherSubjects[0]!.id }));
    }
  }, [teacherSubjects, examId, examDetails.subjectId]);


  useEffect(() => {
    if (examDetails.subjectId && user && (examDetails.classIds || []).length > 0) {
      const examTargetClassIds = examDetails.classIds!; 
      const filtered = allQuestions.filter(q => 
        q.subjectId === examDetails.subjectId && 
        q.isValidated &&
        q.createdBy === user.id &&
        q.targetClassIds && q.targetClassIds.length > 0 && 
        q.targetClassIds.some(qtcId => examTargetClassIds.includes(qtcId))
      );
      setAvailableQuestions(filtered);
    } else {
      setAvailableQuestions([]);
    }
  }, [examDetails.subjectId, examDetails.classIds, allQuestions, user]);

  const handleDateTimeChange = (field: 'startDate' | 'startTimeStr' | 'endDate' | 'endTimeStr', value: string) => {
    if (field === 'startDate') setStartDate(value);
    else if (field === 'startTimeStr') setStartTimeStr(value);
    else if (field === 'endDate') setEndDate(value);
    else if (field === 'endTimeStr') setEndTimeStr(value);
  };

  useEffect(() => {
    let newStartTime: Date | undefined = undefined;
    if (startDate) { newStartTime = new Date(`${startDate}T${startTimeStr || "00:00:00"}`); }
    setExamDetails(prev => ({ ...prev, startTime: newStartTime }));
  }, [startDate, startTimeStr]);

  useEffect(() => {
    let newEndTime: Date | undefined = undefined;
    if (endDate) { newEndTime = new Date(`${endDate}T${endTimeStr || "23:59:59"}`); }
    setExamDetails(prev => ({ ...prev, endTime: newEndTime }));
  }, [endDate, endTimeStr]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target; let val: string | number | boolean | string[] | ExamStatus = value;
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;
    else if (type === 'number') { const p = parseInt(value, 10); val = isNaN(p) ? (name === 'mcqCount' || name === 'essayCount' ? 0 : '') : p; }
    else if (e.target instanceof HTMLSelectElement && e.target.multiple) val = Array.from(e.target.selectedOptions, option => option.value);
    else if (name === 'status') val = value as ExamStatus; 
    setExamDetails(prev => ({ ...prev, [name]: val }));
    if (name === 'subjectId' || name === 'classIds') { setSelectedQuestions([]); setExamDetails(prev => ({...prev, mcqCount:0, essayCount: 0}));}
  };

  const addQuestionToExam = (questionId: string) => { const q = availableQuestions.find(q => q.id === questionId); if (q && !selectedQuestions.find(sq => sq.questionId === q.id)) setSelectedQuestions(prev => [...prev, { questionId, points: q.points }]); };
  const removeQuestionFromExam = (questionId: string) => setSelectedQuestions(prev => prev.filter(q => q.questionId !== questionId));
  const handleQuestionPointsChange = (questionId: string, pointsStr: string) => { const p = parseInt(pointsStr, 10); setSelectedQuestions(prev => prev.map(q => q.questionId === questionId ? { ...q, points: isNaN(p) ? 0 : Math.max(0, p) } : q)); };

  const autoSelectQuestions = useCallback(() => {
    if (!examDetails.subjectId || (examDetails.classIds || []).length === 0 || ((examDetails.mcqCount ?? 0) === 0 && (examDetails.essayCount ?? 0) === 0)) { 
        setFormError("Pilih mata pelajaran, kelas target, dan tentukan jumlah soal PG/Essai yang diinginkan."); 
        return; 
    }
    setFormError(null);
    const mcqs = availableQuestions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
    const essays = availableQuestions.filter(q => q.type === QuestionType.ESSAY);
    
    let autoSelected: ExamQuestion[] = []; 
    const mcqCount = examDetails.mcqCount || 0; 
    const essayCount = examDetails.essayCount || 0;

    if (mcqCount > 0) { 
        if(mcqs.length < mcqCount) { 
            setFormError(`Hanya tersedia ${mcqs.length} soal Pilihan Ganda yang cocok untuk mapel dan kelas target ini. Anda meminta ${mcqCount}.`); 
            autoSelected = [...autoSelected, ...shuffleArray(mcqs).slice(0, mcqs.length).map(q => ({ questionId: q.id, points: q.points }))]; 
        } else {
            autoSelected = [...autoSelected, ...shuffleArray(mcqs).slice(0, mcqCount).map(q => ({ questionId: q.id, points: q.points }))]; 
        }
    }
    if (essayCount > 0) { 
        if(essays.length < essayCount) { 
            setFormError(prevError => (prevError ? prevError + "\n" : "") + `Hanya tersedia ${essays.length} soal Essai yang cocok untuk mapel dan kelas target ini. Anda meminta ${essayCount}.`);
            autoSelected = [...autoSelected, ...shuffleArray(essays).slice(0, essays.length).map(q => ({ questionId: q.id, points: q.points }))]; 
        } else {
             autoSelected = [...autoSelected, ...shuffleArray(essays).slice(0, essayCount).map(q => ({ questionId: q.id, points: q.points }))]; 
        }
    }
    setSelectedQuestions(autoSelected);
  }, [availableQuestions, examDetails.subjectId, examDetails.classIds, examDetails.mcqCount, examDetails.essayCount]);

  const handleSubmit = () => { 
    setFormError(null); if (!user) { setFormError("User tidak ditemukan."); return; }
    if (!examDetails.title || !examDetails.subjectId || (examDetails.classIds || []).length === 0 || selectedQuestions.length === 0 || !examDetails.academicYear) { 
        setFormError("Judul ujian, mata pelajaran, tahun ajaran, minimal satu kelas target, dan minimal satu soal harus diisi."); 
        return; 
    }
    if (examDetails.accessType === 'token_required' && (!examDetails.examToken || examDetails.examToken.trim() === '')) {
        setFormError("Token ujian harus diisi jika jenis akses memerlukan token.");
        return;
    }

    const examData: Exam = {
      ...examDetails,
      id: examId || generateId('exam'),
      creatorId: user.id,
      questions: selectedQuestions,
      createdAt: examDetails.createdAt || new Date(),
      mcqCount: selectedQuestions.filter(sq => allQuestions.find(q => q.id === sq.questionId)?.type === QuestionType.MULTIPLE_CHOICE).length,
      essayCount: selectedQuestions.filter(sq => allQuestions.find(q => q.id === sq.questionId)?.type === QuestionType.ESSAY).length,
      title: examDetails.title!,
      subjectId: examDetails.subjectId!,
      classIds: examDetails.classIds!,
      subClassIds: examDetails.subClassIds || [],
      durationMinutes: examDetails.durationMinutes!,
      kkm: examDetails.kkm!,
      randomizeQuestions: examDetails.randomizeQuestions!,
      randomizeAnswers: examDetails.randomizeAnswers!,
      status: examDetails.status!,
      gradesReleased: examDetails.gradesReleased!,
      academicYear: examDetails.academicYear!,
      accessType: examDetails.accessType!,
      examToken: examDetails.accessType === 'token_required' ? examDetails.examToken : undefined,
    };

    try {
      if (examId) {
        updateExam(examData, user); // Pass user as actor
        setSuccessMessage("Ujian berhasil diperbarui.");
      } else {
        addExam(examData, user); // Pass user as actor
        setSuccessMessage("Ujian baru berhasil dibuat.");
      }
      setTimeout(() => {
        setSuccessMessage(null);
        navigate('/teacher/exams');
      }, 2000);
    } catch (error: any) {
      setFormError(error.message || "Gagal menyimpan ujian.");
    }
  };
  
  const generateToken = () => {
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    setExamDetails(prev => ({ ...prev, examToken: newToken }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">{examId ? 'Edit Ujian' : 'Buat Ujian Baru'}</h1>
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Detail Ujian & Pengaturan */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Informasi Dasar Ujian">
            <Input label="Judul Ujian" name="title" value={examDetails.title || ''} onChange={handleInputChange} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Mata Pelajaran" name="subjectId" options={subjectOptions} value={examDetails.subjectId || ''} onChange={handleInputChange} required disabled={teacherSubjects.length === 0}/>
              <Input label="Tahun Ajaran (Contoh: 2023/2024)" name="academicYear" value={examDetails.academicYear || ''} onChange={handleInputChange} placeholder="YYYY/YYYY" required/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Select label="Status Ujian" name="status" options={Object.values(ExamStatus).map(s => ({value: s, label: s.replace('_', ' ')}))} value={examDetails.status} onChange={handleInputChange} />
                <Select label="Jenis Akses" name="accessType" options={accessTypeOptions} value={examDetails.accessType} onChange={handleInputChange} />
            </div>
            {examDetails.accessType === 'token_required' && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <Input label="Token Ujian" name="examToken" value={examDetails.examToken || ''} onChange={handleInputChange} placeholder="Min. 4 karakter" 
                        rightAddon={
                            <Button type="button" variant="ghost" onClick={generateToken} size="sm" className="text-xs">
                                <i className={`${ICONS.key} mr-1`}></i> Buat Token
                            </Button>
                        }
                        rightAddonSameLine={true}
                    />
                     <div className="flex items-center mt-1">
                        <input type="checkbox" id="showTokenCheckbox" checked={showToken} onChange={() => setShowToken(!showToken)} className="mr-2 h-4 w-4 text-smkn-blue focus:ring-smkn-blue border-gray-300 rounded"/>
                        <label htmlFor="showTokenCheckbox" className="text-xs text-gray-600">Tampilkan Token (untuk guru)</label>
                    </div>
                    {showToken && examDetails.examToken && <p className="text-sm font-mono bg-yellow-100 text-yellow-800 p-2 rounded mt-2">Token: {examDetails.examToken}</p>}
                </div>
            )}
          </Card>

          <Card title="Pengaturan Target & Waktu">
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Kelas Utama (Pilih satu atau lebih)</label>
                <select name="classIds" multiple value={examDetails.classIds || []} onChange={handleInputChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue focus:border-smkn-blue sm:text-sm h-24 bg-white text-smkn-text">
                    {classOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
             { (examDetails.classIds?.length || 0) > 0 && subClassOptionsForSelectedClasses.length > 0 && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Sub Kelas (Opsional, jika kosong berlaku untuk semua Sub Kelas dari Kelas Utama terpilih)</label>
                    <select name="subClassIds" multiple value={examDetails.subClassIds || []} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue focus:border-smkn-blue sm:text-sm h-24 bg-white text-smkn-text">
                        {subClassOptionsForSelectedClasses.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Durasi Ujian (Menit)" name="durationMinutes" type="number" value={examDetails.durationMinutes || ''} onChange={handleInputChange} required />
              <Input label="KKM Ujian (%)" name="kkm" type="number" value={examDetails.kkm || ''} onChange={handleInputChange} required min="0" max="100" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai (Opsional)</label>
                    <input type="date" id="startDate" name="startDate" value={startDate} onChange={e => handleDateTimeChange('startDate', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue focus:border-smkn-blue sm:text-sm bg-white text-smkn-text placeholder-gray-400"/>
                </div>
                <div>
                    <label htmlFor="startTimeStr" className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai (Opsional)</label>
                    <input type="time" id="startTimeStr" name="startTimeStr" value={startTimeStr} onChange={e => handleDateTimeChange('startTimeStr', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue focus:border-smkn-blue sm:text-sm bg-white text-smkn-text placeholder-gray-400"/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai (Opsional)</label>
                    <input type="date" id="endDate" name="endDate" value={endDate} onChange={e => handleDateTimeChange('endDate', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue focus:border-smkn-blue sm:text-sm bg-white text-smkn-text placeholder-gray-400"/>
                </div>
                <div>
                    <label htmlFor="endTimeStr" className="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai (Opsional)</label>
                    <input type="time" id="endTimeStr" name="endTimeStr" value={endTimeStr} onChange={e => handleDateTimeChange('endTimeStr', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue focus:border-smkn-blue sm:text-sm bg-white text-smkn-text placeholder-gray-400"/>
                </div>
            </div>
          </Card>

          <Card title="Pengaturan Tambahan">
            <div className="space-y-3">
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="randomizeQuestions" checked={examDetails.randomizeQuestions || false} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-smkn-blue focus:ring-smkn-blue"/>
                    <span>Acak Urutan Soal</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="randomizeAnswers" checked={examDetails.randomizeAnswers || false} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-smkn-blue focus:ring-smkn-blue"/>
                    <span>Acak Urutan Opsi Jawaban (untuk Pilihan Ganda)</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="showPrerequisites" checked={examDetails.showPrerequisites || false} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-smkn-blue focus:ring-smkn-blue"/>
                    <span>Tampilkan Teks Prasyarat Sebelum Ujian</span>
                </label>
                {examDetails.showPrerequisites && (
                    <Textarea label="Teks Prasyarat Ujian" name="prerequisitesText" value={examDetails.prerequisitesText || ''} onChange={handleInputChange} rows={3} />
                )}
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Pemilihan Soal */}
        <div className="lg:col-span-1 space-y-6">
            <Card title="Pilih Soal untuk Ujian">
                <div className="space-y-2 mb-4">
                    <Input label="Jumlah Soal Pilihan Ganda" name="mcqCount" type="number" value={examDetails.mcqCount ?? ''} onChange={handleInputChange} min="0" placeholder="0"/>
                    <Input label="Jumlah Soal Essai" name="essayCount" type="number" value={examDetails.essayCount ?? ''} onChange={handleInputChange} min="0" placeholder="0"/>
                    <Button onClick={autoSelectQuestions} variant="secondary" size="sm" leftIcon={ICONS.ai_generate} disabled={availableQuestions.length === 0 || (!examDetails.mcqCount && !examDetails.essayCount)}>Pilih Soal Otomatis</Button>
                </div>

                <h4 className="text-md font-semibold mb-2 text-smkn-text">Soal Terpilih ({selectedQuestions.length})</h4>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50 mb-4">
                    {selectedQuestions.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Belum ada soal dipilih.</p>}
                    {selectedQuestions.map(sq => {
                        const qDetail = allQuestions.find(q => q.id === sq.questionId);
                        return (
                        <div key={sq.questionId} className="text-xs p-2 bg-white border rounded-md shadow-sm">
                            <p className="truncate font-medium text-gray-700">{qDetail?.text}</p>
                            <div className="flex items-center justify-between mt-1">
                                <input type="number" value={sq.points} onChange={e => handleQuestionPointsChange(sq.questionId, e.target.value)} className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs" placeholder="Poin"/>
                                <Button size="sm" variant="ghost" onClick={() => removeQuestionFromExam(sq.questionId)} className="!p-1 text-red-500 hover:bg-red-100"><i className="fas fa-times"></i></Button>
                            </div>
                        </div>
                        );
                    })}
                </div>
                <p className="text-sm font-semibold text-gray-700">Total Poin: {selectedQuestions.reduce((sum, q) => sum + (q.points || 0), 0)}</p>

                <hr className="my-4"/>
                
                <h4 className="text-md font-semibold mb-2 text-smkn-text">Bank Soal Tersedia ({availableQuestions.length})</h4>
                <p className="text-xs text-gray-500 mb-2">Soal yang ditampilkan adalah yang telah divalidasi, dibuat oleh Anda, dan sesuai dengan Mata Pelajaran serta minimal satu Kelas Target yang dipilih untuk ujian ini.</p>
                <div className="max-h-96 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50">
                    {availableQuestions.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Tidak ada soal tersedia. Pastikan Anda telah memilih Mata Pelajaran & Kelas Target, dan soal yang relevan sudah divalidasi.</p>}
                    {availableQuestions.filter(q => !selectedQuestions.find(sq => sq.questionId === q.id)).map(q => (
                        <div key={q.id} className="text-xs p-2 bg-white border rounded-md shadow-sm flex justify-between items-start">
                            <div className="flex-1 mr-2">
                                <p className="font-medium text-gray-700">{q.text.substring(0,100)}{q.text.length > 100 ? '...' : ''}</p>
                                <p className="text-gray-500">Tipe: {q.type}, Poin Asli: {q.points}</p>
                                <p className="text-gray-500">Target: {q.targetClassIds?.map(cid => classes.find(c => c.id ===cid)?.name).join(', ') || 'Umum'}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => addQuestionToExam(q.id)} className="!p-1 text-green-500 hover:bg-green-100 flex-shrink-0"><i className="fas fa-plus"></i></Button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => navigate('/teacher/exams')} leftIcon={ICONS.back}>Batal</Button>
        <Button variant="primary" onClick={handleSubmit} leftIcon={ICONS.save}>
            {examId ? 'Simpan Perubahan Ujian' : 'Simpan dan Buat Ujian'}
        </Button>
      </div>
    </div>
  );
};

export default CreateExamPage;
