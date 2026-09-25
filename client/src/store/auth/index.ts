import { create } from 'zustand';
import { apiFetch } from '../../api/client';

interface User {
  _id?: string;
  id: string;
  user_name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAuth: (user: User, accessToken?: string | null) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  googleLogin: (idToken: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken?: string;
  };
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data: User;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setAuth: (user, accessToken = null) => set({ 
    user, 
    accessToken, 
    isAuthenticated: true, 
    error: null 
  }),

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false, error: null });
    }
  },

  setError: (error) => set({ error }),

  googleLogin: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const { ok, data } = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      }) as { ok: boolean; status: number; data: AuthResponse };
      
      if (ok && data.success) {
        const { user, accessToken = null } = data.data;
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
      } else {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: data?.message || "Google sign-in didn't work. Please try again.",
          isLoading: false
        });
      }
    } catch (err: unknown) {
      set({ 
        user: null,
        accessToken: null,
        isAuthenticated: false,
        // fetch() rejects only when the server can't be reached at all.
        error: "Can't reach the server right now. Please try again in a moment.",
        isLoading: false 
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { ok, data } = await apiFetch('/user/profile') as { ok: boolean; status: number; data: ProfileResponse };
      if (ok && data.success) {
        set({ 
          user: data.data, 
          accessToken: null,
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
