
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext'; 
import { User, UserRole, Class, SubClass, Subject, ActivityAction } from '../../types'; // Added ActivityAction
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/common/Input';
import { ICONS, MOCK_PASSWORD } from '../../constants';
import Alert from '../../components/common/Alert';
import { generateId } from '../../utils/helpers';
import * as XLSX from 'xlsx';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const ManageUsersPage: React.FC = () => {
  const { user: loggedInUser } = useAuth(); 
  const { users, addUser, updateUser, deleteUser, classes, subClasses, subjects, addActivityLog } = useData(); // Added addActivityLog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelUploadError, setExcelUploadError] = useState<string | null>(null);
  const [excelUploadSuccess, setExcelUploadSuccess] = useState<string | null>(null);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [isConfirmResetPasswordModalOpen, setIsConfirmResetPasswordModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);


  const modalInputClassName = "bg-gray-700 text-white placeholder-gray-300 border-gray-600 focus:border-smkn-blue";
  const modalSelectClassName = "bg-gray-700 text-white border-gray-600 focus:border-smkn-blue";


  const openModal = (user: Partial<User> | null = null) => {
    let initialUserState: Partial<User> = { role: UserRole.SISWA, password: MOCK_PASSWORD };
    if (user) {
        initialUserState = { ...user };
    } else if (loggedInUser?.role === UserRole.WALI_KELAS) {
        initialUserState = {
            role: UserRole.SISWA,
            password: MOCK_PASSWORD,
            classId: loggedInUser.classId,
            subClassId: loggedInUser.subClassId,
        };
    }
    setCurrentUser(initialUserState);
    setFormError(null);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, fieldName: keyof User) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setCurrentUser(prev => prev ? { ...prev, [fieldName]: selectedOptions } : null);
  };

  const handleSubmit = () => {
    setFormError(null);
    if (!currentUser || !currentUser.username || !currentUser.name || !currentUser.role || !loggedInUser) {
      setFormError("Nama, Username/NIP/NIS, dan Role harus diisi. Aktor tidak terdefinisi.");
      return;
    }
    if (!currentUser.id && !currentUser.password) {
        setFormError("Password harus diisi untuk pengguna baru.");
        return;
    }
     if (loggedInUser?.role === UserRole.WALI_KELAS && currentUser.role !== UserRole.SISWA) {
        setFormError("Wali Kelas hanya dapat menambah/mengedit pengguna dengan role Siswa.");
        return;
    }
    if (loggedInUser?.role === UserRole.WALI_KELAS && 
        (currentUser.classId !== loggedInUser.classId || currentUser.subClassId !== loggedInUser.subClassId)) {
        setFormError(`Siswa harus berada di kelas ${loggedInUser.classId} dan sub-kelas ${loggedInUser.subClassId} yang Anda ampu.`);
        return;
    }


    try {
      if (currentUser.id) {
        updateUser(currentUser as User, loggedInUser);
        setSuccessMessage("Data pengguna berhasil diperbarui.");
      } else {
        addUser({ ...currentUser, id: generateId('user') } as User, loggedInUser);
        setSuccessMessage("Pengguna baru berhasil ditambahkan.");
      }
      closeModal();
    } catch (e: any) {
      setFormError(e.message || "Gagal menyimpan data pengguna.");
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteRequest = (user: User) => {
    setUserToDelete(user);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete || !loggedInUser) return;
    const userName = userToDelete.name;
    setSuccessMessage(null); 
    setFormError(null); 
    try {
      deleteUser(userToDelete.id, loggedInUser); 
      setSuccessMessage(`Pengguna "${userName}" berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setFormError(e.message || `Gagal menghapus pengguna "${userName}". Terjadi kesalahan internal.`);
      setTimeout(() => setFormError(null), 3000);
    }
    setIsConfirmDeleteModalOpen(false);
    setUserToDelete(null);
  };
  
  const handleResetPasswordRequest = (user: User) => {
    setUserToResetPassword(user);
    setIsConfirmResetPasswordModalOpen(true);
  };

  const confirmResetPassword = () => {
    if (!userToResetPassword || !loggedInUser) return;
    try {
      updateUser({ ...userToResetPassword, password: MOCK_PASSWORD }, loggedInUser);
      setSuccessMessage(`Password untuk ${userToResetPassword.name} berhasil direset ke default.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any)      {
      setFormError(e.message || "Gagal mereset password.");
      setTimeout(() => setFormError(null), 3000);
    }
    setIsConfirmResetPasswordModalOpen(false);
    setUserToResetPassword(null);
  };


  const filteredUsers = users.filter(user => {
    let isVisibleToWaliKelas = true;
    if (loggedInUser?.role === UserRole.WALI_KELAS) {
        isVisibleToWaliKelas = user.role === UserRole.SISWA && user.subClassId === loggedInUser.subClassId;
    }
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = (loggedInUser?.role === UserRole.WALI_KELAS || !filterRole) ? true : user.role === filterRole; 
    return isVisibleToWaliKelas && matchesSearch && matchesRole;
  });

  const roleOptions = Object.values(UserRole).map(role => ({ value: role, label: role }));
  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));
  const subClassOptions = (classId?: string) => 
    subClasses.filter(sc => !classId || sc.classId === classId).map(sc => ({ value: sc.id, label: sc.name }));
  const subjectOptions = subjects.map(s => ({ value: s.id, label: s.name }));

  const openExcelUploadModal = () => {
    setExcelFile(null);
    setExcelUploadError(null);
    setExcelUploadSuccess(null);
    setProcessingErrors([]);
    setIsExcelUploadModalOpen(true);
  };
  const closeExcelUploadModal = () => setIsExcelUploadModalOpen(false);

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
      setExcelUploadError(null);
    }
  };

  const handleProcessExcelFile = async () => {
    if (!excelFile || !loggedInUser) {
      setExcelUploadError("Silakan pilih file Excel terlebih dahulu. Aktor tidak terdefinisi.");
      return;
    }
    setIsProcessingExcel(true);
    setExcelUploadError(null);
    setExcelUploadSuccess(null);
    setProcessingErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Gagal membaca file.");
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        let addedCount = 0;
        const currentErrors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowIndex = i + 2; 

          const { NamaLengkap, UsernameNIPNIS, Password, Role, NamaKelas, NamaSubKelas, NamaMapel } = row;

          if (!NamaLengkap || !UsernameNIPNIS || !Role) {
            currentErrors.push(`Baris ${rowIndex}: NamaLengkap, UsernameNIPNIS, dan Role wajib diisi.`);
            continue;
          }

          const role = Role as UserRole;
          if (!Object.values(UserRole).includes(role)) {
            currentErrors.push(`Baris ${rowIndex}: Role '${Role}' tidak valid.`);
            continue;
          }
          
          const newUser: Partial<User> = {
            name: NamaLengkap,
            username: UsernameNIPNIS,
            password: Password || MOCK_PASSWORD,
            role: role,
          };

          if (role === UserRole.SISWA || role === UserRole.WALI_KELAS) {
            if (!NamaKelas) {
              currentErrors.push(`Baris ${rowIndex}: NamaKelas wajib diisi untuk role ${role}.`);
              continue;
            }
            const foundClass = classes.find(c => c.name.toLowerCase() === NamaKelas.toLowerCase());
            if (!foundClass) {
              currentErrors.push(`Baris ${rowIndex}: Kelas '${NamaKelas}' tidak ditemukan.`);
              continue;
            }
            newUser.classId = foundClass.id;

            if (role === UserRole.SISWA || (role === UserRole.WALI_KELAS && NamaSubKelas)) { 
              if (!NamaSubKelas) {
                 currentErrors.push(`Baris ${rowIndex}: NamaSubKelas wajib diisi untuk role Siswa (dan opsional untuk Wali Kelas jika spesifik).`);
                 if (role === UserRole.SISWA) continue;
              } else {
                const foundSubClass = subClasses.find(sc => sc.name.toLowerCase() === NamaSubKelas.toLowerCase() && sc.classId === foundClass.id);
                if (!foundSubClass) {
                  currentErrors.push(`Baris ${rowIndex}: Sub Kelas '${NamaSubKelas}' untuk kelas '${NamaKelas}' tidak ditemukan.`);
                  if (role === UserRole.SISWA) continue; 
                } else {
                    newUser.subClassId = foundSubClass.id;
                }
              }
            }
          }

          if (role === UserRole.GURU_MAPEL) {
            if (!NamaMapel) {
              currentErrors.push(`Baris ${rowIndex}: NamaMapel wajib diisi untuk Guru Mata Pelajaran.`);
              continue;
            }
            const mapelNames = NamaMapel.split(',').map((m: string) => m.trim().toLowerCase());
            const subjectIds: string[] = [];
            let mapelNotFound = false;
            mapelNames.forEach((mn: string) => {
              const foundSubject = subjects.find(s => s.name.toLowerCase() === mn);
              if (foundSubject) {
                subjectIds.push(foundSubject.id);
              } else {
                currentErrors.push(`Baris ${rowIndex}: Mata Pelajaran '${mn}' tidak ditemukan.`);
                mapelNotFound = true;
              }
            });
            if (mapelNotFound || subjectIds.length === 0) continue;
            newUser.subjectIds = subjectIds;
          }
          
          if (users.some(u => u.username.toLowerCase() === UsernameNIPNIS.toLowerCase())) {
              currentErrors.push(`Baris ${rowIndex}: Username/NIP/NIS '${UsernameNIPNIS}' sudah terdaftar.`);
              continue;
          }

          addUser({ ...newUser, id: generateId('user-excel') } as User, loggedInUser); // Pass actor
          addedCount++;
        }

        if (addedCount > 0) {
          addActivityLog({ action: ActivityAction.IMPORT_USERS_EXCEL, details: `Berhasil menambah ${addedCount} pengguna dari Excel. Kesalahan: ${currentErrors.length}.`, targetType: 'Sistem' }, loggedInUser);
          setExcelUploadSuccess(`${addedCount} pengguna berhasil ditambahkan.`);
        }
        setProcessingErrors(currentErrors);
        if (currentErrors.length > 0) {
          setExcelUploadError(`Terjadi ${currentErrors.length} kesalahan saat memproses file. Lihat detail di bawah.`);
        }

      } catch (error: any) {
        console.error("Error processing Excel file:", error);
        setExcelUploadError(`Gagal memproses file Excel: ${error.message}`);
        addActivityLog({ action: ActivityAction.IMPORT_USERS_EXCEL, details: `Gagal memproses file: ${error.message}`, targetType: 'Sistem' }, loggedInUser);
        setProcessingErrors([]);
      } finally {
        setIsProcessingExcel(false);
      }
    };
    reader.readAsBinaryString(excelFile);
  };

  const handleDownloadTemplate = () => {
    const headers = ["NamaLengkap", "UsernameNIPNIS", "Password", "Role", "NamaKelas", "NamaSubKelas", "NamaMapel"];
    const sampleData = [ "Contoh Siswa", "NISN00X", MOCK_PASSWORD, UserRole.SISWA, "X", "X TKJ 1", "" ];
    const sampleGuru = [ "Contoh Guru", "NIP00X", MOCK_PASSWORD, UserRole.GURU_MAPEL, "", "", "Matematika,Fisika" ];
    const sampleAdmin = [ "Contoh Admin", "admin.contoh@smkn73.id", MOCK_PASSWORD, UserRole.ADMIN, "", "", "" ];
    const data = [headers, sampleData, sampleGuru, sampleAdmin];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Pengguna");
    XLSX.writeFile(workbook, "template_pengguna_smkn73.xlsx");
  };

  const isWaliKelas = loggedInUser?.role === UserRole.WALI_KELAS;

  const getClassDisplayString = (userClassId?: string, userSubClassId?: string): string => {
    const subClassName = subClasses.find(sc => sc.id === userSubClassId)?.name || '';
    if (subClassName) return subClassName;
    const className = classes.find(c => c.id === userClassId)?.name || '';
    if (className) return className;
    return '';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">
        {isWaliKelas ? `Kelola Siswa Kelas ${subClasses.find(sc => sc.id === loggedInUser?.subClassId)?.name || ''}` : 'Kelola Pengguna'}
      </h1>
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <Input 
              type="text" 
              placeholder={isWaliKelas ? "Cari siswa..." : "Cari pengguna..."}
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="flex-grow mb-0"
            />
            {!isWaliKelas && (
              <Select
                options={[{value: "", label: "Semua Role"}, ...roleOptions]}
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
                containerClassName="w-48 mb-0"
              />
            )}
          </div>
          <div className="flex gap-2">
            {!isWaliKelas && (
              <Button onClick={openExcelUploadModal} leftIcon={ICONS.upload} variant="secondary">
                Tambah via Excel
              </Button>
            )}
            <Button onClick={() => openModal(null)} leftIcon={ICONS.add} variant="primary">
              {isWaliKelas ? "Tambah Siswa" : "Tambah Pengguna"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-smkn-blue text-white">
              <tr>
                <th className="py-3 px-4 text-left">Nama</th>
                <th className="py-3 px-4 text-left">Username/NIP/NIS</th>
                {!isWaliKelas && <th className="py-3 px-4 text-left">Role</th>}
                <th className="py-3 px-4 text-left">Kelas/Mapel</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b hover:bg-smkn-gray-light transition-colors">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.username}</td>
                  {!isWaliKelas && <td className="py-3 px-4">{user.role}</td>}
                  <td className="py-3 px-4">
                    {(user.role === UserRole.SISWA || (user.role === UserRole.WALI_KELAS && !isWaliKelas)) ? 
                      getClassDisplayString(user.classId, user.subClassId)
                      : ''}
                    {user.role === UserRole.GURU_MAPEL && !isWaliKelas ? 
                      user.subjectIds?.map(id => subjects.find(s=>s.id === id)?.name).join(', ') || 'Belum ada mapel'
                      : ''}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => openModal(user)} leftIcon={ICONS.edit} className="mr-2 text-blue-600 hover:text-blue-800">Edit</Button>
                    {isWaliKelas && user.role === UserRole.SISWA && (
                         <Button size="sm" variant="ghost" onClick={() => handleResetPasswordRequest(user)} leftIcon={ICONS.key} className="mr-2 text-orange-500 hover:text-orange-700">Reset Pass</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRequest(user)} leftIcon={ICONS.delete} className="text-red-600 hover:text-red-800">Hapus</Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={isWaliKelas ? 4 : 5} className="text-center py-4">{isWaliKelas ? "Tidak ada siswa di kelas Anda." : "Tidak ada pengguna yang cocok."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && currentUser && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={currentUser.id ? (isWaliKelas ? 'Edit Siswa' : 'Edit Pengguna') : (isWaliKelas ? 'Tambah Siswa Baru' : 'Tambah Pengguna Baru')}>
          {formError && <Alert type="error" message={formError} onClose={()=>setFormError(null)}/>}
          <Input label="Nama Lengkap" name="name" value={currentUser.name || ''} onChange={handleInputChange} required className={modalInputClassName} containerClassName="text-gray-300"/>
          <Input label={isWaliKelas ? "NIS/NISN" : "Username/NIP/NIS"} name="username" value={currentUser.username || ''} onChange={handleInputChange} required className={modalInputClassName} containerClassName="text-gray-300"/>
          {!currentUser.id && <Input label="Password" name="password" type="password" value={currentUser.password || ''} onChange={handleInputChange} required className={modalInputClassName} containerClassName="text-gray-300"/>}
          
          <Select 
            label="Role Pengguna" 
            name="role" 
            options={isWaliKelas ? [{value: UserRole.SISWA, label: UserRole.SISWA}] : roleOptions} 
            value={currentUser.role || ''} 
            onChange={handleInputChange} 
            required 
            className={modalSelectClassName} 
            containerClassName="text-gray-300"
            disabled={isWaliKelas && !currentUser.id} 
          />

          {(currentUser.role === UserRole.SISWA || (currentUser.role === UserRole.WALI_KELAS && !isWaliKelas)) && (
            <>
              <Select 
                label="Kelas" 
                name="classId" 
                options={classOptions} 
                value={currentUser.classId || ''} 
                onChange={handleInputChange} 
                className={modalSelectClassName} 
                containerClassName="text-gray-300"
                disabled={isWaliKelas}
              />
              {currentUser.classId && (currentUser.role === UserRole.SISWA || currentUser.role === UserRole.WALI_KELAS) && ( 
                <Select 
                    label="Sub Kelas" 
                    name="subClassId" 
                    options={subClassOptions(currentUser.classId)} 
                    value={currentUser.subClassId || ''} 
                    onChange={handleInputChange} 
                    className={modalSelectClassName} 
                    containerClassName="text-gray-300"
                    disabled={isWaliKelas}
                />
              )}
            </>
          )}
          {currentUser.role === UserRole.GURU_MAPEL && !isWaliKelas && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Mata Pelajaran (pilih satu atau lebih)</label>
              <select
                name="subjectIds"
                multiple
                value={currentUser.subjectIds || []}
                onChange={(e) => handleMultiSelectChange(e, 'subjectIds')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue sm:text-sm h-32 ${modalSelectClassName}`}
              >
                {subjectOptions.map(opt => <option key={opt.value} value={opt.value} className="text-white bg-gray-600 p-1">{opt.label}</option>)}
              </select>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={closeModal}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>Simpan</Button>
          </div>
        </Modal>
      )}

      {!isWaliKelas && isExcelUploadModalOpen && (
        <Modal isOpen={isExcelUploadModalOpen} onClose={closeExcelUploadModal} title="Tambah Pengguna Massal via Excel" size="lg">
          {excelUploadError && <Alert type="error" message={excelUploadError} onClose={() => setExcelUploadError(null)} />}
          {excelUploadSuccess && <Alert type="success" message={excelUploadSuccess} onClose={() => setExcelUploadSuccess(null)} />}
          {processingErrors.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto p-2 border border-red-300 bg-red-50 rounded">
              <p className="font-semibold text-red-700">Detail Kesalahan:</p>
              <ul className="list-disc list-inside text-xs text-red-600">
                {processingErrors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="excelFile" className="block text-sm font-medium text-gray-700 mb-1">Pilih File Excel (.xlsx, .xls):</label>
              <input 
                type="file" 
                id="excelFile" 
                accept=".xlsx, .xls" 
                onChange={handleExcelFileChange} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-smkn-blue file:text-white hover:file:bg-smkn-blue-dark"
              />
            </div>
            
            <div className="p-3 bg-gray-100 rounded-md text-xs">
              <h4 className="font-semibold text-smkn-text mb-1">Panduan Format Excel:</h4>
              <p>Pastikan file Excel Anda memiliki kolom berikut (header pada baris pertama):</p>
              <ul className="list-disc list-inside ml-4 space-y-0.5">
                <li><strong>NamaLengkap</strong> (Teks, wajib)</li>
                <li><strong>UsernameNIPNIS</strong> (Teks, unik, wajib. Untuk Admin: username/email; Staf/Guru: NIP; Siswa: NIS/NISN)</li>
                <li><strong>Password</strong> (Teks, opsional. Jika kosong, default: '{MOCK_PASSWORD}')</li>
                <li><strong>Role</strong> (Teks, wajib. Pilihan: Admin, Guru Mata Pelajaran, Wakil Kurikulum, Wali Kelas, Kepala Sekolah, Siswa)</li>
                <li><strong>NamaKelas</strong> (Teks. Wajib jika Role Siswa/Wali Kelas. Contoh: X, XI, XII)</li>
                <li><strong>NamaSubKelas</strong> (Teks. Wajib jika Role Siswa. Opsional untuk Wali Kelas jika spesifik. Pastikan NamaKelas diisi)</li>
                <li><strong>NamaMapel</strong> (Teks, pisahkan dengan koma jika lebih dari satu. Contoh: Matematika, Fisika. Wajib jika Role Guru Mata Pelajaran)</li>
              </ul>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleDownloadTemplate}>
                <i className={`${ICONS.download} mr-1`}></i> Unduh Template Excel (Contoh)
              </Button>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="secondary" onClick={closeExcelUploadModal} disabled={isProcessingExcel}>Batal</Button>
              <Button variant="primary" onClick={handleProcessExcelFile} isLoading={isProcessingExcel} disabled={!excelFile || isProcessingExcel}>
                Unggah dan Proses
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {userToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => { setIsConfirmDeleteModalOpen(false); setUserToDelete(null); }}
          onConfirm={confirmDeleteUser}
          title="Konfirmasi Penghapusan Pengguna"
          message={
            <>
              <p>Apakah Anda yakin ingin menghapus pengguna <strong>{userToDelete.name}</strong> ({userToDelete.username})?</p>
              <p className="mt-2 text-sm text-red-700">Tindakan ini tidak dapat diurungkan. Semua data terkait pengguna ini (seperti submisi ujian jika ini adalah siswa) juga akan terhapus.</p>
            </>
          }
          confirmButtonText="Ya, Hapus Pengguna"
          confirmButtonVariant="danger"
          confirmButtonIcon={ICONS.delete}
        />
      )}
      
      {userToResetPassword && (
        <ConfirmationModal
          isOpen={isConfirmResetPasswordModalOpen}
          onClose={() => { setIsConfirmResetPasswordModalOpen(false); setUserToResetPassword(null); }}
          onConfirm={confirmResetPassword}
          title="Konfirmasi Reset Password"
          message={
            <p>Apakah Anda yakin ingin mereset password untuk siswa <strong>{userToResetPassword.name}</strong> ({userToResetPassword.username}) ke password default ({MOCK_PASSWORD})?</p>
          }
          confirmButtonText="Ya, Reset Password"
          confirmButtonVariant="warning"
          confirmButtonIcon={ICONS.key}
        />
      )}

    </div>
  );
};

export default ManageUsersPage;
