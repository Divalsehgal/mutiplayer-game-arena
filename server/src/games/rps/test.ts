/* eslint-disable max-lines -- one describe block per handler method */
import { rpsGameHandler } from './index';
import { RPSState } from '../../models';

const twoPlayerRoom = (p1 = 'p1', p2 = 'p2'): any => ({
    id: 'room1',
    players: [
        { role: 'player', playerUid: p1 },
        { role: 'player', playerUid: p2 },
    ]
});

const onePlayerRoom = (): any => ({
    id: 'room1',
    players: [{ role: 'player', playerUid: 'p1' }]
});

describe('RPS Game Handler', () => {

    // ---- getInitialState ----
    describe('getInitialState', () => {
        it('should return correct initial state', () => {
            const state = rpsGameHandler.getInitialState();
            expect(state.status).toBe('waiting-for-players');
            expect(state.playerChoices).toEqual({});
            expect(state.readyPlayers).toEqual([]);
            expect(state.roundCount).toBe(0);
            expect(state.lastResult).toBeNull();
        });
    });

    // ---- handleReady ----
    describe('handleReady', () => {
        it('should return unchanged state if fewer than 2 players (L20)', () => {
            const state = rpsGameHandler.getInitialState();
            const result = rpsGameHandler.handleReady({
                room: onePlayerRoom(),
                gameState: state,
                playerUid: 'p1'
            });
            expect(result.newGameState.status).toBe('waiting-for-players');
        });

        it('should start round 1 when status is waiting-for-players (host start)', () => {
            const state = rpsGameHandler.getInitialState();
            const result = rpsGameHandler.handleReady({
                room: twoPlayerRoom(),
                gameState: state,
                playerUid: 'p1'
            });
            expect(result.newGameState.status).toBe('playing');
            expect(result.newGameState.roundCount).toBe(1);
            expect(result.newGameState.playerChoices).toEqual({});
        });

        it('should add first player to readyPlayers mid-game (L39-41, L56-61)', () => {
            const state: RPSState = {
                ...rpsGameHandler.getInitialState(),
                status: 'waiting_for_ready',
                readyPlayers: []
            };
            const result = rpsGameHandler.handleReady({
                room: twoPlayerRoom(),
                gameState: state,
                playerUid: 'p1'
            });
            expect(result.newGameState.status).toBe('waiting_for_ready');
            expect((result.newGameState as RPSState).readyPlayers).toContain('p1');
        });

        it('ignores ready mid-round and never mutates the input state', () => {
            const state: RPSState = { ...rpsGameHandler.getInitialState(), status: 'playing', readyPlayers: ['p1'] };
            const result = rpsGameHandler.handleReady({ room: twoPlayerRoom(), gameState: state, playerUid: 'p2' });
            expect(result.newGameState).toBe(state);

            const over: RPSState = { ...rpsGameHandler.getInitialState(), status: 'waiting_for_ready', readyPlayers: [] };
            rpsGameHandler.handleReady({ room: twoPlayerRoom(), gameState: over, playerUid: 'p1' });
            expect(over.readyPlayers).toEqual([]);
        });

        it('should not double-add player to readyPlayers', () => {
            const state: RPSState = {
                ...rpsGameHandler.getInitialState(),
                status: 'waiting_for_ready',
                readyPlayers: ['p1']
            };
            const result = rpsGameHandler.handleReady({
                room: twoPlayerRoom(),
                gameState: state,
                playerUid: 'p1'
            });
            const readyList = (result.newGameState as RPSState).readyPlayers || [];
            expect(readyList.filter((u: string) => u === 'p1').length).toBe(1);
        });

        it('should start next round when all players are ready (L43-54)', () => {
            const state: RPSState = {
                ...rpsGameHandler.getInitialState(),
                status: 'waiting_for_ready',
                readyPlayers: ['p1'],
                roundCount: 1
            };
            const result = rpsGameHandler.handleReady({
                room: twoPlayerRoom(),
                gameState: state,
                playerUid: 'p2'
            });
            expect(result.newGameState.status).toBe('playing');
            expect(result.newGameState.roundCount).toBe(2);
            expect(result.newGameState.playerChoices).toEqual({});
            expect(result.newGameState.lastResult).toBeNull();
        });
    });

    // ---- handleMove ----
    describe('handleMove', () => {
        const playingState = (): RPSState => ({
            ...rpsGameHandler.getInitialState(),
            status: 'playing'
        });

        it('should guard against fewer than 2 players (L69)', () => {
            const result = rpsGameHandler.handleMove({
                room: onePlayerRoom(),
                gameState: playingState(),
                playerUid: 'p1',
                move: 'Rock'
            });
            expect((result.newGameState as any).status).toBe('waiting-for-players');
            expect((result.newGameState as any).playerChoices).toEqual({});
        });

        it('should no-op when status is waiting_for_ready (L78)', () => {
            const state: RPSState = { ...playingState(), status: 'waiting_for_ready' };
            const result = rpsGameHandler.handleMove({
                room: twoPlayerRoom(),
                gameState: state,
                playerUid: 'p1',
                move: 'Rock'
            });
            expect(result.newGameState.status).toBe('waiting_for_ready');
        });

        it('rejects anything that is not Rock, Paper or Scissors', () => {
            for (const move of ['Lizard', 'hidden', 3, null, { $ne: 1 }]) {
                const result = rpsGameHandler.handleMove({ room: twoPlayerRoom(), gameState: playingState(), playerUid: 'p1', move });
                expect(result.error).toBeDefined();
                expect((result.newGameState as RPSState).playerChoices).toEqual({});
            }
        });

        it('should record first move without resolving round (L121-126)', () => {
            const result = rpsGameHandler.handleMove({
                room: twoPlayerRoom(),
                gameState: playingState(),
                playerUid: 'p1',
                move: 'Rock'
            });
            expect((result.newGameState as RPSState).playerChoices?.p1).toBe('Rock');
            expect(result.newGameState.status).toBe('playing');
        });

        it('p1 wins: Rock beats Scissors (L93,97)', () => {
            const room = twoPlayerRoom();
            const s1 = rpsGameHandler.handleMove({ room, gameState: playingState(), playerUid: 'p1', move: 'Rock' });
            const s2 = rpsGameHandler.handleMove({ room, gameState: s1.newGameState, playerUid: 'p2', move: 'Scissors' });
            expect(s2.winnerUid).toBe('p1');
            expect(s2.newGameState.status).toBe('waiting_for_ready');
        });

        it('p1 wins: Paper beats Rock (L94,97)', () => {
            const room = twoPlayerRoom();
            const s1 = rpsGameHandler.handleMove({ room, gameState: playingState(), playerUid: 'p1', move: 'Paper' });
            const s2 = rpsGameHandler.handleMove({ room, gameState: s1.newGameState, playerUid: 'p2', move: 'Rock' });
            expect(s2.winnerUid).toBe('p1');
        });

        it('p1 wins: Scissors beats Paper (L95,97)', () => {
            const room = twoPlayerRoom();
            const s1 = rpsGameHandler.handleMove({ room, gameState: playingState(), playerUid: 'p1', move: 'Scissors' });
            const s2 = rpsGameHandler.handleMove({ room, gameState: s1.newGameState, playerUid: 'p2', move: 'Paper' });
            expect(s2.winnerUid).toBe('p1');
        });

        it('p2 wins: Rock beats Scissors (L99)', () => {
            const room = twoPlayerRoom();
            const s1 = rpsGameHandler.handleMove({ room, gameState: playingState(), playerUid: 'p1', move: 'Scissors' });
            const s2 = rpsGameHandler.handleMove({ room, gameState: s1.newGameState, playerUid: 'p2', move: 'Rock' });
            expect(s2.winnerUid).toBe('p2');
        });

        it('p2 wins: Paper beats Scissors', () => {
            const room = twoPlayerRoom();
            const s1 = rpsGameHandler.handleMove({ room, gameState: playingState(), playerUid: 'p1', move: 'Rock' });
            const s2 = rpsGameHandler.handleMove({ room, gameState: s1.newGameState, playerUid: 'p2', move: 'Paper' });
            expect(s2.winnerUid).toBe('p2');
        });

        it('should handle a draw (no winner)', () => {
            const room = twoPlayerRoom();
            const s1 = rpsGameHandler.handleMove({ room, gameState: playingState(), playerUid: 'p1', move: 'Rock' });
            const s2 = rpsGameHandler.handleMove({ room, gameState: s1.newGameState, playerUid: 'p2', move: 'Rock' });
            expect(s2.winnerUid).toBeNull();
            expect((s2.newGameState as RPSState).lastResult?.isDraw).toBe(true);
        });
    });

    // ---- projectPublicState ----
    describe('projectPublicState', () => {
        it('should hide opponent choices when status is NOT waiting_for_ready (L132-135)', () => {
            const state: RPSState = {
                ...rpsGameHandler.getInitialState(),
                status: 'playing',
                playerChoices: { p1: 'Rock', p2: 'Paper' }
            };
            const projected = rpsGameHandler.projectPublicState({ gameState: state, playerUid: 'p1' }) as RPSState;
            expect(projected.playerChoices?.p1).toBe('Rock');
            expect(projected.playerChoices?.p2).toBe('hidden');
        });

        it('should reveal all choices when status is waiting_for_ready (L132 false branch)', () => {
            const state: RPSState = {
                ...rpsGameHandler.getInitialState(),
                status: 'waiting_for_ready',
                playerChoices: { p1: 'Rock', p2: 'Scissors' }
            };
            const projected = rpsGameHandler.projectPublicState({ gameState: state, playerUid: 'p1' }) as RPSState;
            expect(projected.playerChoices?.p1).toBe('Rock');
            expect(projected.playerChoices?.p2).toBe('Scissors');
        });

        it('should not hide own move from the requesting player', () => {
            const state: RPSState = {
                ...rpsGameHandler.getInitialState(),
                status: 'playing',
                playerChoices: { p1: 'Scissors' }
            };
            const projected = rpsGameHandler.projectPublicState({ gameState: state, playerUid: 'p1' }) as RPSState;
            expect(projected.playerChoices?.p1).toBe('Scissors');
        });
    });
});
