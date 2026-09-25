import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameScreen from './index';
import { BrowserRouter } from 'react-router-dom';
import { useGameLogic } from '../../hooks/useGameLogic';

vi.mock('../../hooks/useGameLogic', () => ({
    useGameLogic: vi.fn(),
}));

describe('GameScreen', () => {
    it('should render loading state initially', () => {
        vi.mocked(useGameLogic).mockReturnValue({ room: undefined });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);
        expect(document.querySelector('.animate-spin')).toBeDefined();
    });

    it('should render the superseded state when this tab has been taken over', () => {
        vi.mocked(useGameLogic).mockReturnValue({ room: undefined, superseded: true });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);
        expect(screen.getByText(/playing in another tab/i)).toBeDefined();
    });

    it('should render abandoned state when room is null', () => {
        vi.mocked(useGameLogic).mockReturnValue({ room: null });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);
        expect(screen.getByText(/This game has ended/i)).toBeDefined();
    });

    it('should render Arena when room exists', () => {
        const mockRoom = {
            id: 'room1',
            gameType: 'RPS',
            status: 'playing',
            players: [
                { playerUid: 'u1', name: 'P1', role: 'player' },
                { playerUid: 'u2', name: 'P2', role: 'player' }
            ],
            gameState: { status: 'playing' }
        };
        vi.mocked(useGameLogic).mockReturnValue({
            room: mockRoom,
            playerUid: 'u1'
        });

        render(<BrowserRouter><GameScreen /></BrowserRouter>);
        // Check for some header text or arena specific text
        expect(screen.getByText(/P1/i)).toBeDefined();
    });

    const room = (overrides: Record<string, unknown> = {}) => ({
        id: 'room1',
        gameType: 'TIC_TAC_TOE',
        status: 'playing',
        players: [
            { playerUid: 'u1', name: 'P1', role: 'player' },
            { playerUid: 'bot-room1', name: 'Computer', role: 'player', isBot: true },
        ],
        gameState: { status: 'playing', board: Array(9).fill(null), currentTurn: 'u1', readyPlayers: [] },
        ...overrides,
    });

    it('shows the computer as the opponent', () => {
        vi.mocked(useGameLogic).mockReturnValue({ room: room(), playerUid: 'u1', handleLeave: vi.fn() });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);

        expect(screen.getByText('Computer')).toBeDefined();
        expect(screen.getByText('Your turn')).toBeDefined();
    });

    it('lets the player leave the game', () => {
        const handleLeave = vi.fn();
        vi.mocked(useGameLogic).mockReturnValue({ room: room(), playerUid: 'u1', handleLeave });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);

        fireEvent.click(screen.getByRole('button', { name: 'Leave game' }));
        expect(handleLeave).toHaveBeenCalled();
    });

    it('shows spectators the first two players', () => {
        vi.mocked(useGameLogic).mockReturnValue({
            room: room({
                players: [
                    { playerUid: 'u1', name: 'P1', role: 'player' },
                    { playerUid: 'u2', name: 'P2', role: 'player' },
                    { playerUid: 'u3', name: 'Viewer', role: 'spectator' },
                ],
            }),
            playerUid: 'u3',
        });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);

        expect(screen.getByText('Watching')).toBeDefined();
        expect(screen.getByText('P2')).toBeDefined();
    });

    it("says so when a game type isn't supported", () => {
        vi.mocked(useGameLogic).mockReturnValue({ room: room({ gameType: 'CHESS' }), playerUid: 'u1' });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);

        expect(screen.getByText("This game isn't available yet.")).toBeDefined();
    });

    it('goes back to the lobby from an ended game', () => {
        vi.mocked(useGameLogic).mockReturnValue({ room: null });
        render(<BrowserRouter><GameScreen /></BrowserRouter>);

        fireEvent.click(screen.getByRole('button', { name: 'Back to lobby' }));
        expect(window.location.pathname).toBe('/');
    });
});
