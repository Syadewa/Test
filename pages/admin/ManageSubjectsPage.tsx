
import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { Subject, Class, SubClass, User, UserRole, ActivityAction } from '../../types'; // Import ActivityAction
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/common/Input';
import { ICONS } from '../../constants';
import Alert from '../../components/common/Alert';
import { generateId } from '../../utils/helpers';
import ConfirmationModal from '../../components/common/ConfirmationModal';

type ActiveTab = 'kelas' | 'subkelas' | 'mapel';

const ManageSubjectsPage: React.FC = () => {
  const { user: loggedInUser } = useAuth(); // Get loggedInUser
  const { 
    subjects, addSubject, updateSubject, deleteSubject,
    classes, addClass, updateClass, deleteClass,
    subClasses, addSubClass, updateSubClass, deleteSubClass,
    users, addActivityLog // Import addActivityLog
  } = useData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('kelas');
  
  const [kelasSearchTerm, setKelasSearchTerm] = useState('');
  
  const [subKelasSearchTerm, setSubKelasSearchTerm] = useState('');
  const [subKelasFilterKelasInduk, setSubKelasFilterKelasInduk] = useState('');
  const [subKelasFilterWali, setSubKelasFilterWali] = useState('');

  const [mapelSearchTerm, setMapelSearchTerm] = useState('');
  const [mapelFilterKelasAjar, setMapelFilterKelasAjar] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'kelas' | 'subkelas' | 'mapel' | null>(null);
  const [currentItem, setCurrentItem] = useState<Partial<Class | SubClass | Subject> | null>(null);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'kelas' | 'subkelas' | 'mapel', id: string, name: string} | null>(null);
  
  const modalInputClassName = "bg-gray-700 text-white placeholder-gray-300 border-gray-600 focus:border-smkn-blue";
  const modalSelectClassName = "bg-gray-700 text-white border-gray-600 focus:border-smkn-blue";
  const modalLabelClassName = "text-gray-300";

  const getDisplayableItemName = (item: Partial<Class | SubClass | Subject> | Class | SubClass | Subject | undefined): string => {
    return item?.name || 'N/A';
  };

  const potentialWaliKelasOptions = useMemo(() => {
    return [{ value: '', label: 'Pilih Wali Kelas (Opsional)' }, 
            ...users.filter(u => u.role === UserRole.WALI_KELAS || u.role === UserRole.GURU_MAPEL)
                    .map(u => ({ value: u.id, label: u.name }))
                    .sort((a, b) => a.label.localeCompare(b.label))
           ];
  }, [users]);
  
  const guruMapelOptions = users.filter(u => u.role === UserRole.GURU_MAPEL).map(u => ({ value: u.id, label: u.name }));
  const kelasIndukOptions = [{ value: '', label: 'Semua Kelas Induk' }, ...classes.map(c => ({ value: c.id, label: getDisplayableItemName(c) }))];
  const kelasAjarOptions = [{ value: '', label: 'Semua Kelas Ajar' }, ...classes.map(c => ({ value: c.id, label: getDisplayableItemName(c) }))];
  
  const getClassColor = (className: string): string => {
    const nameLower = className.toLowerCase();
    if (nameLower.includes('xii')) return 'bg-purple-100 border-purple-500';
    if (nameLower.includes('xi')) return 'bg-green-100 border-green-500';
    if (nameLower.includes('x') && !nameLower.includes('xi')) return 'bg-blue-100 border-blue-500';
    return 'bg-gray-100 border-gray-400';
  };

  const getStudentCountForSubClass = useCallback((subClassId: string): number => {
    return users.filter(u => u.role === UserRole.SISWA && u.subClassId === subClassId).length;
  }, [users]);

  const openModal = (type: 'kelas' | 'subkelas' | 'mapel', item: Partial<Class | SubClass | Subject> | null = null) => {
    setModalType(type);
    let initialItem: Partial<Class | SubClass | Subject> = {};
    if (item) {
        initialItem = { ...item };
    }
    if (type === 'mapel') {
        initialItem = { ...initialItem, classIds: (initialItem as Subject).classIds || [] };
    } else if (type === 'subkelas' && !item) {
        initialItem = { name: '', classId: classes[0]?.id || '', waliKelasId: '' };
    } else if (type === 'kelas' && !item) {
        initialItem = { name: '' };
    }
    setCurrentItem(initialItem);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setCurrentItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setCurrentItem(prev => prev ? { ...prev, classIds: selectedOptions } : null);
  };

  const handleSubmit = () => {
    setFormError(null);
    if (!currentItem || !currentItem.name || !loggedInUser) {
      setFormError(`Nama untuk ${modalType} harus diisi. Aktor tidak terdefinisi.`);
      return;
    }

    try {
      if (modalType === 'kelas') {
        const classData = currentItem as Partial<Class>;
        if (classData.id) {
          updateClass(classData as Class, loggedInUser);
          setSuccessMessage("Kelas Utama berhasil diperbarui.");
        } else {
          addClass({ name: classData.name! }, loggedInUser);
          setSuccessMessage("Kelas Utama baru berhasil ditambahkan.");
        }
      } else if (modalType === 'subkelas') {
        const subClassData = currentItem as Partial<SubClass>;
        if (!subClassData.classId) { setFormError("Kelas Induk harus dipilih."); return; }
        const dataToSave : Omit<SubClass, 'id'> & {id?: string} = {
            name: subClassData.name!,
            classId: subClassData.classId!,
            waliKelasId: subClassData.waliKelasId || undefined,
        };
        if (subClassData.id) {
            dataToSave.id = subClassData.id;
            updateSubClass(dataToSave as SubClass, loggedInUser);
            setSuccessMessage("Sub Kelas berhasil diperbarui.");
        } else {
            addSubClass(dataToSave as Omit<SubClass, 'id'>, loggedInUser);
            setSuccessMessage("Sub Kelas baru berhasil ditambahkan.");
        }
      } else if (modalType === 'mapel') {
        const subjectData = currentItem as Partial<Subject>;
        if (!subjectData.classIds || subjectData.classIds.length === 0) {
          setFormError("Minimal satu Kelas target pengajaran harus dipilih untuk Mata Pelajaran.");
          return;
        }
        if (subjectData.id) {
          updateSubject(subjectData as Subject, loggedInUser);
          setSuccessMessage("Mata Pelajaran berhasil diperbarui.");
        } else {
          addSubject({ ...subjectData, id: generateId('subject') } as Subject, loggedInUser);
          setSuccessMessage("Mata Pelajaran baru berhasil ditambahkan.");
        }
      }
      closeModal();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setFormError(error.message || "Terjadi kesalahan saat menyimpan data.");
    }
  };

  const handleDeleteRequest = (type: 'kelas' | 'subkelas' | 'mapel', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete || !loggedInUser) return;
    const { type, id, name } = itemToDelete;
    try {
      if (type === 'kelas') deleteClass(id, loggedInUser);
      else if (type === 'subkelas') deleteSubClass(id, loggedInUser);
      else if (type === 'mapel') deleteSubject(id, loggedInUser);
      setSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} "${name}" berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setFormError(error.message || `Gagal menghapus ${type} "${name}".`);
      setTimeout(() => setFormError(null), 3000);
    }
    setIsConfirmDeleteOpen(false);
    setItemToDelete(null);
  };


  const filteredKelas = useMemo(() => {
    return classes.filter(k => 
      (getDisplayableItemName(k).toLowerCase().includes(kelasSearchTerm.toLowerCase()))
    ).sort((a,b) => getDisplayableItemName(a).localeCompare(getDisplayableItemName(b)));
  }, [classes, kelasSearchTerm]);

  const filteredSubKelas = useMemo(() => {
    return subClasses.filter(sk =>
      (getDisplayableItemName(sk).toLowerCase().includes(subKelasSearchTerm.toLowerCase())) &&
      (subKelasFilterKelasInduk ? sk.classId === subKelasFilterKelasInduk : true) &&
      (subKelasFilterWali ? sk.waliKelasId === subKelasFilterWali : true)
    ).sort((a,b) => getDisplayableItemName(a).localeCompare(getDisplayableItemName(b)));
  }, [subClasses, subKelasSearchTerm, subKelasFilterKelasInduk, subKelasFilterWali]);

  const filteredMapel = useMemo(() => {
    return subjects.filter(m =>
      (getDisplayableItemName(m).toLowerCase().includes(mapelSearchTerm.toLowerCase())) &&
      (mapelFilterKelasAjar ? m.classIds.includes(mapelFilterKelasAjar) : true)
    ).sort((a,b) => getDisplayableItemName(a).localeCompare(getDisplayableItemName(b)));
  }, [subjects, mapelSearchTerm, mapelFilterKelasAjar]);


  const renderKelasTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input type="text" placeholder="Cari Nama Kelas Utama..." value={kelasSearchTerm} onChange={e => setKelasSearchTerm(e.target.value)} containerClassName="flex-grow mb-0" />
        <Button onClick={() => openModal('kelas')} leftIcon={ICONS.add} variant="primary" className="w-full sm:w-auto">Tambah Kelas Utama</Button>
      </div>
      {filteredKelas.length === 0 && <p className="text-center text-gray-500 py-4">Tidak ada Kelas Utama yang cocok dengan filter atau belum ada data.</p>}
      
      {filteredKelas.map(k => {
        const subKelasInThisKelas = subClasses.filter(sk => sk.classId === k.id).sort((a,b) => getDisplayableItemName(a).localeCompare(getDisplayableItemName(b)));
        return (
          <div key={k.id} className={`p-4 rounded-lg border-2 ${getClassColor(getDisplayableItemName(k))}`}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold text-gray-700">{getDisplayableItemName(k)}</h2>
              <div>
                <Button size="sm" variant="ghost" onClick={() => openModal('kelas', k)} className="!p-1 text-blue-600 hover:bg-blue-200 mr-1"><i className={ICONS.edit}></i> Edit Nama</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteRequest('kelas', k.id, getDisplayableItemName(k))} className="!p-1 text-red-600 hover:bg-red-200"><i className={ICONS.delete}></i> Hapus Kelas</Button>
              </div>
            </div>
            {subKelasInThisKelas.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-3">Belum ada Sub Kelas untuk {getDisplayableItemName(k)}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subKelasInThisKelas.map(sk => {
                  const wali = users.find(u => u.id === sk.waliKelasId);
                  const studentCount = getStudentCountForSubClass(sk.id);
                  return (
                    <Card key={sk.id} className="bg-white shadow-md relative group !p-0">
                       <div className={`p-4`}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1 z-10">
                            <Button size="sm" variant="ghost" onClick={() => openModal('subkelas', sk)} className="!p-1 text-blue-700 bg-white/80 hover:bg-blue-100 rounded-full shadow"><i className={ICONS.edit}></i></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteRequest('subkelas', sk.id, getDisplayableItemName(sk))} className="!p-1 text-red-700 bg-white/80 hover:bg-red-100 rounded-full shadow"><i className={ICONS.delete}></i></Button>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{getDisplayableItemName(sk)}</h3>
                        {wali ? (
                            <p className="text-xs text-gray-600">Wali: {getDisplayableItemName(wali)}</p>
                        ) : (
                            <p className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded inline-flex items-center"><i className={`${ICONS.warning} mr-1`}></i> Wali belum ada</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">Jumlah Siswa: {studentCount}</p>
                       </div>
                    </Card>
                  );
                })}
              </div>
            )}
             <Button 
                onClick={() => openModal('subkelas', { classId: k.id })} 
                leftIcon={ICONS.add} 
                variant="ghost" 
                size="sm" 
                className="mt-3 text-smkn-blue hover:bg-smkn-blue/10">
                Tambah Sub Kelas untuk {getDisplayableItemName(k)}
            </Button>
          </div>
        );
      })}
    </div>
  );

  const renderSubKelasTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input type="text" placeholder="Cari Nama Sub Kelas..." value={subKelasSearchTerm} onChange={e => setSubKelasSearchTerm(e.target.value)} containerClassName="flex-grow mb-0" />
        <Select options={kelasIndukOptions} value={subKelasFilterKelasInduk} onChange={e => setSubKelasFilterKelasInduk(e.target.value)} containerClassName="sm:w-52 mb-0" />
        <Select 
            label="Filter Wali Kelas"
            options={potentialWaliKelasOptions} 
            value={subKelasFilterWali} 
            onChange={e => setSubKelasFilterWali(e.target.value)} 
            containerClassName="sm:w-52 mb-0"
            labelClassName="text-gray-700"
        />
        <Button onClick={() => openModal('subkelas')} leftIcon={ICONS.add} variant="primary" className="w-full sm:w-auto" disabled={classes.length === 0}>Tambah Sub Kelas</Button>
      </div>
      {classes.length === 0 && <Alert type="warning" message="Harap tambahkan Kelas Utama terlebih dahulu sebelum menambahkan Sub Kelas." />}
      {filteredSubKelas.length === 0 && classes.length > 0 && <p className="text-center text-gray-500 py-4">Tidak ada Sub Kelas yang cocok dengan filter.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubKelas.map(sk => {
          const kelasInduk = classes.find(k => k.id === sk.classId);
          const wali = users.find(u => u.id === sk.waliKelasId);
          const studentCount = getStudentCountForSubClass(sk.id);
          return (
            <Card key={sk.id} className={`bg-white border relative group !p-0`}>
              <div className={`p-4`}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1 z-10">
                    <Button size="sm" variant="ghost" onClick={() => openModal('subkelas', sk)} className="!p-1 text-blue-700 bg-white/80 hover:bg-blue-100 rounded-full shadow"><i className={ICONS.edit}></i></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRequest('subkelas', sk.id, getDisplayableItemName(sk))} className="!p-1 text-red-700 bg-white/80 hover:bg-red-100 rounded-full shadow"><i className={ICONS.delete}></i></Button>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{getDisplayableItemName(sk)}</h3>
                <p className="text-xs text-gray-600">Kelas Induk: {getDisplayableItemName(kelasInduk)}</p>
                {wali ? (
                    <p className="text-xs text-gray-600">Wali: {getDisplayableItemName(wali)}</p>
                ) : (
                    <p className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded inline-flex items-center"><i className={`${ICONS.warning} mr-1`}></i> Wali belum ada</p>
                )}
                <p className="text-xs text-gray-600 mt-1">Jumlah Siswa: {studentCount}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderMapelTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input type="text" placeholder="Cari Nama Mata Pelajaran..." value={mapelSearchTerm} onChange={e => setMapelSearchTerm(e.target.value)} containerClassName="flex-grow mb-0" />
        <Select options={kelasAjarOptions} value={mapelFilterKelasAjar} onChange={e => setMapelFilterKelasAjar(e.target.value)} containerClassName="sm:w-64 mb-0" />
        <Button onClick={() => openModal('mapel')} leftIcon={ICONS.add} variant="primary" className="w-full sm:w-auto" disabled={classes.length === 0}>Tambah Mapel</Button>
      </div>
      {classes.length === 0 && <Alert type="warning" message="Harap tambahkan Kelas Utama terlebih dahulu sebelum menambahkan Mata Pelajaran." />}
      {filteredMapel.length === 0 && classes.length > 0 && <p className="text-center text-gray-500 py-4">Tidak ada Mata Pelajaran yang cocok dengan filter.</p>}
      {filteredMapel.length > 0 && (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full">
            <thead className="bg-smkn-blue text-white">
              <tr>
                <th className="py-3 px-4 text-left">Nama Mapel</th>
                <th className="py-3 px-4 text-left">Guru Pengampu</th>
                <th className="py-3 px-4 text-left">Diajarkan di Kelas Utama</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {filteredMapel.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{getDisplayableItemName(m)}</td>
                  <td className="py-3 px-4">{users.find(u => u.id === m.guruMapelId)?.name || <span className="italic text-gray-400">Belum ada</span>}</td>
                  <td className="py-3 px-4">{m.classIds.map(cid => getDisplayableItemName(classes.find(c => c.id === cid))).join(', ')}</td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="ghost" onClick={() => openModal('mapel', m)} leftIcon={ICONS.edit} className="mr-2 text-blue-600 hover:text-blue-800">Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRequest('mapel', m.id, getDisplayableItemName(m))} leftIcon={ICONS.delete} className="text-red-600 hover:text-red-800">Hapus</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  
  const renderModalContent = () => {
    if (!modalType || !currentItem) return null;

    switch (modalType) {
      case 'kelas':
        const cls = currentItem as Partial<Class>;
        return (
          <>
            <Input label="Nama Kelas Utama (Contoh: X, XI, XII)" name="name" value={cls.name || ''} onChange={handleInputChange} required className={modalInputClassName} labelClassName={modalLabelClassName} />
          </>
        );
      case 'subkelas':
        const subCls = currentItem as Partial<SubClass>;
        return (
          <>
            <Select label="Pilih Kelas Induk (Wajib)" name="classId" options={classes.map(c=>({value: c.id, label: getDisplayableItemName(c)}))} value={subCls.classId || ''} onChange={handleInputChange} required className={modalSelectClassName} labelClassName={modalLabelClassName} />
            <Input label="Nama Sub Kelas (Contoh: X TKJ 1)" name="name" value={subCls.name || ''} onChange={handleInputChange} required className={modalInputClassName} labelClassName={modalLabelClassName} />
            <Select label="Wali Kelas (Opsional)" name="waliKelasId" options={potentialWaliKelasOptions} value={subCls.waliKelasId || ''} onChange={handleInputChange} className={modalSelectClassName} labelClassName={modalLabelClassName} />
          </>
        );
      case 'mapel':
        const mapel = currentItem as Partial<Subject>;
        return (
          <>
            <Input label="Nama Mata Pelajaran" name="name" value={mapel.name || ''} onChange={handleInputChange} required className={modalInputClassName} labelClassName={modalLabelClassName} />
            <Select label="Guru Pengampu (Opsional)" name="guruMapelId" options={guruMapelOptions.map(opt => ({...opt, label: opt.label.replace(/\s*\(.*\)\s*$/, '')}))} value={mapel.guruMapelId || ''} onChange={handleInputChange} className={modalSelectClassName} labelClassName={modalLabelClassName} />
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${modalLabelClassName}`}>Diajarkan di Kelas Utama (Wajib, pilih min. satu)</label>
              <select name="classIds" multiple value={mapel.classIds || []} onChange={handleMultiSelectChange} required className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-smkn-blue sm:text-sm h-32 ${modalSelectClassName}`}>
                {classes.map(opt => <option key={opt.id} value={opt.id} className="text-white bg-gray-600 p-1">{getDisplayableItemName(opt)}</option>)}
              </select>
            </div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-smkn-blue mb-6 text-center md:text-left">Kelola Pembagian Kelas & Mata Pelajaran</h1>
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}

      <div className="mb-6 border-b border-gray-300">
        <nav className="flex space-x-1 -mb-px" aria-label="Tabs">
          {(['kelas', 'subkelas', 'mapel'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === tab 
                  ? 'border-smkn-blue text-smkn-blue' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab === 'kelas' && 'Kelas Utama & Sub Kelasnya'}
              {tab === 'subkelas' && 'Daftar Semua Sub Kelas'}
              {tab === 'mapel' && 'Mata Pelajaran'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'kelas' && renderKelasTab()}
      {activeTab === 'subkelas' && renderSubKelasTab()}
      {activeTab === 'mapel' && renderMapelTab()}

      {isModalOpen && modalType && currentItem && (
        <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            title={`${currentItem.id ? 'Edit' : 'Tambah'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
            size={modalType === 'mapel' ? 'lg' : 'md'}
        >
          {formError && <Alert type="error" message={formError} onClose={()=>setFormError(null)}/>}
          {renderModalContent()}
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={closeModal}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>Simpan</Button>
          </div>
        </Modal>
      )}

      {itemToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => { setIsConfirmDeleteOpen(false); setItemToDelete(null); }}
          onConfirm={confirmDeleteItem}
          title={`Konfirmasi Hapus ${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)}`}
          message={
            <>
              <p>Apakah Anda yakin ingin menghapus {itemToDelete.type} <strong>{itemToDelete.name}</strong>?</p>
              <p className="mt-2 text-sm text-red-700">Tindakan ini akan menghapus data terkait dan tidak dapat diurungkan.</p>
            </>
          }
          confirmButtonText={`Ya, Hapus ${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)}`}
          confirmButtonVariant="danger"
          confirmButtonIcon={ICONS.delete}
        />
      )}
    </div>
  );
};

export default ManageSubjectsPage;
