import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { useSocket } from './hooks/useSocket';

const authState = vi.hoisted(() => ({
    isAuthenticated: true,
    isLoading: false,
    user: { user_name: 'Dana', email: 'dana@example.com' },
    checkAuth: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('./store/auth', () => ({
    useAuthStore: (selector?: (s: typeof authState) => unknown) => (selector ? selector(authState) : authState),
}));
vi.mock('./hooks/useSocket', () => ({ useSocket: vi.fn(() => ({ isConnected: true })) }));
vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./screens/LobbyScreen', () => ({ default: () => <p>Lobby screen</p> }));
vi.mock('./screens/RoomScreen', () => ({ default: () => <p>Room screen</p> }));
vi.mock('./screens/GameScreen', () => ({ default: () => <p>Game screen</p> }));
vi.mock('./screens/AuthScreen', () => ({ default: () => <p>Auth screen</p> }));

const renderAt = (path: string) => {
    window.history.pushState({}, '', path);
    return render(<App />);
};

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.isAuthenticated = true;
        vi.mocked(useSocket).mockReturnValue({ isConnected: true } as any);
    });

    it.each([
        ['/', 'Lobby screen'],
        ['/room/abc', 'Room screen'],
        ['/game/abc', 'Game screen'],
        ['/login', 'Auth screen'],
    ])('renders the right screen at %s', (path, text) => {
        renderAt(path);
        expect(screen.getByText(text)).toBeDefined();
    });

    it('sends unknown routes to the lobby', () => {
        renderAt('/settings');
        expect(screen.getByText('Lobby screen')).toBeDefined();
        expect(window.location.pathname).toBe('/');
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

    it('hides the navigation on the login page', () => {
        renderAt('/login');
        expect(screen.queryByText('Game Arena')).toBeNull();
        expect(screen.queryByText('Log out')).toBeNull();
    });

    it('opens and closes the mobile menu', () => {
        renderAt('/');
        const toggle = screen.getAllByRole('button').find((b) => b.closest('header'))!;
        const drawer = () => screen.getAllByText('Dana')[1].closest('.fixed')!;

        expect(drawer().className).toContain('-translate-x-full');
        fireEvent.click(toggle);
        expect(drawer().className).toContain('translate-x-0');
        fireEvent.click(toggle);
        expect(drawer().className).toContain('-translate-x-full');
    });
});
