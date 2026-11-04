import { Room, RPSState, TicTacToeState, SnakeLadderState } from "../models";

export const BOT_NAME = "Computer";

export type BotAction = { type: "move"; move: unknown } | { type: "ready" } | null;

type Random = () => number;

const RPS_MOVES = ["Rock", "Paper", "Scissors"];

const TIC_TAC_TOE_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];
const CENTER = 4;
const CORNERS = [0, 2, 6, 8];
const SIDES = [1, 3, 5, 7];

const pick = <T>(items: T[], random: Random): T => items[Math.floor(random() * items.length)];

// The square that completes a line for `mark`, if one exists.
const findWinningSquare = (board: (string | null)[], mark: string): number | null => {
    for (const line of TIC_TAC_TOE_LINES) {
        const marks = line.map((i) => board[i]);
        const empty = line.filter((i) => board[i] === null);
        if (empty.length === 1 && marks.filter((m) => m === mark).length === 2) {
            return empty[0];
        }
    }
    return null;
};

/**
 * Win if possible, otherwise block the opponent's win, otherwise prefer the
 * centre, then a corner, then a side. Ties within a group are broken randomly
 * so the computer doesn't play the exact same game every time.
 */
export const pickTicTacToeMove = (
    board: (string | null)[],
    botMark: string,
    random: Random = Math.random
): number | null => {
    const opponentMark = botMark === "X" ? "O" : "X";

    const win = findWinningSquare(board, botMark);
    if (win !== null) return win;

    const block = findWinningSquare(board, opponentMark);
    if (block !== null) return block;

    if (board[CENTER] === null) return CENTER;

    for (const group of [CORNERS, SIDES]) {
        const open = group.filter((i) => board[i] === null);
        if (open.length > 0) return pick(open, random);
    }
    return null;
};

/**
 * Decides what the computer player should do next in `room`, or null when it's
 * waiting on someone else. Pure, so it can be re-evaluated at any time.
 */
export const getBotAction = (room: Room, botUid: string, random: Random = Math.random): BotAction => {
    const players = room.players.filter((p) => p.role === "player");
    if (players.length < 2) return null;

    switch (room.gameType) {
        case "RPS": {
            const state = room.gameState as RPSState;
            if (state.status === "playing" && !state.playerChoices?.[botUid]) {
                return { type: "move", move: pick(RPS_MOVES, random) };
            }
            if (state.status === "waiting_for_ready" && !state.readyPlayers?.includes(botUid)) {
                return { type: "ready" };
            }
            return null;
        }
        case "TIC_TAC_TOE": {
            const state = room.gameState as TicTacToeState;
            if (state.status === "playing" && !state.winner && state.currentTurn === botUid) {
                const botMark = players[0].playerUid === botUid ? "X" : "O";
                const square = pickTicTacToeMove(state.board, botMark, random);
                return square === null ? null : { type: "move", move: square };
            }
            if (state.status === "finished" && !state.readyPlayers?.includes(botUid)) {
                return { type: "ready" };
            }
            return null;
        }
        case "SNAKE_LADDER": {
            const state = room.gameState as SnakeLadderState;
            if (state.status === "playing" && !state.winner && state.currentTurn === botUid) {
                return { type: "move", move: null };
            }
            if (state.status === "finished" && !state.readyPlayers?.includes(botUid)) {
                return { type: "ready" };
            }
            return null;
        }
        default:
            return null;
    }
};
