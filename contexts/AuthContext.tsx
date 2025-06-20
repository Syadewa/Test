
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserRole, ActivityAction } from '../types'; // Added ActivityAction
import { MOCK_USERS } from '../utils/mockData'; 
import { ROLE_DASHBOARD_PATHS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { useData } from './DataContext'; // Import useData

interface LoginResult {
  success: boolean;
  error?: string;
  token?: string; 
}

interface AuthContextType {
  user: User | null;
  token: string | null; 
  loading: boolean;
  login: (identifier: string, password?: string) => Promise<LoginResult>;
  logout: () => void;
  getToken: () => string | null; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dataContext = useData(); // Get DataContext instance

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken'); 
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier: string, password?: string): Promise<LoginResult> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let inferredRoles: UserRole[] = [];
    const identifierLower = identifier.toLowerCase();

    if (identifierLower.includes('@') && (identifierLower.includes('.id') || identifierLower.includes('.com') || identifierLower.includes('.net') || identifierLower.includes('.org') || identifierLower.includes('.sch.id'))) {
        inferredRoles = [UserRole.ADMIN];
    } 
    else if (/^\d{18}$/.test(identifier)) {
        inferredRoles = [UserRole.GURU_MAPEL, UserRole.WALI_KELAS, UserRole.WAKIL_KURIKULUM, UserRole.KEPALA_SEKOLAH];
    } 
    else if (/^(nisn|nis)\d+$/i.test(identifierLower) || /^\d{8,12}$/.test(identifierLower)) {
        inferredRoles = [UserRole.SISWA];
    } 
    else {
        setLoading(false);
        return { success: false, error: "Format NIP/NIS/Email tidak dikenali. Admin: email, Guru/Staf: NIP 18 digit, Siswa: NIS/NISN." };
    }

    const foundUser = MOCK_USERS.find(u => {
        const identifierMatch = u.username.toLowerCase() === identifierLower;
        const passwordMatch = u.password === password; 
        const roleMatch = inferredRoles.includes(u.role);
        return identifierMatch && passwordMatch && roleMatch;
    });

    if (foundUser) {
        const { password: _, ...userToStore } = foundUser; 
        setUser(userToStore);
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        
        const mockToken = `mock-jwt-token-for-${foundUser.id}-${Date.now()}`;
        setToken(mockToken);
        localStorage.setItem('authToken', mockToken);

        if (dataContext) { // Check if dataContext is available
            dataContext.addActivityLog({ action: ActivityAction.LOGIN }, userToStore);
        }

        setLoading(false);
        navigate(ROLE_DASHBOARD_PATHS[userToStore.role] || '/');
        return { success: true, token: mockToken };
    }
    
    setLoading(false);
    return { success: false, error: "Login gagal. Periksa kembali NIP/NIS/Email dan password Anda." };
  }, [navigate, dataContext]); // Add dataContext to dependencies

  const logout = useCallback(() => {
    if (user && dataContext) { // Check if user and dataContext are available
        dataContext.addActivityLog({ action: ActivityAction.LOGOUT }, user);
    }
    setUser(null);
    setToken(null); 
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken'); 
    navigate('/login');
  }, [navigate, user, dataContext]); // Add user and dataContext to dependencies

  const getToken = useCallback(() => {
    return token;
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
