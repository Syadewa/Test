

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CurriculumDashboard from './pages/curriculum/CurriculumDashboard';
import HomeroomDashboard from './pages/homeroom/HomeroomDashboard';
import PrincipalDashboard from './pages/principal/PrincipalDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';
import Layout from './components/Layout';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageSubjectsPage from './pages/admin/ManageSubjectsPage';
import GlobalStatsPage from './pages/admin/GlobalStatsPage';
import MyQuestionsPage from './pages/teacher/MyQuestionsPage';
import CreateExamPage from './pages/teacher/CreateExamPage';
import GradeEssaysPage from './pages/teacher/GradeEssaysPage';
import MyExamsListPage from './pages/teacher/MyExamsListPage'; 
import ValidateQuestionsPage from './pages/curriculum/ValidateQuestionsPage';
import ViewClassGradesPage from './pages/homeroom/ViewClassGradesPage';
import SchoolOverviewPage from './pages/principal/SchoolOverviewPage';
import MyExamsPage from './pages/student/MyExamsPage';
import TakeExamPage from './pages/student/TakeExamPage';
import NotFoundPage from './pages/NotFoundPage';
import ViewExamResultsPage from './pages/student/ViewExamResultsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/student/ChangePasswordPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
// import MathJaxLatexTutorialPage from './pages/teacher/MathJaxLatexTutorialPage'; // Removed import

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsersPage />} />
          <Route path="/admin/subjects" element={<ManageSubjectsPage />} />
          <Route path="/admin/stats" element={<GlobalStatsPage />} />
          <Route path="/admin/activity-log" element={<ActivityLogPage />} /> 
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.GURU_MAPEL]} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/questions" element={<MyQuestionsPage />} />
          {/* <Route path="/teacher/mathjax-tutorial" element={<MathJaxLatexTutorialPage />} /> */} {/* Removed route */}
          <Route path="/teacher/exams" element={<MyExamsListPage />} /> 
          <Route path="/teacher/exams/create" element={<CreateExamPage />} />
          <Route path="/teacher/exams/edit/:examId" element={<CreateExamPage />} />
          <Route path="/teacher/grades" element={<GradeEssaysPage />} />
          <Route path="/teacher/student-activity-log" element={<ActivityLogPage />} /> 
        </Route>

        {/* Curriculum Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.WAKIL_KURIKULUM]} />}>
          <Route path="/curriculum/dashboard" element={<CurriculumDashboard />} />
          <Route path="/curriculum/validate" element={<ValidateQuestionsPage />} />
        </Route>

        {/* Homeroom Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.WALI_KELAS]} />}>
          <Route path="/homeroom/dashboard" element={<HomeroomDashboard />} />
          <Route path="/homeroom/manage-students" element={<ManageUsersPage />} /> 
          <Route path="/homeroom/grades" element={<ViewClassGradesPage />} />
          <Route path="/homeroom/student-activity-log" element={<ActivityLogPage />} /> 
        </Route>

        {/* Principal Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.KEPALA_SEKOLAH]} />}>
          <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
          <Route path="/principal/overview" element={<SchoolOverviewPage />} />
          <Route path="/principal/activity-log" element={<ActivityLogPage />} /> 
        </Route>

        {/* Student Routes (excluding TakeExamPage) */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.SISWA]} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/exams" element={<MyExamsPage />} />
          <Route path="/student/results" element={<ViewExamResultsPage />} />
          <Route path="/student/change-password" element={<ChangePasswordPage />} />
        </Route>
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={[UserRole.SISWA]} />}>
        <Route path="/student/exam/:examId" element={<TakeExamPage />} />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
