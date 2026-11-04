import { RoomRepository } from "../../repositories/room";
import { GameRegistry, Logger, Room, SerializedRoom } from "../../models";
import { GameState } from "../../models/game/Game";

export class GameService {
    constructor(
        private roomRepository: RoomRepository,
        private gameRegistry: Record<string, GameRegistry>,
        private logger: Logger
    ) {}

    // Only seated players may act on game state - spectators must never be able
    // to influence moves/ready checks (they can otherwise be folded in as a
    // phantom participant, e.g. deciding an RPS round or forcing a restart).
    private isActivePlayer(room: Room, playerUid: string): boolean {
        return room.players.some((p) => p.playerUid === playerUid && p.role === "player");
    }

    handleReady(roomId: string, playerUid: string) {
        const room = this.roomRepository.getRoom(roomId);
        if (!room) return null;

        if (!this.isActivePlayer(room, playerUid)) return null;

        const handler = this.gameRegistry[room.gameType];
        if (!handler || !handler.handleReady) return null;

        const { newGameState } = handler.handleReady({ room, gameState: room.gameState, playerUid });
        if (!newGameState) return null;

        this.roomRepository.updateGameState({
            roomId: room.id,
            gameState: newGameState,
            status: "playing"
        });
        
        return { gameState: newGameState, status: "playing" };
    }

    handleMove(roomId: string, playerUid: string, move: unknown): { gameState: GameState } | null {
        const room = this.roomRepository.getRoom(roomId);
        if (!room) return null;

        if (!this.isActivePlayer(room, playerUid)) return null;

        const handler = this.gameRegistry[room.gameType];
        if (!handler) return null;

        const { newGameState, error, winnerUid } = handler.handleMove({ 
            room, 
            gameState: room.gameState, 
            playerUid, 
            move
        });

        if (error) {
            this.logger.error(`Game move error: ${error}`);
            return null;
        }

        if (!newGameState) return null;

        this.roomRepository.updateGameState({
            roomId: room.id,
            gameState: newGameState,
        });

        // Use the explicit winnerUid from the game engine if provided
        if (winnerUid) {
            this.roomRepository.incrementScore(room.id, winnerUid);
        }

        return { gameState: newGameState };
    }

    getPublicRoomState(roomId: string, playerUid: string): SerializedRoom | null {
        const room = this.roomRepository.getRoom(roomId);
        if (!room) return null;

        const serialized = this.roomRepository.serializeRoom(roomId);
        if (!serialized) return null;

        const handler = this.gameRegistry[room.gameType];
        if (handler && handler.projectPublicState) {
            serialized.gameState = handler.projectPublicState({ 
                gameState: room.gameState, 
                playerUid 
            });
        }
        
        return serialized;
    }
}
