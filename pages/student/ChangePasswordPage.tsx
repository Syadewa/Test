
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { ICONS } from '../../constants';
import { ActivityAction } from '../../types'; // Import ActivityAction

const ChangePasswordPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { updateUser, users, addActivityLog } = useData(); // Destructure 'users' and 'addActivityLog'
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true); 

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Semua field password harus diisi.');
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Password baru dan konfirmasi password tidak cocok.');
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) { 
        setError('Password baru minimal 6 karakter.');
        setIsLoading(false);
        return;
    }
    
    const fullUser = users.find(u => u.id === user.id); 
    if (fullUser && fullUser.password && fullUser.password !== currentPassword) {
        setError('Password saat ini salah.');
        setIsLoading(false);
        return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      updateUser({ ...user, password: newPassword }, user); // Pass user as actor
      addActivityLog({ action: ActivityAction.PASSWORD_CHANGE_SELF, targetId: user.id, targetName: user.name, targetType: 'Pengguna' }, user);
      setSuccessMessage('Password berhasil diubah. Anda akan diarahkan ke halaman login.');
      setTimeout(() => {
        logout(); 
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10">
      <Card title="Ganti Password">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMessage && <Alert type="success" message={successMessage} />}
        
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Password Saat Ini"
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Password Baru"
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Konfirmasi Password Baru"
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" isLoading={isLoading} className="w-full" leftIcon={ICONS.save}>
              Simpan Password Baru
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
