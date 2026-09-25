import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomConnection } from './useRoomConnection';
import { socket } from '../api/socket';
import { useRoomStore } from '../store/room';
import { useAuthStore } from '../store/auth';

vi.mock('../api/socket', () => ({
    socket: { emit: vi.fn() },
    getPlayerUid: () => 'anon-1',
}));
vi.mock('../store/room', () => ({ useRoomStore: vi.fn() }));
vi.mock('../store/auth', () => ({ useAuthStore: vi.fn() }));
vi.mock('./useSocket', () => ({ useSocket: () => ({ isConnected: true }) }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

// Capture socket event handlers so tests can fire server events directly.
const handlers: Record<string, (...args: unknown[]) => void> = {};
vi.mock('./useSocketEvent', () => ({
    useSocketEvent: (event: string, cb: (...args: unknown[]) => void) => {
        handlers[event] = cb;
    },
}));

describe('useRoomConnection', () => {
    const store = {
        room: undefined as unknown,
        setRoom: vi.fn(),
        ttlWarning: null as number | null,
        setTtlWarning: vi.fn(),
        reset: vi.fn(),
    };

    // Make register call straight through to join, and join answer with `joinResponse`.
    const answerJoinWith = (joinResponse: unknown) => {
        vi.mocked(socket.emit).mockImplementation(((event: string, _payload: unknown, cb?: (res?: unknown) => void) => {
            if (event === 'register') cb?.();
            if (event === 'join-room') cb?.(joinResponse);
            if (event === 'extend-room') cb?.();
        }) as never);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        store.room = undefined;
        store.ttlWarning = null;
        vi.mocked(useRoomStore).mockReturnValue(store as never);
        vi.mocked(useAuthStore).mockReturnValue({ user: { _id: 'u1', user_name: 'Dana', avatar: 'https://img/a.png' } } as never);
        answerJoinWith({ ok: true, room: { id: 'r1' } });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('registers, joins the room with the avatar, and stores the room', () => {
        renderHook(() => useRoomConnection('r1'));

        expect(socket.emit).toHaveBeenCalledWith('register', { playerUid: 'u1', name: 'Dana', avatar: 'https://img/a.png' }, expect.any(Function));
        expect(socket.emit).toHaveBeenCalledWith('join-room', { roomId: 'r1', name: 'Dana', avatar: 'https://img/a.png' }, expect.any(Function));
        expect(store.setRoom).toHaveBeenCalledWith({ id: 'r1' });
    });

    it('joins as a guest using the saved name when not signed in', () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: null } as never);
        sessionStorage.setItem('playerName', 'Guesty');

        renderHook(() => useRoomConnection('r1'));

        expect(socket.emit).toHaveBeenCalledWith('register', { playerUid: 'anon-1', name: 'Guesty' }, expect.any(Function));
        expect(socket.emit).toHaveBeenCalledWith('join-room', { roomId: 'r1', name: 'Guesty' }, expect.any(Function));
    });

    it('falls back to "Player" when there is no name at all', () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: null } as never);
        renderHook(() => useRoomConnection('r1'));
        expect(socket.emit).toHaveBeenCalledWith('register', expect.objectContaining({ name: 'Player' }), expect.any(Function));
    });

    it('marks the room as gone when joining fails', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        answerJoinWith({ ok: false, error: 'Room does not exist' });

        renderHook(() => useRoomConnection('r1'));

        expect(store.setRoom).toHaveBeenCalledWith(null);
        errorSpy.mockRestore();
    });

    it('does not join without a room id', () => {
        renderHook(() => useRoomConnection(undefined));
        expect(socket.emit).not.toHaveBeenCalled();
    });

    it('applies room updates from the server', () => {
        renderHook(() => useRoomConnection('r1'));

        act(() => handlers['room-update']({ id: 'r1', status: 'playing' }));
        expect(store.setRoom).toHaveBeenLastCalledWith({ id: 'r1', status: 'playing' });

        act(() => handlers['room-update'](null));
        expect(store.setRoom).toHaveBeenLastCalledWith(null);
    });

    it('starts the inactivity countdown on a warning and ticks it down', () => {
        vi.useFakeTimers();
        const { rerender } = renderHook(() => useRoomConnection('r1'));

        act(() => handlers['ROOM_WARNING']({ secondsLeft: 30 }));
        expect(store.setTtlWarning).toHaveBeenCalledWith(30);

        store.ttlWarning = 30;
        rerender();
        act(() => { vi.advanceTimersByTime(1000); });
        expect(store.setTtlWarning).toHaveBeenLastCalledWith(29);
    });

    it('sends the player back to the lobby when the room expires', () => {
        renderHook(() => useRoomConnection('r1'));

        act(() => handlers['room-error']({ code: 'ROOM_EXPIRED' }));

        expect(store.setRoom).toHaveBeenCalledWith(null);
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('ignores other room errors', () => {
        renderHook(() => useRoomConnection('r1'));
        store.setRoom.mockClear();

        act(() => handlers['room-error']({ code: 'SOMETHING_ELSE' }));
        act(() => handlers['room-error'](null));

        expect(store.setRoom).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('marks this tab as superseded when the session moves elsewhere', () => {
        const { result } = renderHook(() => useRoomConnection('r1'));
        expect(result.current.superseded).toBe(false);

        act(() => handlers['session-taken-over']());
        expect(result.current.superseded).toBe(true);
    });

    it('extends the session and clears the warning', () => {
        const { result } = renderHook(() => useRoomConnection('r1'));

        act(() => result.current.handleExtendSession());

        expect(socket.emit).toHaveBeenCalledWith('extend-room', { roomId: 'r1' }, expect.any(Function));
        expect(store.setTtlWarning).toHaveBeenCalledWith(null);
    });

    it('leaves the room, clears local state, and returns to the lobby', () => {
        const { result } = renderHook(() => useRoomConnection('r1'));

        act(() => result.current.handleLeave());

        expect(socket.emit).toHaveBeenCalledWith('leave-room', { roomId: 'r1' });
        expect(store.reset).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('does nothing on extend or leave without a room id', () => {
        const { result } = renderHook(() => useRoomConnection(undefined));

        act(() => {
            result.current.handleExtendSession();
            result.current.handleLeave();
        });

        expect(socket.emit).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
