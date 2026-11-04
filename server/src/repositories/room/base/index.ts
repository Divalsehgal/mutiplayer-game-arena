import { randomInt } from "node:crypto";
import { Room, SerializedRoom } from "../../../models/room/Room";
import { Player } from "../../../models/player/Player";
import { serializeRoom } from "../utils/mapper";

export class RoomBaseRepository {
    protected rooms = new Map<string, Room>();
    protected playerToRoom = new Map<string, string>();
    protected socketToPlayer = new Map<string, string>();

    constructor(
        protected now = () => Date.now(),
        protected roomTtlMs = 5 * 60 * 1000 
    ) {}

    // Room codes are typed by hand, so skip look-alikes (0/O, 1/I/L). 31^6 ~ 887M codes.
    private static ROOM_ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    protected generateRoomId() {
        const alphabet = RoomBaseRepository.ROOM_ID_ALPHABET;
        let id: string;
        do {
            id = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
        } while (this.rooms.has(id));
        return id;
    }

    getRoom(roomId: string): Room | null {
        if (!roomId) return null;
        return this.rooms.get(roomId.toUpperCase()) || null;
    }

    getRoomForPlayer(playerUid: string): Room | null {
        const roomId = this.playerToRoom.get(playerUid);
        return roomId ? this.getRoom(roomId) : null;
    }

    getPlayerInRoom(room: Room, playerUid: string): Player | null {
        return room.players.find((p) => p.playerUid === playerUid) || null;
    }

    getPlayerBySocket(socketId: string): { room: Room, player: Player } | null {
        const playerUid = this.socketToPlayer.get(socketId);
        if (!playerUid) return null;
        const room = this.getRoomForPlayer(playerUid);
        if (!room) return null;
        const player = this.getPlayerInRoom(room, playerUid);
        return player ? { room, player } : null;
    }

    // A room with only the computer left in it is effectively empty.
    hasHumanPlayers(room: Room) {
        return room.players.some((p) => !p.isBot);
    }

    countActivePlayers(room: Room) {
        return room.players.filter((p) => p.role === "player").length;
    }

    getPublicRooms(): SerializedRoom[] {
        return Array.from(this.rooms.values())
            .filter(r => r.isPublic)
            .map(r => serializeRoom(r) as SerializedRoom);
    }
}
