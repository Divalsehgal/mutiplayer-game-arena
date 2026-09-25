import { Socket, Server } from "socket.io";
import { RoomRepository } from "../repositories/room";
import { GameRegistry } from "../models";
import { RoomService } from "../services/room";
import { GameService } from "../services/game";
import { RoomController } from "../controllers/room";
import { GameController } from "../controllers/game";
import { BotRunner } from "../services/bot";
import { registerRoomRoutes } from "../routes/room";
import { registerGameRoutes } from "../routes/game";
import { Logger } from "../models";
import { verifyAccessToken } from "../utils/authTokens";

const getCookieValue = (cookieHeader: string | undefined, name: string) => {
    if (!cookieHeader) return undefined;

    const cookie = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`));

    if (!cookie) return undefined;

    return decodeURIComponent(cookie.slice(name.length + 1));
};

export function initSocket({ io, roomStore, gameRegistry, logger }: {
    io: Server,
    roomStore: RoomRepository,
    gameRegistry: Record<string, GameRegistry>,
    logger: Logger
}) {
    const roomService = new RoomService(roomStore, gameRegistry, logger);
    const gameService = new GameService(roomStore, gameRegistry, logger);

    // The computer's moves are broadcast the same way as a human's.
    const botRunner = new BotRunner(roomStore, gameService, (roomId) => gameController.broadcastRoomUpdate(roomId));
    const roomController = new RoomController(io, roomService, gameService, roomStore, botRunner);
    const gameController = new GameController(io, gameService, roomStore, botRunner);

    // Authentication middleware
    io.use((socket, next) => {
        const { token, playerUid } = socket.handshake.auth;
        const cookieToken = getCookieValue(socket.handshake.headers?.cookie, "access_token");
        const accessToken = typeof token === "string" ? token : cookieToken;

        logger.info(`Socket Auth Attempt - UID: ${playerUid}, HasToken: ${!!accessToken}`);

        // If JWT token is provided, verify it
        if (accessToken) {
            try {
                const decoded = verifyAccessToken<{ _id: string; user_name: string, avatar?: string }>(accessToken);
                
                socket.data.avatar = decoded.avatar;

                socket.data.user = decoded;
                socket.data.playerUid = decoded._id;

                logger.info(`Socket Authenticated: ${decoded.user_name} (${decoded._id})`);
                return next();
            } catch (err) {
                const error = err as Error;
                logger.error(`Socket JWT Verification Failed: ${error.message}`);
                return next(new Error(`AUTHENTICATION_FAILED: ${error.message}`));
            }
        }

        // Fallback to anonymous playerUid 
        if (!playerUid) {
            logger.error(`Socket Auth Failed: No token and no playerUid`);
            return next(new Error("AUTHENTICATION_FAILED: Authentication required"));
        }

        // Player ids are visible to everyone in a room, so an unauthenticated id must never be
        // able to match a real account (or the computer player) and take over its seat.
        socket.data.playerUid = `guest:${playerUid}`;
        logger.info(`Socket Connected as Anonymous: ${socket.data.playerUid}`);
        next();
    });

    io.on("connection", (socket: Socket) => {
        logger.info(`Client connected: ${socket.id} (UID: ${socket.data.playerUid})`);

        // Register Routes
        registerRoomRoutes(io, socket, roomController);
        registerGameRoutes(io, socket, gameController);

        socket.on("register", (_data, callback) => callback?.({ ok: true }));

        socket.on("disconnect", () => {
            const result = roomStore.markSocketDisconnected(socket.id);
            if (result) {
                io.to(result.room.id).emit("room-update", roomStore.serializeRoom(result.room.id));
            }
        });
    });
}
