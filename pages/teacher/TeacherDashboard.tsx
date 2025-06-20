
import React, { useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { ICONS } from '../../constants';
import { Exam, ActivityAction } from '../../types'; // Added ActivityAction

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { exams, questions, getSubmissionsForExam, subjects, addActivityLog } = useData(); // Added addActivityLog

  useEffect(() => {
    if (user) {
      addActivityLog({ action: ActivityAction.VIEW_TEACHER_DASHBOARD, targetType: "Halaman" }, user);
    }
  }, [user, addActivityLog]);


  if (!user) return null;

  const teacherExams = exams.filter(exam => exam.creatorId === user.id);
  const teacherQuestions = questions.filter(q => q.createdBy === user.id);
  const teacherSubjects = subjects.filter(s => s.guruMapelId === user.id);

  const examsNeedingGrading = teacherExams.filter(exam => {
    const submissions = getSubmissionsForExam(exam.id);
    return exam.status === 'completed' && submissions.some(sub => !sub.isGraded);
  });

  const pendingValidationQuestions = teacherQuestions.filter(q => !q.isValidated).length;

  const stats = [
    { title: 'Total Soal Dibuat', value: teacherQuestions.length, icon: ICONS.questions, color: 'bg-blue-500', link: '/teacher/questions' },
    { title: 'Total Ujian Dibuat', value: teacherExams.length, icon: ICONS.exams, color: 'bg-green-500', link: '/teacher/exams' },
    { title: 'Ujian Perlu Dikoreksi', value: examsNeedingGrading.length, icon: ICONS.grades, color: 'bg-yellow-500', link: '/teacher/grades' },
    { title: 'Log Aktivitas', value: <i className={`${ICONS.activity_log} text-xl`}></i>, icon: ICONS.activity_log, color: 'bg-red-500', link: '/teacher/student-activity-log' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-2 text-center md:text-left">Dashboard Guru Mata Pelajaran</h1>
      <p className="text-lg text-gray-700 mb-6 text-center md:text-left">Selamat datang, {user.name}! Ini adalah ringkasan aktivitas Anda.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <Card title="Mata Pelajaran Anda">
        {teacherSubjects.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {teacherSubjects.map(subject => (
              <li key={subject.id} className="text-gray-700">{subject.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Anda belum ditugaskan untuk mengampu mata pelajaran apapun.</p>
        )}
      </Card>

      <Card title="Ujian Terbaru Anda">
        {teacherExams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-smkn-blue text-white">
                <tr>
                  <th className="py-2 px-3 text-left">Judul Ujian</th>
                  <th className="py-2 px-3 text-left">Mapel</th>
                  <th className="py-2 px-3 text-left">Tahun Ajaran</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Tgl Dibuat</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {teacherExams.slice(0, 5).map((exam: Exam) => (
                  <tr key={exam.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                    <td className="py-2 px-3">{exam.title}</td>
                    <td className="py-2 px-3">{subjects.find(s => s.id === exam.subjectId)?.name || '-'}</td>
                    <td className="py-2 px-3">{exam.academicYear || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        exam.status === 'active' ? 'bg-green-200 text-green-800' : 
                        exam.status === 'pending_validation' ? 'bg-yellow-200 text-yellow-800' :
                        exam.status === 'draft' ? 'bg-gray-200 text-gray-800' :
                        'bg-red-200 text-red-800' // completed or archived
                      }`}>
                        {exam.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3">{new Date(exam.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 p-4 text-center">Anda belum membuat ujian.</p>
        )}
         <div className="mt-4 text-right">
            <Link to="/teacher/exams" className="text-smkn-blue hover:underline">Lihat semua ujian atau buat baru &rarr;</Link> 
        </div>
      </Card>

      <Card title="Tindakan Cepat">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/teacher/questions" className="block p-4 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md">
            <i className={`${ICONS.questions} mr-2`}></i> Kelola Bank Soal
          </Link>
          <Link to="/teacher/exams/create" className="block p-4 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md">
            <i className={`${ICONS.add} mr-2`}></i> Buat Ujian Baru
          </Link>
          <Link to="/teacher/grades" className="block p-4 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md">
            <i className={`${ICONS.grades} mr-2`}></i> Koreksi Essai Siswa
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;