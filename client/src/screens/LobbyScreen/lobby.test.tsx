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

const answer = (handlers: Record<string, unknown>, rooms: unknown[] = []) => {
    (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
        if (event === 'get-public-rooms') args[0]?.({ ok: true, rooms });
        if (event in handlers) args[1]?.(handlers[event]);
    });
};

const renderLobby = () => render(<BrowserRouter><LobbyScreen /></BrowserRouter>);

describe('LobbyScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: { user_name: 'JOHN' } } as any);
        answer({});
    });

    it('should render the create-room and public-rooms sections', () => {
        renderLobby();
        expect(screen.getByRole('heading', { level: 1, name: 'Play' })).toBeDefined();
        expect(screen.getByText('New game')).toBeDefined();
        expect(screen.getByText(/Join with a code/i)).toBeDefined();
        expect(screen.getByText(/^Open rooms$/i)).toBeDefined();
    });

    it('has no player name input', () => {
        renderLobby();
        expect(screen.queryByPlaceholderText(/Enter your name/i)).toBeNull();
        expect(screen.getAllByRole('textbox')).toHaveLength(1);
    });

    it('should create a room with the signed-in name and default game, then navigate to it', () => {
        answer({ 'create-room': { ok: true, roomId: 'abc123' } });
        renderLobby();

        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));

        expect(socket.emit).toHaveBeenCalledWith(
            'create-room',
            expect.objectContaining({ hostName: 'JOHN', gameType: 'TIC_TAC_TOE' }),
            expect.any(Function)
        );
        expect(mockedNavigate).toHaveBeenCalledWith('/room/abc123');
    });

    it('falls back to "Player" when the user has no name', () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
        answer({ 'create-room': { ok: true, roomId: 'abc123' } });
        renderLobby();

        fireEvent.click(screen.getByRole('button', { name: 'Rock Paper Scissors' }));
        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));

        expect(socket.emit).toHaveBeenCalledWith(
            'create-room',
            expect.objectContaining({ hostName: 'Player', gameType: 'RPS' }),
            expect.any(Function)
        );
    });

    it('should show an error when room creation fails', () => {
        answer({ 'create-room': { ok: false, error: 'Creation failed' } });
        renderLobby();

        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));

        expect(screen.getByRole('alert').textContent).toBe('Creation failed');
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it('should join a room by ID and navigate to it on success', () => {
        answer({ 'join-room': { ok: true } });
        renderLobby();

        fireEvent.change(screen.getByLabelText('Room code'), { target: { value: 'xyz1' } });
        fireEvent.click(screen.getByRole('button', { name: /^Join$/i }));

        expect(socket.emit).toHaveBeenCalledWith(
            'join-room',
            expect.objectContaining({ roomId: 'XYZ1', name: 'JOHN' }),
            expect.any(Function)
        );
        expect(mockedNavigate).toHaveBeenCalledWith('/room/XYZ1');
    });

    it('should show an error when the room to join is not found', () => {
        answer({ 'join-room': { ok: false, error: 'Room not found' } });
        renderLobby();

        fireEvent.change(screen.getByLabelText('Room code'), { target: { value: 'nope' } });
        fireEvent.click(screen.getByRole('button', { name: /^Join$/i }));

        expect(screen.getByRole('alert').textContent).toBe('Room not found');
    });

    it('should render public rooms fetched on mount and join one on click', () => {
        answer({ 'join-room': { ok: true } }, [
            { id: 'room1', players: [{ name: 'Host', role: 'player' }], maxPlayers: 2, gameType: 'RPS' },
        ]);
        renderLobby();

        expect(screen.getByText('Rock Paper Scissors', { selector: 'p' })).toBeDefined();
        fireEvent.click(screen.getAllByRole('button', { name: /^Join$/i }).at(-1)!);

        expect(socket.emit).toHaveBeenCalledWith(
            'join-room',
            expect.objectContaining({ roomId: 'room1', name: 'JOHN' }),
            expect.any(Function)
        );
    });
});
