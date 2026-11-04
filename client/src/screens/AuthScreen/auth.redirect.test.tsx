import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AuthScreen from './index';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

import { apiFetch } from '../../api/client';

vi.mock('../../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: any) => <>{children}</>,
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <div data-testid="google-login">
        <button onClick={() => onSuccess({ credential: 'mock_token' })}>Success</button>
        <button onClick={() => onError()}>Error</button>
    </div>
  ),
}));

describe('AuthScreen redirect handling', () => {
    beforeEach(() => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null,
            googleLogin: vi.fn(),
            setAuth: vi.fn(),
            logout: vi.fn(),
        } as any);
        vi.mocked(apiFetch).mockResolvedValue({ ok: true, data: {} });
        vi.clearAllMocks();
    });

    it('should redirect to the games after login when there is no originating location', async () => {
        const setAuth = vi.fn();

        vi.mocked(apiFetch).mockResolvedValue({
            ok: true,
            data: {
                success: true,
                data: { user: { id: 'u1' }, accessToken: 't1' }
            }
        });

        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null,
            setAuth,
        } as any);

        const { container } = render(<BrowserRouter><AuthScreen /></BrowserRouter>);

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com', name: 'email' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password', name: 'password' } });

        const signInButton = container.querySelector('button[type="submit"]');
        await act(async () => {
            fireEvent.click(signInButton!);
        });

        await waitFor(() => expect(apiFetch).toHaveBeenCalled());
        await waitFor(() => expect(setAuth).toHaveBeenCalledWith({ id: 'u1' }, 't1'));
        expect(mockedNavigate).toHaveBeenCalledWith('/play');
    });

    it('should redirect back to the originating room link after login instead of the games', async () => {
        const setAuth = vi.fn();

        vi.mocked(apiFetch).mockResolvedValue({
            ok: true,
            data: {
                success: true,
                data: { user: { id: 'u1' }, accessToken: 't1' }
            }
        });

        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null,
            setAuth,
        } as any);

        const { container } = render(
            <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/room/abc123' } } }]}>
                <AuthScreen />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com', name: 'email' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password', name: 'password' } });

        const signInButton = container.querySelector('button[type="submit"]');
        await act(async () => {
            fireEvent.click(signInButton!);
        });

        await waitFor(() => expect(setAuth).toHaveBeenCalledWith({ id: 'u1' }, 't1'));
        expect(mockedNavigate).toHaveBeenCalledWith('/room/abc123');
    });

    it('should redirect to the originating room link when already authenticated', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            setError: vi.fn(),
            error: null,
            setAuth: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/room/xyz789' } } }]}>
                <AuthScreen />
            </MemoryRouter>
        );

        expect(screen.queryByRole('heading', { name: 'Sign in' })).toBeNull();
    });
});
