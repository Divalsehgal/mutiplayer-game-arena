import { RoomController } from './index';

describe('RoomController input checks', () => {
    let controller: RoomController;
    let mockRoomService: any;
    let mockRoomRepository: any;
    const socket: any = { id: 's1', data: { playerUid: 'u1' }, join: jest.fn(), leave: jest.fn() };

    beforeEach(() => {
        const io: any = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        mockRoomService = {
            createRoom: jest.fn().mockReturnValue({ id: 'r1' }),
            joinRoom: jest.fn().mockReturnValue({ room: { id: 'r1', players: [] } }),
            extendRoom: jest.fn(),
        };
        mockRoomRepository = { getRoom: jest.fn(), serializeRoom: jest.fn() };
        const gameService: any = { getPublicRoomState: jest.fn() };
        controller = new RoomController(io, mockRoomService, gameService, mockRoomRepository);
    });

    it('trims long names and limits them to 24 characters', () => {
        controller.createRoom(socket, { hostName: `   ${'x'.repeat(100)}   `, gameType: 'RPS' }, jest.fn());
        expect(mockRoomService.createRoom).toHaveBeenCalledWith(expect.objectContaining({ name: 'x'.repeat(24) }));
    });

    it('uses "Player" when the name is blank or not text', () => {
        controller.createRoom(socket, { hostName: '    ', gameType: 'RPS' }, jest.fn());
        expect(mockRoomService.createRoom).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Player' }));

        controller.joinRoom(socket, { roomId: 'r1', name: { evil: true } as any }, jest.fn());
        expect(mockRoomService.joinRoom).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Player' }));
    });

    it("won't let someone outside the room keep it alive", () => {
        mockRoomRepository.getRoom.mockReturnValue({ id: 'r1', players: [{ playerUid: 'someone-else' }] });
        const callback = jest.fn();

        controller.extendRoom(socket, { roomId: 'r1' }, callback);

        expect(mockRoomService.extendRoom).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });

    it('ignores extend requests for rooms that do not exist', () => {
        mockRoomRepository.getRoom.mockReturnValue(null);
        controller.extendRoom(socket, { roomId: 'missing' }, jest.fn());
        expect(mockRoomService.extendRoom).not.toHaveBeenCalled();
    });
});
