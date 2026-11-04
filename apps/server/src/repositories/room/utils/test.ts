import { serializeRoom } from './mapper';
import { Room } from '../../../models/room/Room';

describe('serializeRoom', () => {
    it('should return null if room is null', () => {
        expect(serializeRoom(null)).toBeNull();
    });

    it('should serialize room correctly and omit socketId', () => {
        const mockRoom: Room = {
            id: 'r1',
            gameType: 'RPS',
            status: 'playing',
            maxPlayers: 2,
            allowSpectators: true,
            isPublic: true,
            hostName: 'Host',
            players: [
                { playerUid: 'u1', name: 'N1', role: 'player', socketId: 's1', status: 'online', score: 0 }
            ],
            gameState: { status: 'waiting', readyPlayers: [], roundCount: 0, playerChoices: {} },
            createdAt: 100,
            updatedAt: 200,
            lastActivityAt: 200,
            expiresAt: 1000,
            hasSentWarning: false
        };

        const result = serializeRoom(mockRoom);
        expect(result).not.toBeNull();
        expect(result?.id).toBe('r1');
        expect(result?.players[0]).not.toHaveProperty('socketId');
        expect(result?.players[0].playerUid).toBe('u1');
    });
});
