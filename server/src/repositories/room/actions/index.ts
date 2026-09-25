import { Room } from "../../../models/room/Room";
import { Player, PlayerRole } from "../../../models/player/Player";
import { GameState } from "../../../models/game/Game";
import { RoomBaseRepository } from "../base";
import { createRoomError } from "../utils/error";

export class RoomActionRepository extends RoomBaseRepository {
    createRoom(data: {
        hostPlayerUid: string;
        socketId: string | null;
        name: string;
        gameType: string;
        maxPlayers?: number;
        allowSpectators?: boolean;
        isPublic?: boolean;
        hostName: string;
        avatar?: string;
        initialGameState: GameState;
    }): Room {
        if (!data.hostPlayerUid) {
            throw createRoomError("MISSING_PLAYER_UID", "hostPlayerUid required");
        }

        const roomId = this.generateRoomId();
        const ts = this.now();

        const room: Room = {
            id: roomId,
            gameType: data.gameType,
            status: "waiting-for-players",
            maxPlayers: data.maxPlayers ?? 2,
            allowSpectators: data.allowSpectators ?? true,
            isPublic: data.isPublic ?? false,
            hostName: data.hostName,
            players: [
                {
                    playerUid: data.hostPlayerUid,
                    socketId: data.socketId,
                    name: data.name,
                    role: "player",
                    status: "online",
                    avatar: data.avatar,
                    score: 0,
                },
            ],
            gameState: data.initialGameState,
            createdAt: ts,
            updatedAt: ts,
            lastActivityAt: ts,
            expiresAt: ts + this.roomTtlMs,
            hasSentWarning: false,
        };

        this.rooms.set(roomId, room);
        this.playerToRoom.set(data.hostPlayerUid, roomId);
        if (data.socketId) this.socketToPlayer.set(data.socketId, data.hostPlayerUid);

        return room;
    }

    addBotPlayer(roomId: string, name: string): Player {
        const room = this.getRoom(roomId);
        if (!room) throw createRoomError("ROOM_NOT_FOUND", "Room does not exist");

        const bot: Player = {
            playerUid: `bot-${room.id}`,
            socketId: null,
            name,
            role: "player",
            status: "online",
            score: 0,
            isBot: true,
        };
        room.players.push(bot);
        room.updatedAt = this.now();
        return bot;
    }

    joinRoom(data: { roomId: string, playerUid: string, socketId: string | null, name: string, avatar?: string }) {
        const room = this.getRoom(data.roomId);
        if (!room) throw createRoomError("ROOM_NOT_FOUND", "Room does not exist");

        const tsNow = this.now();
        room.updatedAt = tsNow;
        room.lastActivityAt = tsNow;
        room.expiresAt = tsNow + this.roomTtlMs;
        room.hasSentWarning = false;

        const existing = this.getPlayerInRoom(room, data.playerUid);
        if (existing) {
            let supersededSocketId: string | null = null;
            if (existing.socketId && existing.socketId !== data.socketId) {
                supersededSocketId = existing.socketId;
                this.socketToPlayer.delete(existing.socketId);
            }
            existing.socketId = data.socketId;
            existing.status = "online";
            if (data.socketId) this.socketToPlayer.set(data.socketId, data.playerUid);
            return { room, role: existing.role, supersededSocketId };
        }

        const activePlayers = this.countActivePlayers(room);
        const role: PlayerRole = activePlayers < room.maxPlayers ? "player" : "spectator";

        const newPlayer: Player = {
            playerUid: data.playerUid,
            socketId: data.socketId,
            name: data.name,
            role,
            status: "online",
            avatar: data.avatar,
            score: 0,
        };

        room.players.push(newPlayer);
        this.playerToRoom.set(data.playerUid, room.id);
        if (data.socketId) this.socketToPlayer.set(data.socketId, data.playerUid);

        return { room, role };
    }

    leaveRoom(data: { roomId: string, playerUid: string }) {
        const room = this.getRoom(data.roomId);
        if (!room) return { roomId: data.roomId, roomDeleted: false };

        const player = this.getPlayerInRoom(room, data.playerUid);
        if (!player) return { roomId: data.roomId, roomDeleted: false };

        this.playerToRoom.delete(data.playerUid);
        if (player.socketId) this.socketToPlayer.delete(player.socketId);

        room.players = room.players.filter((p) => p.playerUid !== data.playerUid);
        room.updatedAt = this.now();

        if (!this.hasHumanPlayers(room)) {
            this.rooms.delete(room.id);
            return { roomId: room.id, roomDeleted: true };
        }

        this.promoteSpectators(room);
        return { roomId: room.id, roomDeleted: false };
    }

    protected promoteSpectators(room: Room) {
        let promoted = false;
        while (this.countActivePlayers(room) < room.maxPlayers) {
            const nextSpectator = room.players.find(p => p.role === "spectator");
            if (!nextSpectator) break;
            
            nextSpectator.role = "player";
            nextSpectator.score = 0;
            promoted = true;
        }

        if (this.countActivePlayers(room) < room.maxPlayers || promoted) {
            room.status = "waiting-for-players";
        }
    }
}
