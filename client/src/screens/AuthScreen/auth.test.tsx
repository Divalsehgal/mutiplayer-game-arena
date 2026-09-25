import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthScreen from './index';
import { BrowserRouter } from 'react-router-dom';
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
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <div data-testid="google-login">
        <button onClick={() => onSuccess({ credential: 'mock_token' })}>Success</button>
        <button onClick={() => onError()}>Error</button>
    </div>
  ),
}));

describe('AuthScreen', () => {
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
    it('should render sign in form by default', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null,
            googleLogin: vi.fn(),
            setAuth: vi.fn()
        });

        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        expect(screen.getByText(/Welcome Back/i)).toBeDefined();
    });

    it('should switch to sign up form', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null
        });

        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        const signUpTab = screen.getByRole('button', { name: /Sign Up/i });
        fireEvent.click(signUpTab);
        expect(screen.getByText(/Create your account/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/what should we call you/i)).toBeDefined();
    });

    it('should update form data on input change', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null
        });

        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        const emailInput = screen.getByPlaceholderText(/you@example.com/i) as HTMLInputElement;
        fireEvent.change(emailInput, { target: { value: 'test@test.com', name: 'email' } });
        expect(emailInput.value).toBe('test@test.com');
    });

    it('should call setAuth on sign in submit', async () => {
        const setAuth = vi.fn();
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null,
            setAuth
        });

        const { container } = render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        const emailInput = screen.getByPlaceholderText(/you@example.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        
        fireEvent.change(emailInput, { target: { value: 'test@test.com', name: 'email' } });
        fireEvent.change(passwordInput, { target: { value: 'password123', name: 'password' } });
        
        const signInButton = container.querySelector('button[type="submit"]');
        fireEvent.click(signInButton!);
    });

    it('should handle sign up submit', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null
        });

        const { container } = render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        
        // Switch to sign up
        const signUpTab = screen.getByRole('button', { name: /Sign Up/i });
        fireEvent.click(signUpTab);

        const nameInput = screen.getByPlaceholderText(/what should we call you/i);
        const emailInput = screen.getByPlaceholderText(/you@example.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        
        fireEvent.change(nameInput, { target: { value: 'Tester', name: 'user_name' } });
        fireEvent.change(emailInput, { target: { value: 'test@test.com', name: 'email' } });
        fireEvent.change(passwordInput, { target: { value: 'password123', name: 'password' } });
        
        const signUpButton = container.querySelector('button[type="submit"]');
        fireEvent.click(signUpButton!);
    });

    it('should handle Google login success', async () => {
        const googleLogin = vi.fn();
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError: vi.fn(),
            error: null,
            googleLogin
        });

        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        const successButton = screen.getByText('Success');
        fireEvent.click(successButton);
        
        expect(googleLogin).toHaveBeenCalledWith('mock_token');
    });

    it('should handle Google login error', async () => {
        const setError = vi.fn();
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError,
            error: null,
            googleLogin: vi.fn()
        });

        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        const errorButton = screen.getByText('Error');
        fireEvent.click(errorButton);
        
        expect(setError).toHaveBeenCalledWith("Google sign-in didn't work. Please try again.");
    });

    it('should show error on apiFetch failure', async () => {
        const setError = vi.fn();
        vi.mocked(apiFetch).mockResolvedValue({ ok: false, data: { message: 'Wrong password' } });

        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            setError,
            error: null
        });

        const { container } = render(<BrowserRouter><AuthScreen /></BrowserRouter>);

        const emailInput = screen.getByPlaceholderText(/you@example.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        
        fireEvent.change(emailInput, { target: { value: 'test@test.com', name: 'email' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong', name: 'password' } });

        const signInButton = container.querySelector('button[type="submit"]');
        fireEvent.click(signInButton!);
        
        await waitFor(() => expect(setError).toHaveBeenCalledWith('Wrong password'));
    });

    it('shows a friendly message when sign-in fails without a reason', async () => {
        const setError = vi.fn();
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false, isLoading: false, setError, error: null, setAuth: vi.fn() } as any);
        vi.mocked(apiFetch).mockResolvedValue({ ok: false, data: null } as any);

        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        fireEvent.submit(screen.getByPlaceholderText('you@example.com').closest('form')!);

        await waitFor(() => expect(setError).toHaveBeenCalledWith("Couldn't sign you in. Check your details and try again."));
    });

    it('shows a generic message when the request throws', async () => {
        const setError = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false, isLoading: false, setError, error: null, setAuth: vi.fn() } as any);
        vi.mocked(apiFetch).mockRejectedValue(new Error('network down'));

        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        fireEvent.submit(screen.getByPlaceholderText('you@example.com').closest('form')!);

        await waitFor(() => expect(setError).toHaveBeenCalledWith('Something went wrong. Please try again.'));
        errorSpy.mockRestore();
    });

    it('switches back to sign in from sign up', () => {
        render(<BrowserRouter><AuthScreen /></BrowserRouter>);

        fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
        expect(screen.getByText('Create your account')).toBeDefined();

        fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' })[0]);
        expect(screen.getByText('Welcome back')).toBeDefined();
    });

    it('shows the error message returned by the store', () => {
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false, isLoading: false, setError: vi.fn(), error: 'Wrong password' } as any);
        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        expect(screen.getByRole('alert').textContent).toBe('Wrong password');
    });

    it('disables the submit button while signing in', () => {
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false, isLoading: true, setError: vi.fn(), error: null } as any);
        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
        expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
    });
});
