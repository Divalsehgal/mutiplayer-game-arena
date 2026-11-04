import { Room } from "../room/Room";

export interface GameEvent {
    type: string;
    payload: unknown;
}

export interface BaseGameState {
    status: string;
    readyPlayers: string[];
}

export interface RPSState extends BaseGameState {
    roundCount: number;
    playerChoices: Record<string, string>;
    lastResult?: RoundResult | null;
}

export interface TicTacToeState extends BaseGameState {
    board: (string | null)[];
    currentTurn: string | null;
    winner: string | null;
    isDraw?: boolean;
}

export interface SnakeLadderState extends BaseGameState {
    positions: Record<string, number>;
    currentTurn: string | null;
    lastRoll: number | null;
    winner: string | null;
    logs: string[];
}

export type GameState = RPSState | TicTacToeState | SnakeLadderState;


export interface GameMoveResult {
    error?: string;
    newGameState?: GameState;
    events?: GameEvent[];
    winnerUid?: string | null;
}

export interface GameRegistry {
    handleMove: (args: {
        room: Room;
        gameState: GameState;
        playerUid: string;
        move: unknown;
    }) => GameMoveResult;
    handleReady?: (args: {
        room: Room;
        gameState: GameState;
        playerUid: string;
    }) => { newGameState: GameState };
    getInitialState?: () => GameState;
    projectPublicState: (args: { gameState: GameState; playerUid: string }) => GameState;
}

export interface RoundResult {
    roomId: string;
    isDraw: boolean;
    winnerUid: string | null;
    choices: Record<string, string>;
    scores?: Record<string, number>;
}
