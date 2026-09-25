import { RoomStatus } from "../../../models/room/Room";
import { GameState } from "../../../models/game/Game";
import { RoomActionRepository } from "../actions";
import { createRoomError } from "../utils/error";
import { serializeRoom } from "../utils/mapper";

export class RoomMaintenanceRepository extends RoomActionRepository {
    markSocketDisconnected(socketId: string) {
        const record = this.getPlayerBySocket(socketId);
        if (!record) return null;

        const { room, player } = record;
        player.status = "offline";
        player.socketId = null;
        player.lastDisconnectedAt = this.now();

        this.socketToPlayer.delete(socketId);
        room.updatedAt = this.now();
        return { room, player };
    }

    incrementScore(roomId: string, playerUid: string) {
        const room = this.getRoom(roomId);
        if (!room) return;
        const player = this.getPlayerInRoom(room, playerUid);
        if (player) {
            player.score = (player.score || 0) + 1;
            room.updatedAt = this.now();
        }
    }

    updateGameState(data: { roomId: string, gameState: GameState, status?: RoomStatus }) {
        const room = this.getRoom(data.roomId);
        if (!room) throw createRoomError("ROOM_NOT_FOUND", "No room");

        room.gameState = data.gameState;
        if (data.status) room.status = data.status;
        room.updatedAt = this.now();
        room.lastActivityAt = this.now();
        room.expiresAt = this.now() + this.roomTtlMs;
        room.hasSentWarning = false;
        return room;
    }

    serializeRoom(roomId: string) {
        return serializeRoom(this.getRoom(roomId));
    }

    extendRoom(roomId: string) {
        const room = this.getRoom(roomId);
        if (!room) return null;
        room.expiresAt = this.now() + this.roomTtlMs;
        room.hasSentWarning = false;
        room.updatedAt = this.now();
        room.lastActivityAt = this.now();
        return room;
    }

    cleanupDisconnectedPlayers(gracePeriod: number) {
        const t = this.now();
        const removed: { roomId: string, playerUid: string }[] = [];

        for (const [roomId, room] of this.rooms.entries()) {
            const initialCount = room.players.length;
            room.players = room.players.filter((p) => {
                if (p.status === "offline" && p.lastDisconnectedAt && (t - p.lastDisconnectedAt > gracePeriod)) {
                    this.playerToRoom.delete(p.playerUid);
                    removed.push({ roomId: room.id, playerUid: p.playerUid });
                    return false;
                }
                return true;
            });

            if (room.players.length !== initialCount) {
                room.updatedAt = t;
                if (!this.hasHumanPlayers(room)) {
                    this.rooms.delete(roomId);
                } else {
                    this.promoteSpectators(room);
                }
            }
        }
        return removed;
    }

    cleanupIdleRooms(maxIdle: number) {
        const t = this.now();
        for (const [roomId, room] of this.rooms.entries()) {
            if (t - room.lastActivityAt > maxIdle) {
                this.rooms.delete(roomId);
                room.players.forEach((p) => {
                    this.playerToRoom.delete(p.playerUid);
                    if (p.socketId) this.socketToPlayer.delete(p.socketId);
                });
            }
        }
    }

    checkRoomTTLs(warningMs: number = 60 * 1000) {
        const t = this.now();
        const expired: string[] = [];
        const warnings: { roomId: string, secondsLeft: number }[] = [];

        for (const [roomId, room] of this.rooms.entries()) {
            if (room.expiresAt && t > room.expiresAt) {
                this.rooms.delete(roomId);
                room.players.forEach((p) => {
                    this.playerToRoom.delete(p.playerUid);
                    if (p.socketId) this.socketToPlayer.delete(p.socketId);
                });
                expired.push(room.id);
            } else if (room.expiresAt && !room.hasSentWarning && (room.expiresAt - t) <= warningMs) {
                warnings.push({ roomId: room.id, secondsLeft: Math.ceil((room.expiresAt - t) / 1000) });
                room.hasSentWarning = true;
            }
        }
        return { expired, warnings };
    }
}
