import { Player } from "../player/Player";
import { GameState } from "../game/Game";

export type RoomStatus = "waiting-for-players" | "playing" | "finished";

export interface Room {
    id: string;
    gameType: string;
    status: RoomStatus;
    maxPlayers: number;
    allowSpectators: boolean;
    isPublic: boolean;
    hostName: string;
    players: Player[];
    gameState: GameState;
    createdAt: number;
    updatedAt: number;
    lastActivityAt: number;
    expiresAt: number;
    hasSentWarning: boolean;
}

export interface SerializedRoom {
    id: string;
    gameType: string;
    status: string;
    maxPlayers: number;
    allowSpectators: boolean;
    isPublic: boolean;
    hostName: string;
    players: Omit<Player, "socketId">[];
    updatedAt: number;
    expiresAt?: number;
    hasSentWarning?: boolean;
    gameState: GameState;
}

