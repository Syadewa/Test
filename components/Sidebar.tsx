

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, ActivityAction } from '../types';
import { ICONS } from '../constants';
import { useData } from '../contexts/DataContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
  action?: ActivityAction; 
}

const navItems: NavItem[] = [
  // Admin
  { path: '/admin/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: [UserRole.ADMIN], action: ActivityAction.VIEW_ADMIN_DASHBOARD },
  { path: '/admin/users', label: 'Kelola Pengguna', icon: ICONS.users, roles: [UserRole.ADMIN], action: ActivityAction.VIEW_MANAGE_USERS_PAGE },
  { path: '/admin/subjects', label: 'Kelola Mapel & Kelas', icon: ICONS.subjects, roles: [UserRole.ADMIN], action: ActivityAction.VIEW_MANAGE_SUBJECTS_PAGE },
  { path: '/admin/stats', label: 'Statistik Global', icon: ICONS.stats, roles: [UserRole.ADMIN], action: ActivityAction.VIEW_GLOBAL_STATS },
  { path: '/admin/activity-log', label: 'Log Aktivitas', icon: ICONS.activity_log, roles: [UserRole.ADMIN], action: ActivityAction.VIEW_ACTIVITY_LOG },
  // Guru Mapel
  { path: '/teacher/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: [UserRole.GURU_MAPEL], action: ActivityAction.VIEW_TEACHER_DASHBOARD },
  { path: '/teacher/questions', label: 'Bank Soal Saya', icon: ICONS.questions, roles: [UserRole.GURU_MAPEL], action: ActivityAction.VIEW_MY_QUESTIONS },
  // { path: '/teacher/mathjax-tutorial', label: 'Panduan Rumus (MathJax)', icon: ICONS.info, roles: [UserRole.GURU_MAPEL] }, // Removed link
  { path: '/teacher/exams', label: 'Daftar Ujian Saya', icon: ICONS.exams, roles: [UserRole.GURU_MAPEL], action: ActivityAction.VIEW_CREATE_EXAM_PAGE },
  { path: '/teacher/exams/create', label: 'Buat Ujian Baru', icon: ICONS.add, roles: [UserRole.GURU_MAPEL], action: ActivityAction.VIEW_CREATE_EXAM_PAGE },
  { path: '/teacher/grades', label: 'Koreksi Essai', icon: ICONS.grades, roles: [UserRole.GURU_MAPEL], action: ActivityAction.VIEW_GRADE_ESSAYS_PAGE },
  { path: '/teacher/student-activity-log', label: 'Log Aktivitas', icon: ICONS.activity_log, roles: [UserRole.GURU_MAPEL], action: ActivityAction.VIEW_STUDENT_ACTIVITY_LOG },
  // Wakil Kurikulum
  { path: '/curriculum/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: [UserRole.WAKIL_KURIKULUM], action: ActivityAction.VIEW_CURRICULUM_DASHBOARD },
  { path: '/curriculum/validate', label: 'Validasi Soal & Ujian', icon: ICONS.validate, roles: [UserRole.WAKIL_KURIKULUM], action: ActivityAction.VIEW_VALIDATE_PAGE },
  // Wali Kelas
  { path: '/homeroom/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: [UserRole.WALI_KELAS], action: ActivityAction.VIEW_HOMEROOM_DASHBOARD },
  { path: '/homeroom/manage-students', label: 'Kelola Siswa', icon: ICONS.users, roles: [UserRole.WALI_KELAS], action: ActivityAction.VIEW_MANAGE_USERS_PAGE }, 
  { path: '/homeroom/grades', label: 'Nilai Siswa Kelas', icon: ICONS.grades, roles: [UserRole.WALI_KELAS], action: ActivityAction.VIEW_CLASS_GRADES },
  { path: '/homeroom/student-activity-log', label: 'Log Aktivitas', icon: ICONS.activity_log, roles: [UserRole.WALI_KELAS], action: ActivityAction.VIEW_STUDENT_ACTIVITY_LOG },
  // Kepala Sekolah
  { path: '/principal/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: [UserRole.KEPALA_SEKOLAH], action: ActivityAction.VIEW_PRINCIPAL_DASHBOARD },
  { path: '/principal/overview', label: 'Pantau Aktivitas', icon: ICONS.overview, roles: [UserRole.KEPALA_SEKOLAH], action: ActivityAction.VIEW_SCHOOL_OVERVIEW },
  { path: '/principal/activity-log', label: 'Log Aktivitas', icon: ICONS.activity_log, roles: [UserRole.KEPALA_SEKOLAH], action: ActivityAction.VIEW_ACTIVITY_LOG },
  // Siswa
  { path: '/student/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: [UserRole.SISWA], action: ActivityAction.VIEW_STUDENT_DASHBOARD },
  { path: '/student/exams', label: 'Daftar Ujian', icon: ICONS.exams, roles: [UserRole.SISWA], action: ActivityAction.VIEW_MY_EXAMS_PAGE },
  { path: '/student/results', label: 'Hasil Ujian Saya', icon: ICONS.grades, roles: [UserRole.SISWA], action: ActivityAction.VIEW_EXAM_RESULTS },
  { path: '/student/change-password', label: 'Ganti Password', icon: ICONS.change_password, roles: [UserRole.SISWA], action: ActivityAction.PASSWORD_CHANGE_SELF }, 
];


interface SidebarProps {
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, closeMobileSidebar }) => {
  const { user } = useAuth();
  const { addActivityLog } = useData();

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const handleNavLinkClick = (itemAction?: ActivityAction) => {
    if (itemAction && user) {
        if(itemAction !== ActivityAction.PASSWORD_CHANGE_SELF) {
            addActivityLog({ action: itemAction, targetType: "Halaman Navigasi" }, user);
        }
    }
    if (isMobileOpen) {
      closeMobileSidebar();
    }
  };

  return (
    <aside
      className={`
        transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        fixed md:sticky 
        inset-y-0 left-0 md:top-16  
        w-64 bg-white shadow-lg  
        transition-transform duration-300 ease-in-out
        h-screen md:h-[calc(100vh-4rem)] 
        overflow-y-auto 
        z-40 md:z-30
        pt-16 md:pt-0 
      `}
    >
      <div className="md:hidden flex justify-between items-center px-4 pt-8 pb-4"> 
          <span className="text-lg font-semibold text-smkn-blue">Menu Navigasi</span>
          <button 
            onClick={closeMobileSidebar} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close sidebar"
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
      <nav className="px-4 pt-6 md:pt-8 pb-4 space-y-2"> 
        {filteredNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => handleNavLinkClick(item.action)}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-md hover:bg-smkn-blue hover:text-white transition-colors ${
                isActive ? 'bg-smkn-blue text-white font-semibold shadow-md' : 'text-smkn-text hover:bg-gray-100'
              }`
            }
          >
            <i className={`${item.icon} w-5 text-center`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;