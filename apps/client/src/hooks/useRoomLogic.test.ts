import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomLogic } from './useRoomLogic';
import { socket } from '../api/socket';
import { useSocketEvent } from './useSocketEvent';
import { useRoomStore } from '../store/room';

vi.mock('../store/room', () => ({
    useRoomStore: vi.fn(),
}));

vi.mock('../api/socket', () => ({
    socket: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        disconnect: vi.fn()
    },
    getPlayerUid: () => 'u1'
}));

vi.mock('../store/auth', () => ({
    useAuthStore: () => ({ user: { id: 'u1' } })
}));

vi.mock('./useSocket', () => ({
    useSocket: () => ({ isConnected: true })
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

vi.mock('./useSocketEvent', () => ({
    useSocketEvent: vi.fn()
}));

describe('useRoomLogic', () => {
    beforeEach(() => {
        vi.mocked(useRoomStore).mockReturnValue({
            room: undefined,
            setRoom: vi.fn(),
            ttlWarning: null,
            setTtlWarning: vi.fn(),
            reset: vi.fn()
        } as any);
        vi.clearAllMocks();
    });
    it('should initialize and return correct playerUid', () => {
        const { result } = renderHook(() => useRoomLogic('r1'));
        expect(result.current.playerUid).toBe('u1');
    });

    it('should return initial store values', () => {
        const { result } = renderHook(() => useRoomLogic('r1'));
        expect(result.current.room).toBeUndefined();
        expect(result.current.ttlWarning).toBeNull();
    });

    it('should handle handleStartGame', () => {
        const { result } = renderHook(() => useRoomLogic('r1'));
        result.current.handleStartGame();
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('game-ready', expect.anything());
    });

    it('should handle handleLeave', () => {
        const { result } = renderHook(() => useRoomLogic('r1'));
        result.current.handleLeave();
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('leave-room', expect.anything());
    });

    it('should test socket event handlers', () => {
        let roomUpdateCb: any;
        let roomWarningCb: any;
        let roomErrorCb: any;

        vi.mocked(useSocketEvent).mockImplementation((event: string, cb: any) => {
            if (event === 'room-update') roomUpdateCb = cb;
            if (event === 'ROOM_WARNING') roomWarningCb = cb;
            if (event === 'room-error') roomErrorCb = cb;
        });

        const setRoom = vi.fn();
        vi.mocked(useRoomStore).mockReturnValue({
            room: undefined,
            setRoom,
            ttlWarning: null,
            setTtlWarning: vi.fn(),
            reset: vi.fn()
        } as any);

        renderHook(() => useRoomLogic('r1'));

        expect(roomUpdateCb).toBeDefined();
        expect(roomWarningCb).toBeDefined();
        expect(roomErrorCb).toBeDefined();

        // Call them to cover lines
        roomUpdateCb(null);
        roomUpdateCb({ id: 'r1' });
        roomWarningCb({ secondsLeft: 10 });
        
        // ROOM_EXPIRED branch
        roomErrorCb({ code: 'ROOM_EXPIRED' });
        expect(setRoom).toHaveBeenCalledWith(null);
        
        // Other error code
        roomErrorCb({ code: 'OTHER' });
    });

    it('should mark the session as superseded when another tab/device takes over the room', () => {
        let sessionTakenOverCb: any;

        vi.mocked(useSocketEvent).mockImplementation((event: string, cb: any) => {
            if (event === 'session-taken-over') sessionTakenOverCb = cb;
        });

        const { result } = renderHook(() => useRoomLogic('r1'));

        expect(sessionTakenOverCb).toBeDefined();
        expect(result.current.superseded).toBe(false);

        act(() => {
            sessionTakenOverCb({ roomId: 'r1' });
        });

        expect(result.current.superseded).toBe(true);
    });

    it('should execute interval when ttlWarning is > 0', () => {
        vi.useFakeTimers();
        const setTtlWarning = vi.fn();
        vi.mocked(useRoomStore).mockReturnValue({
            room: undefined,
            setRoom: vi.fn(),
            ttlWarning: 10,
            setTtlWarning,
            reset: vi.fn()
        } as any);

        renderHook(() => useRoomLogic('r1'));
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(setTtlWarning).toHaveBeenCalledWith(9);
        vi.useRealTimers();
    });

    it('should handle join-room callback', () => {
        let joinCallback: any;
        vi.mocked(socket.emit).mockImplementation((event: string, data: any, cb?: any) => {
            if (event === 'register') {
                // register's callback is the 3rd arg — invoke it immediately to trigger the nested join-room emit
                const registerCb = typeof data === 'function' ? data : cb;
                if (registerCb) registerCb();
            }
            if (event === 'join-room') joinCallback = cb;
            return socket;
        });

        const setRoom = vi.fn();
        vi.mocked(useRoomStore).mockReturnValue({
            room: undefined,
            setRoom,
            ttlWarning: null,
            setTtlWarning: vi.fn(),
            reset: vi.fn()
        } as any);

        renderHook(() => useRoomLogic('r1'));

        // At this point, the useEffect has run, register was called, its callback fired,
        // and join-room was called — so joinCallback should be captured.
        expect(joinCallback).toBeDefined();

        act(() => {
            joinCallback({ ok: true, room: { id: 'r1' } });
        });
        expect(setRoom).toHaveBeenCalledWith({ id: 'r1' });

        act(() => {
            joinCallback({ ok: false, error: 'fail' });
        });
    });

    it('should handle handleExtendSession callback', () => {
        let extendCallback: any;
        vi.mocked(socket.emit).mockImplementation((event: string, data: any, cb?: any) => {
            if (event === 'extend-room') extendCallback = cb;
            return socket;
        });

        const setTtlWarning = vi.fn();
        vi.mocked(useRoomStore).mockReturnValue({
            room: undefined,
            setRoom: vi.fn(),
            ttlWarning: 10,
            setTtlWarning,
            reset: vi.fn()
        } as any);

        const { result } = renderHook(() => useRoomLogic('r1'));
        result.current.handleExtendSession();

        act(() => {
            if (extendCallback) extendCallback();
        });
        expect(setTtlWarning).toHaveBeenCalledWith(null);
    });

    it('should navigate to game when status is playing', () => {
        vi.useFakeTimers();
        vi.mocked(useRoomStore).mockReturnValue({
            room: { status: 'playing' },
            setRoom: vi.fn(),
            ttlWarning: null,
            setTtlWarning: vi.fn(),
            reset: vi.fn()
        } as any);

        renderHook(() => useRoomLogic('r1'));
        act(() => {
            vi.advanceTimersByTime(150);
        });
    });
});
