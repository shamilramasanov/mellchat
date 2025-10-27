import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@shared/utils/constants';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      skipAuth: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => {
        if (token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        }
        set({ token, isAuthenticated: !!token });
      },
      
      setSkipAuth: (skip) => set({ skipAuth: skip }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: async (token, user) => {
        set({ token, user, isAuthenticated: true });
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      },
      
      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      // Getters
      isAuth: () => get().isAuthenticated || get().skipAuth,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        skipAuth: state.skipAuth,
      }),
    }
  )
);

