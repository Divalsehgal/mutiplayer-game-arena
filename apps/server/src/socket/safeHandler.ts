import { z } from "zod";
import { gameRegistry } from "../games/registry";
import { logger } from "../utils/logger";

export type Ack = (res: { ok: boolean; error?: string }) => void;

export const GENERIC_ERROR = "Something went wrong";

const noop: Ack = () => {};

const MAX_ROOM_ID_LENGTH = 16;
const roomId = z.string().min(1).max(MAX_ROOM_ID_LENGTH);
const name = z.string().trim().min(1).max(24);

export const schemas = {
    none: z.unknown(),
    roomOnly: z.object({ roomId }),
    createRoom: z.object({
        hostName: name,
        gameType: z.enum(Object.keys(gameRegistry) as [string, ...string[]]),
        isPublic: z.boolean().optional(),
        vsComputer: z.boolean().optional(),
    }),
    joinRoom: z.object({ roomId, name }),
    // Tic-tac-toe sends a cell index (as a string), snakes & ladders "roll", RPS a hand.
    move: z.object({
        roomId,
        move: z.union([z.number().int(), z.string().regex(/^\d{1,2}$/), z.enum(["Rock", "Paper", "Scissors", "roll"])]),
    }),
};

/** Per-socket token bucket: `capacity` actions, refilled evenly over `perMs`. */
export const tokenBucket = (capacity: number, perMs: number, now = Date.now) => {
    let tokens = capacity;
    let last = now();
    return () => {
        const t = now();
        tokens = Math.min(capacity, tokens + ((t - last) * capacity) / perMs);
        last = t;
        if (tokens < 1) return false;
        tokens -= 1;
        return true;
    };
};

/**
 * Wraps a socket event handler so a malformed payload, a missing ack or a thrown
 * error can never crash the process. The ack may be the only argument (get-public-rooms).
 */
export const safeHandler = <S extends z.ZodTypeAny>(
    event: string,
    schema: S,
    handler: (data: z.infer<S>, ack: Ack) => void,
    allow: () => boolean = () => true
) => (...args: unknown[]) => {
    const last = args[args.length - 1];
    const ack = typeof last === "function" ? (last as Ack) : noop;
    const payload = typeof args[0] === "function" ? undefined : args[0];
    try {
        if (!allow()) return ack({ ok: false, error: "Too many requests, slow down" });
        const parsed = schema.safeParse(payload);
        if (!parsed.success) return ack({ ok: false, error: "Invalid request" });
        handler(parsed.data, ack);
    } catch (err) {
        logger.error(`Socket handler "${event}" failed:`, err);
        ack({ ok: false, error: GENERIC_ERROR });
    }
};
