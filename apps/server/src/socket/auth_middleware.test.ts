import { initSocket } from "./index";
import jwt from "jsonwebtoken";
import { issueGuestToken } from "../utils/authTokens";

jest.mock("jsonwebtoken");

describe("Socket Auth Middleware", () => {
    let mockIo: any;
    let mockLogger: any;
    let middleware: (socket: any, next: (err?: Error) => void) => void;

    beforeEach(() => {
        mockIo = { 
            use: jest.fn((fn) => middleware = fn),
            on: jest.fn()
        };
        mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
        
        initSocket({ 
            io: mockIo, 
            roomStore: {} as any, 
            gameRegistry: {}, 
            logger: mockLogger 
        });
    });

    it("should authenticate with valid token", () => {
        const socket: any = { handshake: { auth: { token: "valid" } }, data: {} };
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ _id: "u1", user_name: "test" });

        middleware(socket, next);
        
        expect(socket.data.playerUid).toBe("u1");
        expect(next).toHaveBeenCalledWith();
    });

    it("should fail with invalid token", () => {
        const socket: any = { handshake: { auth: { token: "invalid" } }, data: {} };
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("Invalid"); });

        middleware(socket, next);
        
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it("mints a server-issued guest id when there is no token", () => {
        const socket: any = { handshake: { auth: {} }, data: {} };
        const next = jest.fn();

        middleware(socket, next);

        expect(socket.data.playerUid).toMatch(/^guest:[0-9a-f-]{36}$/);
        expect(socket.data.guestToken).toEqual(expect.any(String));
        expect(next).toHaveBeenCalledWith();
    });

    it("reuses the guest id from a valid server-signed guest token", () => {
        const { playerUid, token } = issueGuestToken();
        const socket: any = { handshake: { auth: { guestToken: token } }, data: {} };

        middleware(socket, jest.fn());

        expect(socket.data.playerUid).toBe(playerUid);
        expect(socket.data.guestToken).toBeUndefined();
    });

    it("should authenticate with the access_token cookie when no token is passed", () => {
        const socket: any = {
            handshake: { auth: {}, headers: { cookie: "theme=dark; access_token=cookie%20token" } },
            data: {},
        };
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ _id: "u2", user_name: "cookie-user" });

        middleware(socket, next);

        expect(jwt.verify).toHaveBeenCalledWith("cookie token", expect.anything());
        expect(socket.data.playerUid).toBe("u2");
        expect(next).toHaveBeenCalledWith();
    });

    it("should ignore cookies that don't include an access token", () => {
        const socket: any = {
            handshake: { auth: { playerUid: "anon2" }, headers: { cookie: "theme=dark" } },
            data: {},
        };
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockClear();

        middleware(socket, next);

        expect(jwt.verify).not.toHaveBeenCalled();
        expect(socket.data.playerUid).toMatch(/^guest:/);
    });

    it("should never let a guest claim someone else's id (raw or forged token)", () => {
        const { playerUid: victim } = issueGuestToken();
        for (const auth of [{ playerUid: "507f1f77bcf86cd799439011" }, { playerUid: victim }, { guestToken: `${victim}.forged` }]) {
            const socket: any = { handshake: { auth }, data: {} };
            middleware(socket, jest.fn());
            expect(socket.data.playerUid).not.toBe(victim);
            expect(socket.data.playerUid).not.toBe("507f1f77bcf86cd799439011");
        }
    });
});
