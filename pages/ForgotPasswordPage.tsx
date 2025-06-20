
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { UserRole, ActivityAction } from '../types'; // Import ActivityAction
import { APP_NAME } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { users, addActivityLog } = useData(); // Add addActivityLog
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!email) {
      setError('Email harus diisi.');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid.');
      setLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const adminUser = users.find(u => u.username.toLowerCase() === email.toLowerCase() && u.role === UserRole.ADMIN);

    if (adminUser) {
      addActivityLog({ action: ActivityAction.FORGOT_PASSWORD_REQUEST, targetId: adminUser.id, targetName: adminUser.name, targetType: 'Pengguna', details: `Email: ${email}` }, adminUser);
      setMessage('Jika email Anda terdaftar sebagai Admin, link untuk mereset password akan segera dikirim. Silakan periksa kotak masuk Anda (termasuk folder spam).');
    } else {
      // Log failed attempt without revealing user existence for non-admin
      // For now, we don't have a generic 'system' actor for such logs, so we'll log based on a generic attempt if needed, or skip detailed user logging here.
      // To keep it simple, we might just log the attempt from a system perspective if an actor is not clearly identifiable.
      // However, the current addActivityLog expects an actor. This part could be refined if system-level logging without a specific user actor is desired.
      // For now, we'll log only if adminUser is found.
      setError('Email tidak terdaftar sebagai Admin.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-smkn-gray p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://picsum.photos/seed/smkn73logo/80/80" alt="SMKN 73 Logo" className="mx-auto mb-4 rounded-full" />
          <h1 className="text-3xl font-bold text-smkn-blue">{APP_NAME}</h1>
          <p className="text-gray-600 mt-1">Reset Password Admin</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Admin"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan email admin Anda"
            required
            className="bg-gray-800 text-white placeholder-gray-400 border-gray-600 focus:border-smkn-blue"
            disabled={loading || !!message} 
          />
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full" 
            isLoading={loading} 
            size="lg"
            disabled={loading || !!message} 
          >
            Kirim Link Reset Password
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-6 text-center">
          <Link to="/login" className="hover:underline text-smkn-blue">
            Kembali ke Halaman Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
