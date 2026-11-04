// Daily Sudoku: every visitor gets the same puzzle for a given date, generated in the browser.
// Grids are 81-length arrays, row-major, 0 = empty.

export type Grid = number[];

/** localStorage key prefix for saved progress, followed by the date key. */
export const STORAGE_PREFIX = "sudoku:";

const TARGET_GIVENS = 32;
const CELLS = 81;
// FNV-1a hash of the seed text, then mulberry32 for the stream.
const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;
const MULBERRY_INC = 0x6d2b79f5;
const MULBERRY_MUL = 61;
const MULBERRY_SHIFT = 14;
const UINT32_RANGE = 4294967296;

/** YYYY-MM-DD in the visitor's local time zone. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function seededRandom(seedText: string): () => number {
  let seed = FNV_OFFSET;
  for (let i = 0; i < seedText.length; i++) {
    seed = Math.imul(seed ^ seedText.charCodeAt(i), FNV_PRIME);
  }
  return () => {
    seed = (seed + MULBERRY_INC) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), MULBERRY_MUL | t)) ^ t;
    return ((t ^ (t >>> MULBERRY_SHIFT)) >>> 0) / UINT32_RANGE;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const boxOf = (i: number) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);

/** Indices of every cell that shares a row, column or box with cell i. */
export const PEERS: number[][] = Array.from({ length: CELLS }, (_, i) => {
  const peers: number[] = [];
  for (let j = 0; j < CELLS; j++) {
    if (j !== i && (Math.floor(j / 9) === Math.floor(i / 9) || j % 9 === i % 9 || boxOf(j) === boxOf(i))) {
      peers.push(j);
    }
  }
  return peers;
});

function candidates(grid: Grid, i: number): number[] {
  const used = new Set(PEERS[i].map((p) => grid[p]));
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n));
}

/** Counts solutions up to `limit`, filling `grid` in place with the first one found when limit is 1. */
function solve(grid: Grid, limit: number, random?: () => number): number {
  let best = -1;
  let bestCands: number[] = [];
  for (let i = 0; i < CELLS; i++) {
    if (grid[i]) continue;
    const c = candidates(grid, i);
    if (c.length === 0) return 0;
    if (best === -1 || c.length < bestCands.length) {
      best = i;
      bestCands = c;
      if (c.length === 1) break;
    }
  }
  if (best === -1) return 1;

  let count = 0;
  for (const n of random ? shuffle(bestCands, random) : bestCands) {
    grid[best] = n;
    count += solve(grid, limit - count, random);
    if (count >= limit) {
      if (limit === 1) return count;
      break;
    }
  }
  grid[best] = 0;
  return count;
}

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
}

export function generatePuzzle(seedText: string): Puzzle {
  const random = seededRandom(seedText);
  const solution: Grid = Array(CELLS).fill(0);
  solve(solution, 1, random);

  const puzzle = [...solution];
  let givens = CELLS;
  for (const i of shuffle([...Array(CELLS).keys()], random)) {
    if (givens <= TARGET_GIVENS) break;
    const kept = puzzle[i];
    puzzle[i] = 0;
    if (solve([...puzzle], 2) !== 1) puzzle[i] = kept;
    else givens--;
  }
  return { puzzle, solution };
}

/** Cells whose value repeats in a row, column or box. */
export function findConflicts(grid: Grid): Set<number> {
  const out = new Set<number>();
  grid.forEach((n, i) => {
    if (n && PEERS[i].some((p) => grid[p] === n)) out.add(i);
  });
  return out;
}
