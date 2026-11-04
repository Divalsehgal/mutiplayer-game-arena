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
import { safeHandler, schemas } from "./safeHandler";
import { issueGuestToken, verifyAccessToken, verifyGuestToken } from "../utils/authTokens";

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
        const { token, guestToken } = socket.handshake.auth ?? {};
        const cookieToken = getCookieValue(socket.handshake.headers?.cookie, "access_token");
        const accessToken = typeof token === "string" ? token : cookieToken;

        logger.info(`Socket Auth Attempt - HasToken: ${!!accessToken}, HasGuestToken: ${!!guestToken}`);

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
                return next(new Error("AUTHENTICATION_FAILED"));
            }
        }

        // Player ids are broadcast to everyone in a room, so a guest's id must come from the
        // server: reuse it only with our signature, otherwise mint a fresh one the client keeps.
        const guestUid = verifyGuestToken(guestToken);
        if (guestUid) {
            socket.data.playerUid = guestUid;
        } else {
            const issued = issueGuestToken();
            socket.data.playerUid = issued.playerUid;
            socket.data.guestToken = issued.token;
        }
        logger.info(`Socket Connected as Guest: ${socket.data.playerUid}`);
        next();
    });

    io.on("connection", (socket: Socket) => {
        logger.info(`Client connected: ${socket.id} (UID: ${socket.data.playerUid})`);

        // Register Routes
        registerRoomRoutes(socket, roomController);
        registerGameRoutes(socket, gameController);

        // A newly minted guest identity: the client stores the token and sends it back as auth.guestToken.
        const guestIdentity = socket.data.guestToken
            ? { playerUid: socket.data.playerUid, guestToken: socket.data.guestToken }
            : { playerUid: socket.data.playerUid };
        if (socket.data.guestToken) socket.emit("guest-token", guestIdentity);

        socket.on("register", safeHandler("register", schemas.none, (_data, ack) => ack({ ok: true, ...guestIdentity })));

        socket.on("disconnect", () => {
            const result = roomStore.markSocketDisconnected(socket.id);
            if (result) gameController.broadcastRoomUpdate(result.room.id);
        });
    });

    return { roomController, gameController };
}
