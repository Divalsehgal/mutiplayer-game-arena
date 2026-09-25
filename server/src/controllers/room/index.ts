import { Socket, Server } from "socket.io";
import { RoomService } from "../../services/room";
import { RoomRepository } from "../../repositories/room";
import { CreateRoomRequest, JoinRoomRequest, LeaveRoomRequest, ExtendRoomRequest, RoomResponse, PublicRoomsResponse } from "../../dtos/room.dto";

import { GameService } from "../../services/game";
import { BotRunner } from "../../services/bot";

const MAX_NAME_LENGTH = 24;

// Names are shown to other players, so don't trust the client to have limited them.
const cleanName = (name: unknown) =>
    (typeof name === "string" ? name.trim().slice(0, MAX_NAME_LENGTH) : "") || "Player";

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

    createRoom(socket: Socket, data: CreateRoomRequest, callback: (res: RoomResponse) => void) {
        const playerUid = socket.data.playerUid;
        try {
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
            const error = err as Error;
            callback({ ok: false, error: error.message });
        }
    }

    joinRoom(socket: Socket, data: JoinRoomRequest, callback: (res: RoomResponse) => void) {
        const playerUid = socket.data.playerUid;
        try {
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
            const error = err as Error;
            callback({ ok: false, error: error.message });
        }
    }

    leaveRoom(socket: Socket, data: LeaveRoomRequest) {
        const playerUid = socket.data.playerUid;
        const { roomDeleted } = this.roomService.leaveRoom({
            roomId: data.roomId,
            playerUid
        });
        socket.leave(data.roomId);
        if (roomDeleted) {
            this.botRunner?.cancel(data.roomId);
        } else {
            this.broadcastRoomUpdate(data.roomId);
        }
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
            const publicRooms = this.roomRepository.getPublicRooms();
            callback({ ok: true, rooms: publicRooms });
        } catch (err) {
            const error = err as Error;
            callback({ ok: false, error: error.message });
        }
    }
}

