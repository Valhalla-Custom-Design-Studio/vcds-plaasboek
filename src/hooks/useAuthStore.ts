import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: Record<string, unknown> | null;
  setToken: (token: string) => void;
  setUser: (user: Record<string, unknown>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  logout: () => set({ token: null, user: null }),
}));
