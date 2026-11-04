import { RoomController } from './index';

describe('RoomController', () => {
    let controller: RoomController;
    let mockIo: any;
    let mockRoomService: any;
    let mockGameService: any;
    let mockRoomRepository: any;
    let mockSocket: any;

    beforeEach(() => {
        mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        mockRoomService = { 
            createRoom: jest.fn(), 
            joinRoom: jest.fn(), 
            leaveRoom: jest.fn(),
            extendRoom: jest.fn()
        };
        mockGameService = { getPublicRoomState: jest.fn() };
        mockRoomRepository = { getRoom: jest.fn(), serializeRoom: jest.fn(), getPublicRooms: jest.fn(), getRoomForPlayer: jest.fn() };
        mockSocket = { id: 'socket123', data: { playerUid: 'user123' }, join: jest.fn(), leave: jest.fn() };
        
        controller = new RoomController(mockIo, mockRoomService, mockGameService, mockRoomRepository);
    });

    it('should create a room and join socket to it', () => {
        const mockRoom = { id: 'room1' };
        mockRoomService.createRoom.mockReturnValue(mockRoom);
        mockRoomRepository.serializeRoom.mockReturnValue({ id: 'room1' });
        const callback = jest.fn();

        controller.createRoom(mockSocket, { hostName: 'Host', gameType: 'RPS' }, callback);

        expect(mockSocket.join).toHaveBeenCalledWith('room1');
        expect(callback).toHaveBeenCalledWith({ ok: true, roomId: 'room1', room: { id: 'room1' } });
    });

    it('should handle errors in createRoom', () => {
        mockRoomService.createRoom.mockImplementation(() => { throw new Error('Failed'); });
        const callback = jest.fn();

        controller.createRoom(mockSocket, { hostName: 'Host', gameType: 'RPS' }, callback);

        // Internal errors stay in the server log; the client gets a generic message.
        expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Something went wrong' });
    });

    it('should allow joining a room', () => {
        const mockRoom = { id: 'room1', players: [{ playerUid: 'u1', socketId: 'socket123' }] };
        mockRoomService.joinRoom.mockReturnValue({ room: mockRoom });
        mockRoomRepository.getRoom.mockReturnValue(mockRoom);
        mockGameService.getPublicRoomState.mockReturnValue({ id: 'room1', players: [] });
        const callback = jest.fn();

        controller.joinRoom(mockSocket, { roomId: 'room1', name: 'Player' }, callback);

        expect(mockSocket.join).toHaveBeenCalledWith('room1');
        expect(callback).toHaveBeenCalledWith({ ok: true, room: expect.any(Object) });
        expect(mockIo.to).toHaveBeenCalledWith('socket123');
        expect(mockIo.to().emit).toHaveBeenCalledWith('room-update', expect.any(Object));
    });

    it('should allow leaving a room', () => {
        mockRoomService.leaveRoom.mockReturnValue({ roomId: 'room1', roomDeleted: false });
        mockRoomRepository.getRoom.mockReturnValue({ id: 'room1', players: [{ playerUid: 'u2', socketId: 'socket456' }] });
        
        controller.leaveRoom(mockSocket, { roomId: 'room1' });

        expect(mockSocket.leave).toHaveBeenCalledWith('room1');
        expect(mockRoomService.leaveRoom).toHaveBeenCalled();
        expect(mockIo.to).toHaveBeenCalledWith('socket456');
    });
    
    it('should silently return if room not found during broadcast', () => {
        mockRoomService.leaveRoom.mockReturnValue({ roomId: 'room1', roomDeleted: false });
        mockRoomRepository.getRoom.mockReturnValue(null); // room not found
        
        controller.leaveRoom(mockSocket, { roomId: 'room1' });
        expect(mockIo.to).not.toHaveBeenCalled();
    });

    it('should allow extending a room', () => {
        const mockRoom = { id: 'room1', players: [{ playerUid: 'user123', socketId: 'socket123' }] };
        mockRoomService.extendRoom.mockReturnValue(mockRoom);
        mockRoomRepository.getRoom.mockReturnValue(mockRoom);
        const callback = jest.fn();

        controller.extendRoom(mockSocket, { roomId: 'room1' }, callback);

        expect(callback).toHaveBeenCalledWith({ ok: true });
    });

    it('should get public rooms projected for a non-player (hides RPS choices)', () => {
        mockRoomRepository.getPublicRooms.mockReturnValue([{ id: 'r1' }]);
        mockGameService.getPublicRoomState.mockReturnValue({ id: 'r1', gameState: { playerChoices: { a: 'hidden' } } });
        const callback = jest.fn();

        controller.getPublicRooms(mockSocket, callback);
        expect(mockGameService.getPublicRoomState).toHaveBeenCalledWith('r1', '');
        expect(callback).toHaveBeenCalledWith({ ok: true, rooms: [{ id: 'r1', gameState: { playerChoices: { a: 'hidden' } } }] });
    });

    it('should handle errors in getPublicRooms', () => {
        mockRoomRepository.getPublicRooms.mockImplementation(() => { throw new Error('Error fetching rooms'); });
        const callback = jest.fn();

        controller.getPublicRooms(mockSocket, callback);
        expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Something went wrong' });
    });

    it('should notify the superseded socket when a player rejoins from another tab/device', () => {
        const mockRoom = { id: 'room1', players: [{ playerUid: 'u1', socketId: 'socket789' }] };
        mockRoomService.joinRoom.mockReturnValue({ room: mockRoom, role: 'player', supersededSocketId: 'oldSocket456' });
        mockRoomRepository.getRoom.mockReturnValue(mockRoom);
        mockGameService.getPublicRoomState.mockReturnValue({ id: 'room1', players: [] });
        const callback = jest.fn();

        controller.joinRoom(mockSocket, { roomId: 'room1', name: 'Player' }, callback);

        expect(mockIo.to).toHaveBeenCalledWith('oldSocket456');
        expect(mockIo.to('oldSocket456').emit).toHaveBeenCalledWith('session-taken-over', { roomId: 'room1' });
    });

    it('should not emit a takeover notice on a fresh join', () => {
        const mockRoom = { id: 'room1', players: [{ playerUid: 'u1', socketId: 'socket123' }] };
        mockRoomService.joinRoom.mockReturnValue({ room: mockRoom, role: 'player' });
        mockRoomRepository.getRoom.mockReturnValue(mockRoom);
        mockGameService.getPublicRoomState.mockReturnValue({ id: 'room1', players: [] });
        const callback = jest.fn();

        controller.joinRoom(mockSocket, { roomId: 'room1', name: 'Player' }, callback);

        expect(mockIo.to).not.toHaveBeenCalledWith('session-taken-over');
        const emitCalls = (mockIo.to().emit as jest.Mock).mock.calls;
        expect(emitCalls.some(([event]: [string]) => event === 'session-taken-over')).toBe(false);
    });

    it('should handle errors in joinRoom', () => {
        mockRoomService.joinRoom.mockImplementation(() => { throw new Error('Join error'); });
        const callback = jest.fn();

        controller.joinRoom(mockSocket, { roomId: 'r1', name: 'N' }, callback);
        expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Something went wrong' });
    });

    it('passes room errors through to the player', () => {
        mockRoomService.joinRoom.mockImplementation(() => { throw { isRoomError: true, code: 'ROOM_NOT_FOUND', message: 'Room does not exist' }; });
        const callback = jest.fn();

        controller.joinRoom(mockSocket, { roomId: 'r1', name: 'N' }, callback);
        expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Room does not exist' });
    });

    it('removes the player from their previous room before joining another', () => {
        const target = { id: 'room2', players: [] };
        mockRoomRepository.getRoomForPlayer.mockReturnValue({ id: 'room1' });
        mockRoomRepository.getRoom.mockImplementation((id: string) => (id === 'room2' ? target : null));
        mockRoomService.leaveRoom.mockReturnValue({ roomId: 'room1', roomDeleted: false });
        mockRoomService.joinRoom.mockReturnValue({ room: target });

        controller.joinRoom(mockSocket, { roomId: 'room2', name: 'N' }, jest.fn());

        expect(mockSocket.leave).toHaveBeenCalledWith('room1');
        expect(mockRoomService.leaveRoom).toHaveBeenCalledWith({ roomId: 'room1', playerUid: 'user123' });
        expect(mockRoomService.leaveRoom.mock.invocationCallOrder[0]).toBeLessThan(mockRoomService.joinRoom.mock.invocationCallOrder[0]);
    });

    it('keeps the player in their room when rejoining it or when the target room is missing', () => {
        mockRoomRepository.getRoomForPlayer.mockReturnValue({ id: 'room1' });
        mockRoomRepository.getRoom.mockImplementation((id: string) => (id === 'room1' ? { id: 'room1', players: [] } : null));
        mockRoomService.joinRoom.mockReturnValue({ room: { id: 'room1', players: [] } });

        controller.joinRoom(mockSocket, { roomId: 'room1', name: 'N' }, jest.fn());
        controller.joinRoom(mockSocket, { roomId: 'nope', name: 'N' }, jest.fn());

        expect(mockRoomService.leaveRoom).not.toHaveBeenCalled();
    });

    it('leaves the previous room when creating a new one', () => {
        mockRoomRepository.getRoomForPlayer.mockReturnValue({ id: 'room1' });
        mockRoomService.leaveRoom.mockReturnValue({ roomId: 'room1', roomDeleted: true });
        mockRoomService.createRoom.mockReturnValue({ id: 'room2' });

        controller.createRoom(mockSocket, { hostName: 'Host', gameType: 'RPS' }, jest.fn());

        expect(mockRoomService.leaveRoom).toHaveBeenCalledWith({ roomId: 'room1', playerUid: 'user123' });
    });

    describe('with a computer opponent', () => {
        let mockBotRunner: any;

        beforeEach(() => {
            mockBotRunner = { schedule: jest.fn(), cancel: jest.fn() };
            mockGameService.handleReady = jest.fn();
            controller = new RoomController(mockIo, mockRoomService, mockGameService, mockRoomRepository, mockBotRunner);
        });

        it('starts the game straight away and lets the computer act', () => {
            mockRoomService.createRoom.mockReturnValue({ id: 'room1' });
            mockRoomRepository.serializeRoom.mockReturnValue({ id: 'room1' });
            const callback = jest.fn();

            controller.createRoom(mockSocket, { hostName: 'Host', gameType: 'RPS', vsComputer: true }, callback);

            expect(mockRoomService.createRoom).toHaveBeenCalledWith(expect.objectContaining({ vsComputer: true }));
            expect(mockGameService.handleReady).toHaveBeenCalledWith('room1', 'user123');
            expect(mockBotRunner.schedule).toHaveBeenCalledWith('room1');
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({ ok: true, roomId: 'room1' }));
        });

        it('does not auto-start a normal room', () => {
            mockRoomService.createRoom.mockReturnValue({ id: 'room1' });

            controller.createRoom(mockSocket, { hostName: 'Host', gameType: 'RPS' }, jest.fn());

            expect(mockGameService.handleReady).not.toHaveBeenCalled();
            expect(mockBotRunner.schedule).not.toHaveBeenCalled();
        });

        it('cancels any pending computer move when the room closes', () => {
            mockRoomService.leaveRoom.mockReturnValue({ roomId: 'room1', roomDeleted: true });

            controller.leaveRoom(mockSocket, { roomId: 'room1' });

            expect(mockBotRunner.cancel).toHaveBeenCalledWith('room1');
            expect(mockIo.to).not.toHaveBeenCalled();
        });
    });

    it('does not call back when extending a room that no longer exists', () => {
        mockRoomService.extendRoom.mockReturnValue(null);
        mockRoomRepository.getRoom.mockReturnValue({ id: 'gone', players: [{ playerUid: 'user123' }] });
        const callback = jest.fn();

        controller.extendRoom(mockSocket, { roomId: 'gone' }, callback);

        expect(callback).not.toHaveBeenCalled();
    });
});
