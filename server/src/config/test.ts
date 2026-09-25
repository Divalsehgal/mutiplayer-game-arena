describe("config", () => {
    const savedEnv = { ...process.env };

    const loadConfig = () => {
        let config: typeof import("./index") | undefined;
        jest.isolateModules(() => {
            config = require("./index");
        });
        return config!;
    };

    afterEach(() => {
        process.env = { ...savedEnv };
    });

    it("uses sensible defaults", () => {
        delete process.env.PORT;
        delete process.env.CORS_ORIGIN;
        const config = loadConfig();
        expect(config.PORT).toBe(3030);
        expect(config.CORS_ORIGIN).toBe("http://localhost:5173");
        expect(config.BOT_MOVE_DELAY_MS).toBeGreaterThan(0);
    });

    it("reads the port and strips trailing slashes from the CORS origin", () => {
        process.env.PORT = "4000";
        process.env.CORS_ORIGIN = "https://arena.example.com///";
        const config = loadConfig();
        expect(config.PORT).toBe(4000);
        expect(config.CORS_ORIGIN).toBe("https://arena.example.com");
    });
});
