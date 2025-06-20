
import React, { useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useData } from '../../contexts/DataContext';
import { ICONS } from '../../constants';
import { ActivityAction } from '../../types'; // Added ActivityAction
import { useAuth } from '../../contexts/AuthContext'; // Added useAuth

const CurriculumDashboard: React.FC = () => {
  const { user } = useAuth(); // Get current user
  const { questions, exams, addActivityLog } = useData(); // Added addActivityLog

  useEffect(() => {
    if (user) {
      addActivityLog({ action: ActivityAction.VIEW_CURRICULUM_DASHBOARD, targetType: "Halaman" }, user);
    }
  }, [user, addActivityLog]);

  const questionsPendingValidation = questions.filter(q => !q.isValidated).length;
  const examsPendingValidation = exams.filter(exam => exam.status === 'pending_validation').length;

  const stats = [
    { title: 'Soal Menunggu Validasi', value: questionsPendingValidation, icon: ICONS.pending, color: 'bg-yellow-500', link: '/curriculum/validate' },
    { title: 'Ujian Menunggu Validasi', value: examsPendingValidation, icon: ICONS.pending, color: 'bg-orange-500', link: '/curriculum/validate' },
  ];


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-2 text-center md:text-left">Dashboard Wakil Kurikulum</h1>
      <p className="text-lg text-gray-700 mb-6 text-center md:text-left">Kelola validasi soal & ujian, serta pantau kualitas bank soal.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map(stat => (
          <Link to={stat.link} key={stat.title} className="block">
            <Card className="hover:shadow-xl transition-shadow duration-300 h-full">
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

      <Card title="Tindakan Utama">
        <div className="grid grid-cols-1 gap-4">
          <Link to="/curriculum/validate" className="block p-6 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md text-center">
            <i className={`${ICONS.validate} text-3xl mb-2`}></i>
            <p className="font-semibold text-lg">Validasi Soal & Ujian</p>
            {(questionsPendingValidation > 0 || examsPendingValidation > 0) && 
              <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                {questionsPendingValidation > 0 && `${questionsPendingValidation} soal menunggu`}
                {questionsPendingValidation > 0 && examsPendingValidation > 0 && ` & `}
                {examsPendingValidation > 0 && `${examsPendingValidation} ujian menunggu`}
              </span>
            }
          </Link>
        </div>
      </Card>
      
      <Card title="Informasi Penting">
        <p className="text-gray-700">
          Sebagai Wakil Kurikulum, Anda bertanggung jawab untuk memastikan semua soal dan ujian yang digunakan telah memenuhi standar kualitas yang ditetapkan. 
          Harap tinjau dan validasi item yang diajukan oleh Guru Mata Pelajaran secara berkala.
        </p>
        <p className="mt-2 text-gray-700">
          Soal dan ujian yang belum divalidasi tidak akan bisa digunakan dalam pembuatan ujian oleh guru atau diikuti oleh siswa.
        </p>
      </Card>
    </div>
  );
};

export default CurriculumDashboard;
