import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Exam, Subject, ExamStatus } from '../../types'; // Added ExamStatus
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ICONS } from '../../constants';
import Alert from '../../components/common/Alert';
import { formatDate } from '../../utils/helpers';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Select } from '../../components/common/Input'; // Import custom Select

const MyExamsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getExamsByCreator, deleteExam: dataContextDeleteExam, subjects } = useData();

  const [teacherExams, setTeacherExams] = useState<Exam[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ExamStatus | ''>('');
  const [filterExamType, setFilterExamType] = useState<'uts' | 'uas' | ''>('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');


  const [isConfirmDeleteExamModalOpen, setIsConfirmDeleteExamModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const academicYearOptions = useMemo(() => {
    if (!user) return [{ value: '', label: 'Semua Tahun Ajaran' }];
    const examsForUser = getExamsByCreator(user.id);
    const uniqueYears = Array.from(new Set(examsForUser.map(ex => ex.academicYear).filter(Boolean)))
                              .sort((a,b) => b!.localeCompare(a!)); // Sort descending
    return [{ value: '', label: 'Semua Tahun Ajaran' }, ...uniqueYears.map(year => ({ value: year!, label: year! }))];
  }, [user, getExamsByCreator]);

  useEffect(() => {
    if (user) {
      const examsData = getExamsByCreator(user.id);
      let filtered = examsData;
      if (filterStatus) {
        filtered = filtered.filter(exam => exam.status === filterStatus);
      }
      if (filterExamType) {
        const typeLower = filterExamType.toLowerCase();
        if (typeLower === 'uts') {
            filtered = filtered.filter(exam => exam.title.toLowerCase().includes('uts') || exam.title.toLowerCase().includes('ujian tengah semester'));
        } else if (typeLower === 'uas') {
            filtered = filtered.filter(exam => exam.title.toLowerCase().includes('uas') || exam.title.toLowerCase().includes('ujian akhir semester'));
        }
      }
      if (filterAcademicYear) {
        filtered = filtered.filter(exam => exam.academicYear === filterAcademicYear);
      }
      setTeacherExams(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  }, [user, getExamsByCreator, filterStatus, filterExamType, filterAcademicYear]);

  const handleDeleteExamRequest = (exam: Exam) => {
    setExamToDelete(exam);
    setIsConfirmDeleteExamModalOpen(true);
  };

  const confirmDeleteExam = () => {
    if (!examToDelete || !user) return;
    try {
      dataContextDeleteExam(examToDelete.id);
      setSuccessMessage(`Ujian "${examToDelete.title}" berhasil dihapus.`);
      setTeacherExams(prevExams => prevExams.filter(ex => ex.id !== examToDelete.id));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setFormError(e.message || `Gagal menghapus ujian "${examToDelete.title}".`);
      setTimeout(() => setFormError(null), 3000);
    }
    setIsConfirmDeleteExamModalOpen(false);
    setExamToDelete(null);
  };


  const getSubjectName = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'N/A';
  };

  const examStatusSelectOptions: { value: ExamStatus | ''; label: string }[] = [
    { value: '', label: 'Semua Status' },
    { value: ExamStatus.DRAFT, label: 'Draft' },
    { value: ExamStatus.PENDING_VALIDATION, label: 'Menunggu Validasi' },
    { value: ExamStatus.ACTIVE, label: 'Aktif'},
    { value: ExamStatus.COMPLETED, label: 'Selesai' },
    { value: ExamStatus.ARCHIVED, label: 'Diarsipkan'}
  ];

  const examTypeSelectOptions: { value: 'uts' | 'uas' | ''; label: string }[] = [
    { value: '', label: 'Semua Jenis Ujian' },
    { value: 'uts', label: 'UTS (Ujian Tengah Semester)' },
    { value: 'uas', label: 'UAS (Ujian Akhir Semester)' },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-smkn-blue mb-4 sm:mb-0 text-center sm:text-left">Daftar Ujian Saya</h1>
        <Button onClick={() => navigate('/teacher/exams/create')} leftIcon={ICONS.add} variant="primary">
          Buat Ujian Baru
        </Button>
      </div>

      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}


      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Select
                label="Filter Status Ujian"
                options={examStatusSelectOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ExamStatus | '')}
                containerClassName="mb-0"
            />
            <Select
                label="Filter Jenis Ujian"
                options={examTypeSelectOptions}
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value as 'uts' | 'uas' | '')}
                containerClassName="mb-0"
            />
            <Select
                label="Filter Tahun Ajaran"
                options={academicYearOptions}
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                containerClassName="mb-0"
                disabled={academicYearOptions.length <= 1} // Disable if only "Semua Tahun Ajaran" is there
            />
        </div>

        {teacherExams.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {filterStatus || filterExamType || filterAcademicYear ? `Tidak ada ujian yang cocok dengan filter.` : "Anda belum membuat ujian."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-smkn-blue text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Judul Ujian</th>
                  <th className="py-3 px-4 text-left">Mata Pelajaran</th>
                  <th className="py-3 px-4 text-left">Tahun Ajaran</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Tgl Dibuat</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {teacherExams.map(exam => (
                  <tr key={exam.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                    <td className="py-3 px-4">{exam.title}</td>
                    <td className="py-3 px-4">{getSubjectName(exam.subjectId)}</td>
                    <td className="py-3 px-4">{exam.academicYear || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        exam.status === 'active' ? 'bg-green-200 text-green-800' : 
                        exam.status === 'pending_validation' ? 'bg-yellow-200 text-yellow-800' :
                        exam.status === 'draft' ? 'bg-gray-200 text-gray-800' :
                        exam.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                        'bg-red-200 text-red-800' // archived
                      }`}>
                        {exam.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatDate(exam.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => navigate(`/teacher/exams/edit/${exam.id}`)} 
                        leftIcon={ICONS.edit} 
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteExamRequest(exam)} 
                        leftIcon={ICONS.delete} 
                        className="text-red-600 hover:text-red-800"
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {examToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteExamModalOpen}
          onClose={() => { setIsConfirmDeleteExamModalOpen(false); setExamToDelete(null); }}
          onConfirm={confirmDeleteExam}
          title="Konfirmasi Hapus Ujian"
          message={
            <>
              <p>Apakah Anda yakin ingin menghapus ujian <strong>{examToDelete.title}</strong>?</p>
              <p className="mt-2 text-sm text-red-700">Semua data terkait ujian ini (termasuk submisi siswa) juga akan terhapus. Tindakan ini tidak dapat diurungkan.</p>
            </>
          }
          confirmButtonText="Ya, Hapus Ujian"
          confirmButtonVariant="danger"
          confirmButtonIcon={ICONS.delete}
        />
      )}
    </div>
  );
};

export default MyExamsListPage;