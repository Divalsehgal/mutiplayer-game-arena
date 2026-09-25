import { RoomService } from './index';

describe('RoomService', () => {
    let service: RoomService;
    let mockRepo: any;
    let mockRegistry: any;
    let mockLogger: any;

    beforeEach(() => {
        mockRepo = { 
            createRoom: jest.fn(), 
            joinRoom: jest.fn(), 
            getRoom: jest.fn(), 
            leaveRoom: jest.fn(), 
            extendRoom: jest.fn(),
            updateGameState: jest.fn()
        };
        mockRegistry = { 
            RPS: { 
                getInitialState: jest.fn().mockReturnValue({}),
                handleReady: jest.fn().mockReturnValue({ newGameState: { status: 'playing' } })
            } 
        };
        mockLogger = { info: jest.fn() };
        service = new RoomService(mockRepo, mockRegistry, mockLogger);
    });

    it('should create a room', () => {
        mockRepo.createRoom.mockReturnValue({ id: 'r1', gameType: 'RPS', isPublic: false });
        const room = service.createRoom({ playerUid: 'u1', socketId: 's1', name: 'N', gameType: 'RPS' });
        expect(room.id).toBe('r1');
        expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should join a room', () => {
        mockRepo.joinRoom.mockReturnValue({ room: { id: 'r1' }, role: 'player' });
        const result = service.joinRoom({ roomId: 'r1', playerUid: 'u2', socketId: 's2', name: 'N2' });
        expect(result.role).toBe('player');
    });

    it('should handle leaving a room', () => {
        mockRepo.leaveRoom.mockReturnValue({ roomId: 'r1', roomDeleted: true });
        const result = service.leaveRoom({ roomId: 'r1', playerUid: 'u1' });
        expect(result.roomDeleted).toBe(true);
    });

    it('should create a SNAKE_LADDER room with 4 max players', () => {
        mockRegistry.SNAKE_LADDER = { 
            getInitialState: jest.fn().mockReturnValue({}) 
        };
        mockRepo.createRoom.mockReturnValue({ id: 'r2', gameType: 'SNAKE_LADDER' });
        
        service.createRoom({ playerUid: 'u1', socketId: 's1', name: 'N', gameType: 'SNAKE_LADDER' });
        expect(mockRepo.createRoom).toHaveBeenCalledWith(expect.objectContaining({ maxPlayers: 4 }));
    });

    it('should reset room state', () => {
        const mockRoom = { 
            id: 'r1', 
            gameType: 'RPS', 
            players: [{ playerUid: 'u1', score: 10 }] 
        };
        mockRepo.getRoom.mockReturnValue(mockRoom);
        
        service.resetRoomState('r1');
        expect(mockRoom.players[0].score).toBe(0);
        expect(mockRegistry.RPS.getInitialState).toHaveBeenCalled();
    });

    it('should extend room', () => {
        service.extendRoom('r1');
        expect(mockRepo.extendRoom).toHaveBeenCalledWith('r1');
    });

    it('should handle leaving room without deletion', () => {
        mockRepo.leaveRoom.mockReturnValue({ roomId: 'r1', roomDeleted: false });
        mockRepo.getRoom.mockReturnValue({ id: 'r1', status: 'waiting-for-players', players: [], gameType: 'RPS' });
        
        service.leaveRoom({ roomId: 'r1', playerUid: 'u1' });
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('left Room r1'));
    });

    describe('Negative paths', () => {
        it('should throw error if game type is unsupported', () => {
            expect(() => {
                service.createRoom({ playerUid: 'u1', socketId: 's1', name: 'N', gameType: 'UNKNOWN' });
            }).toThrow('Unsupported game type');
        });

        it('should throw error if initial game state fails', () => {
            mockRegistry.RPS.getInitialState.mockReturnValueOnce(null);
            expect(() => {
                service.createRoom({ playerUid: 'u1', socketId: 's1', name: 'N', gameType: 'RPS' });
            }).toThrow('Could not initialize game state');
        });

        it('should return early if room not found in resetRoomState', () => {
            mockRepo.getRoom.mockReturnValue(null);
            service.resetRoomState('r1');
            expect(mockRegistry.RPS.getInitialState).not.toHaveBeenCalled();
        });

        it('should handle resetRoomState if handler missing getInitialState', () => {
            const mockRoom = { id: 'r1', gameType: 'NO_INIT', players: [] };
            mockRepo.getRoom.mockReturnValue(mockRoom);
            mockRegistry.NO_INIT = {}; 
            service.resetRoomState('r1');
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('reset to initial state'));
        });

        it('should not reset state if room is not waiting-for-players on leave', () => {
            mockRepo.leaveRoom.mockReturnValue({ roomId: 'r1', roomDeleted: false });
            mockRepo.getRoom.mockReturnValue({ id: 'r1', status: 'playing', players: [], gameType: 'RPS' });
            
            service.leaveRoom({ roomId: 'r1', playerUid: 'u1' });
            expect(mockRegistry.RPS.getInitialState).not.toHaveBeenCalled();
        });
    });

    describe('against the computer', () => {
        beforeEach(() => {
            mockRepo.addBotPlayer = jest.fn();
            mockRegistry.SNAKE_LADDER = { getInitialState: jest.fn().mockReturnValue({}) };
        });

        it('adds the computer as the second player and keeps the room private', () => {
            mockRepo.createRoom.mockReturnValue({ id: 'r1', gameType: 'RPS', isPublic: false });

            service.createRoom({ playerUid: 'u1', socketId: 's1', name: 'N', gameType: 'RPS', isPublic: true, vsComputer: true });

            expect(mockRepo.createRoom).toHaveBeenCalledWith(expect.objectContaining({ isPublic: false, maxPlayers: 2 }));
            expect(mockRepo.addBotPlayer).toHaveBeenCalledWith('r1', 'Computer');
        });

        it('limits Snakes & Ladders to two players', () => {
            mockRepo.createRoom.mockReturnValue({ id: 'r1', gameType: 'SNAKE_LADDER', isPublic: false });

            service.createRoom({ playerUid: 'u1', socketId: 's1', name: 'N', gameType: 'SNAKE_LADDER', vsComputer: true });

            expect(mockRepo.createRoom).toHaveBeenCalledWith(expect.objectContaining({ maxPlayers: 2 }));
        });

        it('keeps four seats for Snakes & Ladders with other players', () => {
            mockRepo.createRoom.mockReturnValue({ id: 'r1', gameType: 'SNAKE_LADDER', isPublic: true });

            service.createRoom({ playerUid: 'u1', socketId: 's1', name: 'N', gameType: 'SNAKE_LADDER', isPublic: true });

            expect(mockRepo.createRoom).toHaveBeenCalledWith(expect.objectContaining({ maxPlayers: 4, isPublic: true }));
            expect(mockRepo.addBotPlayer).not.toHaveBeenCalled();
        });
    });
});
