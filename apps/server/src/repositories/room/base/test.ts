import { RoomBaseRepository } from './index';

describe('RoomBaseRepository', () => {
    let repo: RoomBaseRepository;

    beforeEach(() => {
        repo = new RoomBaseRepository();
    });

    it('should generate a short uppercase room id without look-alike characters', () => {
        const id = (repo as any).generateRoomId();
        expect(id).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    });

    it('should never hand out an id that is already in use', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires -- spy needs the real CJS module object
        const randomInt = jest.spyOn(require('node:crypto'), 'randomInt');
        (repo as any).rooms.set('AAAAAA', {});
        randomInt.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0)
            .mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0);
        const id = (repo as any).generateRoomId();
        expect(id).not.toBe('AAAAAA');
        expect(randomInt).toHaveBeenCalledTimes(12); // the colliding draw was retried
        randomInt.mockRestore();
    });

    it('should find rooms regardless of the case the code was typed in', () => {
        (repo as any).rooms.set('ABC234', { id: 'ABC234' });
        expect(repo.getRoom('abc234')?.id).toBe('ABC234');
    });

    it('should return null for non-existent room', () => {
        expect(repo.getRoom('none')).toBeNull();
    });

    it('should get public rooms', () => {
        const room1: any = { id: 'r1', isPublic: true, players: [] };
        const room2: any = { id: 'r2', isPublic: false, players: [] };
        (repo as any).rooms.set('R1', room1);
        (repo as any).rooms.set('R2', room2);
        
        const publicRooms = repo.getPublicRooms();
        expect(publicRooms).toHaveLength(1);
        expect(publicRooms[0].id).toBe('r1');
    });

    it('should return null for empty roomId', () => {
        expect(repo.getRoom('')).toBeNull();
    });
});
