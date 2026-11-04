import { describe, it, expect } from "vitest";
import { generatePuzzle, findConflicts, todayKey } from "./sudoku";

describe("daily sudoku", () => {
  const { puzzle, solution } = generatePuzzle("2026-11-04");

  it("produces a valid solved grid", () => {
    expect(solution.every((n) => n >= 1 && n <= 9)).toBe(true);
    expect(findConflicts(solution).size).toBe(0);
  });

  it("puzzle is a subset of the solution with a playable number of givens", () => {
    puzzle.forEach((n, i) => {
      if (n) expect(n).toBe(solution[i]);
    });
    const givens = puzzle.filter(Boolean).length;
    expect(givens).toBeGreaterThanOrEqual(32);
    expect(givens).toBeLessThan(45);
  });

  it("is the same for the same date and different on another date", () => {
    expect(generatePuzzle("2026-11-04").puzzle).toEqual(puzzle);
    expect(generatePuzzle("2026-11-05").puzzle).not.toEqual(puzzle);
  });

  it("flags repeated numbers", () => {
    const grid = Array(81).fill(0);
    grid[0] = 5;
    grid[8] = 5;
    expect([...findConflicts(grid)].sort()).toEqual([0, 8]);
  });

  it("formats dates as local YYYY-MM-DD", () => {
    expect(todayKey(new Date(2026, 0, 7))).toBe("2026-01-07");
  });
});
