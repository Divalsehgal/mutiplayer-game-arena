import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { useSocket } from './hooks/useSocket';

const authState = vi.hoisted(() => ({
    isAuthenticated: true,
    isLoading: false,
    user: { user_name: 'Dana', email: 'dana@example.com' } as { user_name: string; email: string } | null,
    checkAuth: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('./store/auth', () => ({
    useAuthStore: (selector?: (s: typeof authState) => unknown) => (selector ? selector(authState) : authState),
}));
vi.mock('./hooks/useSocket', () => ({ useSocket: vi.fn(() => ({ isConnected: true })) }));
vi.mock('./screens/LobbyScreen', () => ({ default: () => <p>Lobby screen</p> }));
vi.mock('./screens/RoomScreen', () => ({ default: () => <p>Room screen</p> }));
vi.mock('./screens/GameScreen', () => ({ default: () => <p>Game screen</p> }));
vi.mock('./screens/AuthScreen', () => ({ default: () => <p>Auth screen</p> }));
vi.mock('./screens/SudokuScreen', () => ({ default: () => <p>Sudoku screen</p> }));

const renderAt = (path: string) => {
    window.history.pushState({}, '', path);
    return render(<App />);
};

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.isAuthenticated = true;
        authState.user = { user_name: 'Dana', email: 'dana@example.com' };
        vi.mocked(useSocket).mockReturnValue({ isConnected: true } as any);
    });

    it.each([
        ['/', 'Quick games with friends'],
        ['/play', 'Lobby screen'],
        ['/room/abc', 'Room screen'],
        ['/game/abc', 'Game screen'],
        ['/login', 'Auth screen'],
        ['/sudoku', 'Sudoku screen'],
    ])('renders the right screen at %s', async (path, text) => {
        renderAt(path);
        expect(await screen.findByText(text)).toBeDefined();
    });

    it('shows a not-found page for unknown routes', async () => {
        renderAt('/settings');
        expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeDefined();
        expect(window.location.pathname).toBe('/settings');
    });

    it('checks the session on load, except on the login page', () => {
        renderAt('/');
        expect(authState.checkAuth).toHaveBeenCalled();

        vi.clearAllMocks();
        renderAt('/login');
        expect(authState.checkAuth).not.toHaveBeenCalled();
    });

    it('shows the reconnecting banner only inside a room or game', () => {
        vi.mocked(useSocket).mockReturnValue({ isConnected: false } as any);

        const { unmount } = renderAt('/game/abc');
        expect(screen.getByText(/Reconnecting/)).toBeDefined();
        unmount();

        renderAt('/');
        expect(screen.queryByText(/Reconnecting/)).toBeNull();
    });

    it('shows the top bar navigation', () => {
        renderAt('/');
        expect(screen.getByRole('link', { name: /Game Arena/ }).getAttribute('href')).toBe('/');
        expect(screen.getByRole('link', { name: 'Play' }).getAttribute('href')).toBe('/play');
        expect(screen.getByRole('link', { name: 'Daily Sudoku' }).getAttribute('href')).toBe('/sudoku');
    });

    it('logs out from the top bar and goes home', async () => {
        renderAt('/play');
        fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
        expect(authState.logout).toHaveBeenCalled();
        await waitFor(() => expect(window.location.pathname).toBe('/'));
    });

    it('offers a sign-in link when signed out', () => {
        authState.user = null;
        renderAt('/');
        expect(screen.queryByText('Log out')).toBeNull();
        expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/login');
    });
});
