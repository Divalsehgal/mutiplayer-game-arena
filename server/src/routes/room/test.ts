import { registerRoomRoutes } from './index';
import { RoomController } from '../../controllers/room';

describe('RoomRoutes', () => {
    let mockSocket: any;
    let mockController: jest.Mocked<RoomController>;

    beforeEach(() => {
        mockSocket = {
            on: jest.fn(),
            id: 'socket-id'
        };
        mockController = {
            createRoom: jest.fn(),
            joinRoom: jest.fn(),
            leaveRoom: jest.fn(),
            extendRoom: jest.fn(),
            getPublicRooms: jest.fn(),
        } as any;
    });

    it('should register all room events', () => {
        registerRoomRoutes(mockSocket, mockController);

        expect(mockSocket.on).toHaveBeenCalledWith('create-room', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('join-room', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('leave-room', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('extend-room', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('get-public-rooms', expect.any(Function));
    });

    it('should call controller methods when events are triggered', () => {
        registerRoomRoutes(mockSocket, mockController);

        // Get the callbacks passed to socket.on
        const eventHandlers: Record<string, (...args: any[]) => void> = {};
        (mockSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
            eventHandlers[event] = handler;
        });

        const callback = jest.fn();
        const create = { hostName: ' Host ', gameType: 'RPS' };
        const join = { roomId: 'ABC123', name: 'Guest' };
        const room = { roomId: 'ABC123' };

        eventHandlers['create-room'](create, callback);
        expect(mockController.createRoom).toHaveBeenCalledWith(mockSocket, { hostName: 'Host', gameType: 'RPS' }, callback);

        eventHandlers['join-room'](join, callback);
        expect(mockController.joinRoom).toHaveBeenCalledWith(mockSocket, join, callback);

        eventHandlers['leave-room'](room);
        expect(mockController.leaveRoom).toHaveBeenCalledWith(mockSocket, room);

        eventHandlers['extend-room'](room, callback);
        expect(mockController.extendRoom).toHaveBeenCalledWith(mockSocket, room, callback);

        eventHandlers['get-public-rooms'](callback);
        expect(mockController.getPublicRooms).toHaveBeenCalledWith(mockSocket, callback);
    });

    const handlersFor = () => {
        registerRoomRoutes(mockSocket, mockController);
        const eventHandlers: Record<string, (...args: any[]) => void> = {};
        (mockSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
            eventHandlers[event] = handler;
        });
        return eventHandlers;
    };

    it('rejects malformed payloads without calling the controller or crashing', () => {
        const h = handlersFor();
        const callback = jest.fn();

        for (const bad of [null, 'x', { roomId: 5, name: 'a' }, { roomId: 'R'.repeat(17), name: 'a' }, { roomId: 'R1', name: '   ' }, { roomId: 'R1', name: 'n'.repeat(25) }]) {
            h['join-room'](bad, callback);
        }
        h['create-room']({ hostName: 'Host', gameType: 'CHESS' }, callback);
        h['leave-room'](undefined); // no ack at all

        expect(mockController.joinRoom).not.toHaveBeenCalled();
        expect(mockController.createRoom).not.toHaveBeenCalled();
        expect(mockController.leaveRoom).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(7);
        expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Invalid request' });
    });

    it('turns a thrown error into a generic reply and works without an ack', () => {
        const h = handlersFor();
        mockController.joinRoom.mockImplementation(() => { throw new Error('secret detail'); });
        const callback = jest.fn();

        h['join-room']({ roomId: 'R1', name: 'a' }, callback);
        expect(() => h['join-room']({ roomId: 'R1', name: 'a' })).not.toThrow();
        expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Something went wrong' });
    });

    it('rate limits create-room and join-room per socket', () => {
        const h = handlersFor();
        const callback = jest.fn();

        for (let i = 0; i < 12; i++) h['join-room']({ roomId: 'R1', name: 'a' }, callback);

        expect(mockController.joinRoom).toHaveBeenCalledTimes(10);
        expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Too many requests, slow down' });
    });
});
