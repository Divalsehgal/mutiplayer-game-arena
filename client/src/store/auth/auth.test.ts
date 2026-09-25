import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './index';
import { apiFetch } from '../../api/client';

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn()
}));

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  });

  it('should handle setError', () => {
    useAuthStore.getState().setError('Test error');
    expect(useAuthStore.getState().error).toBe('Test error');
  });

  it('should handle logout error', async () => {
    const mockError = new Error('Network error');
    vi.mocked(apiFetch).mockRejectedValueOnce(mockError);
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await useAuthStore.getState().logout();
    
    expect(consoleSpy).toHaveBeenCalledWith('Logout error:', mockError);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    
    consoleSpy.mockRestore();
  });

  describe('googleLogin', () => {
    it('should handle successful login', async () => {
      const mockUser = { id: '1', user_name: 'Test', email: 'test@test.com' };
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { success: true, data: { user: mockUser, accessToken: 'token' } }
      });

      await useAuthStore.getState().googleLogin('idToken123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should show a friendly message when Google sign-in is rejected without a reason', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({ ok: false, status: 401, data: null });

      await useAuthStore.getState().googleLogin('badToken');

      expect(useAuthStore.getState().error).toBe("Google sign-in didn't work. Please try again.");
    });

    it('should handle login failure from API', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { success: false, message: 'Invalid token' }
      });

      await useAuthStore.getState().googleLogin('invalidToken');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid token');
      expect(state.isLoading).toBe(false);
    });

    it('should handle network errors during login', async () => {
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Network failure'));

      await useAuthStore.getState().googleLogin('idToken123');

      const state = useAuthStore.getState();
      expect(state.error).toBe("Can't reach the server right now. Please try again in a moment.");
      expect(state.isLoading).toBe(false);
    });
    
    it('should handle non-Error exceptions during login', async () => {
      vi.mocked(apiFetch).mockRejectedValueOnce('Some string error');

      await useAuthStore.getState().googleLogin('idToken123');

      const state = useAuthStore.getState();
      expect(state.error).toBe("Can't reach the server right now. Please try again in a moment.");
      expect(state.isLoading).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should handle successful auth check', async () => {
      const mockUser = { id: '1', user_name: 'Test', email: 'test@test.com' };
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { success: true, data: mockUser }
      });

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle unsuccessful auth check', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { success: false }
      });

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should handle network error during auth check', async () => {
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
