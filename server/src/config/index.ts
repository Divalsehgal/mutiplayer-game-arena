const normalizeOrigin = (value: string) => value.replace(/\/+$|\/+(?=\?|#|$)/g, "");

export const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3030;
export const CORS_ORIGIN = normalizeOrigin(process.env.CORS_ORIGIN || "http://localhost:5173");
export const ROOM_IDLE_MS = 15 * 60 * 1000; // 15 minutes
export const GRACE_PERIOD_MS = 120 * 1000; // 2 minutes for state recovery
// Browsers always send Origin on a WebSocket handshake; a missing one is a non-browser client.
export const isAllowedSocketOrigin = (origin: string | undefined, allowMissing = process.env.NODE_ENV !== "production") =>
    origin ? normalizeOrigin(origin) === CORS_ORIGIN : allowMissing;
export const BOT_MOVE_DELAY_MS = 800; // pause before the computer plays, so its turn is visible
