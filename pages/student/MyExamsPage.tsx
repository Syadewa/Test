
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ICONS } from '../../constants';
import { Exam } from '../../types';
import { formatDate, formatDuration } from '../../utils/helpers';

const MyExamsPage: React.FC = () => {
  const { user } = useAuth();
  const { getExamsForStudent, submissions, subjects } = useData();

  if (!user) return null;

  const availableExams = getExamsForStudent(user.id);
  
  const examsWithStatus = availableExams.map(exam => {
    const submission = submissions.find(sub => sub.examId === exam.id && sub.studentId === user.id);
    return {
      ...exam,
      isTaken: !!submission,
      submissionTime: submission ? (submission.submittedAt || submission.endTime) : undefined,
    };
  }).sort((a,b) => { // Sort by not taken first, then by start time or creation time
      if (a.isTaken !== b.isTaken) return a.isTaken ? 1 : -1;
      const timeA = a.startTime ? new Date(a.startTime).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.startTime ? new Date(b.startTime).getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
  });


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Daftar Ujian Saya</h1>

      {examsWithStatus.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-10">Tidak ada ujian yang tersedia untuk Anda saat ini.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examsWithStatus.map(exam => (
            <Card key={exam.id} title={exam.title} className="flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <i className={`${ICONS.subjects} mr-2 text-smkn-blue`}></i>
                  Mapel: {subjects.find(s => s.id === exam.subjectId)?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <i className="fas fa-calendar-check mr-2 text-smkn-blue"></i>
                  Tahun Ajaran: {exam.academicYear || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <i className={`${ICONS.time} mr-2 text-smkn-blue`}></i>
                  Durasi: {formatDuration(exam.durationMinutes)}
                </p>
                {exam.startTime && (
                  <p className="text-sm text-gray-600 mb-1">
                    <i className="fas fa-calendar-alt mr-2 text-smkn-blue"></i>
                    Mulai: {formatDate(exam.startTime)}
                  </p>
                )}
                 <p className="text-sm text-gray-600 mb-2">
                  <i className={`${ICONS.info} mr-2 text-smkn-blue`}></i>
                  KKM: {exam.kkm}
                </p>
                {exam.isTaken && exam.submissionTime && (
                  <p className="text-xs text-green-600 bg-green-100 p-2 rounded-md">
                    <i className={`${ICONS.success} mr-1`}></i>
                    Sudah dikerjakan pada: {formatDate(exam.submissionTime)}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                {!exam.isTaken ? (
                  <Link to={`/student/exam/${exam.id}`}>
                    <Button variant="primary" className="w-full" leftIcon={ICONS.start_exam}>
                      Mulai Ujian
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" disabled className="w-full">
                    Sudah Dikerjakan
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyExamsPage;
