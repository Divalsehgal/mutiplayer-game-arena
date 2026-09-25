import { initSocket } from './index';
import jwt from 'jsonwebtoken';
import { RoomRepository } from '../repositories/room';

jest.mock('jsonwebtoken');
jest.mock('../services/room');
jest.mock('../services/game');
jest.mock('../controllers/room');
jest.mock('../controllers/game');
jest.mock('../routes/room');
jest.mock('../routes/game');

describe('SocketInit', () => {
    let mockIo: any;
    let mockRoomStore: jest.Mocked<RoomRepository>;
    let mockLogger: any;

    beforeEach(() => {
        mockIo = {
            use: jest.fn(),
            on: jest.fn(),
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };
        mockRoomStore = {
            markSocketDisconnected: jest.fn(),
            serializeRoom: jest.fn()
        } as any;
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should register auth middleware and connection handler', () => {
        initSocket({ io: mockIo, roomStore: mockRoomStore, gameRegistry: {}, logger: mockLogger });
        expect(mockIo.use).toHaveBeenCalled();
        expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    describe('Auth Middleware', () => {
        it('should authenticate with valid token', () => {
            initSocket({ io: mockIo, roomStore: mockRoomStore, gameRegistry: {}, logger: mockLogger });
            const middleware = mockIo.use.mock.calls[0][0];
            const mockSocket: any = {
                handshake: { auth: { token: 'valid-token' } },
                data: {}
            };
            const next = jest.fn();

            (jwt.verify as jest.Mock).mockReturnValue({ _id: 'u1', user_name: 'test' });
            
            middleware(mockSocket, next);
            
            expect(mockSocket.data.playerUid).toBe('u1');
            expect(next).toHaveBeenCalledWith();
        });

        it('should allow anonymous if playerUid provided', () => {
            initSocket({ io: mockIo, roomStore: mockRoomStore, gameRegistry: {}, logger: mockLogger });
            const middleware = mockIo.use.mock.calls[0][0];
            const mockSocket: any = {
                handshake: { auth: { playerUid: 'anon1' } },
                data: {}
            };
            const next = jest.fn();

            middleware(mockSocket, next);
            
            expect(mockSocket.data.playerUid).toBe('guest:anon1');
            expect(next).toHaveBeenCalledWith();
        });

        it('should fail if no token and no playerUid', () => {
            initSocket({ io: mockIo, roomStore: mockRoomStore, gameRegistry: {}, logger: mockLogger });
            const middleware = mockIo.use.mock.calls[0][0];
            const mockSocket = {
                handshake: { auth: {} },
                data: {}
            };
            const next = jest.fn();

            middleware(mockSocket, next);
            
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toContain('Authentication required');
        });
    });
});
