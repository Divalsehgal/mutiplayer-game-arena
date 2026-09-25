import { RoomMaintenanceRepository } from './index';
import { RPSState } from '../../../models/game/Game';

describe('RoomMaintenanceRepository with a computer player', () => {
    const mockNow = 1000000;

    it('removes a room once its only human times out, leaving just the computer', () => {
        let now = mockNow;
        const timedRepo = new RoomMaintenanceRepository(() => now);
        const room = timedRepo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        timedRepo.addBotPlayer(room.id, 'Computer');

        timedRepo.markSocketDisconnected('s1');
        now += 5000;
        const removed = timedRepo.cleanupDisconnectedPlayers(1000);

        expect(removed).toEqual([{ roomId: room.id, playerUid: 'h1' }]);
        expect(timedRepo.getRoom(room.id)).toBeNull();
    });

    it('never times out the computer player', () => {
        let now = mockNow;
        const timedRepo = new RoomMaintenanceRepository(() => now);
        const room = timedRepo.createRoom({
            hostPlayerUid: 'h1',
            socketId: 's1',
            name: 'P1',
            gameType: 'RPS',
            hostName: 'P1',
            initialGameState: {} as RPSState
        });
        timedRepo.addBotPlayer(room.id, 'Computer');

        now += 60 * 60 * 1000;
        expect(timedRepo.cleanupDisconnectedPlayers(1000)).toEqual([]);
        expect(room.players).toHaveLength(2);
    });
});
