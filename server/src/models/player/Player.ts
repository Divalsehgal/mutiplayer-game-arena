export type PlayerRole = "player" | "spectator";
export type PlayerStatus = "online" | "offline";

export interface Player {
    playerUid: string;
    socketId: string | null;
    name: string;
    role: PlayerRole;
    status: PlayerStatus;
    avatar?: string;
    score?: number;
    lastDisconnectedAt?: number | null;
    isBot?: boolean;
}
