import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events";

const rawServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3030";
const SERVER_URL = rawServerUrl.replace(/\/+$/, '');

/**
 * Persistent Player UUID Helper
 */
export const getPlayerUid = (): string => {
    let clientUid = typeof window !== "undefined" ? sessionStorage.getItem("player_uid") : null;
    if (!clientUid && typeof window !== "undefined") {
        // Maintain prefixing for consistency with old store
        const randomPart = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
        clientUid = `p_${Date.now()}_${randomPart}`;
        sessionStorage.setItem("player_uid", clientUid);
    }
    return clientUid || uuidv4();
};

/**
 * Unified Typed Socket Instance
 * Handles all real-time communication with strict event typing.
 */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
    autoConnect: false,
    transports: ["websocket"],
    auth: {
        playerUid: getPlayerUid(),
    },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
});

export const connectSocket = (token?: string, playerUid?: string) => {
    let changed = false;

    const auth = socket.auth as { token?: string; playerUid?: string };

    if (token && auth.token !== token) {
        auth.token = token;
        changed = true;
    } else if (!token && auth.token) {
        delete auth.token;
        changed = true;
    }

    if (playerUid && auth.playerUid !== playerUid) {
        auth.playerUid = playerUid;
        changed = true;
    }

    if (changed && socket.connected) {
        // Force a fresh handshake with the new credentials
        socket.disconnect().connect();
    } else if (!socket.connected) {
        socket.connect();
    }
};

export default socket;
