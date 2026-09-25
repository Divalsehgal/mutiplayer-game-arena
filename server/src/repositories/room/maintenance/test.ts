import { RoomMaintenanceRepository } from './index';
import { RPSState } from '../../../models/game/Game';

describe('RoomMaintenanceRepository', () => {
    let repo: RoomMaintenanceRepository;
    const mockNow = 1000000;

    beforeEach(() => {
        repo = new RoomMaintenanceRepository(() => mockNow);
    });

    it('should handle disconnection and reconnection via rejoin', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });

        repo.markSocketDisconnected('s1');
        expect(room.players[0].status).toBe('offline');

        // Reconnection happens by rejoining with the same playerUid and a fresh socket.
        repo.joinRoom({ roomId: room.id, playerUid: 'h1', socketId: 's2', name: 'P1' });
        expect(room.players[0].status).toBe('online');
        expect(room.players[0].socketId).toBe('s2');
    });

    it('should increment score', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
        });
        repo.incrementScore(room.id, 'h1');
        expect(room.players[0].score).toBe(1);
    });

    it('should update game state', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
        });
        repo.updateGameState({ roomId: room.id, gameState: { status: 'playing' } as RPSState, status: 'playing' });
        expect(room.status).toBe('playing');
        expect((room.gameState as RPSState).status).toBe('playing');
    });

    it('should extend room', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
        });
        const oldExpires = room.expiresAt;
        (repo as any).now = () => mockNow + 1000;
        repo.extendRoom(room.id);
        expect(room.expiresAt).toBeGreaterThan(oldExpires);
    });

    it('should cleanup disconnected players', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
        });
        repo.markSocketDisconnected('s1');
        (repo as any).now = () => mockNow + 10000;
        repo.cleanupDisconnectedPlayers(1000);
        expect(room.players.length).toBe(0);
        expect(repo.getRoom(room.id)).toBeNull(); // room deleted if 0 players
    });

    it('should check room TTLs and send warnings', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
        });
        (repo as any).now = () => room.expiresAt - 1000;
        const result = repo.checkRoomTTLs(5000);
        expect(result.warnings.length).toBe(1);
        expect(room.hasSentWarning).toBe(true);

        (repo as any).now = () => room.expiresAt + 1;
        const result2 = repo.checkRoomTTLs();
        expect(result2.expired.length).toBe(1);
        expect(repo.getRoom(room.id)).toBeNull();
    });

    it('should cleanup idle rooms', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
        });
        room.lastActivityAt = 100;
        (repo as any).now = () => 1000000;
        repo.cleanupIdleRooms(1000);
        expect(repo.getRoom(room.id)).toBeNull();
    });

    describe('Negative paths & edge cases', () => {
        it('should return null when marking unknown socket disconnected', () => {
            expect(repo.markSocketDisconnected('unknown')).toBeNull();
        });

        it('should silently return when incrementing score for unknown room or player', () => {
            repo.incrementScore('unknown', 'h1');
            const room = repo.createRoom({ hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState });
            repo.incrementScore(room.id, 'unknown');
        });

        it('should throw error when updating game state for unknown room', () => {
            expect(() => repo.updateGameState({ roomId: 'unknown', gameState: {} as RPSState })).toThrow('No room');
        });

        it('should return null when extending unknown room', () => {
            expect(repo.extendRoom('unknown')).toBeNull();
        });

        it('should serialize room correctly', () => {
            const room = repo.createRoom({ hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState });
            const serialized = repo.serializeRoom(room.id);
            expect(serialized?.id).toBe(room.id);
        });

        it('should promote spectators when cleaning up disconnected players but room not empty', () => {
            const room = repo.createRoom({
                hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState, maxPlayers: 1
            });
            // join as spectator
            repo.joinRoom({ roomId: room.id, playerUid: 's1', socketId: 'sock2', name: 'S1' });
            
            repo.markSocketDisconnected('s1'); // host disconnects
            
            (repo as any).now = () => mockNow + 10000;
            repo.cleanupDisconnectedPlayers(1000);
            
            // room should still exist with 1 player
            expect(room.players.length).toBe(1);
            expect(room.players[0].playerUid).toBe('s1');
            expect(room.players[0].role).toBe('player'); // Promoted
        });
        
        it('should keep disconnected player if grace period not met', () => {
            const room = repo.createRoom({
                hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
            });
            repo.markSocketDisconnected('s1');
            
            // only 500ms passed, grace period is 1000
            (repo as any).now = () => mockNow + 500;
            repo.cleanupDisconnectedPlayers(1000);
            
            expect(room.players.length).toBe(1);
        });

        it('should handle updateGameState without status update', () => {
            const room = repo.createRoom({
                hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
            });
            const oldStatus = room.status;
            repo.updateGameState({ roomId: room.id, gameState: { status: 'playing' } as RPSState });
            expect(room.status).toBe(oldStatus);
        });

        it('should cleanup idle rooms with socket mapping cleanup', () => {
            const room = repo.createRoom({
                hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
            });
            room.lastActivityAt = 100;
            (repo as any).now = () => 1000000;
            repo.cleanupIdleRooms(1000);
            expect(repo.getRoom(room.id)).toBeNull();
            expect((repo as any).socketToPlayer.has('s1')).toBe(false);
        });


        it('should cleanup rooms and socket mapping in checkRoomTTLs', () => {
            const room = repo.createRoom({
                hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
            });
            (repo as any).now = () => room.expiresAt + 1;
            repo.checkRoomTTLs();
            expect(repo.getRoom(room.id)).toBeNull();
            expect((repo as any).socketToPlayer.has('s1')).toBe(false);
        });

        it('should cleanup socket mapping when room expires in checkRoomTTLs', () => {
            const room = repo.createRoom({
                hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
            });
            room.players[0].socketId = 's1';
            (repo as any).now = () => room.expiresAt + 1;
            repo.checkRoomTTLs();
            expect(repo.getRoom(room.id)).toBeNull();
            expect((repo as any).socketToPlayer.has('s1')).toBe(false);
        });

        it('should handle players without socketId in checkRoomTTLs cleanup', () => {
            const room = repo.createRoom({
                hostPlayerUid: 'h1', socketId: 's1', name: 'P1', gameType: 'RPS', hostName: 'P1', initialGameState: {} as RPSState
            });
            room.players[0].socketId = null;
            (repo as any).now = () => room.expiresAt + 1;
            repo.checkRoomTTLs();
            expect(repo.getRoom(room.id)).toBeNull();
        });




    });

    it('finds a player by socket and ignores unknown sockets', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });

        expect(repo.getPlayerBySocket('s1')?.room.id).toBe(room.id);
        expect(repo.getPlayerBySocket('unknown')).toBeNull();
        expect(repo.getRoom('')).toBeNull();
        expect(repo.getRoomForPlayer('nobody')).toBeNull();
    });
});
