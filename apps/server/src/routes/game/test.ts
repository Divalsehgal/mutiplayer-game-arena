import { registerGameRoutes } from './index';
import { GameController } from '../../controllers/game';

describe('GameRoutes', () => {
    let mockSocket: any;
    let mockController: jest.Mocked<GameController>;

    beforeEach(() => {
        mockSocket = {
            on: jest.fn(),
            id: 'socket-id'
        };
        mockController = {
            handleReady: jest.fn(),
            handleMove: jest.fn(),
        } as any;
    });

    it('should register game events', () => {
        registerGameRoutes(mockSocket, mockController);
        expect(mockSocket.on).toHaveBeenCalledWith('game-ready', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('game-move', expect.any(Function));
    });

    it('should delegate to controller', () => {
        registerGameRoutes(mockSocket, mockController);

        const handlers: Record<string, (...args: any[]) => void> = {};
        (mockSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
            handlers[event] = handler;
        });

        handlers['game-ready']({ roomId: 'r1' });
        expect(mockController.handleReady).toHaveBeenCalledWith(mockSocket, { roomId: 'r1' });

        handlers['game-move']({ roomId: 'r1', move: 'Rock' });
        expect(mockController.handleMove).toHaveBeenCalledWith(mockSocket, { roomId: 'r1', move: 'Rock' });

        for (const move of ['4', 4, 'roll']) handlers['game-move']({ roomId: 'r1', move });
        expect(mockController.handleMove).toHaveBeenCalledTimes(4);
    });

    it('drops malformed moves without crashing', () => {
        registerGameRoutes(mockSocket, mockController);
        const handlers: Record<string, (...args: any[]) => void> = {};
        (mockSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
            handlers[event] = handler;
        });

        for (const bad of [undefined, { roomId: 'r1' }, { roomId: 'r1', move: 'Lizard' }, { roomId: 'r1', move: 1.5 }, { roomId: 'r1', move: { $gt: 1 } }]) {
            expect(() => handlers['game-move'](bad)).not.toThrow();
        }
        handlers['game-ready']({});
        expect(mockController.handleMove).not.toHaveBeenCalled();
        expect(mockController.handleReady).not.toHaveBeenCalled();
    });
});
