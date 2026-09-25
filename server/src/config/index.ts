// src/config/index.js
const normalizeOrigin = (value: string) => value.replace(/\/+$|\/+(?=\?|#|$)/g, "");

export const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3030;
export const CORS_ORIGIN = normalizeOrigin(process.env.CORS_ORIGIN || "http://localhost:5173");
export const ROOM_IDLE_MS = 15 * 60 * 1000; // 15 minutes
export const GRACE_PERIOD_MS = 120 * 1000; // 2 minutes for state recovery
export const BOT_MOVE_DELAY_MS = 800; // pause before the computer plays, so its turn is visible
