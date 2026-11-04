import { RoomRepository } from './index';
import { RPSState } from '../../models/game/Game';

describe('RoomRepository Integration', () => {
    let repo: RoomRepository;

    beforeEach(() => {
        repo = new RoomRepository();
    });

    it('should have all methods from inheritance chain', () => {
        const room = repo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        
        expect(repo.getRoom(room.id)).toBeDefined();
        repo.markSocketDisconnected('s1');
        expect(room.players[0].status).toBe('offline');
    });
});
