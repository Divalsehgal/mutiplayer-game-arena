import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import cookieParser from "cookie-parser"
import helmet from "helmet";
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

// Config
import { PORT, CORS_ORIGIN, ROOM_IDLE_MS, GRACE_PERIOD_MS, isAllowedSocketOrigin } from "./src/config";

// Repositories
import { RoomRepository } from "./src/repositories/room";

// Socket handlers
import { initSocket } from "./src/socket/index";

// Game registry
import { gameRegistry } from "./src/games/registry";

// Logger
import { logger } from "./src/utils/logger";

// Routes
import authRouter from "./src/routes/auth";
import userRouter from "./src/routes/user";

const app = express();
app.disable("x-powered-by");
// Behind a load balancer, req.ip (used by the auth rate limiter) is only the client's IP if we trust its hops.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));
app.use(helmet());

// Strip $-operators from query filters so request data can never become a NoSQL operator.
mongoose.set("sanitizeFilter", true);

const normalizeRequestOrigin = (value: string | undefined) => value?.replace(/\/+$|\/+?(?=\?|#|$)/g, "") ?? undefined;

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const normalizedOrigin = normalizeRequestOrigin(origin);

        if (!origin || normalizedOrigin === CORS_ORIGIN) {
            callback(null, true);
            return;
        }

        callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser())

app.use("/auth", authRouter);
app.use("/user", userRouter);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
    },
    // Detect dead connections faster than the defaults (25s/20s)
    pingInterval: 10000, // 10s
    pingTimeout: 20000,  // 20s
    // CORS doesn't cover WebSocket upgrades, so check the origin ourselves (cross-site WebSocket hijacking).
    allowRequest: (req, callback) => callback(null, isAllowedSocketOrigin(req.headers.origin)),
});

// In-memory room repository
const roomStore = new RoomRepository();

// Attach all socket events + game routing
const { roomController } = initSocket({
    io,
    roomStore,
    gameRegistry,
    logger,
});

// Basic health endpoint
app.get("/", (_req, res) => {
    res.json({ ok: true, message: "Multiplayer server online" });
});

// Clean idle rooms and check TTLs every 10 seconds
setInterval(() => {
    roomStore.cleanupIdleRooms(ROOM_IDLE_MS);

    // TTL Warnings and Expired cleanup
    const { expired, warnings } = roomStore.checkRoomTTLs(60 * 1000); // 60s warning

    warnings.forEach(({ roomId, secondsLeft }) => {
        io.to(roomId).emit("ROOM_WARNING", { type: "EXPIRING_SOON", secondsLeft });
    });

    expired.forEach((roomId) => {
        io.to(roomId).emit("room-error", { code: "ROOM_EXPIRED", message: "Room session expired." });
        logger.info(`Room ${roomId} expired due to TTL.`);
    });
}, 10 * 1000);

setInterval(() => {
    // Same path as an explicit leave, so turns, ready lists and the bot timer stay consistent.
    roomStore.getExpiredDisconnectedPlayers(GRACE_PERIOD_MS).forEach(({ roomId, playerUid }) => {
        logger.info(`Grace period expired for ${playerUid} in room ${roomId}. Removing.`);
        roomController.removePlayer(roomId, playerUid);
    });
}, 5000); // Check every 5s

async function startServer() {
    try {
        if (process.env.MONGO_DB_URI) {
            const dbName = process.env.DB_NAME ?? "";
            await mongoose.connect(process.env.MONGO_DB_URI + dbName);
            logger.info("Connected to MongoDB Cluster");
        } else {
            logger.warn(
                "MONGO_DB_URI not set; starting server without a database connection. Set MONGO_DB_URI to enable DB."
            );
        }

        server.listen(PORT, () => {
            logger.info(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error("Database connection failed:", error);
        process.exit(1);
    }
}

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception, shutting down:", error);
    process.exit(1);
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down.");
    io.close();
    server.close(() => {
        mongoose.disconnect().finally(() => process.exit(0));
    });
    // Don't hang forever on lingering connections.
    setTimeout(() => process.exit(1), 10 * 1000).unref();
});

startServer();