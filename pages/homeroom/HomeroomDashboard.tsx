
import React, { useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { ICONS } from '../../constants';
import { UserRole, ActivityAction } from '../../types'; // Added ActivityAction
 
const HomeroomDashboard: React.FC = () => {
  const { user } = useAuth();
  const { users, submissions, classes, subClasses, addActivityLog } = useData();  // Added addActivityLog

  useEffect(() => {
    if (user) {
      addActivityLog({ action: ActivityAction.VIEW_HOMEROOM_DASHBOARD, targetType: "Halaman" }, user);
    }
  }, [user, addActivityLog]);

  if (!user || user.role !== UserRole.WALI_KELAS) return null; 

  let mySubClassNameDisplay = "Sub Kelas Belum Ditentukan";
  let studentsInCare: typeof users = [];

  if (user.subClassId) {
    const foundSubClass = subClasses.find(sc => sc.id === user.subClassId);
    if (foundSubClass) {
      mySubClassNameDisplay = foundSubClass.name;
      studentsInCare = users.filter(u => u.role === UserRole.SISWA && u.subClassId === user.subClassId);
    }
  } else if (user.classId) {
    const mainClass = classes.find(c => c.id === user.classId);
    if (mainClass) {
      mySubClassNameDisplay = `Wali Kelas untuk ${mainClass.name} (Sub Kelas belum spesifik)`;
      studentsInCare = users.filter(u => u.role === UserRole.SISWA && u.classId === user.classId && !u.subClassId);
    }
  }
  
  let averageScore = 0;
  const studentIdsInCare = studentsInCare.map(s => s.id);
  const gradedSubmissions = submissions.filter(s => studentIdsInCare.includes(s.studentId) && s.isGraded && s.totalScore !== undefined);
  
  if (gradedSubmissions.length > 0) {
    averageScore = gradedSubmissions.reduce((acc, curr) => acc + curr.totalScore!, 0) / gradedSubmissions.length;
  }

  const stats = [
    { title: 'Jumlah Siswa Bimbingan', value: studentsInCare.length, icon: ICONS.users, color: 'bg-blue-500', link: '/homeroom/grades' },
    { title: 'Rata-rata Nilai Siswa (Terkoreksi)', value: averageScore > 0 ? averageScore.toFixed(2) : 'N/A', icon: ICONS.grades, color: 'bg-yellow-500', link: '/homeroom/grades' },
    { title: 'Log Aktivitas', value: <i className={`${ICONS.activity_log} text-xl`}></i>, icon: ICONS.activity_log, color: 'bg-purple-500', link: '/homeroom/student-activity-log' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-2 text-center md:text-left">Dashboard Wali Kelas</h1>
      <p className="text-lg text-gray-700 mb-6 text-center md:text-left">
        Anda adalah Wali Kelas untuk: <span className="font-semibold">{mySubClassNameDisplay}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <Card title="Tindakan Cepat">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
          <Link to="/homeroom/grades" className="block p-6 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md text-center">
            <i className={`${ICONS.grades} text-3xl mb-2`}></i>
            <p className="font-semibold">Lihat Nilai kelas</p>
          </Link>
           <Link to="/homeroom/manage-students" className="block p-6 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md text-center">
            <i className={`${ICONS.users} text-3xl mb-2`}></i>
            <p className="font-semibold">Kelola Siswa Kelas</p>
          </Link>
        </div>
      </Card>

      <Card title={`Daftar Siswa ${mySubClassNameDisplay !== "Sub Kelas Belum Ditentukan" ? mySubClassNameDisplay : "Bimbingan"} (Contoh)`}>
        {studentsInCare.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 max-h-60 overflow-y-auto">
            {studentsInCare.slice(0, 10).map(student => ( 
              <li key={student.id} className="text-gray-700">{student.name} ({student.username})</li>
            ))}
            {studentsInCare.length > 10 && <li>Dan {studentsInCare.length - 10} siswa lainnya...</li>}
          </ul>
        ) : (
          <p className="text-gray-500">Tidak ada siswa yang terdaftar di {mySubClassNameDisplay !== "Sub Kelas Belum Ditentukan" ? mySubClassNameDisplay : "kelas bimbingan Anda"}.</p>
        )}
      </Card>
    </div>
  );
};

export default HomeroomDashboard;