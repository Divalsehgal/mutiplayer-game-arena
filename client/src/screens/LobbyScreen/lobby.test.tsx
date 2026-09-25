import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LobbyScreen from './index';
import { BrowserRouter } from 'react-router-dom';
import { socket } from '../../api/socket';

vi.mock('../../api/socket', () => ({
  socket: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  getPlayerUid: () => 'uid123',
}));

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockedNavigate,
  };
});

describe('LobbyScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                const cb = args[0];
                cb?.({ ok: true, rooms: [] });
            }
        });
    });

    it('should render the create-room and public-rooms sections', () => {
        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );
        expect(screen.getByText(/Create a room/i)).toBeDefined();
        expect(screen.getByText(/Join with a code/i)).toBeDefined();
        expect(screen.getByText(/^Open rooms$/i)).toBeDefined();
    });

    it('should allow entering a player name', () => {
        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );
        const nameInput = screen.getByPlaceholderText(/Enter your name/i) as HTMLInputElement;
        fireEvent.change(nameInput, { target: { value: 'JOHN' } });
        expect(nameInput.value).toBe('JOHN');
    });

    it('should show an error instead of creating a room when the name is too short', () => {
        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));

        expect(screen.getByRole('alert').textContent).toContain('Enter a name');
        expect(socket.emit).not.toHaveBeenCalledWith('create-room', expect.anything(), expect.anything());
    });

    it('should create a room and navigate to it on success', () => {
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                args[0]?.({ ok: true, rooms: [] });
            }
            if (event === 'create-room') {
                const cb = args[1];
                cb?.({ ok: true, roomId: 'abc123' });
            }
        });

        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'JOHN' } });
        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));

        expect(socket.emit).toHaveBeenCalledWith(
            'create-room',
            expect.objectContaining({ hostName: 'JOHN', gameType: 'RPS' }),
            expect.any(Function)
        );
        expect(mockedNavigate).toHaveBeenCalledWith('/room/abc123');
    });

    it('should show an error when room creation fails', () => {
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                args[0]?.({ ok: true, rooms: [] });
            }
            if (event === 'create-room') {
                const cb = args[1];
                cb?.({ ok: false, error: 'Creation failed' });
            }
        });

        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'JOHN' } });
        fireEvent.click(screen.getByRole('button', { name: /^Create room$/i }));

        expect(screen.getByRole('alert').textContent).toBe('Creation failed');
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it('should join a room by ID and navigate to it on success', () => {
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                args[0]?.({ ok: true, rooms: [] });
            }
            if (event === 'join-room') {
                const cb = args[1];
                cb?.({ ok: true });
            }
        });

        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'JOHN' } });
        fireEvent.change(screen.getByPlaceholderText(/Room code/i), { target: { value: 'xyz1' } });
        fireEvent.click(screen.getByRole('button', { name: /^Join$/i }));

        expect(socket.emit).toHaveBeenCalledWith(
            'join-room',
            expect.objectContaining({ roomId: 'XYZ1', name: 'JOHN' }),
            expect.any(Function)
        );
        expect(mockedNavigate).toHaveBeenCalledWith('/room/XYZ1');
    });

    it('should show an error when the room to join is not found', () => {
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                args[0]?.({ ok: true, rooms: [] });
            }
            if (event === 'join-room') {
                const cb = args[1];
                cb?.({ ok: false, error: 'Room not found' });
            }
        });

        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'JOHN' } });
        fireEvent.change(screen.getByPlaceholderText(/Room code/i), { target: { value: 'nope' } });
        fireEvent.click(screen.getByRole('button', { name: /^Join$/i }));

        expect(screen.getByRole('alert').textContent).toBe('Room not found');
    });

    it('should render public rooms fetched on mount and join one on click', () => {
        (socket.emit as any).mockImplementation((event: string, ...args: any[]) => {
            if (event === 'get-public-rooms') {
                args[0]?.({
                    ok: true,
                    rooms: [{ id: 'room1', hostName: 'Host', players: [], maxPlayers: 2, gameType: 'RPS' }]
                });
            }
            if (event === 'join-room') {
                const cb = args[1];
                cb?.({ ok: true });
            }
        });

        render(
            <BrowserRouter>
                <LobbyScreen />
            </BrowserRouter>
        );

        expect(screen.getAllByText(/room1/i).length).toBeGreaterThan(0);

        fireEvent.change(screen.getByPlaceholderText(/Enter your name/i), { target: { value: 'JOHN' } });
        fireEvent.click(screen.getAllByRole('button', { name: /^Join$/i }).at(-1)!);

        expect(socket.emit).toHaveBeenCalledWith(
            'join-room',
            expect.objectContaining({ roomId: 'room1', name: 'JOHN' }),
            expect.any(Function)
        );
    });
});
