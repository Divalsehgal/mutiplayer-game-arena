import { GameService } from './index';

describe('GameService', () => {
    let service: GameService;
    let mockRepo: any;
    let mockRegistry: any;
    let mockLogger: any;

    beforeEach(() => {
        mockRepo = { 
            getRoom: jest.fn(), 
            updateGameState: jest.fn(), 
            incrementScore: jest.fn(), 
            serializeRoom: jest.fn() 
        };
        mockRegistry = { 
            RPS: { 
                handleMove: jest.fn(),
                handleReady: jest.fn(),
                projectPublicState: jest.fn()
            } 
        };
        mockLogger = { error: jest.fn() };
        service = new GameService(mockRepo, mockRegistry, mockLogger);
    });

    it('should handle game move and update state', () => {
        const mockRoom = { id: 'r1', gameType: 'RPS', gameState: {}, players: [{ playerUid: 'u1', role: 'player' }] };
        mockRepo.getRoom.mockReturnValue(mockRoom);
        mockRegistry.RPS.handleMove.mockReturnValue({ 
            newGameState: { moved: true }, 
            winnerUid: 'u1' 
        });
        
        const result = service.handleMove('r1', 'u1', { choice: 'Rock' });
        expect(result?.gameState).toEqual({ moved: true });
        expect(mockRepo.updateGameState).toHaveBeenCalled();
        expect(mockRepo.incrementScore).toHaveBeenCalledWith('r1', 'u1');
    });

    it('should handle game move error', () => {
        const mockRoom = { id: 'r1', gameType: 'RPS', gameState: {}, players: [{ playerUid: 'u1', role: 'player' }] };
        mockRepo.getRoom.mockReturnValue(mockRoom);
        mockRegistry.RPS.handleMove.mockReturnValue({ error: 'Invalid move' });
        
        const result = service.handleMove('r1', 'u1', { choice: 'Rock' });
        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should get public room state', () => {
        const mockRoom = { id: 'r1', gameType: 'RPS', gameState: { secret: 'hidden' } };
        mockRepo.getRoom.mockReturnValue(mockRoom);
        mockRepo.serializeRoom.mockReturnValue({ id: 'r1', gameState: {} });
        mockRegistry.RPS.projectPublicState.mockReturnValue({ secret: 'visible' });

        const state = service.getPublicRoomState('r1', 'u1');
        expect(state?.gameState).toEqual({ secret: 'visible' });
    });

    it('should handle game ready', () => {
        const mockRoom = { id: 'r1', gameType: 'RPS', gameState: {}, players: [{ playerUid: 'u1', role: 'player' }] };
        mockRepo.getRoom.mockReturnValue(mockRoom);
        mockRegistry.RPS.handleReady.mockReturnValue({ newGameState: { status: 'playing' } });
        
        const result = service.handleReady('r1', 'u1');
        expect(result?.status).toBe('playing');
        expect(mockRepo.updateGameState).toHaveBeenCalled();
    });

    describe('Negative paths', () => {
        it('should return null if room not found in handleReady', () => {
            mockRepo.getRoom.mockReturnValue(null);
            expect(service.handleReady('r1', 'u1')).toBeNull();
        });

        it('should return null if handler not found in handleReady', () => {
            mockRepo.getRoom.mockReturnValue({ id: 'r1', gameType: 'UNKNOWN', players: [{ playerUid: 'u1', role: 'player' }] });
            expect(service.handleReady('r1', 'u1')).toBeNull();
        });

        it('should return null if newGameState is null in handleReady', () => {
            mockRepo.getRoom.mockReturnValue({ id: 'r1', gameType: 'RPS', players: [{ playerUid: 'u1', role: 'player' }] });
            mockRegistry.RPS.handleReady.mockReturnValue({ newGameState: null });
            expect(service.handleReady('r1', 'u1')).toBeNull();
        });

        it('should return null if caller is not a seated player in handleReady', () => {
            mockRepo.getRoom.mockReturnValue({ id: 'r1', gameType: 'RPS', players: [{ playerUid: 'spectator1', role: 'spectator' }] });
            expect(service.handleReady('r1', 'spectator1')).toBeNull();
            expect(mockRegistry.RPS.handleReady).not.toHaveBeenCalled();
        });

        it('should return null if room not found in handleMove', () => {
            mockRepo.getRoom.mockReturnValue(null);
            expect(service.handleMove('r1', 'u1', {})).toBeNull();
        });

        it('should return null if handler not found in handleMove', () => {
            mockRepo.getRoom.mockReturnValue({ id: 'r1', gameType: 'UNKNOWN', players: [{ playerUid: 'u1', role: 'player' }] });
            expect(service.handleMove('r1', 'u1', {})).toBeNull();
        });

        it('should return null if newGameState is null in handleMove', () => {
            mockRepo.getRoom.mockReturnValue({ id: 'r1', gameType: 'RPS', players: [{ playerUid: 'u1', role: 'player' }] });
            mockRegistry.RPS.handleMove.mockReturnValue({ newGameState: null });
            expect(service.handleMove('r1', 'u1', {})).toBeNull();
        });

        it('should return null and never call the handler if caller is a spectator in handleMove', () => {
            mockRepo.getRoom.mockReturnValue({
                id: 'r1',
                gameType: 'RPS',
                players: [
                    { playerUid: 'p1', role: 'player' },
                    { playerUid: 'spectator1', role: 'spectator' }
                ]
            });
            expect(service.handleMove('r1', 'spectator1', { choice: 'Rock' })).toBeNull();
            expect(mockRegistry.RPS.handleMove).not.toHaveBeenCalled();
            expect(mockRepo.updateGameState).not.toHaveBeenCalled();
            expect(mockRepo.incrementScore).not.toHaveBeenCalled();
        });

        it('should return null if room not found in getPublicRoomState', () => {
            mockRepo.getRoom.mockReturnValue(null);
            expect(service.getPublicRoomState('r1', 'u1')).toBeNull();
        });

        it('should return null if serializeRoom returns null', () => {
            mockRepo.getRoom.mockReturnValue({ id: 'r1', gameType: 'RPS' });
            mockRepo.serializeRoom.mockReturnValue(null);
            expect(service.getPublicRoomState('r1', 'u1')).toBeNull();
        });

        it('should return serialized room if handler has no projectPublicState', () => {
            mockRepo.getRoom.mockReturnValue({ id: 'r1', gameType: 'NO_PUBLIC' });
            mockRegistry.NO_PUBLIC = {}; // No projectPublicState
            mockRepo.serializeRoom.mockReturnValue({ id: 'r1', gameState: { secret: 'hidden' } });
            
            const state = service.getPublicRoomState('r1', 'u1');
            expect(state?.gameState).toEqual({ secret: 'hidden' });
        });
    });
});
