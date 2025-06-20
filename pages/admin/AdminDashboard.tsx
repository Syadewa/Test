
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useData } from '../../contexts/DataContext';
import { ICONS } from '../../constants';
import Button from '../../components/common/Button'; 
import Alert from '../../components/common/Alert'; 
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { QuestionType, StudentSubmission, Exam, Question as QuestionInterface, ActivityAction, User } from '../../types'; // Added ActivityAction
import { useAuth } from '../../contexts/AuthContext'; // Added useAuth

const AdminDashboard: React.FC = () => {
  const { user } = useAuth(); // Get current user
  const { 
    users, subjects, exams, submissions, questions: allQuestions, 
    gradesReleasedGlobally, setGradesReleasedGlobally, addActivityLog // Added addActivityLog
  } = useData();

  const [showReleaseConfirmationAlert, setShowReleaseConfirmationAlert] = useState<boolean>(false);
  const [showUngradedEssaysWarningModal, setShowUngradedEssaysWarningModal] = useState<boolean>(false);
  const [cachedGradesReleasedGlobally, setCachedGradesReleasedGlobally] = useState<boolean>(gradesReleasedGlobally);

  useEffect(() => {
    if (user) {
      addActivityLog({ action: ActivityAction.VIEW_ADMIN_DASHBOARD, targetType: "Halaman" }, user);
    }
  }, [user, addActivityLog]);

  useEffect(() => {
    setCachedGradesReleasedGlobally(gradesReleasedGlobally);
  }, [gradesReleasedGlobally]);

  const stats = [
    { title: 'Total Pengguna', value: users.length, icon: ICONS.users, color: 'bg-blue-500', link: '/admin/users' },
    { title: 'Total Mata Pelajaran', value: subjects.length, icon: ICONS.subjects, color: 'bg-green-500', link: '/admin/subjects' },
    { title: 'Total Ujian Dibuat', value: exams.length, icon: ICONS.exams, color: 'bg-yellow-500', link: '/admin/stats' },
    { title: 'Log Aktivitas Sistem', value: <i className={`${ICONS.activity_log} text-xl`}></i>, icon: ICONS.activity_log, color: 'bg-purple-500', link: '/admin/activity-log' },
  ];

  const checkForUngradedEssays = (): boolean => {
    return submissions.some(sub => {
      const examForSub = exams.find(ex => ex.id === sub.examId);
      if (!examForSub) return false;

      const hasEssayQuestionsInExam = examForSub.questions.some(eq => {
        const questionDetail = allQuestions.find(q => q.id === eq.questionId);
        return questionDetail && questionDetail.type === QuestionType.ESSAY;
      });
      return hasEssayQuestionsInExam && !sub.isGraded;
    });
  };

  const handleGradeReleaseToggle = () => {
    if (!user) return;
    const currentlyTryingToEnable = !cachedGradesReleasedGlobally;

    if (currentlyTryingToEnable) {
      if (checkForUngradedEssays()) {
        setShowUngradedEssaysWarningModal(true);
      } else {
        setGradesReleasedGlobally(true, user);
        setCachedGradesReleasedGlobally(true);
        setShowReleaseConfirmationAlert(true);
        setTimeout(() => setShowReleaseConfirmationAlert(false), 4000);
      }
    } else {
      setGradesReleasedGlobally(false, user);
      setCachedGradesReleasedGlobally(false);
      setShowReleaseConfirmationAlert(true);
      setTimeout(() => setShowReleaseConfirmationAlert(false), 4000);
    }
  };

  const confirmGlobalReleaseDespiteWarning = () => {
    if (!user) return;
    setGradesReleasedGlobally(true, user);
    setCachedGradesReleasedGlobally(true);
    setShowUngradedEssaysWarningModal(false);
    setShowReleaseConfirmationAlert(true);
    setTimeout(() => setShowReleaseConfirmationAlert(false), 4000);
  };
  
  const cancelGlobalReleaseFromWarning = () => {
      setShowUngradedEssaysWarningModal(false);
      setCachedGradesReleasedGlobally(false); 
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Dashboard Admin</h1>
      
      {showReleaseConfirmationAlert && (
        <Alert 
            type={cachedGradesReleasedGlobally ? "success" : "info"} 
            message={cachedGradesReleasedGlobally ? "Rilis nilai global telah DIAKTIFKAN. Siswa dapat melihat nilai ujian yang sudah sepenuhnya dikoreksi." : "Rilis nilai global telah DINONAKTIFKAN. Siswa tidak dapat melihat nilai ujian."} 
            onClose={() => setShowReleaseConfirmationAlert(false)}
        />
      )}

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

      <Card title="Tindakan Cepat">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/users" className="block p-4 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md">
            <i className={`${ICONS.users} mr-2`}></i> Kelola Pengguna
          </Link>
          <Link to="/admin/subjects" className="block p-4 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md">
            <i className={`${ICONS.subjects} mr-2`}></i> Kelola Mapel & Kelas
          </Link>
          <Link to="/admin/stats" className="block p-4 bg-smkn-blue-dark text-white rounded-lg hover:bg-smkn-blue transition-colors shadow-md">
            <i className={`${ICONS.stats} mr-2`}></i> Lihat Statistik Global
          </Link>
        </div>
      </Card>
      
      <Card title="Pengaturan Rilis Nilai Global">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow">
          <div>
            <h4 className="text-lg font-semibold text-smkn-text">Rilis Nilai Global untuk Siswa</h4>
            <p className="text-sm text-gray-600">
              Jika diaktifkan, siswa dapat melihat persentase nilai akhir mereka untuk ujian yang telah selesai dikoreksi sepenuhnya (termasuk semua esai).
            </p>
          </div>
          <div className="flex flex-col items-center ml-4">
            <label htmlFor="gradeReleaseToggle" className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="gradeReleaseToggle" 
                className="sr-only peer" 
                checked={cachedGradesReleasedGlobally} 
                onChange={handleGradeReleaseToggle}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-smkn-success"></div>
            </label>
            <span className={`mt-1 text-xs font-medium ${cachedGradesReleasedGlobally ? 'text-smkn-success' : 'text-smkn-danger'}`}>
              {cachedGradesReleasedGlobally ? 'Nilai Dirilis' : 'Nilai Ditahan'}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500 italic">
            Perhatian: Pengaturan ini bersifat global. Nilai individu siswa tetap hanya akan muncul jika ujian tersebut sudah selesai dikoreksi sepenuhnya oleh guru. Jika ada esai yang belum dikoreksi, nilai ujian tersebut tidak akan muncul untuk siswa ybs meskipun rilis global aktif.
        </p>
      </Card>

      <Card title="Informasi Sistem">
         <p className="text-gray-700">
           Selamat datang di panel admin Sistem Ujian Online SMKN 73. Dari sini Anda dapat mengelola seluruh aspek sistem, mulai dari pengguna, mata pelajaran, hingga memantau statistik ujian secara keseluruhan.
         </p>
         <p className="mt-2 text-gray-700">
           Pastikan semua data terkelola dengan baik untuk kelancaran proses belajar mengajar dan evaluasi.
         </p>
      </Card>

      {showUngradedEssaysWarningModal && (
        <ConfirmationModal
          isOpen={showUngradedEssaysWarningModal}
          onClose={cancelGlobalReleaseFromWarning}
          onConfirm={confirmGlobalReleaseDespiteWarning}
          title="Peringatan: Essai Belum Dikoreksi"
          message={
            <>
              <p>Masih ada jawaban esai siswa yang belum dikoreksi.</p>
              <p className="mt-1">Jika Anda merilis nilai sekarang, siswa dengan esai yang belum dikoreksi <strong>tidak akan melihat nilai akhir mereka</strong> untuk ujian tersebut, meskipun rilis global aktif.</p>
              <p className="mt-2">Apakah Anda yakin ingin melanjutkan rilis nilai global?</p>
            </>
          }
          confirmButtonText="Ya, Tetap Rilis Global"
          confirmButtonVariant="warning"
          cancelButtonText="Batal"
        />
      )}
    </div>
  );
};

export default AdminDashboard;
