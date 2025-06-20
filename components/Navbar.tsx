
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, ICONS, ROLE_DASHBOARD_PATHS } from '../constants';

interface NavbarProps {
  toggleMobileSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const homePath = user ? ROLE_DASHBOARD_PATHS[user.role] : '/login';

  return (
    <nav className="bg-smkn-blue text-white p-4 shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button
            className="md:hidden text-white focus:outline-none mr-3"
            onClick={toggleMobileSidebar}
            aria-label="Open sidebar"
          >
            <i className="fas fa-bars text-xl"></i> {/* Hamburger Icon */}
          </button>
          <Link to={homePath} className="text-xl sm:text-2xl font-bold hover:text-smkn-warning transition-colors">
            {APP_NAME}
          </Link>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-sm">
              Selamat datang, <span className="font-semibold">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-smkn-danger hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <i className={`${ICONS.logout} mr-2`}></i>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;