import { GameController } from './index';

describe('GameController', () => {
    let controller: GameController;
    let mockIo: any;
    let mockGameService: any;
    let mockRepo: any;
    let mockSocket: any;

    beforeEach(() => {
        mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        mockGameService = { 
            handleReady: jest.fn(), 
            handleMove: jest.fn(), 
            getPublicRoomState: jest.fn() 
        };
        mockRepo = { getRoom: jest.fn() };
        mockSocket = { data: { playerUid: 'u1' } };
        controller = new GameController(mockIo, mockGameService, mockRepo);
    });

    it('should handle ready and broadcast update', () => {
        mockGameService.handleReady.mockReturnValue({ gameState: {} });
        mockGameService.getPublicRoomState.mockReturnValue({ id: 'r1' });
        mockRepo.getRoom.mockReturnValue({ 
            players: [{ socketId: 's1', playerUid: 'u1' }] 
        });
        
        controller.handleReady(mockSocket, { roomId: 'r1' });
        
        expect(mockGameService.handleReady).toHaveBeenCalledWith('r1', 'u1');
        expect(mockIo.to).toHaveBeenCalledWith('s1');
        expect(mockIo.emit).toHaveBeenCalledWith('room-update', expect.anything());
    });

    it('should handle move and broadcast update', () => {
        mockGameService.handleMove.mockReturnValue({ gameState: {} });
        mockGameService.getPublicRoomState.mockReturnValue({ id: 'r1' });
        mockRepo.getRoom.mockReturnValue({ 
            players: [{ socketId: 's1', playerUid: 'u1' }] 
        });
        
        controller.handleMove(mockSocket, { roomId: 'r1', move: 'Rock' });
        
        expect(mockGameService.handleMove).toHaveBeenCalledWith('r1', 'u1', 'Rock');
        expect(mockIo.to).toHaveBeenCalledWith('s1');
    });

    it('should do nothing if room not found during broadcast', () => {
        mockGameService.handleReady.mockReturnValue({ gameState: {} });
        mockRepo.getRoom.mockReturnValue(null);
        
        controller.handleReady(mockSocket, { roomId: 'r1' });
        
        expect(mockIo.to).not.toHaveBeenCalled();
    });

    it('should handle move error', () => {
        mockGameService.handleMove.mockReturnValue(null);
        controller.handleMove(mockSocket, { roomId: 'r1', move: 'Rock' });
        expect(mockIo.to).not.toHaveBeenCalled();
    });

    describe('with a computer opponent', () => {
        let mockBotRunner: any;

        beforeEach(() => {
            mockBotRunner = { schedule: jest.fn() };
            controller = new GameController(mockIo, mockGameService, mockRepo, mockBotRunner);
            mockRepo.getRoom.mockReturnValue({ players: [{ socketId: 's1', playerUid: 'u1' }] });
        });

        it('gives the computer a turn after a move', () => {
            mockGameService.handleMove.mockReturnValue({ gameState: {} });

            controller.handleMove(mockSocket, { roomId: 'r1', move: 'Rock' });

            expect(mockBotRunner.schedule).toHaveBeenCalledWith('r1');
        });

        it('gives the computer a turn after a ready', () => {
            mockGameService.handleReady.mockReturnValue({ gameState: {} });

            controller.handleReady(mockSocket, { roomId: 'r1' });

            expect(mockBotRunner.schedule).toHaveBeenCalledWith('r1');
        });

        it('does not wake the computer when a move is rejected', () => {
            mockGameService.handleMove.mockReturnValue(null);

            controller.handleMove(mockSocket, { roomId: 'r1', move: 'Rock' });

            expect(mockBotRunner.schedule).not.toHaveBeenCalled();
        });
    });

    it('skips players without a socket, such as the computer, when broadcasting', () => {
        mockGameService.handleMove.mockReturnValue({ gameState: {} });
        mockRepo.getRoom.mockReturnValue({
            players: [{ socketId: 's1', playerUid: 'u1' }, { socketId: null, playerUid: 'bot-r1', isBot: true }]
        });

        controller.handleMove(mockSocket, { roomId: 'r1', move: 'Rock' });

        expect(mockIo.to).toHaveBeenCalledTimes(1);
        expect(mockGameService.getPublicRoomState).not.toHaveBeenCalledWith('r1', 'bot-r1');
    });
});
