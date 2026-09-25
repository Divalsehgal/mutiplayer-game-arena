import { Room, GameState, TicTacToeState } from "../../models";

export const ticTacToeGameHandler = {
    getInitialState() {
        return {
            status: 'waiting-for-players',
            board: Array(9).fill(null),
            currentTurn: null,
            winner: null,
            readyPlayers: [],
            logs: ["Awaiting combatants for high-stakes grid combat."]
        };
    },

    handleReady({ room, gameState, playerUid }: { room: Room; gameState: GameState; playerUid: string }) {
        const state = gameState as TicTacToeState;
        const players = room.players.filter((p) => p.role === 'player');
        if (players.length < 2) return { newGameState: state };

        const { readyPlayers = [], status: currentStatus } = state;
        
        // If we are starting from the lobby, the host's action is enough to start for everyone
        if (currentStatus === 'waiting-for-players') {
            return {
                newGameState: {
                    ...state,
                    status: 'playing',
                    board: Array(9).fill(null),
                    currentTurn: players[0].playerUid,
                    winner: null,
                    readyPlayers: [],
                    logs: ["Grid initialized. Tactical engagement active."]
                } as TicTacToeState
            };
        }

        // For rematches (status === 'finished'), we wait for all players to be ready
        if (!readyPlayers.includes(playerUid)) {
            readyPlayers.push(playerUid);
        }

        if (readyPlayers.length >= players.length) {
            return {
                newGameState: {
                    ...gameState,
                    status: 'playing',
                    board: Array(9).fill(null),
                    currentTurn: players[0].playerUid,
                    winner: null,
                    isDraw: false,
                    readyPlayers: [],
                    logs: ["Grid reset. New cycle initialized."]
                } as TicTacToeState
            };
        }

        return { newGameState: { ...state, readyPlayers } as TicTacToeState };
    },

    handleMove({ room, gameState, playerUid, move }: { room: Room; gameState: GameState; playerUid: string; move: unknown }) {
        const state = gameState as TicTacToeState;
        const players = room.players.filter((p) => p.role === 'player');
        if (players.length < 2) return { newGameState: { ...state, status: 'waiting-for-players' } as TicTacToeState };

        if (state.status !== 'playing' || state.winner) return { newGameState: state };
        if (state.currentTurn !== playerUid) return { newGameState: state };

        const index = typeof move === 'number' ? move : parseInt(move as string);
        if (isNaN(index) || index < 0 || index > 8 || state.board[index]) return { newGameState: state };

        const newBoard = [...state.board];
        const isHost = room.players.find(p => p.playerUid === playerUid && p.role === 'player')?.playerUid === players[0].playerUid;
        
        // Host is X (Player 1), Joiner is O (Player 2)
        newBoard[index] = isHost ? 'X' : 'O';

        const winnerMark = this.checkWinner(newBoard);
        let winnerUid = null;
        let status = 'playing';

        if (winnerMark) {
            winnerUid = playerUid; // The person who just moved wins
            status = 'finished';
        } else if (!newBoard.includes(null)) {
            status = 'finished'; // Draw
        }

        const nextTurn = players.find(p => p.playerUid !== playerUid)?.playerUid || null;

        return {
            newGameState: {
                ...state,
                board: newBoard,
                currentTurn: status === 'finished' ? null : nextTurn,
                winner: winnerUid,
                status,
                isDraw: !winnerMark && !newBoard.includes(null),
                logs: [`Combatant ${isHost ? 'ALPHA' : 'BRAVO'} marked node ${index}.`, ...(winnerUid ? ["ENGAGEMENT COMPLETE: VICTORY."] : [])]
            } as TicTacToeState,
            winnerUid
        };
    },

    checkWinner(board: (string | null)[]) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]             // diags
        ];
        for (const [a, b, c] of lines) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    },

    projectPublicState({ gameState }: { gameState: GameState }) {
        return gameState;
    }
};
