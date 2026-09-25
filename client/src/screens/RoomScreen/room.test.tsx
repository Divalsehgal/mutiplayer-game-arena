import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomScreen from './index';
import { BrowserRouter } from 'react-router-dom';
import { useRoomLogic } from '../../hooks/useRoomLogic';

vi.mock('../../hooks/useRoomLogic', () => ({
    useRoomLogic: vi.fn(),
}));

describe('RoomScreen', () => {
    it('should render loading state initially', () => {
        vi.mocked(useRoomLogic).mockReturnValue({ room: undefined });
        render(<BrowserRouter><RoomScreen /></BrowserRouter>);
        expect(document.querySelector('.animate-spin')).toBeDefined();
    });

    it('should render the superseded state when this tab has been taken over', () => {
        vi.mocked(useRoomLogic).mockReturnValue({ room: undefined, superseded: true });
        render(<BrowserRouter><RoomScreen /></BrowserRouter>);
        expect(screen.getByText(/playing in another tab/i)).toBeDefined();
    });

    it('should render expired state when room is null', () => {
        vi.mocked(useRoomLogic).mockReturnValue({ room: null });
        render(<BrowserRouter><RoomScreen /></BrowserRouter>);
        expect(screen.getByText(/no longer exists/i)).toBeDefined();
    });

    it('should render room details when room exists', () => {
        const mockRoom = {
            id: 'room123',
            gameType: 'RPS',
            maxPlayers: 2,
            status: 'waiting',
            players: [
                { playerUid: 'u1', name: 'Host', role: 'player', status: 'online' },
                { playerUid: 'u2', name: 'Guest', role: 'player', status: 'online' }
            ]
        };
        vi.mocked(useRoomLogic).mockReturnValue({
            room: mockRoom,
            playerUid: 'u1',
            ttlWarning: false,
            handleStartGame: vi.fn(),
            handleExtendSession: vi.fn(),
            handleLeave: vi.fn()
        });

        render(<BrowserRouter><RoomScreen /></BrowserRouter>);
        expect(screen.getByText(/Waiting room/i)).toBeDefined();
        expect(screen.getAllByText(/Host/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Guest/i)).toBeDefined();
    });

    it('should render initializing state when status is playing', () => {
        vi.mocked(useRoomLogic).mockReturnValue({
            room: { status: 'playing', players: [] },
            playerUid: 'u1'
        });
        render(<BrowserRouter><RoomScreen /></BrowserRouter>);
        expect(screen.getByText(/Starting the game/i)).toBeDefined();
    });

    describe('waiting room details', () => {
        const baseRoom = {
            id: 'room123',
            gameType: 'TIC_TAC_TOE',
            maxPlayers: 2,
            status: 'waiting-for-players',
            players: [{ playerUid: 'u1', name: 'Host', role: 'player', status: 'online' }],
        };
        const handlers = () => ({
            handleStartGame: vi.fn(),
            handleExtendSession: vi.fn(),
            handleLeave: vi.fn(),
        });

        it('tells the host why they cannot start yet', () => {
            const h = handlers();
            vi.mocked(useRoomLogic).mockReturnValue({ room: baseRoom, playerUid: 'u1', ttlWarning: null, ...h });

            render(<BrowserRouter><RoomScreen /></BrowserRouter>);

            expect(screen.getByText('Tic-Tac-Toe')).toBeDefined();
            expect(screen.getByText('Players (1/2)')).toBeDefined();
            expect(screen.getByText('Waiting for a player…')).toBeDefined();
            expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled();
            expect(screen.getByText(/at least 2 players/)).toBeDefined();
        });

        it('lets the host start once there are enough players', () => {
            const h = handlers();
            vi.mocked(useRoomLogic).mockReturnValue({
                room: { ...baseRoom, players: [...baseRoom.players, { playerUid: 'u2', name: 'Guest', role: 'player', status: 'offline' }] },
                playerUid: 'u1',
                ttlWarning: null,
                ...h,
            });

            render(<BrowserRouter><RoomScreen /></BrowserRouter>);
            fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

            expect(h.handleStartGame).toHaveBeenCalled();
            expect(screen.getByText('Offline')).toBeDefined();
            expect(screen.getByText('Host · You')).toBeDefined();
        });

        it('tells a guest they are waiting on the host', () => {
            vi.mocked(useRoomLogic).mockReturnValue({
                room: { ...baseRoom, players: [...baseRoom.players, { playerUid: 'u2', name: 'Guest', role: 'player', status: 'online' }] },
                playerUid: 'u2',
                ttlWarning: null,
                ...handlers(),
            });

            render(<BrowserRouter><RoomScreen /></BrowserRouter>);

            expect(screen.getByText('Waiting for Host to start the game…')).toBeDefined();
            expect(screen.queryByRole('button', { name: 'Start game' })).toBeNull();
        });

        it('explains spectating and lists spectators', () => {
            vi.mocked(useRoomLogic).mockReturnValue({
                room: {
                    ...baseRoom,
                    players: [
                        ...baseRoom.players,
                        { playerUid: 'u2', name: 'Guest', role: 'player', status: 'online', avatar: 'https://img/g.png' },
                        { playerUid: 'u3', name: 'Watcher', role: 'spectator', status: 'online' },
                    ],
                },
                playerUid: 'u3',
                ttlWarning: null,
                ...handlers(),
            });

            const { container } = render(<BrowserRouter><RoomScreen /></BrowserRouter>);

            expect(screen.getByText(/You're watching this room/)).toBeDefined();
            expect(screen.getByText('Watcher')).toBeDefined();
            expect(screen.getByText('(you)')).toBeDefined();
            expect(container.querySelector('img[src="https://img/g.png"]')).not.toBeNull();
        });

        it('shows an empty spectator list', () => {
            vi.mocked(useRoomLogic).mockReturnValue({ room: baseRoom, playerUid: 'u1', ttlWarning: null, ...handlers() });
            render(<BrowserRouter><RoomScreen /></BrowserRouter>);
            expect(screen.getByText('No one is watching yet.')).toBeDefined();
        });

        it('copies the room code and confirms it', async () => {
            const writeText = vi.fn().mockResolvedValue(undefined);
            Object.assign(navigator, { clipboard: { writeText } });
            vi.mocked(useRoomLogic).mockReturnValue({ room: baseRoom, playerUid: 'u1', ttlWarning: null, ...handlers() });

            render(<BrowserRouter><RoomScreen /></BrowserRouter>);
            fireEvent.click(screen.getByRole('button', { name: 'Copy room code' }));

            expect(writeText).toHaveBeenCalledWith('room123');
            await waitFor(() => expect(document.querySelector('.text-success')).not.toBeNull());
        });

        it('does not crash when the clipboard is blocked', async () => {
            const writeText = vi.fn().mockRejectedValue(new Error('blocked'));
            Object.assign(navigator, { clipboard: { writeText } });
            vi.mocked(useRoomLogic).mockReturnValue({ room: baseRoom, playerUid: 'u1', ttlWarning: null, ...handlers() });

            render(<BrowserRouter><RoomScreen /></BrowserRouter>);
            fireEvent.click(screen.getByRole('button', { name: 'Copy room code' }));

            await waitFor(() => expect(writeText).toHaveBeenCalled());
            expect(document.querySelector('.text-success')).toBeNull();
        });

        it('leaves the room', () => {
            const h = handlers();
            vi.mocked(useRoomLogic).mockReturnValue({ room: baseRoom, playerUid: 'u1', ttlWarning: null, ...h });

            render(<BrowserRouter><RoomScreen /></BrowserRouter>);
            fireEvent.click(screen.getByRole('button', { name: 'Leave room' }));

            expect(h.handleLeave).toHaveBeenCalled();
        });

        it('goes back to the lobby from an expired room', () => {
            vi.mocked(useRoomLogic).mockReturnValue({ room: null });
            render(<BrowserRouter><RoomScreen /></BrowserRouter>);

            fireEvent.click(screen.getByRole('button', { name: 'Back to lobby' }));
            expect(window.location.pathname).toBe('/');
        });
    });
});
