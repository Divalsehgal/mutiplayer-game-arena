import { getBotAction, pickTicTacToeMove } from "./bot";
import { Room, GameState } from "../models";

const BOT = "bot-r1";
const HUMAN = "u1";

const makeRoom = (gameType: string, gameState: Partial<GameState>, players = [HUMAN, BOT]): Room => ({
    id: "r1",
    gameType,
    status: "playing",
    maxPlayers: 2,
    allowSpectators: true,
    isPublic: false,
    hostName: "Human",
    players: players.map((uid) => ({
        playerUid: uid,
        socketId: null,
        name: uid,
        role: "player" as const,
        status: "online" as const,
        isBot: uid === BOT,
    })),
    gameState: gameState as GameState,
    createdAt: 0,
    updatedAt: 0,
    lastActivityAt: 0,
    expiresAt: 0,
    hasSentWarning: false,
});

// Always picks the first option, so random choices are predictable.
const first = () => 0;
// Always picks the last option.
const last = () => 0.999;

describe("pickTicTacToeMove", () => {
    const _ = null;

    it("completes its own line to win", () => {
        const board = ["O", "O", _, "X", "X", _, _, _, _];
        expect(pickTicTacToeMove(board, "O")).toBe(2);
    });

    it("prefers winning over blocking", () => {
        // X threatens 5, but O can win at 2.
        const board = ["O", "O", _, "X", "X", _, "X", _, _];
        expect(pickTicTacToeMove(board, "O")).toBe(2);
    });

    it("blocks the opponent's winning line", () => {
        const board = ["X", "X", _, _, "O", _, _, _, _];
        expect(pickTicTacToeMove(board, "O")).toBe(2);
    });

    it("blocks diagonal threats", () => {
        const board = ["X", _, _, _, "X", _, _, _, _];
        expect(pickTicTacToeMove(board, "O")).toBe(8);
    });

    it("takes the centre when nothing is urgent", () => {
        const board = ["X", _, _, _, _, _, _, _, _];
        expect(pickTicTacToeMove(board, "O")).toBe(4);
    });

    it("takes a corner when the centre is taken", () => {
        const board = [_, _, _, _, "X", _, _, _, _];
        expect(pickTicTacToeMove(board, "O", first)).toBe(0);
        expect(pickTicTacToeMove(board, "O", last)).toBe(8);
    });

    it("falls back to a side when the centre and every corner are taken", () => {
        // Centre and corners full, and no line has two of a kind with a gap.
        const board = ["X", _, "O", _, "X", _, "O", _, "X"];
        expect(pickTicTacToeMove(board, "O", first)).toBe(1);
        expect(pickTicTacToeMove(board, "O", last)).toBe(7);
    });

    it("returns null for a full board", () => {
        const board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
        expect(pickTicTacToeMove(board, "O")).toBeNull();
    });

    it("works when the computer plays X", () => {
        const board = ["X", "X", _, "O", "O", _, _, _, _];
        expect(pickTicTacToeMove(board, "X")).toBe(2);
    });
});

describe("getBotAction", () => {
    it("does nothing when there is no opponent", () => {
        const room = makeRoom("RPS", { status: "playing", playerChoices: {} }, [BOT]);
        expect(getBotAction(room, BOT)).toBeNull();
    });

    it("does nothing for an unknown game", () => {
        const room = makeRoom("CHESS", { status: "playing" });
        expect(getBotAction(room, BOT)).toBeNull();
    });

    describe("Rock Paper Scissors", () => {
        it("picks a move when the round is in progress", () => {
            const room = makeRoom("RPS", { status: "playing", playerChoices: {}, readyPlayers: [] });
            expect(getBotAction(room, BOT, first)).toEqual({ type: "move", move: "Rock" });
            expect(getBotAction(room, BOT, last)).toEqual({ type: "move", move: "Scissors" });
        });

        it("waits once it has already picked", () => {
            const room = makeRoom("RPS", { status: "playing", playerChoices: { [BOT]: "Rock" }, readyPlayers: [] });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("gets ready for the next round", () => {
            const room = makeRoom("RPS", { status: "waiting_for_ready", playerChoices: {}, readyPlayers: [] });
            expect(getBotAction(room, BOT)).toEqual({ type: "ready" });
        });

        it("does not ready twice", () => {
            const room = makeRoom("RPS", { status: "waiting_for_ready", playerChoices: {}, readyPlayers: [BOT] });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("does nothing before the game starts", () => {
            const room = makeRoom("RPS", { status: "waiting-for-players", playerChoices: {}, readyPlayers: [] });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("handles missing choices and ready lists", () => {
            expect(getBotAction(makeRoom("RPS", { status: "playing" }), BOT, first)).toEqual({ type: "move", move: "Rock" });
            expect(getBotAction(makeRoom("RPS", { status: "waiting_for_ready" }), BOT)).toEqual({ type: "ready" });
        });
    });

    describe("Tic-Tac-Toe", () => {
        const emptyBoard = Array(9).fill(null);

        it("plays a square on its turn", () => {
            const room = makeRoom("TIC_TAC_TOE", { status: "playing", board: ["X", ...Array(8).fill(null)], currentTurn: BOT, winner: null });
            expect(getBotAction(room, BOT)).toEqual({ type: "move", move: 4 });
        });

        it("plays X when it is the first player", () => {
            const room = makeRoom(
                "TIC_TAC_TOE",
                { status: "playing", board: ["X", "X", null, "O", "O", null, null, null, null], currentTurn: BOT, winner: null },
                [BOT, HUMAN]
            );
            expect(getBotAction(room, BOT)).toEqual({ type: "move", move: 2 });
        });

        it("waits on the other player's turn", () => {
            const room = makeRoom("TIC_TAC_TOE", { status: "playing", board: emptyBoard, currentTurn: HUMAN, winner: null });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("does nothing when the board is full", () => {
            const full = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
            const room = makeRoom("TIC_TAC_TOE", { status: "playing", board: full, currentTurn: BOT, winner: null });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("gets ready for a rematch after the game ends", () => {
            const room = makeRoom("TIC_TAC_TOE", { status: "finished", board: emptyBoard, currentTurn: null, winner: HUMAN, readyPlayers: [] });
            expect(getBotAction(room, BOT)).toEqual({ type: "ready" });
        });

        it("does not ready twice", () => {
            const room = makeRoom("TIC_TAC_TOE", { status: "finished", board: emptyBoard, currentTurn: null, winner: HUMAN, readyPlayers: [BOT] });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("handles a missing ready list", () => {
            const room = makeRoom("TIC_TAC_TOE", { status: "finished", board: emptyBoard, currentTurn: null, winner: null });
            expect(getBotAction(room, BOT)).toEqual({ type: "ready" });
        });
    });

    describe("Snakes & Ladders", () => {
        it("rolls on its turn", () => {
            const room = makeRoom("SNAKE_LADDER", { status: "playing", currentTurn: BOT, winner: null, positions: {} });
            expect(getBotAction(room, BOT)).toEqual({ type: "move", move: null });
        });

        it("waits on the other player's turn", () => {
            const room = makeRoom("SNAKE_LADDER", { status: "playing", currentTurn: HUMAN, winner: null, positions: {} });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("gets ready for a rematch after someone wins", () => {
            const room = makeRoom("SNAKE_LADDER", { status: "finished", currentTurn: null, winner: HUMAN, positions: {}, readyPlayers: [] });
            expect(getBotAction(room, BOT)).toEqual({ type: "ready" });
        });

        it("does not ready twice", () => {
            const room = makeRoom("SNAKE_LADDER", { status: "finished", currentTurn: null, winner: HUMAN, positions: {}, readyPlayers: [BOT] });
            expect(getBotAction(room, BOT)).toBeNull();
        });

        it("handles a missing ready list", () => {
            const room = makeRoom("SNAKE_LADDER", { status: "finished", currentTurn: null, winner: HUMAN, positions: {} });
            expect(getBotAction(room, BOT)).toEqual({ type: "ready" });
        });
    });
});
