export interface RoomError {
    code: string;
    message: string;
    meta: Record<string, unknown>;
    isRoomError: true;
}

export const createRoomError = (code: string, message: string, meta: Record<string, unknown> = {}): RoomError => ({
    code,
    message,
    meta,
    isRoomError: true,
});

export const isRoomError = (err: unknown): err is RoomError => 
    typeof err === 'object' && err !== null && 'isRoomError' in err && (err as Record<string, unknown>).isRoomError === true;
