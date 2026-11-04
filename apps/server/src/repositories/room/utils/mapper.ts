import { Room, SerializedRoom } from "../../../models/room/Room";

export const serializeRoom = (room: Room | null): SerializedRoom | null => {
    if (!room) return null;

    return {
        id: room.id,
        gameType: room.gameType,
        status: room.status,
        maxPlayers: room.maxPlayers,
        allowSpectators: room.allowSpectators,
        isPublic: room.isPublic,
        hostName: room.hostName,
        players: room.players.map(({ socketId: _, ...p }) => p),
        updatedAt: room.updatedAt,
        expiresAt: room.expiresAt,
        hasSentWarning: room.hasSentWarning,
        gameState: room.gameState,
    };
};
