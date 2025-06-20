
import React, { useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useData } from '../../contexts/DataContext';
import { ICONS } from '../../constants';
import { UserRole, ActivityAction } from '../../types'; // Added ActivityAction
import { useAuth } from '../../contexts/AuthContext'; // Added useAuth
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const PrincipalDashboard: React.FC = () => {
  const { user } = useAuth(); // Get current user
  const { users, exams, submissions, classes, addActivityLog } = useData(); // Added addActivityLog

  useEffect(() => {
    if (user) {
      addActivityLog({ action: ActivityAction.VIEW_PRINCIPAL_DASHBOARD, targetType: "Halaman" }, user);
    }
  }, [user, addActivityLog]);

  const totalTeachers = users.filter(u => u.role === UserRole.GURU_MAPEL || u.role === UserRole.WALI_KELAS).length;
  const totalStudents = users.filter(u => u.role === UserRole.SISWA).length;
  const activeExams = exams.filter(e => e.status === 'active').length;
  
  const averageScoresPerClass = React.useMemo(() => {
    return classes.map(cls => {
      const relevantExams = exams.filter(ex => ex.classIds.includes(cls.id));
      let totalScore = 0;
      let numSubmissions = 0;
      relevantExams.forEach(ex => {
        const classSubmissions = submissions.filter(s => s.examId === ex.id && users.find(u => u.id === s.studentId && u.classId === cls.id && s.isGraded));
        classSubmissions.forEach(s => {
          if (s.totalScore !== undefined) {
            totalScore += s.totalScore;
            numSubmissions++;
          }
        });
      });
      return {
        name: cls.name,
        averageScore: numSubmissions > 0 ? parseFloat((totalScore / numSubmissions).toFixed(2)) : 0,
      };
    }).filter(data => data.averageScore > 0);
  }, [classes, exams, submissions, users]);

  const stats = [
    { title: 'Total Guru & Staf', value: totalTeachers, icon: ICONS.users, color: 'bg-blue-500', link: '#' },
    { title: 'Total Siswa', value: totalStudents, icon: ICONS.users, color: 'bg-green-500', link: '#' },
    { title: 'Total Ujian Dilaksanakan', value: exams.length, icon: ICONS.exams, color: 'bg-yellow-500', link: '/principal/overview' },
    { title: 'Log Aktivitas Global', value: <i className={`${ICONS.activity_log} text-xl`}></i>, icon: ICONS.activity_log, color: 'bg-red-500', link: '/principal/activity-log'},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-2 text-center md:text-left">Dashboard Kepala Sekolah</h1>
      <p className="text-lg text-gray-700 mb-6 text-center md:text-left">Pantau aktivitas dan performa akademik sekolah secara keseluruhan.</p>

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

      <Card title="Rata-Rata Nilai Ujian per Kelas (Terkoreksi)">
        {averageScoresPerClass.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={averageScoresPerClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]}/>
              <Tooltip />
              <Legend />
              <Bar dataKey="averageScore" fill="#8884d8" name="Rata-rata Skor" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">Data rata-rata nilai belum tersedia atau belum ada ujian yang selesai dikoreksi.</p>
        )}
      </Card>

      <Card title="Tindakan Cepat & Laporan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/principal/overview" className="block p-6 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md text-center">
            <i className={`${ICONS.overview} text-3xl mb-2`}></i>
            <p className="font-semibold">Pantau Semua Aktivitas Ujian</p>
          </Link>
           <Link to="/principal/activity-log" className="block p-6 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md text-center">
            <i className={`${ICONS.activity_log} text-3xl mb-2`}></i>
            <p className="font-semibold">Lihat Log Aktivitas Global</p>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default PrincipalDashboard;
