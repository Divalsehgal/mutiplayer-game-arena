import { Socket, Server } from "socket.io";
import { GameService } from "../../services/game";
import { RoomRepository } from "../../repositories/room";
import { GameReadyRequest, GameMoveRequest } from "../../dtos/game.dto";
import { BotRunner } from "../../services/bot";

export class GameController {
    constructor(
        private io: Server,
        private gameService: GameService,
        private roomRepository: RoomRepository,
        private botRunner?: BotRunner
    ) {}

    broadcastRoomUpdate(roomId: string) {
        const room = this.roomRepository.getRoom(roomId);
        if (!room) return;

        room.players.forEach(p => {
            if (p.socketId) {
                const personalizedState = this.gameService.getPublicRoomState(roomId, p.playerUid);
                this.io.to(p.socketId).emit("room-update", personalizedState);
            }
        });
    }

    handleReady(socket: Socket, data: GameReadyRequest) {
        const playerUid = socket.data.playerUid;
        const result = this.gameService.handleReady(data.roomId, playerUid);
        if (result) {
            this.broadcastRoomUpdate(data.roomId);
            this.botRunner?.schedule(data.roomId);
        }
    }

    handleMove(socket: Socket, data: GameMoveRequest) {
        const playerUid = socket.data.playerUid;
        const result = this.gameService.handleMove(data.roomId, playerUid, data.move);
        if (result) {
            this.broadcastRoomUpdate(data.roomId);
            this.botRunner?.schedule(data.roomId);
        }
    }
}
