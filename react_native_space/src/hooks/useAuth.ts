import { useState, useEffect, createContext, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User { id: string; email: string; name: string; farmName: string; tier: string; role: string; status: string; language: string; }
interface AuthCtx { user: User | null; token: string | null; lang: 'af'|'en'; login: (email: string, password: string) => Promise<void>; register: (data: any) => Promise<void>; logout: () => Promise<void>; setLang: (l: 'af'|'en') => void; }

export const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function useAuth() { return useContext(AuthContext); }

export function useAuthProvider(): AuthCtx {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [lang, setLangState] = useState<'af'|'en'>('af');

  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync('auth_token');
      const l = await SecureStore.getItemAsync('lang') as 'af'|'en' | null;
      if (l) setLangState(l);
      if (t) {
        setToken(t);
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data.user);
        } catch { await SecureStore.deleteItemAsync('auth_token'); }
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    await SecureStore.setItemAsync('auth_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (data: any) => {
    const res = await api.post('/api/auth/register', data);
    await SecureStore.setItemAsync('auth_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setToken(null); setUser(null);
  };

  const setLang = async (l: 'af'|'en') => {
    setLangState(l);
    await SecureStore.setItemAsync('lang', l);
  };

  return { user, token, lang, login, register, logout, setLang };
}
