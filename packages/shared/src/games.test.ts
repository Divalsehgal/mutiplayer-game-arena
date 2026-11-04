import { GAME_NAMES, SNAKE_LADDER_BOARD } from "./games";

describe("games", () => {
  it("has a display name for every game type", () => {
    expect(Object.keys(GAME_NAMES).sort()).toEqual(["RPS", "SNAKE_LADDER", "TIC_TAC_TOE"]);
  });

  it("sends ladders up and snakes down, all on the 1-100 board", () => {
    for (const [from, to] of Object.entries(SNAKE_LADDER_BOARD.ladders)) {
      expect(to).toBeGreaterThan(Number(from));
      expect(to).toBeLessThanOrEqual(100);
    }
    for (const [from, to] of Object.entries(SNAKE_LADDER_BOARD.snakes)) {
      expect(to).toBeLessThan(Number(from));
      expect(to).toBeGreaterThanOrEqual(1);
    }
  });
});
