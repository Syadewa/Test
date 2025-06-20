
import React, { useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { ICONS } from '../../constants';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button'; 
import { ActivityAction } from '../../types'; // Added ActivityAction

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getExamsForStudent, submissions, exams, subjects, gradesReleasedGlobally, addActivityLog } = useData(); // Added addActivityLog

  useEffect(() => {
    if (user) {
      addActivityLog({ action: ActivityAction.VIEW_STUDENT_DASHBOARD, targetType: "Halaman" }, user);
    }
  }, [user, addActivityLog]);

  if (!user) return null;

  const availableExams = getExamsForStudent(user.id);
  const mySubmissions = submissions.filter(sub => sub.studentId === user.id);
  const completedExamsCount = mySubmissions.length;

  const upcomingExams = availableExams
    .filter(exam => !mySubmissions.find(sub => sub.examId === exam.id))
    .sort((a,b) => (a.startTime ? new Date(a.startTime).getTime() : 0) - (b.startTime ? new Date(b.startTime).getTime() : 0)); 


  const stats = [
    { title: 'Ujian Tersedia', value: upcomingExams.length, icon: ICONS.exams, color: 'bg-blue-500', link: '/student/exams' },
    { title: 'Ujian Selesai Dikerjakan', value: completedExamsCount, icon: ICONS.success, color: 'bg-green-500', link: '/student/results' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-2 text-center md:text-left">Dashboard Siswa</h1>
      <p className="text-lg text-gray-700 mb-6 text-center md:text-left">Selamat datang, {user.name}! Berikut adalah informasi ujian Anda.</p>

      {gradesReleasedGlobally && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow" role="alert">
            <div className="flex">
                <div className="py-1"><i className={`${ICONS.info} text-xl mr-3`}></i></div>
                <div>
                    <p className="font-bold">Informasi Nilai!</p>
                    <p className="text-sm">Nilai ujian sudah dapat dilihat. Silakan cek halaman "Hasil Ujian Saya".</p>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map(stat => (
          <Link to={stat.link} key={stat.title}>
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className={`p-3 rounded-full text-white mr-4 ${stat.color}`}>
                  <i className={`${stat.icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-smkn-text">{stat.value}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card title="Ujian Akan Datang / Aktif">
        {upcomingExams.length > 0 ? (
          <div className="space-y-3">
            {upcomingExams.slice(0,3).map(exam => ( 
              <div key={exam.id} className="p-4 bg-white shadow rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="font-semibold text-smkn-text text-lg">{exam.title}</h3>
                  <p className="text-sm text-gray-600">Mapel: {subjects.find(s => s.id === exam.subjectId)?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Tahun Ajaran: {exam.academicYear || '-'}</p>
                  <p className="text-sm text-gray-600">Durasi: {exam.durationMinutes} menit</p>
                  {exam.startTime && <p className="text-xs text-gray-500">Mulai: {formatDate(exam.startTime)}</p>}
                </div>
                <Link to={`/student/exam/${exam.id}`}>
                  <Button variant="primary" leftIcon={ICONS.start_exam}>Mulai Ujian</Button>
                </Link>
              </div>
            ))}
            {upcomingExams.length > 3 && <p className="text-sm text-center mt-2"><Link to="/student/exams" className="text-smkn-blue hover:underline">Lihat semua ujian &rarr;</Link></p>}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">Tidak ada ujian yang tersedia untuk Anda saat ini.</p>
        )}
      </Card>

       <Card title="Tips Ujian">
        <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            <li>Pastikan koneksi internet Anda stabil sebelum memulai ujian.</li>
            <li>Baca instruksi dan prasyarat ujian dengan seksama.</li>
            <li>Perhatikan waktu yang tersisa selama mengerjakan ujian.</li>
            <li>Jika waktu habis, jawaban Anda akan tersimpan otomatis.</li>
            <li>Kerjakan dengan tenang dan jujur!</li>
        </ul>
      </Card>
    </div>
  );
};

export default StudentDashboard;
