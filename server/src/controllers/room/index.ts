import { Socket, Server } from "socket.io";
import { RoomService } from "../../services/room";
import { RoomRepository } from "../../repositories/room";
import { CreateRoomRequest, JoinRoomRequest, LeaveRoomRequest, ExtendRoomRequest, RoomResponse, PublicRoomsResponse } from "../../dtos/room.dto";
import { SerializedRoom } from "../../models";

import { GameService } from "../../services/game";
import { BotRunner } from "../../services/bot";
import { isRoomError } from "../../repositories/room/utils/error";
import { logger } from "../../utils/logger";
import { GENERIC_ERROR } from "../../socket/safeHandler";

const MAX_NAME_LENGTH = 24;

// Names are shown to other players, so don't trust the client to have limited them.
const cleanName = (name: unknown) =>
    (typeof name === "string" ? name.trim().slice(0, MAX_NAME_LENGTH) : "") || "Player";

// Room errors ("Room does not exist") are meant for players; anything else stays in the log.
const clientError = (err: unknown) => {
    if (isRoomError(err)) return err.message;
    logger.error("Room request failed:", err);
    return GENERIC_ERROR;
};

export class RoomController {
    constructor(
        private io: Server,
        private roomService: RoomService,
        private gameService: GameService,
        private roomRepository: RoomRepository,
        private botRunner?: BotRunner
    ) { }

    private broadcastRoomUpdate(roomId: string) {
        const room = this.roomRepository.getRoom(roomId);
        if (!room) return;

        room.players.forEach(p => {
            if (p.socketId) {
                const personalizedState = this.gameService.getPublicRoomState(roomId, p.playerUid);
                this.io.to(p.socketId).emit("room-update", personalizedState);
            }
        });
    }

    /** Takes a player out of a room (leave, grace-period expiry, switching rooms) and tells everyone left. */
    removePlayer(roomId: string, playerUid: string) {
        const { roomDeleted } = this.roomService.leaveRoom({ roomId, playerUid });
        if (roomDeleted) {
            this.botRunner?.cancel(roomId);
        } else {
            this.broadcastRoomUpdate(roomId);
        }
    }

    // A player sits in one room at a time: leave the old one before taking a new seat.
    private leavePreviousRoom(socket: Socket, nextRoomId?: string) {
        const previous = this.roomRepository.getRoomForPlayer(socket.data.playerUid);
        if (!previous || previous.id === this.roomRepository.getRoom(nextRoomId ?? "")?.id) return;
        socket.leave(previous.id);
        this.removePlayer(previous.id, socket.data.playerUid);
    }

    createRoom(socket: Socket, data: CreateRoomRequest, callback: (res: RoomResponse) => void) {
        const playerUid = socket.data.playerUid;
        try {
            this.leavePreviousRoom(socket);
            const room = this.roomService.createRoom({
                playerUid,
                socketId: socket.id,
                name: cleanName(data.hostName),
                gameType: data.gameType,
                isPublic: data.isPublic,
                avatar: socket.data.avatar,
                vsComputer: data.vsComputer
            });
            socket.join(room.id);
            // Nobody else is coming, so start straight away and let the computer take its turn.
            if (data.vsComputer) {
                this.gameService.handleReady(room.id, playerUid);
                this.botRunner?.schedule(room.id);
            }
            callback({ ok: true, roomId: room.id, room: this.roomRepository.serializeRoom(room.id) });
        } catch (err) {
            callback({ ok: false, error: clientError(err) });
        }
    }

    joinRoom(socket: Socket, data: JoinRoomRequest, callback: (res: RoomResponse) => void) {
        const playerUid = socket.data.playerUid;
        try {
            if (this.roomRepository.getRoom(data.roomId)) this.leavePreviousRoom(socket, data.roomId);
            const { room, supersededSocketId } = this.roomService.joinRoom({
                roomId: data.roomId,
                playerUid,
                socketId: socket.id,
                name: cleanName(data.name),
                avatar: socket.data.avatar
            });
            socket.join(room.id);

            // The same player just connected from another tab/device - let the
            // superseded socket know it's no longer the live session for this room.
            if (supersededSocketId) {
                this.io.to(supersededSocketId).emit("session-taken-over", { roomId: room.id });
            }

            const serialized = this.gameService.getPublicRoomState(room.id, playerUid);
            callback({ ok: true, room: serialized });
            this.broadcastRoomUpdate(room.id);
        } catch (err) {
            callback({ ok: false, error: clientError(err) });
        }
    }

    leaveRoom(socket: Socket, data: LeaveRoomRequest) {
        socket.leave(data.roomId);
        this.removePlayer(data.roomId, socket.data.playerUid);
    }

    extendRoom(socket: Socket, data: ExtendRoomRequest, callback?: (res: { ok: boolean }) => void) {
        // Only someone in the room may keep it alive.
        const current = this.roomRepository.getRoom(data.roomId);
        if (!current?.players.some((p) => p.playerUid === socket.data.playerUid)) return;

        const room = this.roomService.extendRoom(data.roomId);
        if (room) {
            this.broadcastRoomUpdate(room.id);
            callback?.({ ok: true });
        }
    }

    getPublicRooms(socket: Socket, callback: (res: PublicRoomsResponse) => void) {
        try {
            // Projected as a non-player, so hidden choices (RPS) never reach the lobby list.
            const publicRooms = this.roomRepository.getPublicRooms()
                .map((r) => this.gameService.getPublicRoomState(r.id, ""))
                .filter((r): r is SerializedRoom => r !== null);
            callback({ ok: true, rooms: publicRooms });
        } catch (err) {
            callback({ ok: false, error: clientError(err) });
        }
    }
}
