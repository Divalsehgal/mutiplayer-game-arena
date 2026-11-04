export * from "./player/Player";
export * from "./room/Room";
export * from "./game/Game";

export interface Logger {
    info: (...msg: unknown[]) => void;
    warn: (...msg: unknown[]) => void;
    error: (...msg: unknown[]) => void;
}
