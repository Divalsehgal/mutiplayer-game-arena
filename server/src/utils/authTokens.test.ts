import { getTokenSecret, hashToken, issueGuestToken, verifyGuestToken } from "./authTokens";

describe("getTokenSecret", () => {
    const savedEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...savedEnv };
    });

    it("uses the secret from the environment when set", () => {
        process.env.JWT_SECRET = "from-env";
        process.env.REFRESH_TOKEN_SECRET = "refresh-from-env";
        expect(getTokenSecret("access")).toBe("from-env");
        expect(getTokenSecret("refresh")).toBe("refresh-from-env");
    });

    it("falls back to a test-only secret under NODE_ENV=test", () => {
        delete process.env.JWT_SECRET;
        process.env.NODE_ENV = "test";
        expect(getTokenSecret("access")).toBe("access_secret_key");
    });

    it.each(["production", "development", undefined])("refuses to run without a secret when NODE_ENV=%s", (env) => {
        delete process.env.REFRESH_TOKEN_SECRET;
        if (env) process.env.NODE_ENV = env; else delete process.env.NODE_ENV;
        expect(() => getTokenSecret("refresh")).toThrow("REFRESH_TOKEN_SECRET must be set");
    });
});

describe("guest tokens", () => {
    it("round-trips a server-issued guest id", () => {
        const { playerUid, token } = issueGuestToken();
        expect(playerUid).toMatch(/^guest:[0-9a-f-]{36}$/);
        expect(verifyGuestToken(token)).toBe(playerUid);
    });

    it("rejects forged, tampered or non-string tokens", () => {
        const { token } = issueGuestToken();
        expect(verifyGuestToken(token.replace(/^guest:./, "guest:x"))).toBeNull();
        expect(verifyGuestToken("guest:victim.forged")).toBeNull();
        expect(verifyGuestToken("nodot")).toBeNull();
        expect(verifyGuestToken({ $ne: null })).toBeNull();
    });
});

describe("hashToken", () => {
    it("is a stable sha256 hex digest", () => {
        expect(hashToken("abc")).toBe(hashToken("abc"));
        expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
    });
});
