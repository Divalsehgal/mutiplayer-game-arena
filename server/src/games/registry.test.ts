import { gameRegistry } from "./registry";

describe("gameRegistry", () => {
    it("registers every game the lobby offers", () => {
        expect(Object.keys(gameRegistry).sort()).toEqual(["RPS", "SNAKE_LADDER", "TIC_TAC_TOE"]);
    });

    it.each(Object.entries(gameRegistry))("%s can start a game and make moves", (_name, handler) => {
        expect(typeof handler.getInitialState).toBe("function");
        expect(typeof handler.handleReady).toBe("function");
        expect(typeof handler.handleMove).toBe("function");
        expect(typeof handler.projectPublicState).toBe("function");
    });
});
