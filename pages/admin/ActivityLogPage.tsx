
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityLog, UserRole, ActivityAction, StudentSubmission, Exam } from '../../types';
import Card from '../../components/common/Card';
import Input, { Select } from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ICONS } from '../../constants';
import { formatDate } from '../../utils/helpers';

const ITEMS_PER_PAGE = 15;

// Global list of actions for Admin/Kepsek, and as a base for others
const allCuratedActionsList: { value: ActivityAction; label: string }[] = [
  { value: ActivityAction.LOGIN, label: 'Login Pengguna' },
  { value: ActivityAction.LOGOUT, label: 'Logout Pengguna' },
  { value: ActivityAction.PASSWORD_CHANGE_SELF, label: 'Ganti Password (Pengguna)' },
  { value: ActivityAction.FORGOT_PASSWORD_REQUEST, label: 'Permintaan Reset Password' },
  
  { value: ActivityAction.CREATE_USER, label: 'Buat Pengguna (Admin)' },
  { value: ActivityAction.UPDATE_USER, label: 'Update Pengguna (Admin/Wali)' },
  { value: ActivityAction.DELETE_USER, label: 'Hapus Pengguna (Admin)' },
  { value: ActivityAction.IMPORT_USERS_EXCEL, label: 'Import Pengguna (Admin)' },
  { value: ActivityAction.PASSWORD_RESET_ADMIN, label: 'Reset Password oleh Admin/Wali' },

  { value: ActivityAction.CREATE_CLASS, label: 'Buat Kelas Utama (Admin)' },
  { value: ActivityAction.UPDATE_CLASS, label: 'Update Kelas Utama (Admin)' },
  { value: ActivityAction.DELETE_CLASS, label: 'Hapus Kelas Utama (Admin)' },
  { value: ActivityAction.CREATE_SUBCLASS, label: 'Buat Sub Kelas (Admin)' },
  { value: ActivityAction.UPDATE_SUBCLASS, label: 'Update Sub Kelas (Admin)' },
  { value: ActivityAction.DELETE_SUBCLASS, label: 'Hapus Sub Kelas (Admin)' },
  { value: ActivityAction.CREATE_SUBJECT, label: 'Buat Mata Pelajaran (Admin)' },
  { value: ActivityAction.UPDATE_SUBJECT, label: 'Update Mata Pelajaran (Admin)' },
  { value: ActivityAction.DELETE_SUBJECT, label: 'Hapus Mata Pelajaran (Admin)' },
  
  { value: ActivityAction.CREATE_QUESTION, label: 'Buat Soal' }, // Base label, (Guru) might be contextual
  { value: ActivityAction.UPDATE_QUESTION, label: 'Update Soal (Guru)' },
  { value: ActivityAction.DELETE_QUESTION, label: 'Hapus Soal (Guru)' },
  { value: ActivityAction.AI_GENERATE_QUESTION, label: 'Buat Soal dengan AI' }, // Base label
  { value: ActivityAction.IMPORT_QUESTIONS_EXCEL, label: 'Import Soal (Guru)' },
  { value: ActivityAction.REQUEST_QUESTION_VALIDATION, label: 'Minta Validasi Soal (Guru)' },
  
  { value: ActivityAction.VALIDATE_QUESTION, label: 'Validasi Soal Disetujui (Kur.)' },
  { value: ActivityAction.REJECT_QUESTION, label: 'Validasi Soal Ditolak (Kur.)' },
  
  { value: ActivityAction.CREATE_EXAM, label: 'Buat Ujian (Guru)' },
  { value: ActivityAction.UPDATE_EXAM, label: 'Update Ujian (Guru)' },
  { value: ActivityAction.DELETE_EXAM, label: 'Hapus Ujian (Guru)' },
  
  { value: ActivityAction.VALIDATE_EXAM, label: 'Validasi Ujian Disetujui (Kur.)' },
  { value: ActivityAction.REJECT_EXAM, label: 'Validasi Ujian Ditolak (Kur.)' },

  { value: ActivityAction.START_EXAM_ATTEMPT, label: 'Mulai Ujian (Siswa)' },
  { value: ActivityAction.SUBMIT_EXAM, label: 'Submit Ujian (Siswa)' },
  { value: ActivityAction.VIEW_EXAM_RESULTS, label: 'Lihat Hasil Ujian (Siswa)' },
  { value: ActivityAction.STUDENT_LEFT_EXAM_TAB, label: 'Siswa Meninggalkan Tab Ujian' },


  { value: ActivityAction.FINALIZE_SUBMISSION_GRADING, label: 'Finalisasi Koreksi (Guru)' },

  { value: ActivityAction.GLOBAL_GRADES_RELEASE_ON, label: 'Aktifkan Rilis Global (Admin)' },
  { value: ActivityAction.GLOBAL_GRADES_RELEASE_OFF, label: 'Nonaktifkan Rilis Global (Admin)' },

  { value: ActivityAction.VIEW_ADMIN_DASHBOARD, label: 'Akses Dashboard Admin' },
  { value: ActivityAction.VIEW_TEACHER_DASHBOARD, label: 'Akses Dashboard Guru Mapel' },
  { value: ActivityAction.VIEW_CURRICULUM_DASHBOARD, label: 'Akses Dashboard Kurikulum' },
  { value: ActivityAction.VIEW_HOMEROOM_DASHBOARD, label: 'Akses Dashboard Wali Kelas' },
  { value: ActivityAction.VIEW_PRINCIPAL_DASHBOARD, label: 'Akses Dashboard Kepala Sekolah' },
  { value: ActivityAction.VIEW_STUDENT_DASHBOARD, label: 'Akses Dashboard Siswa' },
  
  { value: ActivityAction.VIEW_MANAGE_USERS_PAGE, label: 'Akses Kelola Pengguna' },
  { value: ActivityAction.VIEW_MANAGE_SUBJECTS_PAGE, label: 'Akses Kelola Mapel & Kelas' },
  { value: ActivityAction.VIEW_GLOBAL_STATS, label: 'Akses Statistik Global' },
  { value: ActivityAction.VIEW_SCHOOL_OVERVIEW, label: 'Akses Pantauan Sekolah' },
  
  { value: ActivityAction.VIEW_MY_QUESTIONS, label: 'Akses Bank Soal Saya (Guru)' },
  { value: ActivityAction.VIEW_CREATE_EXAM_PAGE, label: 'Akses Buat/Edit Ujian (Guru)' },
  { value: ActivityAction.VIEW_GRADE_ESSAYS_PAGE, label: 'Akses Koreksi Essai (Guru)' },
  
  { value: ActivityAction.VIEW_VALIDATE_PAGE, label: 'Akses Halaman Validasi (Kur.)' },
  
  { value: ActivityAction.VIEW_CLASS_GRADES, label: 'Akses Nilai Kelas (Wali Kelas)' },
  
  { value: ActivityAction.VIEW_MY_EXAMS_PAGE, label: 'Akses Daftar Ujian (Siswa)' },

  { value: ActivityAction.VIEW_ACTIVITY_LOG, label: 'Lihat Log Aktivitas (Global)' },
  { value: ActivityAction.VIEW_STUDENT_ACTIVITY_LOG, label: 'Lihat Log Aktivitas Siswa' },
].sort((a,b) => a.label.localeCompare(b.label));

const COMBINED_CREATE_QUESTION_ACTION = 'CREATE_OR_AI_QUESTION';
const COMBINED_CREATE_QUESTION_LABEL = 'Buat Soal (Manual/AI)';


export default function ActivityLogPage() {
  const { user: currentUser } = useAuth();
  const { activityLogs, users: allUsers, submissions, exams } = useData();

  const [filters, setFilters] = useState(() => {
    let initialUserRoleFilter: UserRole | '' = '';
    if (currentUser?.role === UserRole.WALI_KELAS || currentUser?.role === UserRole.GURU_MAPEL) {
      initialUserRoleFilter = UserRole.SISWA; // Default to "Hanya Aktivitas Siswa"
    }
    return {
      searchTerm: '',
      userRole: initialUserRoleFilter,
      action: '' as ActivityAction | string, // Can be ActivityAction or combined string
      startDate: '',
      endDate: '',
    };
  });
  const [currentPage, setCurrentPage] = useState(1);

  const roleOptions = useMemo(() => {
    if (currentUser?.role === UserRole.WALI_KELAS || currentUser?.role === UserRole.GURU_MAPEL) {
      return [
        { value: UserRole.SISWA, label: 'Hanya Aktivitas Siswa' },
        { value: '', label: 'Semua Aktivitas Relevan (Termasuk Saya)' },
      ];
    }
    return [{ value: '', label: 'Semua Role' }, ...Object.values(UserRole).map(role => ({ value: role, label: role }))];
  }, [currentUser]);

  const actionOptions = useMemo(() => {
    const defaultOptionAllRelevant = { value: '', label: 'Semua Aksi Relevan' };
    const defaultOptionAll = { value: '', label: 'Semua Aksi' };

    if (!currentUser) return [defaultOptionAllRelevant];

    if (currentUser.role === UserRole.GURU_MAPEL) {
      const relevantActionsSet = new Set<ActivityAction>([
        ActivityAction.START_EXAM_ATTEMPT,
        ActivityAction.SUBMIT_EXAM,
        ActivityAction.VIEW_EXAM_RESULTS,
        ActivityAction.STUDENT_LEFT_EXAM_TAB,
        ActivityAction.CREATE_QUESTION,
        ActivityAction.AI_GENERATE_QUESTION,
        ActivityAction.UPDATE_QUESTION,
        ActivityAction.DELETE_QUESTION,
        ActivityAction.IMPORT_QUESTIONS_EXCEL,
        ActivityAction.REQUEST_QUESTION_VALIDATION,
        ActivityAction.CREATE_EXAM,
        ActivityAction.UPDATE_EXAM,
        ActivityAction.DELETE_EXAM,
        ActivityAction.FINALIZE_SUBMISSION_GRADING,
        ActivityAction.LOGIN,
        ActivityAction.LOGOUT,
        ActivityAction.VIEW_STUDENT_ACTIVITY_LOG,
        ActivityAction.VIEW_TEACHER_DASHBOARD,
      ]);
      
      const initialFilteredActions = allCuratedActionsList.filter(action => relevantActionsSet.has(action.value));
      const finalProcessedActions: { value: string; label: string }[] = [];
      let combinedCreateQuestionAdded = false;

      for (const actionItem of initialFilteredActions) {
        if (actionItem.value === ActivityAction.CREATE_QUESTION || actionItem.value === ActivityAction.AI_GENERATE_QUESTION) {
          if (!combinedCreateQuestionAdded) {
            finalProcessedActions.push({ value: COMBINED_CREATE_QUESTION_ACTION, label: COMBINED_CREATE_QUESTION_LABEL });
            combinedCreateQuestionAdded = true;
          }
        } else {
          finalProcessedActions.push(actionItem);
        }
      }
      return [defaultOptionAllRelevant, ...finalProcessedActions.sort((a,b) => a.label.localeCompare(b.label))];

    } else if (currentUser.role === UserRole.WALI_KELAS) {
      const relevantActionsSet = new Set<ActivityAction>([
        ActivityAction.LOGIN,
        ActivityAction.LOGOUT,
        ActivityAction.PASSWORD_CHANGE_SELF,
        ActivityAction.START_EXAM_ATTEMPT,
        ActivityAction.SUBMIT_EXAM,
        ActivityAction.VIEW_EXAM_RESULTS,
        ActivityAction.STUDENT_LEFT_EXAM_TAB,
        ActivityAction.UPDATE_USER, // Specifically if they update student data
        ActivityAction.PASSWORD_RESET_ADMIN, // If they reset student password
        ActivityAction.VIEW_STUDENT_ACTIVITY_LOG,
        ActivityAction.VIEW_HOMEROOM_DASHBOARD,
        ActivityAction.VIEW_CLASS_GRADES,
      ]);
      const filteredActions = allCuratedActionsList.filter(action => relevantActionsSet.has(action.value));
      return [defaultOptionAllRelevant, ...filteredActions.sort((a,b) => a.label.localeCompare(b.label))];
    } else if (currentUser.role === UserRole.KEPALA_SEKOLAH) {
        const relevantActionsSet = new Set<ActivityAction>([
          ActivityAction.LOGIN,
          ActivityAction.LOGOUT,
          ActivityAction.CREATE_USER, 
          ActivityAction.DELETE_USER, 
          ActivityAction.IMPORT_USERS_EXCEL,
          ActivityAction.CREATE_EXAM, 
          ActivityAction.VALIDATE_EXAM, 
          ActivityAction.DELETE_EXAM,
          ActivityAction.START_EXAM_ATTEMPT, 
          ActivityAction.SUBMIT_EXAM, 
          ActivityAction.STUDENT_LEFT_EXAM_TAB,
          ActivityAction.FINALIZE_SUBMISSION_GRADING,
          ActivityAction.GLOBAL_GRADES_RELEASE_ON,
          ActivityAction.GLOBAL_GRADES_RELEASE_OFF,
          ActivityAction.VIEW_ADMIN_DASHBOARD,
          ActivityAction.VIEW_TEACHER_DASHBOARD,
          ActivityAction.VIEW_CURRICULUM_DASHBOARD,
          ActivityAction.VIEW_HOMEROOM_DASHBOARD,
          ActivityAction.VIEW_PRINCIPAL_DASHBOARD,
          ActivityAction.VIEW_STUDENT_DASHBOARD,
          ActivityAction.VIEW_GLOBAL_STATS,
          ActivityAction.VIEW_SCHOOL_OVERVIEW,
          ActivityAction.VIEW_ACTIVITY_LOG,
      ]);
      const filteredActions = allCuratedActionsList.filter(action => relevantActionsSet.has(action.value));
      return [defaultOptionAllRelevant, ...filteredActions.sort((a, b) => a.label.localeCompare(b.label))];
    } else { // Admin (and any other roles not specifically handled)
      return [ defaultOptionAll, ...allCuratedActionsList];
    }
  }, [currentUser]);


  const filteredLogs = useMemo(() => {
    if (!currentUser) return [];

    let logsToFilter = [...activityLogs]; 

    if (currentUser.role === UserRole.GURU_MAPEL) {
      const teacherCreatedExamIds = new Set(
        exams.filter(ex => ex.creatorId === currentUser.id).map(ex => ex.id)
      );

      logsToFilter = logsToFilter.filter(log => {
        if (log.userId === currentUser.id) return true; 

        if (log.userRole === UserRole.SISWA &&
            (log.action === ActivityAction.STUDENT_LEFT_EXAM_TAB ||
             log.action === ActivityAction.START_EXAM_ATTEMPT ||
             log.action === ActivityAction.SUBMIT_EXAM ||
             log.action === ActivityAction.VIEW_EXAM_RESULTS || 
             log.action === ActivityAction.LOGIN || 
             log.action === ActivityAction.LOGOUT   
            )
           ) {
          
          if (log.action === ActivityAction.LOGIN || log.action === ActivityAction.LOGOUT) {
            const student = allUsers.find(u => u.id === log.userId);
            if (student && student.classId) {
              return exams.some(ex => 
                ex.creatorId === currentUser.id && 
                ex.classIds.includes(student.classId!) &&
                (ex.subClassIds.length === 0 || (student.subClassId && ex.subClassIds.includes(student.subClassId!)))
              );
            }
            return false;
          }
          
          if (log.targetId && log.targetType === 'Ujian') {
            const examId = log.targetId;
            if (!teacherCreatedExamIds.has(examId)) return false; 

            const examDetails = exams.find(ex => ex.id === examId);
            if (!examDetails) return false;

            const student = allUsers.find(u => u.id === log.userId);
            if (!student || !student.classId) return false; 

            return examDetails.classIds.includes(student.classId) &&
                   (examDetails.subClassIds.length === 0 || (student.subClassId && examDetails.subClassIds.includes(student.subClassId)));
          }
        }
        return false; 
      });
    } else if (currentUser.role === UserRole.WALI_KELAS) {
      const studentIdsInCare = allUsers
        .filter(u => u.role === UserRole.SISWA && u.subClassId === currentUser.subClassId)
        .map(s => s.id);
      logsToFilter = logsToFilter.filter(log => 
        log.userId === currentUser.id || 
        (log.userRole === UserRole.SISWA && studentIdsInCare.includes(log.userId))
      );
    } // For Admin and Kepala Sekolah, logsToFilter remains all activityLogs initially. Further filtering by UI controls applies below.


    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      logsToFilter = logsToFilter.filter(log => 
        log.userName.toLowerCase().includes(term) ||
        (log.targetName && log.targetName.toLowerCase().includes(term)) ||
        (log.details && log.details.toLowerCase().includes(term))
      );
    }
    
    // This role filter applies AFTER the initial role-based log selection for Teacher/Homeroom.
    // For Admin/Principal, it filters from all logs.
    if (filters.userRole) { 
        logsToFilter = logsToFilter.filter(log => log.userRole === filters.userRole);
    }
    
    if (filters.action === COMBINED_CREATE_QUESTION_ACTION) {
        logsToFilter = logsToFilter.filter(log => 
            log.action === ActivityAction.CREATE_QUESTION || 
            log.action === ActivityAction.AI_GENERATE_QUESTION
        );
    } else if (filters.action) {
      logsToFilter = logsToFilter.filter(log => log.action === filters.action);
    }

    if (filters.startDate) {
      try {
        const startDateObj = new Date(filters.startDate);
        startDateObj.setHours(0, 0, 0, 0); 
        logsToFilter = logsToFilter.filter(log => new Date(log.timestamp) >= startDateObj);
      } catch (e) { /* Invalid date string, ignore filter */ }
    }
    if (filters.endDate) {
      try {
        const endDateObj = new Date(filters.endDate);
        endDateObj.setHours(23, 59, 59, 999); 
        logsToFilter = logsToFilter.filter(log => new Date(log.timestamp) <= endDateObj);
      } catch (e) { /* Invalid date string, ignore filter */ }
    }
    return logsToFilter;
  }, [activityLogs, currentUser, filters, allUsers, submissions, exams]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };

  const pageTitle = useMemo(() => 
    currentUser?.role === UserRole.GURU_MAPEL ? "Log Aktivitas" : // Changed from "Log Aktivitas Siswa (Terkait Ujian Anda)"
    currentUser?.role === UserRole.WALI_KELAS ? "Log Aktivitas" : // Changed from "Log Aktivitas Siswa Kelas Bimbingan"
    currentUser?.role === UserRole.KEPALA_SEKOLAH ? "Log Aktivitas" : // Changed from "Log Aktivitas Global Sekolah"
    "Log Aktivitas Sistem" // Default for Admin
  , [currentUser?.role]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">{pageTitle}</h1>
      
      <Card title="Filter Log Aktivitas">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Cari (Nama Pengguna, Target, Detail)"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            placeholder="Masukkan kata kunci..."
            containerClassName="mb-0"
          />
          <Select
            label="Filter Role Pengguna"
            name="userRole"
            options={roleOptions} 
            value={filters.userRole} 
            onChange={handleFilterChange}
            containerClassName="mb-0"
          />
          <Select
            label="Filter Aksi"
            name="action"
            options={actionOptions}
            value={filters.action}
            onChange={handleFilterChange}
            containerClassName="mb-0"
          />
          <Input
            label="Tanggal Mulai"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            containerClassName="mb-0"
          />
          <Input
            label="Tanggal Akhir"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            containerClassName="mb-0"
          />
        </div>
      </Card>

      <Card>
        {paginatedLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Tidak ada log aktivitas yang cocok dengan filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-smkn-blue text-white">
                <tr>
                  <th className="py-2 px-3 text-left">Waktu</th>
                  <th className="py-2 px-3 text-left">Pengguna</th>
                  <th className="py-2 px-3 text-left">Role</th>
                  <th className="py-2 px-3 text-left">Aksi</th>
                  <th className="py-2 px-3 text-left">Target</th>
                  <th className="py-2 px-3 text-left">Detail</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {paginatedLogs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                    <td className="py-2 px-3 whitespace-nowrap">{formatDate(log.timestamp, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td className="py-2 px-3">{log.userName} <span className="text-xs text-gray-500">({log.userId ? log.userId.substring(0,8) : 'N/A'})</span></td>
                    <td className="py-2 px-3">{log.userRole}</td>
                    <td className="py-2 px-3">{log.action}</td>
                    <td className="py-2 px-3">
                      {log.targetType && (
                        <>
                          <span className="font-medium">{log.targetType}:</span> {log.targetName || (log.targetId ? log.targetId.substring(0,15) + (log.targetId.length > 15 ? '...' : '') : '')}
                        </>
                      )}
                    </td>
                    <td className="py-2 px-3">{log.details && log.details.length > 70 ? `${log.details.substring(0, 70)}...` : log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <Button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Sebelumnya
            </Button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages} (Total: {filteredLogs.length} log)
            </span>
            <Button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Berikutnya
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
