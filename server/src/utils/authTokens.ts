import jwt from "jsonwebtoken";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type TokenKind = "access" | "refresh";

// Only the test suite may run without real secrets.
const TEST_SECRETS: Record<TokenKind, string> = {
    access: "access_secret_key",
    refresh: "refresh_secret_key",
};

const ENV_KEYS: Record<TokenKind, string> = {
    access: "JWT_SECRET",
    refresh: "REFRESH_TOKEN_SECRET",
};

export const getTokenSecret = (kind: TokenKind) => {
    const envKey = ENV_KEYS[kind];
    const secret = process.env[envKey];

    if (secret) return secret;

    if (process.env.NODE_ENV !== "test") {
        throw new Error(`${envKey} must be set`);
    }

    return TEST_SECRETS[kind];
};

export const signAccessToken = (payload: object) =>
    jwt.sign(payload, getTokenSecret("access"), { expiresIn: "1h" });

export const signRefreshToken = (payload: object) =>
    jwt.sign(payload, getTokenSecret("refresh"), { expiresIn: "7d" });

export const verifyAccessToken = <T>(token: string) =>
    jwt.verify(token, getTokenSecret("access")) as T;

export const verifyRefreshToken = <T>(token: string) =>
    jwt.verify(token, getTokenSecret("refresh")) as T;

// Sessions store only a digest, so a leaked sessions collection can't be replayed.
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Guest tokens are "<id>.<hmac>", deliberately not JWTs so they can never pass as an access token.
const signGuestId = (id: string) =>
    `${id}.${createHmac("sha256", getTokenSecret("access")).update(`guest-token:${id}`).digest("base64url")}`;

export const issueGuestToken = () => {
    const playerUid = `guest:${randomUUID()}`;
    return { playerUid, token: signGuestId(playerUid) };
};

export const verifyGuestToken = (token: unknown): string | null => {
    if (typeof token !== "string") return null;
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return null;
    const id = token.slice(0, dot);
    const expected = Buffer.from(signGuestId(id));
    const actual = Buffer.from(token);
    return actual.length === expected.length && timingSafeEqual(actual, expected) ? id : null;
};
