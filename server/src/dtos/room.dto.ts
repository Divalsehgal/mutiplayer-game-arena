import { SerializedRoom } from "../models/room/Room";

export interface CreateRoomRequest {
    hostName: string;
    gameType: string;
    isPublic?: boolean;
    vsComputer?: boolean;
}

export interface JoinRoomRequest {
    roomId: string;
    name: string;
}

export interface LeaveRoomRequest {
    roomId: string;
}

export interface ExtendRoomRequest {
    roomId: string;
}

export interface RoomResponse {
    ok: boolean;
    roomId?: string;
    room?: SerializedRoom | null;
    error?: string;
}

export interface PublicRoomsResponse {
    ok: boolean;
    rooms?: SerializedRoom[];
    error?: string;
}
