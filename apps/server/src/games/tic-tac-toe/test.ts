import { ticTacToeGameHandler } from './index';

describe('TicTacToe Game Handler', () => {
    it('should provide initial state', () => {
        const state = ticTacToeGameHandler.getInitialState();
        expect(state.status).toBe('waiting-for-players');
        expect(state.board.length).toBe(9);
        expect(state.board.every(cell => cell === null)).toBe(true);
    });

    it('should start game when host is ready', () => {
        const room: any = { 
            id: 'r1', 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state = ticTacToeGameHandler.getInitialState();
        const result = ticTacToeGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        expect(result.newGameState.status).toBe('playing');
        expect(result.newGameState.currentTurn).toBe('u1');
    });

    it('should handle moves and switch turns', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            board: Array(9).fill(null), 
            currentTurn: 'u1' 
        };
        
        const result = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: 0 });
        expect(result.newGameState.board[0]).toBe('X');
        expect(result.newGameState.currentTurn).toBe('u2');
    });

    it('should detect winner', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            board: ['X', 'X', null, 'O', 'O', null, null, null, null], 
            currentTurn: 'u1' 
        };
        
        const result = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: 2 });
        expect(result.newGameState.winner).toBe('u1');
        expect(result.newGameState.status).toBe('finished');
    });

    it('should detect draw', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        // Board almost full, no winner
        const state: any = { 
            status: 'playing', 
            board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', null], 
            currentTurn: 'u1' 
        };
        
        const result = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: 8 });
        expect(result.newGameState.isDraw).toBe(true);
        expect(result.newGameState.status).toBe('finished');
    });

    it('should handle rematch ready state', () => {
        const room: any = { 
            id: 'r1', 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { status: 'finished', readyPlayers: [] };
        
        // First player ready
        const result1 = ticTacToeGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        expect(result1.newGameState.status).toBe('finished');
        expect(result1.newGameState.readyPlayers).toContain('u1');

        // Second player ready
        const result2 = ticTacToeGameHandler.handleReady({ room, gameState: result1.newGameState, playerUid: 'u2' });
        expect(result2.newGameState.status).toBe('playing');
        expect(result2.newGameState.readyPlayers.length).toBe(0);
    });

    it('should reject invalid moves', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            board: ['X', null, null, null, null, null, null, null, null], 
            currentTurn: 'u1' 
        };

        // Move to occupied spot
        const result1 = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: 0 });
        expect(result1.newGameState).toBe(state);

        // Move by wrong player
        const result2 = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u2', move: 1 });
        expect(result2.newGameState).toBe(state);

        // Move out of bounds
        const result3 = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: 10 });
        expect(result3.newGameState).toBe(state);
    });

    it('should project public state', () => {
        const state: any = { board: [] };
        expect(ticTacToeGameHandler.projectPublicState({ gameState: state })).toBe(state);
    });

    it('should return same state if less than 2 players in handleReady', () => {
        const room: any = { players: [{ playerUid: 'u1', role: 'player' }] };
        const state = ticTacToeGameHandler.getInitialState();
        const result = ticTacToeGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        expect(result.newGameState).toBe(state);
    });

    it('should not add player multiple times to readyPlayers', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { status: 'finished', readyPlayers: ['u1'] };
        const result = ticTacToeGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        expect(result.newGameState.readyPlayers.length).toBe(1);
    });

    it('should handle move with less than 2 players', () => {
        const room: any = { players: [{ playerUid: 'u1', role: 'player' }] };
        const state: any = { status: 'playing', board: Array(9).fill(null), currentTurn: 'u1' };
        const result = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: 0 });
        expect(result.newGameState.status).toBe('waiting-for-players');
    });

    it('should handle string move index', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { status: 'playing', board: Array(9).fill(null), currentTurn: 'u1' };
        const result = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: '0' });
        expect(result.newGameState.board[0]).toBe('X');
    });

    it('should handle guest move', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { status: 'playing', board: Array(9).fill(null), currentTurn: 'u2' };
        const result = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u2', move: 1 });
        expect(result.newGameState.board[1]).toBe('O');
    });

    it('ignores a rematch vote while a game is in progress', () => {
        const room: any = { players: [{ playerUid: 'u1', role: 'player' }, { playerUid: 'u2', role: 'player' }] };
        const state: any = { status: 'playing', board: ['X', ...Array(8).fill(null)], currentTurn: 'u2', readyPlayers: [] };
        const r1 = ticTacToeGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        const r2 = ticTacToeGameHandler.handleReady({ room, gameState: r1.newGameState, playerUid: 'u2' });
        expect(r2.newGameState).toBe(state);
        expect(state.readyPlayers).toEqual([]); // input state never mutated
    });

    it('should return same state if game is finished in handleMove', () => {

        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { status: 'finished', board: Array(9).fill(null), currentTurn: 'u1' };
        const result = ticTacToeGameHandler.handleMove({ room, gameState: state, playerUid: 'u1', move: 0 });
        expect(result.newGameState).toBe(state);
    });
});



