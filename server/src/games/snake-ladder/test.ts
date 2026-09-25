import { snakeLadderGameHandler } from './index';
import { SnakeLadderState } from '../../models';

describe('SnakeLadder Game Handler', () => {
    it('should provide initial state', () => {
        const state = snakeLadderGameHandler.getInitialState();
        expect(state.status).toBe('waiting-for-players');
        expect(state.positions).toEqual({});
    });

    it('should start game when host is ready', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state = snakeLadderGameHandler.getInitialState();
        const result = snakeLadderGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        const newState = result.newGameState as SnakeLadderState;
        expect(newState.status).toBe('playing');
        expect(newState.positions['u1']).toBe(1);
        expect(newState.positions['u2']).toBe(1);
    });

    it('should not start if players < 2', () => {
        const room: any = { players: [{ playerUid: 'u1', role: 'player' }] };
        const state = snakeLadderGameHandler.getInitialState();
        const result = snakeLadderGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        expect(result.newGameState).toBe(state);
    });

    it('should handle readyPlayers for rematch', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'finished', 
            readyPlayers: [], 
            positions: { 'u1': 100, 'u2': 10 } 
        };
        
        // u1 becomes ready
        let result = snakeLadderGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        const intermediateState = result.newGameState as any;
        expect(intermediateState.readyPlayers).toEqual(['u1']);
        expect(intermediateState.status).toBe('finished');

        // u1 already ready, u2 becomes ready
        result = snakeLadderGameHandler.handleReady({ room, gameState: intermediateState, playerUid: 'u2' });
        const finalState = result.newGameState as any;
        expect(finalState.status).toBe('playing');
        expect(finalState.positions['u1']).toBe(1);
        expect(finalState.readyPlayers).toEqual([]);
    });

    it('should handle dice roll and position update', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            positions: { 'u1': 1, 'u2': 1 }, 
            currentTurn: 'u1', 
            logs: [] 
        };
        
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.4); // roll 3 -> pos 4 -> ladder to 14
        
        const result = snakeLadderGameHandler.handleMove({ room, gameState: state, playerUid: 'u1' });
        const newState = result.newGameState as SnakeLadderState;
        expect(newState.positions['u1']).toBe(14);
        expect(newState.currentTurn).toBe('u2');
        
        spy.mockRestore();
    });

    it('should stop move if players < 2', () => {
        const room: any = { players: [{ playerUid: 'u1', role: 'player' }] };
        const state: any = { status: 'playing', positions: { 'u1': 10 } };
        const result = snakeLadderGameHandler.handleMove({ room, gameState: state, playerUid: 'u1' });
        const newState = result.newGameState as any;
        expect(newState.status).toBe('waiting-for-players');
        expect(newState.logs[0]).toContain('opponent left');
    });

    it('should ignore move if not player\'s turn or game finished', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { status: 'playing', currentTurn: 'u2', winner: null };
        const result = snakeLadderGameHandler.handleMove({ room, gameState: state, playerUid: 'u1' });
        expect(result.newGameState).toBe(state);

        const finishedState: any = { status: 'finished', winner: 'u2' };
        const result2 = snakeLadderGameHandler.handleMove({ room, gameState: finishedState, playerUid: 'u2' });
        expect(result2.newGameState).toBe(finishedState);
    });

    it('should stay in place if roll exceeds 100', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player', name: 'P1' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            positions: { 'u1': 98, 'u2': 1 }, 
            currentTurn: 'u1', 
            logs: [] 
        };
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.4); // Roll 3 -> 98 + 3 = 101
        const result = snakeLadderGameHandler.handleMove({ room, gameState: state, playerUid: 'u1' });
        const newState = result.newGameState as any;
        expect(newState.positions['u1']).toBe(98);
        expect(newState.logs[0]).toContain('exact roll');
        spy.mockRestore();
    });

    it('should move down on snake', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player', name: 'P1' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            positions: { 'u1': 14, 'u2': 1 }, 
            currentTurn: 'u1', 
            logs: [] 
        };
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.2); // Roll 2 -> 14 + 2 = 16 (Snake at 16 -> 6)
        const result = snakeLadderGameHandler.handleMove({ room, gameState: state, playerUid: 'u1' });
        const newState = result.newGameState as any;
        expect(newState.positions['u1']).toBe(6);
        expect(newState.logs[0]).toContain('snake');
        spy.mockRestore();
    });

    it('should detect win at 100', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            positions: { 'u1': 97, 'u2': 1 }, 
            currentTurn: 'u1', 
            logs: [] 
        };
        
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.4); // Roll 3
        
        const result = snakeLadderGameHandler.handleMove({ room, gameState: state, playerUid: 'u1' });
        const newState = result.newGameState as SnakeLadderState;
        expect(newState.positions['u1']).toBe(100);
        expect(newState.winner).toBe('u1');
        expect(newState.status).toBe('finished');
        
        spy.mockRestore();
    });

    it('should return same state for projectPublicState', () => {
        const state: any = { foo: 'bar' };
        expect(snakeLadderGameHandler.projectPublicState({ gameState: state })).toBe(state);
    });

    it('should handle undefined readyPlayers and duplicate ready calls', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { status: 'finished', positions: { 'u1': 1, 'u2': 1 } }; // readyPlayers missing
        
        let result = snakeLadderGameHandler.handleReady({ room, gameState: state, playerUid: 'u1' });
        expect(result.newGameState.readyPlayers).toEqual(['u1']);

        // call again for same player
        result = snakeLadderGameHandler.handleReady({ room, gameState: result.newGameState, playerUid: 'u1' });
        expect(result.newGameState.readyPlayers).toEqual(['u1']);
    });

    it('should start from position 1 if position is missing', () => {
        const room: any = { 
            players: [
                { playerUid: 'u1', role: 'player', name: 'P1' }, 
                { playerUid: 'u2', role: 'player' }
            ] 
        };
        const state: any = { 
            status: 'playing', 
            positions: { 'u2': 1 }, // u1 missing
            currentTurn: 'u1', 
            logs: [] 
        };
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0); // Roll 1 -> 1 + 1 = 2
        const result = snakeLadderGameHandler.handleMove({ room, gameState: state, playerUid: 'u1' });
        const newState = result.newGameState as any;
        expect(newState.positions['u1']).toBe(2);
        spy.mockRestore();
    });
});
