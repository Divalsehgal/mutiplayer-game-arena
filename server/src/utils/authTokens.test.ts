import { getTokenSecret } from "./authTokens";

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

    it("falls back to a development secret outside production", () => {
        delete process.env.JWT_SECRET;
        process.env.NODE_ENV = "test";
        expect(getTokenSecret("access")).toBe("access_secret_key");
    });

    it("refuses to run in production without a secret", () => {
        delete process.env.REFRESH_TOKEN_SECRET;
        process.env.NODE_ENV = "production";
        expect(() => getTokenSecret("refresh")).toThrow("REFRESH_TOKEN_SECRET must be set in production");
    });
});
