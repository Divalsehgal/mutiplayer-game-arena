import { RoomRepository } from "../../repositories/room";
import { GameService } from "../game";
import { getBotAction } from "../../games/bot";
import { BOT_MOVE_DELAY_MS } from "../../config";

/**
 * Plays for the computer opponent. Call `schedule(roomId)` after anything that
 * changes a room's game state; if it's the computer's turn, it acts after a
 * short delay, broadcasts the result, and checks again (e.g. a rematch ready
 * followed by the opening move).
 */
export class BotRunner {
    private timers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(
        private roomRepository: RoomRepository,
        private gameService: GameService,
        private onUpdate: (roomId: string) => void,
        private delayMs: number = BOT_MOVE_DELAY_MS,
        private random: () => number = Math.random
    ) {}

    private findBotUid(roomId: string): string | null {
        const room = this.roomRepository.getRoom(roomId);
        if (!room || room.status !== "playing") return null;
        return room.players.find((p) => p.isBot && p.role === "player")?.playerUid ?? null;
    }

    schedule(roomId: string): void {
        if (this.timers.has(roomId)) return;

        const botUid = this.findBotUid(roomId);
        if (!botUid) return;

        const room = this.roomRepository.getRoom(roomId)!;
        if (!getBotAction(room, botUid, this.random)) return;

        const timer = setTimeout(() => {
            this.timers.delete(roomId);
            this.act(roomId);
        }, this.delayMs);
        // Don't keep the process alive just for a pending computer move.
        timer.unref?.();
        this.timers.set(roomId, timer);
    }

    cancel(roomId: string): void {
        const timer = this.timers.get(roomId);
        if (timer) clearTimeout(timer);
        this.timers.delete(roomId);
    }

    private act(roomId: string): void {
        const botUid = this.findBotUid(roomId);
        if (!botUid) return;

        // Re-evaluate: the state may have changed while we were waiting.
        const room = this.roomRepository.getRoom(roomId)!;
        const action = getBotAction(room, botUid, this.random);
        if (!action) return;

        const result = action.type === "ready"
            ? this.gameService.handleReady(roomId, botUid)
            : this.gameService.handleMove(roomId, botUid, action.move);

        if (result) {
            this.onUpdate(roomId);
            this.schedule(roomId);
        }
    }
}
