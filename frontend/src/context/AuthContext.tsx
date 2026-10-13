import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken, getStoredUser } from '../services/api';

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  organization?: string;
  role: 'admin' | 'analyst' | 'viewer';
  account_status?: string;
}

export interface RegisterResult {
  status: string;
  message: string;
  user_id: number;
  username: string;
  email: string;
  account_status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }, onStatusUpdate?: (status: string) => void) => Promise<void>;
  register: (data: {
    full_name: string;
    email: string;
    username: string;
    password: string;
    confirm_password?: string;
    organization?: string;
    invitation_code?: string;
    accept_policy?: boolean;
  }, onStatusUpdate?: (status: string) => void) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
        } catch {
          clearAuthToken();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (credentials: { username: string; password: string }, onStatusUpdate?: (status: string) => void) => {
    const data = await api.login(credentials, onStatusUpdate);
    const userInfo: User = {
      id: data.user_id,
      username: data.username,
      role: data.role,
      account_status: data.account_status,
      full_name: data.full_name
    };
    setAuthToken(data.access_token, userInfo);
    setToken(data.access_token);
    setUser(userInfo);
  };

  const register = async (data: {
    full_name: string;
    email: string;
    username: string;
    password: string;
    confirm_password?: string;
    organization?: string;
    invitation_code?: string;
    accept_policy?: boolean;
  }, onStatusUpdate?: (status: string) => void): Promise<RegisterResult> => {
    const res = await api.register(data, onStatusUpdate);
    return res;
  };

  const logout = async () => {
    await api.logout();
    clearAuthToken();
    setUser(null);
    setToken(null);
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
