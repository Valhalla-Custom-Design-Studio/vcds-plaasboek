import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface User {
  id: string; email: string; name: string; farmName?: string;
  role: string; status: string; tier: string; language: string;
  latitude?: number; longitude?: number;
  plotNumber?: string; gateLatitude?: number; gateLongitude?: number;
  nearestTown?: string; alertRadiusKm?: number;
  bloodType?: string; allergies?: string; chronicConditions?: string;
  medications?: string; medicalAidName?: string; medicalAidNumber?: string;
  nearestHospital?: string; doctorName?: string; doctorPhone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; farmName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isApproved: boolean;
  isAdmin: boolean;
  isPro: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('auth_token');
        if (savedToken) {
          setToken(savedToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        }
      } catch { await SecureStore.deleteItemAsync('auth_token'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    await SecureStore.setItemAsync('auth_token', t);
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setToken(t);
    setUser(u);
  };

  const signup = async (data: { email: string; password: string; name: string; farmName?: string }) => {
    const res = await api.post('/signup', data);
    const { token: t, user: u } = res.data;
    await SecureStore.setItemAsync('auth_token', t);
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const res = await api.patch('/users/me', data);
    setUser(prev => prev ? { ...prev, ...res.data.user } : null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, signup, logout, updateUser,
      isApproved: user?.status === 'approved',
      isAdmin: user?.role === 'admin',
      isPro: user?.tier === 'pro',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
