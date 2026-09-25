import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import cookieParser from "cookie-parser"
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

// Config
import { PORT, CORS_ORIGIN, ROOM_IDLE_MS, GRACE_PERIOD_MS } from "./src/config";

// ... (rest of the imports)
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
    // Industry standard: Detect dead connections faster (default: 20s/45s)
    pingInterval: 10000, // 10s
    pingTimeout: 20000,  // 20s
});

// In-memory room repository
const roomStore = new RoomRepository();

// Attach all socket events + game routing
initSocket({
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
    const removals = roomStore.cleanupDisconnectedPlayers(GRACE_PERIOD_MS);
    removals.forEach(({ roomId, playerUid }: { roomId: string, playerUid: string }) => {
        logger.info(`Grace period expired for ${playerUid} in room ${roomId}. Removing.`);
        const room = roomStore.getRoom(roomId);
        if (room) {
            io.to(roomId).emit("room-update", roomStore.serializeRoom(roomId));
        }
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

startServer();