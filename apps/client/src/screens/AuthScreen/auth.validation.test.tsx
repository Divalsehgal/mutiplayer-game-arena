import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthScreen from './index';
import { useAuthStore } from '../../store/auth';
import { apiFetch } from '../../api/client';

vi.mock('../../store/auth', () => ({ useAuthStore: vi.fn() }));
vi.mock('../../api/client', () => ({ apiFetch: vi.fn() }));
vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }: any) => <>{children}</>,
    GoogleLogin: () => null,
}));

const type = (label: string, name: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value, name } });

describe('AuthScreen client-side validation (shared zod schemas)', () => {
    const setError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false, isLoading: false, setError, error: null } as any);
        render(<BrowserRouter><AuthScreen /></BrowserRouter>);
    });

    it('rejects a malformed email on sign-in without calling the server', () => {
        type('Email', 'email', 'not-an-email');
        type('Password', 'password', 'whatever');
        fireEvent.submit(screen.getByLabelText('Email').closest('form')!);

        expect(setError).toHaveBeenLastCalledWith('Invalid email format');
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('applies the password rules on sign-up', () => {
        fireEvent.click(screen.getByRole('button', { name: /create account|sign up/i }));
        type('Username', 'user_name', 'player1');
        type('Email', 'email', 'p@example.com');
        type('Password', 'password', 'password1');
        fireEvent.submit(screen.getByLabelText('Email').closest('form')!);

        expect(setError).toHaveBeenLastCalledWith('Password must contain at least one uppercase letter');
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('sends the normalised data the schema produced', async () => {
        vi.mocked(apiFetch).mockResolvedValue({ ok: false, data: null } as any);
        type('Email', 'email', '  Me@Example.COM ');
        type('Password', 'password', 'secret');
        fireEvent.submit(screen.getByLabelText('Email').closest('form')!);

        const body = JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]!.body as string);
        expect(body).toEqual({ email: 'me@example.com', password: 'secret' });
    });
});
