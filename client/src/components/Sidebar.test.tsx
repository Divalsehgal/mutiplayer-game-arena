import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/auth';

vi.mock('../store/auth', () => ({ useAuthStore: vi.fn() }));

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockedNavigate };
});

describe('Sidebar', () => {
    const logout = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({
            user: { user_name: 'Dana', email: 'dana@example.com' },
            logout,
        } as any);
    });

    it('renders nothing when signed out', () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: null, logout } as any);
        const { container } = render(<MemoryRouter><Sidebar /></MemoryRouter>);
        expect(container.firstChild).toBeNull();
    });

    it('shows the signed-in user and only the Lobby link', () => {
        render(<MemoryRouter><Sidebar /></MemoryRouter>);
        expect(screen.getByText('Dana')).toBeDefined();
        expect(screen.getByText('dana@example.com')).toBeDefined();
        expect(screen.getByRole('button', { name: /Lobby/ })).toBeDefined();
        expect(screen.queryByText(/Settings|Games/)).toBeNull();
    });

    it("shows the user's avatar when they have one", () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { user_name: 'Dana', email: 'd@e.com', avatar: 'https://img/avatar.png' },
            logout,
        } as any);
        render(<MemoryRouter><Sidebar /></MemoryRouter>);
        expect(screen.getByAltText('Dana').getAttribute('src')).toBe('https://img/avatar.png');
    });

    it('navigates to the lobby and closes the mobile menu', () => {
        const onAction = vi.fn();
        render(<MemoryRouter><Sidebar onAction={onAction} /></MemoryRouter>);

        fireEvent.click(screen.getByRole('button', { name: /Lobby/ }));

        expect(mockedNavigate).toHaveBeenCalledWith('/');
        expect(onAction).toHaveBeenCalled();
    });

    it('logs out and returns to the login page', async () => {
        const onAction = vi.fn();
        render(<MemoryRouter><Sidebar onAction={onAction} /></MemoryRouter>);

        fireEvent.click(screen.getByRole('button', { name: /Log out/ }));

        await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/login'));
        expect(logout).toHaveBeenCalled();
        expect(onAction).toHaveBeenCalled();
    });
});
