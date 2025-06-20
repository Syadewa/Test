
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_DASHBOARD_PATHS } from '../constants';

const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const homePath = user ? ROLE_DASHBOARD_PATHS[user.role] : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-smkn-gray text-center p-4">
      <img src="https://picsum.photos/seed/404error/200/200" alt="Error Illustration" className="w-48 h-48 mb-8 opacity-80" />
      <h1 className="text-6xl font-bold text-smkn-blue mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-smkn-text mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Maaf, halaman yang Anda cari tidak ada atau mungkin telah dipindahkan.
      </p>
      <Button
        variant="primary"
        size="lg"
        onClick={() => window.history.back()}
        className="mb-4"
      >
        Kembali ke Halaman Sebelumnya
      </Button>
      <Link to={homePath}>
        <Button variant="secondary" size="lg">
          Ke Halaman Utama
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
    