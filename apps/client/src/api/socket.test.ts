import { describe, it, expect, vi, beforeEach } from 'vitest';

const fakeSocket = vi.hoisted(() => ({
    auth: {} as Record<string, string>,
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
}));

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => fakeSocket),
}));

import { io } from 'socket.io-client';
import { connectSocket, getPlayerUid } from './socket';

describe('getPlayerUid', () => {
    beforeEach(() => sessionStorage.clear());

    it('creates an id once and reuses it for the session', () => {
        const first = getPlayerUid();
        expect(first).toMatch(/^p_\d+_/);
        expect(getPlayerUid()).toBe(first);
        expect(sessionStorage.getItem('player_uid')).toBe(first);
    });
});

describe('socket', () => {
    it('is created without connecting automatically', () => {
        expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ autoConnect: false, withCredentials: true }));
    });
});

describe('connectSocket', () => {
    beforeEach(() => {
        fakeSocket.auth = {};
        fakeSocket.connected = false;
        fakeSocket.connect.mockReset();
        fakeSocket.disconnect.mockReset().mockReturnValue(fakeSocket);
    });

    it('connects with the given credentials when not connected', () => {
        connectSocket('token-1', 'user-1');
        expect(fakeSocket.auth).toEqual({ token: 'token-1', playerUid: 'user-1' });
        expect(fakeSocket.connect).toHaveBeenCalledTimes(1);
        expect(fakeSocket.disconnect).not.toHaveBeenCalled();
    });

    it('reconnects when credentials change on a live connection', () => {
        fakeSocket.connected = true;
        fakeSocket.auth = { token: 'old', playerUid: 'user-1' };

        connectSocket('new', 'user-1');

        expect(fakeSocket.disconnect).toHaveBeenCalled();
        expect(fakeSocket.connect).toHaveBeenCalled();
    });

    it('drops a stale token after logging out', () => {
        fakeSocket.connected = true;
        fakeSocket.auth = { token: 'old', playerUid: 'user-1' };

        connectSocket(undefined, 'user-1');

        expect(fakeSocket.auth.token).toBeUndefined();
        expect(fakeSocket.disconnect).toHaveBeenCalled();
    });

    it('leaves a live connection alone when nothing changed', () => {
        fakeSocket.connected = true;
        fakeSocket.auth = { token: 't', playerUid: 'user-1' };

        connectSocket('t', 'user-1');

        expect(fakeSocket.disconnect).not.toHaveBeenCalled();
        expect(fakeSocket.connect).not.toHaveBeenCalled();
    });
});
