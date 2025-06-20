
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, StudentSubmission, Exam, Subject, Question } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button'; // Import Button
import { Select } from '../../components/common/Input';
import { calculateScore, formatDate } from '../../utils/helpers';
import * as XLSX from 'xlsx'; // Import xlsx
import { ICONS } from '../../constants'; // Import ICONS

const ViewClassGradesPage: React.FC = () => {
  const { user } = useAuth();
  const { users, submissions, exams, subjects, questions: allQuestions, classes, subClasses } = useData();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [studentGrades, setStudentGrades] = useState<any[]>([]); 

  const myStudents = useMemo(() => {
    if (!user || user.role !== UserRole.WALI_KELAS || !user.subClassId) return [];
     return users.filter(u => u.role === UserRole.SISWA && u.subClassId === user.subClassId);
  }, [user, users]);
  
  const homeroomSubClassDetails = useMemo(() => {
    if (!user || !user.subClassId) return null;
    return subClasses.find(sc => sc.id === user.subClassId);
  }, [user, subClasses]);

  const homeroomName = homeroomSubClassDetails?.name || "Kelas Bimbingan Anda";

  const relevantSubjects = useMemo(() => {
    if (!user || !homeroomSubClassDetails) return [];
    const studentIdsInSubClass = myStudents.map(s => s.id);
    const examsTakenBySubClass = exams.filter(exam => 
        submissions.some(sub => sub.examId === exam.id && studentIdsInSubClass.includes(sub.studentId))
    );
    const subjectIdsFromExams = new Set(examsTakenBySubClass.map(exam => exam.subjectId));
    return subjects.filter(s => subjectIdsFromExams.has(s.id));
  }, [user, homeroomSubClassDetails, myStudents, exams, submissions, subjects]);
  const subjectOptions = relevantSubjects.map(s => ({ value: s.id, label: s.name }));

  const relevantExams = useMemo(() => {
    if (myStudents.length === 0) return [];
    const studentIdsInSubClass = myStudents.map(s => s.id);
    let examsForSubClass = exams.filter(ex => 
        submissions.some(sub => sub.examId === ex.id && studentIdsInSubClass.includes(sub.studentId))
    );
    if (selectedSubjectId) {
      examsForSubClass = examsForSubClass.filter(ex => ex.subjectId === selectedSubjectId);
    }
    return examsForSubClass;
  }, [myStudents, submissions, exams, selectedSubjectId]);
  
  const getSimpleExamType = (title: string): string => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("ujian tengah semester") || titleLower.includes("uts")) {
      return "Ujian Tengah Semester";
    }
    if (titleLower.includes("ujian akhir semester") || titleLower.includes("uas")) {
      return "Ujian Akhir Semester";
    }
    return title;
  };

  const examOptions = relevantExams.map(ex => ({ 
    value: ex.id, 
    label: getSimpleExamType(ex.title) 
  }));


  useEffect(() => {
    if (myStudents.length === 0) {
        setStudentGrades([]);
        return;
    }

    const grades: any[] = []; 

    myStudents.forEach(student => {
      const studentSubmissions = submissions.filter(s => s.studentId === student.id);
      
      studentSubmissions.forEach(submission => {
        const exam = exams.find(e => e.id === submission.examId);
        if (!exam) return;
        if (selectedSubjectId && exam.subjectId !== selectedSubjectId) return;
        if (selectedExamId && exam.id !== selectedExamId) return;

        const examQuestionsDetails = exam.questions.map(eq => {
            const fullQ = allQuestions.find(q => q.id === eq.questionId);
            return { ...fullQ!, points: eq.points };
        });

        const { totalScore, maxScore } = calculateScore(submission.answers, examQuestionsDetails);
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const status = submission.isGraded ? (percentage >= exam.kkm ? 'Lulus' : 'Tidak Lulus') : 'Belum Dikoreksi';

        grades.push({
          studentName: student.name,
          studentUsername: student.username,
          examTitle: exam.title,
          subjectName: subjects.find(s => s.id === exam.subjectId)?.name || 'N/A',
          score: submission.isGraded ? totalScore.toFixed(2) : 'N/A',
          maxScore: maxScore,
          percentage: submission.isGraded ? percentage.toFixed(2) : 'N/A', // No '%' symbol here for easier export
          kkm: exam.kkm,
          status: status,
          submissionDate: formatDate(new Date(submission.submittedAt || submission.endTime || submission.startTime)), // Use formatDate for consistent output
        });
      });
    });
    setStudentGrades(grades.sort((a,b) => a.studentName.localeCompare(b.studentName) || a.examTitle.localeCompare(b.examTitle)));
  }, [myStudents, submissions, exams, subjects, allQuestions, selectedSubjectId, selectedExamId]);
  
  const handleDownloadExcel = () => {
    const dataToExport = studentGrades.map(grade => ({
      "Nama Siswa": grade.studentName,
      "NIS/Username": grade.studentUsername,
      "Ujian": grade.examTitle,
      "Mata Pelajaran": grade.subjectName,
      "Skor": grade.score,
      "Skor Maksimal": grade.maxScore,
      "Persentase (%)": grade.percentage,
      "KKM": grade.kkm,
      "Status": grade.status,
      "Tanggal Submisi": grade.submissionDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Nilai Siswa");
    XLSX.writeFile(workbook, `Laporan_Nilai_${homeroomName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-smkn-blue mb-4 sm:mb-0 text-center sm:text-left">Nilai Siswa {homeroomName}</h1>
        {studentGrades.length > 0 && (
            <Button onClick={handleDownloadExcel} leftIcon={ICONS.download} variant="success">
                Unduh Laporan (Excel)
            </Button>
        )}
      </div>


      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select label="Filter Mata Pelajaran" options={[{value: '', label: 'Semua Mapel'}, ...subjectOptions]} value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} />
          <Select label="Filter Ujian" options={[{value: '', label: 'Semua Ujian'}, ...examOptions]} value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} disabled={relevantExams.length === 0} />
        </div>

        {myStudents.length === 0 && (
             <p className="text-gray-500 text-center py-8">Anda tidak terdaftar sebagai wali untuk sub kelas manapun, atau sub kelas Anda tidak memiliki siswa.</p>
        )}

        {myStudents.length > 0 && studentGrades.length === 0 && (
          <p className="text-gray-500 text-center py-8">Tidak ada data nilai yang cocok dengan filter atau belum ada siswa di kelas Anda yang mengerjakan ujian.</p>
        )}
        
        {studentGrades.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-smkn-blue text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Nama Siswa</th>
                  <th className="py-3 px-4 text-left">NIS/Username</th>
                  <th className="py-3 px-4 text-left">Ujian</th>
                  <th className="py-3 px-4 text-left">Mapel</th>
                  <th className="py-3 px-4 text-right">Skor</th>
                  <th className="py-3 px-4 text-right">KKM</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Tanggal</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {studentGrades.map((grade, index) => (
                  <tr key={index} className="border-b hover:bg-smkn-gray-light transition-colors">
                    <td className="py-3 px-4">{grade.studentName}</td>
                    <td className="py-3 px-4">{grade.studentUsername}</td>
                    <td className="py-3 px-4">{grade.examTitle}</td>
                    <td className="py-3 px-4">{grade.subjectName}</td>
                    <td className="py-3 px-4 text-right">{grade.score} / {grade.maxScore} ({grade.percentage}%)</td>
                    <td className="py-3 px-4 text-right">{grade.kkm}</td>
                    <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            grade.status === 'Lulus' ? 'bg-green-200 text-green-800' : 
                            grade.status === 'Tidak Lulus' ? 'bg-red-200 text-red-800' :
                            'bg-yellow-200 text-yellow-800' 
                        }`}>
                            {grade.status}
                        </span>
                    </td>
                    <td className="py-3 px-4">{grade.submissionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ViewClassGradesPage;