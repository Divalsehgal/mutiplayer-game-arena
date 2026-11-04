import type { RoomState, RoundResult, JoinRoomResponse } from "../types";

// Events sent from SERVER -> CLIENT
export interface ServerToClientEvents {
  "room-update": (updated: RoomState | null) => void;
  "round-result": (result: RoundResult) => void;
  "room-closed": (data: { roomId: string }) => void;
  "player-state-update": (data: { roomId: string; playerUid: string; status: string }) => void;
  "ROOM_WARNING": (data: { secondsLeft: number }) => void;
  "room-error": (data: { code: string; message: string }) => void;
  "session-taken-over": (data: { roomId: string }) => void;
}

// Events sent from CLIENT -> SERVER
export interface ClientToServerEvents {
  register: (data: { playerUid: string; name: string }, cb?: (res: { ok: boolean; error?: string }) => void) => void;
  "create-room": (data: {
    hostName: string;
    gameType: string;
    isPublic: boolean;
    vsComputer?: boolean;
    maxPlayers?: number;
    allowSpectators?: boolean;
  }, cb?: (res: JoinRoomResponse & { roomId?: string }) => void) => void;
  "join-room": (data: { roomId: string; name: string }, cb?: (res: JoinRoomResponse) => void) => void;
  "request-player-slot": (data: { roomId: string }, cb?: (res: { ok: boolean; error?: string }) => void) => void;
  "game-move": (data: { roomId: string; move: string }) => void;
  "game-ready": (data: { roomId: string }) => void;
  "leave-room": (data: { roomId: string }, cb?: (res: { ok: boolean; roomDeleted?: boolean }) => void) => void;
  "extend-room": (data: { roomId: string }, cb?: (res: { ok: boolean }) => void) => void;
  "get-public-rooms": (cb: (res: { ok: boolean; rooms: RoomState[]; error?: string }) => void) => void;
}

export default {} as const;
