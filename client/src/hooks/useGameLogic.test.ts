import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameLogic } from './useGameLogic';
import { socket } from '../api/socket';
import { useSocketEvent } from './useSocketEvent';
import * as roomStore from '../store/room';

vi.mock('../api/socket', () => ({
    socket: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    },
    getPlayerUid: () => 'u1'
}));

vi.mock('../store/auth', () => ({
    useAuthStore: () => ({ user: { id: 'u1' } })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

vi.mock('./useSocket', () => ({
    useSocket: () => ({ isConnected: true })
}));

vi.mock('./useSocketEvent', () => ({
    useSocketEvent: vi.fn()
}));

const mockSetRoom = vi.fn();
const mockSetTtlWarning = vi.fn();

vi.mock('../store/room', () => ({
    useRoomStore: vi.fn()
}));

describe('useGameLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(roomStore.useRoomStore).mockReturnValue({
            room: undefined,
            setRoom: mockSetRoom,
            ttlWarning: null,
            setTtlWarning: mockSetTtlWarning,
            reset: vi.fn()
        } as any);
    });

    it('should initialize and return correct playerUid', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        expect(result.current.playerUid).toBe('u1');
    });

    it('should return initial store values', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        expect(result.current.room).toBeUndefined();
        expect(result.current.ttlWarning).toBeNull();
    });

    it('should handle handleExtendSession', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        result.current.handleExtendSession();
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('extend-room', expect.anything(), expect.anything());
    });

    it('should handle handleLeave', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        result.current.handleLeave();
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('leave-room', expect.anything());
    });

    it('should handle handleRPSMove', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        result.current.handleRPSMove('Rock');
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('game-move', expect.objectContaining({ move: 'Rock' }));
    });

    it('should handle handleSnakeLadderMove', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        result.current.handleSnakeLadderMove();
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('game-move', expect.objectContaining({ move: 'roll' }));
    });

    it('should handle handleTicTacToeMove', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        result.current.handleTicTacToeMove(0);
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('game-move', expect.objectContaining({ move: '0' }));
    });

    it('should handle handleNextRound', () => {
        const { result } = renderHook(() => useGameLogic('r1'));
        result.current.handleNextRound();
        expect(vi.mocked(socket.emit)).toHaveBeenCalledWith('game-ready', expect.anything());
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

        renderHook(() => useGameLogic('r1'));

        expect(roomUpdateCb).toBeDefined();
        expect(roomWarningCb).toBeDefined();
        expect(roomErrorCb).toBeDefined();

        // Call them to cover lines
        roomUpdateCb(null);
        expect(mockSetRoom).toHaveBeenCalledWith(null);

        roomUpdateCb({ id: 'r1' });
        expect(mockSetRoom).toHaveBeenCalledWith({ id: 'r1' });

        roomWarningCb({ secondsLeft: 10 });
        expect(mockSetTtlWarning).toHaveBeenCalledWith(10);

        roomErrorCb({ code: 'ROOM_EXPIRED', message: 'Expired' });
        expect(mockSetRoom).toHaveBeenCalledWith(null);

        roomErrorCb({ code: 'OTHER', message: 'Other' });
    });

    it('should execute interval when ttlWarning is > 0', () => {
        vi.useFakeTimers();
        vi.mocked(roomStore.useRoomStore).mockReturnValue({
            room: undefined,
            setRoom: mockSetRoom,
            ttlWarning: 10,
            setTtlWarning: mockSetTtlWarning,
            reset: vi.fn()
        } as any);

        renderHook(() => useGameLogic('r1'));
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(mockSetTtlWarning).toHaveBeenCalledWith(9);
        vi.useRealTimers();
    });

    it('should trigger register and join-room callbacks on mount', () => {
        vi.mocked(socket.emit).mockImplementation((event, data, cb) => {
            if (event === 'register') {
                if (typeof cb === 'function') cb();
            }
            if (event === 'join-room') {
                if (typeof cb === 'function') cb({ ok: true, room: { id: 'r1' } });
            }
        });

        renderHook(() => useGameLogic('r1'));

        expect(socket.emit).toHaveBeenCalledWith('register', expect.anything(), expect.any(Function));
        expect(socket.emit).toHaveBeenCalledWith('join-room', expect.anything(), expect.any(Function));
        expect(mockSetRoom).toHaveBeenCalledWith({ id: 'r1' });
    });

    it('should handle join-room callback failure', () => {
        vi.mocked(socket.emit).mockImplementation((event, data, cb) => {
            if (event === 'register') {
                if (typeof cb === 'function') cb();
            }
            if (event === 'join-room') {
                if (typeof cb === 'function') cb({ ok: false, error: 'Not found' });
            }
        });

        renderHook(() => useGameLogic('r1'));

        expect(mockSetRoom).toHaveBeenCalledWith(null);
    });

    it('returns to the waiting room if the match is interrupted', () => {
        vi.mocked(roomStore.useRoomStore).mockReturnValue({
            room: { status: 'waiting-for-players' },
            setRoom: mockSetRoom,
            ttlWarning: null,
            setTtlWarning: mockSetTtlWarning,
            reset: vi.fn()
        } as any);

        renderHook(() => useGameLogic('r1'));

        expect(mockNavigate).toHaveBeenCalledWith('/room/r1');
    });

    it('ignores game actions without a room id', () => {
        const { result } = renderHook(() => useGameLogic(undefined));

        result.current.handleRPSMove('Rock');
        result.current.handleSnakeLadderMove();
        result.current.handleTicTacToeMove(0);
        result.current.handleNextRound();

        expect(socket.emit).not.toHaveBeenCalled();
    });
});
