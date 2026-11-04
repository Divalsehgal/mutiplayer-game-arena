import { RoomActionRepository } from './index';
import { RPSState } from '../../../models/game/Game';

describe('RoomActionRepository', () => {
    let repo: RoomActionRepository;

    beforeEach(() => {
        repo = new RoomActionRepository();
    });

    it('should create and join a room', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        expect(room.id).toBeDefined();
        
        const join = repo.joinRoom({ roomId: room.id, playerUid: 'p2', socketId: 's2', name: 'P2' });
        expect(join.room.players).toHaveLength(2);
    });

    it('should handle leaving', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        const res = repo.leaveRoom({ roomId: room.id, playerUid: 'h1' });
        expect(res.roomDeleted).toBe(true);
    });

    it('should throw if hostPlayerUid is missing', () => {
        expect(() => {
            repo.createRoom({
                hostPlayerUid: '',
                socketId: 's1',
                name: 'P1',
                gameType: 'RPS',
                hostName: 'P1',
                initialGameState: {} as RPSState
            });
        }).toThrow('hostPlayerUid required');
    });

    it('should handle re-joining the same room', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        
        const join = repo.joinRoom({ roomId: room.id, playerUid: 'h1', socketId: 's2', name: 'P1' });
        expect(join.room.players).toHaveLength(1);
        expect(join.room.players[0].socketId).toBe('s2');
        expect(join.supersededSocketId).toBe('s1');
    });

    it('should not report a superseded socket for a brand new player', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });

        const join = repo.joinRoom({ roomId: room.id, playerUid: 'p2', socketId: 's2', name: 'P2' });
        expect(join.supersededSocketId).toBeUndefined();
    });

    it('should not report a superseded socket when the same connection rejoins', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });

        const join = repo.joinRoom({ roomId: room.id, playerUid: 'h1', socketId: 's1', name: 'P1' });
        expect(join.supersededSocketId).toBeNull();
    });

    it('should promote spectator to player when a player leaves', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'p1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            maxPlayers: 1,
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        
        // Join as spectator because maxPlayers is 1
        const join = repo.joinRoom({ roomId: room.id, playerUid: 's1', socketId: 's2', name: 'S1' });
        expect(join.role).toBe('spectator');
        
        // P1 leaves, S1 should be promoted
        repo.leaveRoom({ roomId: room.id, playerUid: 'p1' });
        
        const remainingPlayer = repo.getRoom(room.id)?.players[0];
        expect(remainingPlayer?.playerUid).toBe('s1');
        expect(remainingPlayer?.role).toBe('player');
    });

    it('should return roomDeleted false if room or player not found when leaving', () => {
        const res1 = repo.leaveRoom({ roomId: 'nonexistent', playerUid: 'h1' });
        expect(res1.roomDeleted).toBe(false);

        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });

        const res2 = repo.leaveRoom({ roomId: room.id, playerUid: 'nonexistent' });
        expect(res2.roomDeleted).toBe(false);
    });

    it('should throw if room not found on join', () => {
        expect(() => {
            repo.joinRoom({ roomId: 'nonexistent', playerUid: 'p2', socketId: 's2', name: 'P2' });
        }).toThrow('Room does not exist');
    });

    it('should handle join without socketId', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: null,
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        const join = repo.joinRoom({ roomId: room.id, playerUid: 'p2', socketId: null, name: 'P2' });
        expect(join.room.players).toHaveLength(2);
    });

    it('should handle leave without socketId', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: null,
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        repo.joinRoom({ roomId: room.id, playerUid: 'p2', socketId: null, name: 'P2' });
        repo.leaveRoom({ roomId: room.id, playerUid: 'p2' });
        expect(room.players).toHaveLength(1);
    });

    describe('computer player', () => {
        const createHumanRoom = () => repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });

        it('adds a seated computer player without a socket', () => {
            const room = createHumanRoom();
            const bot = repo.addBotPlayer(room.id, 'Computer');

            expect(bot).toMatchObject({ playerUid: `bot-${room.id}`, name: 'Computer', role: 'player', isBot: true, socketId: null });
            expect(room.players).toHaveLength(2);
            expect(repo.hasHumanPlayers(room)).toBe(true);
        });

        it('throws when adding a computer to a missing room', () => {
            expect(() => repo.addBotPlayer('nope', 'Computer')).toThrow('Room does not exist');
        });

        it('closes the room when the last human leaves, even if the computer is still seated', () => {
            const room = createHumanRoom();
            repo.addBotPlayer(room.id, 'Computer');

            const res = repo.leaveRoom({ roomId: room.id, playerUid: 'h1' });

            expect(res.roomDeleted).toBe(true);
            expect(repo.getRoom(room.id)).toBeNull();
        });

        it('makes later joiners spectators because the computer holds the second seat', () => {
            const room = createHumanRoom();
            repo.addBotPlayer(room.id, 'Computer');

            const join = repo.joinRoom({ roomId: room.id, playerUid: 'p3', socketId: 's3', name: 'P3' });
            expect(join.role).toBe('spectator');
        });
    });
});
