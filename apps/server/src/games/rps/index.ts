import { Room, RPSState, GameState, RoundResult } from "../../models";

const HANDS = ['Rock', 'Paper', 'Scissors'];

export const rpsGameHandler = {
    getInitialState(): RPSState {
        return {
            status: 'waiting-for-players',
            playerChoices: {},
            readyPlayers: [],
            roundCount: 0,
            lastResult: null
        };
    },

    handleReady({ room, gameState, playerUid }: { room: Room; gameState: GameState; playerUid: string }) {
        const state = gameState as RPSState;
        const players = room.players.filter((p) => p.role === 'player');
        
        // Don't start if there are fewer than 2 players
        if (players.length < 2) {
            return { newGameState: state };
        }

        const { readyPlayers = [], status: currentStatus } = state;
        
        // Initial start from lobby: Host override
        if (currentStatus === 'waiting-for-players') {
            return {
                newGameState: {
                    ...state,
                    status: 'playing',
                    playerChoices: {},
                    readyPlayers: [],
                    roundCount: (state.roundCount || 0) + 1,
                    lastResult: null
                } as RPSState
            };
        }

        // A rematch vote only counts once the round is over, never mid-round.
        if (currentStatus !== 'waiting_for_ready') return { newGameState: state };

        const nextReady = readyPlayers.includes(playerUid) ? readyPlayers : [...readyPlayers, playerUid];

        if (nextReady.length >= players.length) {
            return {
                newGameState: {
                    ...state,
                    status: 'playing',
                    playerChoices: {},
                    readyPlayers: [],
                    roundCount: (state.roundCount || 0) + 1,
                    lastResult: null
                } as RPSState
            };
        }

        return {
            newGameState: {
                ...state,
                readyPlayers: nextReady
            }
        };
    },

    handleMove({ room, gameState, playerUid, move }: { room: Room; gameState: GameState; playerUid: string; move: unknown }) {
        const state = gameState as RPSState;
        // Prevent game moves if a player has left
        const players = room.players.filter((p) => p.role === 'player');
        if (players.length < 2) {
            return { 
                newGameState: { 
                    ...gameState, 
                    status: 'waiting-for-players',
                    playerChoices: {} 
                } 
            };
        }

        if (state.status === 'waiting_for_ready') return { newGameState: state };
        if (typeof move !== 'string' || !HANDS.includes(move)) return { newGameState: state, error: `Invalid RPS move: ${String(move)}` };

        const playerChoices = { ...state.playerChoices, [playerUid]: move };

        if (Object.keys(playerChoices).length >= players.length) {
            const uids = Object.keys(playerChoices);
            const p1 = uids[0];
            const p2 = uids[1];
            const move1 = playerChoices[p1];
            const move2 = playerChoices[p2];

            let winnerUid = null;
            if (move1 !== move2) {
                if (
                    (move1 === 'Rock' && move2 === 'Scissors') ||
                    (move1 === 'Paper' && move2 === 'Rock') ||
                    (move1 === 'Scissors' && move2 === 'Paper')
                ) {
                    winnerUid = p1;
                } else {
                    winnerUid = p2;
                }
            }

            const lastResult: RoundResult = {
                roomId: room.id,
                isDraw: move1 === move2,
                winnerUid,
                choices: playerChoices
            };

            return {
                newGameState: {
                    ...state,
                    status: 'waiting_for_ready',
                    playerChoices,
                    lastResult
                } as RPSState,
                winnerUid
            };
        }

        return {
            newGameState: {
                ...state,
                playerChoices
            } as RPSState
        };
    },

    projectPublicState({ gameState, playerUid }: { gameState: GameState; playerUid: string }): GameState {
        const state = gameState as RPSState;
        const publicChoices = { ...state.playerChoices };
        if (state.status !== 'waiting_for_ready') {
            Object.keys(publicChoices).forEach(uid => {
                if (uid !== playerUid) publicChoices[uid] = 'hidden';
            });
        }
        return { ...state, playerChoices: publicChoices } as RPSState;
    }
};
