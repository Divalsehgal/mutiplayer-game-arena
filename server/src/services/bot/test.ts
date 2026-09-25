import { BotRunner } from "./index";
import { RoomRepository } from "../../repositories/room";
import { GameService } from "../game";
import { RoomService } from "../room";
import { gameRegistry } from "../../games/registry";
import { TicTacToeState, RPSState, SnakeLadderState } from "../../models";

const DELAY = 100;
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe("BotRunner", () => {
    let repo: RoomRepository;
    let gameService: GameService;
    let roomService: RoomService;
    let onUpdate: jest.Mock;
    let runner: BotRunner;

    const createComputerGame = (gameType: string) => {
        const room = roomService.createRoom({
            playerUid: "u1",
            socketId: "s1",
            name: "Human",
            gameType,
            vsComputer: true,
        });
        gameService.handleReady(room.id, "u1");
        return room;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        repo = new RoomRepository();
        gameService = new GameService(repo, gameRegistry, logger);
        roomService = new RoomService(repo, gameRegistry, logger);
        onUpdate = jest.fn();
        runner = new BotRunner(repo, gameService, onUpdate, DELAY, () => 0);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("does nothing for a room that doesn't exist", () => {
        runner.schedule("missing");
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("does nothing in a room without a computer player", () => {
        const room = roomService.createRoom({ playerUid: "u1", socketId: "s1", name: "A", gameType: "RPS" });
        repo.joinRoom({ roomId: room.id, playerUid: "u2", socketId: "s2", name: "B" });
        gameService.handleReady(room.id, "u1");

        runner.schedule(room.id);
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("does nothing before the game has started", () => {
        const room = roomService.createRoom({ playerUid: "u1", socketId: "s1", name: "A", gameType: "RPS", vsComputer: true });

        runner.schedule(room.id);
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("does nothing when it's the human's turn", () => {
        const room = createComputerGame("TIC_TAC_TOE"); // human is X and moves first

        runner.schedule(room.id);
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("waits for the delay before playing", () => {
        const room = createComputerGame("RPS");

        runner.schedule(room.id);
        jest.advanceTimersByTime(DELAY - 1);
        expect(onUpdate).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(onUpdate).toHaveBeenCalledWith(room.id);
        const state = repo.getRoom(room.id)!.gameState as RPSState;
        expect(state.playerChoices[`bot-${room.id}`]).toBe("Rock");
    });

    it("only schedules one pending action per room", () => {
        const room = createComputerGame("RPS");

        runner.schedule(room.id);
        runner.schedule(room.id);
        jest.runAllTimers();
        expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it("can cancel a pending action", () => {
        const room = createComputerGame("RPS");

        runner.schedule(room.id);
        runner.cancel(room.id);
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("cancelling with nothing pending is harmless", () => {
        expect(() => runner.cancel("nothing")).not.toThrow();
    });

    it("skips the action if the room closed while waiting", () => {
        const room = createComputerGame("RPS");

        runner.schedule(room.id);
        repo.leaveRoom({ roomId: room.id, playerUid: "u1" });
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("skips the action if it's no longer needed when the timer fires", () => {
        const room = createComputerGame("RPS");
        const botUid = `bot-${room.id}`;

        runner.schedule(room.id);
        // Something else made the move for the computer in the meantime.
        gameService.handleMove(room.id, botUid, "Paper");
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("doesn't broadcast when the game rejects the action", () => {
        const room = createComputerGame("RPS");
        jest.spyOn(gameService, "handleMove").mockReturnValue(null);

        runner.schedule(room.id);
        jest.runAllTimers();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    describe("playing full games", () => {
        it("answers each Tic-Tac-Toe move and blocks a winning line", () => {
            const room = createComputerGame("TIC_TAC_TOE");

            gameService.handleMove(room.id, "u1", 0);
            runner.schedule(room.id);
            jest.runAllTimers();
            let state = repo.getRoom(room.id)!.gameState as TicTacToeState;
            expect(state.board[4]).toBe("O"); // takes the centre
            expect(state.currentTurn).toBe("u1");

            gameService.handleMove(room.id, "u1", 1); // X threatens 0-1-2
            runner.schedule(room.id);
            jest.runAllTimers();
            state = repo.getRoom(room.id)!.gameState as TicTacToeState;
            expect(state.board[2]).toBe("O"); // blocks
            expect(state.currentTurn).toBe("u1");
            expect(state.winner).toBeNull();
        });

        it("gets ready for a rematch, and the rematch starts once the human is ready", () => {
            const room = createComputerGame("TIC_TAC_TOE");
            const r = repo.getRoom(room.id)!;
            r.gameState = { ...(r.gameState as TicTacToeState), status: "finished", winner: "u1", currentTurn: null, readyPlayers: [] };

            runner.schedule(room.id);
            jest.runAllTimers();
            expect((repo.getRoom(room.id)!.gameState as TicTacToeState).readyPlayers).toContain(`bot-${room.id}`);

            gameService.handleReady(room.id, "u1");
            const state = repo.getRoom(room.id)!.gameState as TicTacToeState;
            expect(state.status).toBe("playing");
            expect(state.board.every((c) => c === null)).toBe(true);
        });

        it("keeps Rock Paper Scissors going: moves, then readies for the next round", () => {
            const room = createComputerGame("RPS");

            runner.schedule(room.id);
            jest.runAllTimers();
            gameService.handleMove(room.id, "u1", "Paper"); // Paper beats the computer's Rock
            runner.schedule(room.id);
            jest.runAllTimers();

            const state = repo.getRoom(room.id)!.gameState as RPSState;
            expect(state.lastResult?.winnerUid).toBe("u1");
            expect(state.readyPlayers).toContain(`bot-${room.id}`);
            expect(repo.getRoom(room.id)!.players.find((p) => p.playerUid === "u1")?.score).toBe(1);
        });

        it("rolls on its Snakes & Ladders turn and hands the turn back", () => {
            const room = createComputerGame("SNAKE_LADDER");

            gameService.handleMove(room.id, "u1", "roll");
            runner.schedule(room.id);
            jest.runAllTimers();

            const state = repo.getRoom(room.id)!.gameState as SnakeLadderState;
            expect(state.currentTurn).toBe("u1");
            expect(state.positions[`bot-${room.id}`]).toBeGreaterThan(1);
            expect(onUpdate).toHaveBeenCalledTimes(1);
        });
    });
});
