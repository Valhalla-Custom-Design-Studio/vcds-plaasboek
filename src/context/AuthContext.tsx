import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  farmName?: string;
  farm_name?: string;
  role: 'farmer' | 'worker' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  tier: 'free' | 'pro';
  language: 'af' | 'en';
  latitude?: number;
  longitude?: number;
  plotNumber?: string;
  gateLatitude?: number;
  gateLongitude?: number;
  nearestTown?: string;
  alertRadiusKm?: number;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  medications?: string;
  medicalAidName?: string;
  medicalAidNumber?: string;
  nearestHospital?: string;
  doctorName?: string;
  doctorPhone?: string;
  farmerId?: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  farmName?: string;
  role?: string;
  farmerId?: string;
  language?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  signup: (data: RegisterData) => Promise<void>; // alias for register
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (u: any): User => ({
    ...u,
    farmName: u.farmName || u.farm_name,
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(normalizeUser(res.data.user));
        }
      } catch {
        await SecureStore.deleteItemAsync('auth_token');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('auth_token', res.data.token);
    setUser(normalizeUser(res.data.user));
  };

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/signup', data);
    await SecureStore.setItemAsync('auth_token', res.data.token);
    setUser(normalizeUser(res.data.user));
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(normalizeUser(res.data.user));
    } catch {}
  };

  const updateUser = async (data: Partial<User>) => {
    const res = await api.put('/auth/profile', data);
    setUser(normalizeUser(res.data.user));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, signup: register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
