
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, ROLE_DASHBOARD_PATHS } from '../constants'; 
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(ROLE_DASHBOARD_PATHS[user.role] || '/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError('NIP/NIS/Email dan Password harus diisi.');
      return;
    }
    const result = await login(identifier, password);
    if (!result.success) {
      setError(result.error || 'Login gagal. Terjadi kesalahan tidak diketahui.');
    }
  };

  const identifierLabel = "NIP / NIS / Email";
  const motivationalQuote = "Kerjakan dengan jujur, karena nilai terbaik lahir dari usaha sendiri.";
  const schoolLogoUrl = "https://smkn73jkt.sch.id/img/favicon.png";
  const backgroundImageUrl = "https://www.smkn73jkt.sch.id/storage/public/berita/HFJ4LBQTqdOuCuIQGHRh3E7vCVDfUn19u6ZTFDr2.jpg";


  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-smkn-blue-dark selection:text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
    >
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <img src={schoolLogoUrl} alt="Logo SMKN 73" className="mx-auto h-32 w-auto mb-5" />
          <h1 className="text-3xl font-bold text-smkn-blue">{APP_NAME}</h1>
          <p className="text-gray-600 mt-2 text-sm">{motivationalQuote}</p>
        </div>

        <hr className="my-6 border-gray-200" />

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={identifierLabel}
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={`Masukkan ${identifierLabel}`}
            required
            className="focus:border-smkn-blue focus:ring-smkn-blue" 
            leftIcon="fas fa-user" 
          />

          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password Anda"
            required
            className="focus:border-smkn-blue focus:ring-smkn-blue"
            leftIcon="fas fa-lock" 
          />
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full !py-3 text-base" 
            isLoading={loading} 
            size="lg" 
            rightIcon="fas fa-arrow-right" 
          >
            Login
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-8 text-center">
          Lupa password?{' '}
          <Link to="/forgot-password" className="font-medium hover:underline text-smkn-blue">
            Reset Password Admin
          </Link>
          .
          <br />
          Untuk peran lain atau kendala login, hubungi Administrator Sekolah.
        </p>
      </div>
      <footer className="text-center text-xs text-white mt-8 bg-black/50 px-3 py-2 rounded-md">
        © {new Date().getFullYear()} - Sistem Ujian SMKN 73
      </footer>
    </div>
  );
};

export default LoginPage;
