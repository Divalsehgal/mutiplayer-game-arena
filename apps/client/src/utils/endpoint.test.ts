import { describe, it, expect } from 'vitest';
import { ROOM_ENDPOINT, GAME_ENDPOINT } from './endpoint';

describe('Endpoints', () => {
    it('should have correct ROOM_ENDPOINT values', () => {
        expect(ROOM_ENDPOINT.CREATE_ROOM).toBe('create-room');
        expect(ROOM_ENDPOINT.JOIN_ROOM).toBe('join-room');
        expect(ROOM_ENDPOINT.REGISTER).toBe('register');
    });

    it('should have correct GAME_ENDPOINT values', () => {
        expect(GAME_ENDPOINT.GAME_MOVE).toBe('game-move');
        expect(GAME_ENDPOINT.GAME_SYNC).toBe('game-sync');
    });
});
