import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LobbyScreen from './index';
import { BrowserRouter } from 'react-router-dom';
import { socket } from '../../api/socket';
import { useAuthStore } from '../../store/auth';

vi.mock('../../api/socket', () => ({
  socket: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  getPlayerUid: () => 'uid123',
}));

vi.mock('../../store/auth', () => ({ useAuthStore: vi.fn() }));

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockedNavigate,
  };
});

describe('LobbyScreen options and open rooms', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: { user_name: 'JOHN' } } as any);
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                const cb = args[0];
                cb?.({ ok: true, rooms: [] });
            }
        });
    });

    describe('playing against the computer', () => {
        it('starts a private game against the computer and goes straight to the game', () => {
            (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
                if (event === 'get-public-rooms') args[0]?.({ ok: true, rooms: [] });
                if (event === 'create-room') {
                    args[1]?.({
                        ok: true,
                        roomId: 'bot1',
                        room: { players: [{ playerUid: 'uid123', name: 'JOHN' }, { playerUid: 'bot-bot1', name: 'Computer', isBot: true }] },
                    });
                }
            });

            render(<BrowserRouter><LobbyScreen /></BrowserRouter>);

            fireEvent.click(screen.getByRole('button', { name: 'Tic-Tac-Toe' }));
            fireEvent.click(screen.getByRole('button', { name: 'Computer' }));
            fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

            expect(socket.emit).toHaveBeenCalledWith(
                'create-room',
                expect.objectContaining({ hostName: 'JOHN', gameType: 'TIC_TAC_TOE', vsComputer: true }),
                expect.any(Function)
            );
            expect(mockedNavigate).toHaveBeenCalledWith('/game/bot1');
        });

        it('hides the room privacy choice, since nobody else can join', () => {
            render(<BrowserRouter><LobbyScreen /></BrowserRouter>);

            expect(screen.getByText('Who can join')).toBeDefined();
            fireEvent.click(screen.getByRole('button', { name: 'Computer' }));
            expect(screen.queryByText('Who can join')).toBeNull();

            fireEvent.click(screen.getByRole('button', { name: 'People' }));
            expect(screen.getByText('Who can join')).toBeDefined();
        });
    });

    it('creates a private room when "Only with code" is chosen', () => {
        render(<BrowserRouter><LobbyScreen /></BrowserRouter>);

        expect(screen.getByRole('button', { name: 'Anyone', pressed: true })).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: 'Only with code' }));
        expect(screen.getByRole('button', { name: 'Only with code', pressed: true })).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));

        expect(socket.emit).toHaveBeenCalledWith(
            'create-room',
            expect.objectContaining({ isPublic: false, vsComputer: false }),
            expect.any(Function)
        );
    });

    it('uses a generic message when the server gives no reason', () => {
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') args[0]?.({ ok: true, rooms: [] });
            if (event === 'create-room') args[1]?.({ ok: false });
            if (event === 'join-room') args[1]?.({ ok: false });
        });
        render(<BrowserRouter><LobbyScreen /></BrowserRouter>);

        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));
        expect(screen.getByRole('alert').textContent).toMatch(/Couldn't create the room/);

        fireEvent.change(screen.getByLabelText('Room code'), { target: { value: 'abc' } });
        fireEvent.click(screen.getByRole('button', { name: /^Join$/i }));
        expect(screen.getByRole('alert').textContent).toMatch(/couldn't find that room/);
    });

    it('asks for a room code before joining', () => {
        render(<BrowserRouter><LobbyScreen /></BrowserRouter>);

        fireEvent.click(screen.getByRole('button', { name: /^Join$/i }));

        expect(screen.getByRole('alert').textContent).toBe('Enter a room code to join.');
        expect(socket.emit).not.toHaveBeenCalledWith('join-room', expect.anything(), expect.anything());
    });

    it('refreshes the open rooms every 10 seconds', () => {
        vi.useFakeTimers();
        render(<BrowserRouter><LobbyScreen /></BrowserRouter>);
        const fetches = () => (socket.emit as any).mock.calls.filter(([e]: [string]) => e === 'get-public-rooms').length;

        expect(fetches()).toBe(1);
        vi.advanceTimersByTime(10000);
        expect(fetches()).toBe(2);
        vi.useRealTimers();
    });

    it('offers to watch a full room and shows who is hosting', () => {
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                args[0]?.({
                    ok: true,
                    rooms: [{
                        id: 'full1',
                        gameType: 'SNAKE_LADDER',
                        maxPlayers: 2,
                        players: [
                            { playerUid: 'a', name: 'Ana', role: 'player' },
                            { playerUid: 'b', name: 'Ben', role: 'player' },
                        ],
                    }],
                });
            }
        });

        render(<BrowserRouter><LobbyScreen /></BrowserRouter>);

        const row = screen.getByRole('listitem');
        expect(row.textContent).toContain('Snakes & Ladders');
        expect(row.textContent).toContain('Ana · 2/2 players');
        expect(screen.getByRole('button', { name: 'Watch' })).toBeDefined();
    });

    it('shows an empty state when there are no open rooms', () => {
        render(<BrowserRouter><LobbyScreen /></BrowserRouter>);
        expect(screen.getByText('No open rooms right now.')).toBeDefined();
    });
});
