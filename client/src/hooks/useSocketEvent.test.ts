import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocketEvent } from './useSocketEvent';
import { socket } from '../api/socket';

vi.mock('../api/socket', () => ({
    socket: { on: vi.fn(), off: vi.fn() },
}));

describe('useSocketEvent', () => {
    it('subscribes on mount and unsubscribes on unmount', () => {
        const handler = vi.fn();
        const { unmount } = renderHook(() => useSocketEvent('room-update', handler));

        expect(socket.on).toHaveBeenCalledWith('room-update', handler);

        unmount();
        expect(socket.off).toHaveBeenCalledWith('room-update', handler);
    });
});
