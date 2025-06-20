
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/common/Card';
import { Exam, User, UserRole, Subject, Class, Question } from '../../types';
import { formatDate } from '../../utils/helpers';
import { Select } from '../../components/common/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ActiveView = 'ringkasan' | 'ujian' | 'statistik';

export default function SchoolOverviewPage() {
  const { users, exams, subjects, classes, questions } = useData();
  
  const [activeView, setActiveView] = useState<ActiveView>('ringkasan');
  const [filterExamStatus, setFilterExamStatus] = useState<Exam['status'] | ''>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');


  const examStatusOptions = [
    {value: '', label: 'Semua Status Ujian'},
    {value: 'draft', label: 'Draft'},
    {value: 'pending_validation', label: 'Menunggu Validasi'},
    {value: 'active', label: 'Aktif'},
    {value: 'completed', label: 'Selesai'},
    {value: 'archived', label: 'Diarsipkan'},
  ];
  const classOptions = [{value: '', label: 'Semua Kelas'}, ...classes.map(c => ({ value: c.id, label: c.name }))];
  const academicYearOptions = useMemo(() => {
    const uniqueYears = Array.from(new Set(exams.map(ex => ex.academicYear).filter(Boolean)))
                              .sort((a,b) => b!.localeCompare(a!));
    return [{ value: '', label: 'Semua Thn. Ajaran' }, ...uniqueYears.map(year => ({ value: year!, label: year! }))];
  }, [exams]);


  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const statusMatch = filterExamStatus ? exam.status === filterExamStatus : true;
      const classMatch = filterClassId ? exam.classIds.includes(filterClassId) : true;
      const academicYearMatch = filterAcademicYear ? exam.academicYear === filterAcademicYear : true;
      return statusMatch && classMatch && academicYearMatch;
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [exams, filterExamStatus, filterClassId, filterAcademicYear]);

  const getTeacherName = (teacherId?: string) => users.find(u => u.id === teacherId)?.name || 'N/A';
  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || 'N/A';
  const getClassNames = (classIds: string[]) => classIds.map(cid => classes.find(c => c.id === cid)?.name).join(', ') || 'N/A';

  const recentUserActivity = users.slice(0,5).map(u => ({
      name: u.name,
      role: u.role,
      lastActivity: formatDate(new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24)) 
  }));

  const examsPerSubjectData = useMemo(() => {
    return subjects.map(subject => ({
      name: subject.name,
      jumlahUjian: exams.filter(ex => ex.subjectId === subject.id).length,
    })).filter(s => s.jumlahUjian > 0).sort((a,b) => b.jumlahUjian - a.jumlahUjian);
  }, [subjects, exams]);

  const questionValidationStatusData = useMemo(() => {
    const validated = questions.filter(q => q.isValidated).length;
    const notValidated = questions.length - validated;
    return [
      { name: 'Soal Tervalidasi', value: validated },
      { name: 'Soal Belum Divalidasi', value: notValidated },
    ].filter(item => item.value > 0);
  }, [questions]);

  const CHART_COLORS = ['#0088FE', '#FF8042', '#00C49F', '#FFBB28', '#8884D8'];

  const renderRingkasanTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Statistik Umum" className="lg:col-span-1">
        <div className="space-y-2 text-sm">
          <p><strong>Total Pengguna:</strong> {users.length}</p>
          <p><strong>Total Guru:</strong> {users.filter(u=>u.role === UserRole.GURU_MAPEL || u.role === UserRole.WALI_KELAS).length}</p>
          <p><strong>Total Siswa:</strong> {users.filter(u=>u.role === UserRole.SISWA).length}</p>
          <p><strong>Total Mata Pelajaran:</strong> {subjects.length}</p>
          <p><strong>Total Kelas Utama:</strong> {classes.length}</p>
          <p><strong>Total Soal di Bank:</strong> {questions.length}</p>
          <p><strong>Total Ujian Dibuat:</strong> {exams.length}</p>
        </div>
      </Card>
      
      <Card title="Aktivitas Pengguna Terbaru" className="lg:col-span-2">
        <ul className="space-y-2 text-sm">
          {recentUserActivity.map((activity, index) => (
            <li key={index} className="p-2 bg-gray-50 rounded-md">
              <span className="font-semibold">{activity.name}</span> ({activity.role}) - Aktivitas terakhir: {activity.lastActivity}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-2">Ini adalah data contoh. Integrasi log aktivitas nyata diperlukan.</p>
      </Card>
    </div>
  );

  const renderPantauanUjianTab = () => (
    <Card title="Daftar Ujian Keseluruhan">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Select options={examStatusOptions} value={filterExamStatus} onChange={e => setFilterExamStatus(e.target.value as Exam['status'] | '')} containerClassName="mb-0"/>
          <Select options={classOptions} value={filterClassId} onChange={e => setFilterClassId(e.target.value)} containerClassName="mb-0"/>
          <Select options={academicYearOptions} value={filterAcademicYear} onChange={e => setFilterAcademicYear(e.target.value)} containerClassName="mb-0"/>
      </div>
      {filteredExams.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Tidak ada ujian yang cocok dengan filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-smkn-blue text-white text-sm">
              <tr>
                <th className="py-2 px-3 text-left">Judul Ujian</th>
                <th className="py-2 px-3 text-left">Mapel</th>
                <th className="py-2 px-3 text-left">Thn. Ajaran</th>
                <th className="py-2 px-3 text-left">Pembuat</th>
                <th className="py-2 px-3 text-left">Kelas Target</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Tgl Dibuat</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {filteredExams.map(exam => (
                <tr key={exam.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                  <td className="py-2 px-3">{exam.title}</td>
                  <td className="py-2 px-3">{getSubjectName(exam.subjectId)}</td>
                  <td className="py-2 px-3">{exam.academicYear || '-'}</td>
                  <td className="py-2 px-3">{getTeacherName(exam.creatorId)}</td>
                  <td className="py-2 px-3">{getClassNames(exam.classIds)}</td>
                  <td className="py-2 px-3">
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
                  <td className="py-2 px-3">{formatDate(exam.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderStatistikTambahanTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Jumlah Ujian per Mata Pelajaran">
        {examsPerSubjectData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={examsPerSubjectData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="jumlahUjian" fill="#8884d8" name="Jumlah Ujian" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">Data jumlah ujian per mata pelajaran tidak tersedia.</p>
        )}
      </Card>
      <Card title="Status Validasi Bank Soal">
        {questionValidationStatusData.length > 0 && questions.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={questionValidationStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {questionValidationStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} soal`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">Data status validasi soal tidak tersedia atau belum ada soal di bank.</p>
        )}
      </Card>
    </div>
  );


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Pantauan Aktivitas Sekolah</h1>

      <div className="mb-6 border-b border-gray-300">
        <nav className="flex space-x-1 -mb-px" aria-label="Tabs">
          {(['ringkasan', 'ujian', 'statistik'] as ActiveView[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveView(tab)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none
                ${activeView === tab 
                  ? 'border-smkn-blue text-smkn-blue' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab === 'ringkasan' && 'Ringkasan Aktivitas'}
              {tab === 'ujian' && 'Pantauan Ujian'}
              {tab === 'statistik' && 'Statistik Tambahan'}
            </button>
          ))}
        </nav>
      </div>

      {activeView === 'ringkasan' && renderRingkasanTab()}
      {activeView === 'ujian' && renderPantauanUjianTab()}
      {activeView === 'statistik' && renderStatistikTambahanTab()}
      
    </div>
  );
}
