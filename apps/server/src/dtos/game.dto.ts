export interface GameReadyRequest {
    roomId: string;
}

export interface GameMoveRequest {
    roomId: string;
    move: unknown;
}
