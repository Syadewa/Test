import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/common/Card';
import { Exam, Question, StudentSubmission, Subject, User, UserRole } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const GlobalStatsPage: React.FC = () => {
  const { users, subjects, exams, questions, submissions, classes } = useData();

  const examStatusData = useMemo(() => {
    const counts = exams.reduce((acc, exam) => {
      acc[exam.status] = (acc[exam.status] || 0) + 1;
      return acc;
    }, {} as Record<Exam['status'], number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [exams]);

  const questionsPerSubjectData = useMemo(() => {
    return subjects.map(subject => ({
      name: subject.name,
      jumlahSoal: questions.filter(q => q.subjectId === subject.id).length,
    }));
  }, [subjects, questions]);

  const averageScoresPerClass = useMemo(() => {
    return classes.map(cls => {
      const relevantExams = exams.filter(ex => ex.classIds.includes(cls.id));
      let totalScore = 0;
      let numSubmissions = 0;
      relevantExams.forEach(ex => {
        const classSubmissions = submissions.filter(s => s.examId === ex.id && users.find(u => u.id === s.studentId && u.classId === cls.id));
        classSubmissions.forEach(s => {
          if (s.totalScore !== undefined) {
            totalScore += s.totalScore;
            numSubmissions++;
          }
        });
      });
      return {
        name: cls.name,
        rataRataNilai: numSubmissions > 0 ? parseFloat((totalScore / numSubmissions).toFixed(2)) : 0,
      };
    }).filter(data => data.rataRataNilai > 0);
  }, [classes, exams, submissions, users]);

  const userRoleDistribution = useMemo(() => {
    const counts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Statistik Global Sistem Ujian</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Distribusi Peran Pengguna">
          {userRoleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={userRoleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill="#8884d8">
                  {userRoleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-500 py-8">Data peran pengguna tidak tersedia.</p>}
        </Card>

        <Card title="Status Ujian">
          {examStatusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={examStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false}/>
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name="Jumlah Ujian" />
            </BarChart>
          </ResponsiveContainer>
          ) : <p className="text-center text-gray-500 py-8">Data status ujian tidak tersedia.</p>}
        </Card>
      </div>

      <Card title="Jumlah Soal per Mata Pelajaran">
        {questionsPerSubjectData.filter(d => d.jumlahSoal > 0).length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={questionsPerSubjectData.filter(d => d.jumlahSoal > 0)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false}/>
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="jumlahSoal" fill="#8884d8" name="Jumlah Soal" />
          </BarChart>
        </ResponsiveContainer>
        ) : <p className="text-center text-gray-500 py-8">Data soal per mata pelajaran tidak tersedia.</p>}
      </Card>
      
      <Card title="Rata-rata Nilai Ujian per Kelas">
        {averageScoresPerClass.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={averageScoresPerClass}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="rataRataNilai" fill="#ffc658" name="Rata-rata Nilai" />
          </BarChart>
        </ResponsiveContainer>
        ) : <p className="text-center text-gray-500 py-8">Data rata-rata nilai tidak tersedia.</p>}
      </Card>

      <Card title="Ringkasan Data Utama">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-100 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                <p className="text-sm text-blue-500">Total Pengguna</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{subjects.length}</p>
                <p className="text-sm text-green-500">Total Mapel</p>
            </div>
            <div className="p-4 bg-yellow-100 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{exams.length}</p>
                <p className="text-sm text-yellow-500">Total Ujian</p>
            </div>
            <div className="p-4 bg-purple-100 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{questions.length}</p>
                <p className="text-sm text-purple-500">Total Soal</p>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default GlobalStatsPage;