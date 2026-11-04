import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { usePageMeta } from "../../hooks/usePageMeta";
import { findConflicts, generatePuzzle, Grid, todayKey } from "../../lib/sudoku";
import { SudokuBoard } from "./SudokuBoard";
import { formatTimeLeft } from "../../utils/formatTimeLeft";

const STORAGE_PREFIX = "sudoku:";
const LAST_CELL = 80;

interface SavedGame {
  grid: Grid;
  seconds: number;
  solved: boolean;
}

function load(key: string): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as SavedGame) : null;
  } catch {
    return null;
  }
}

function save(key: string, game: SavedGame) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(game));
  } catch {
    // Private mode or full storage: the game still works, it just won't survive a reload.
  }
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Daily Sudoku",
  description: "A free Sudoku puzzle every day, played in the browser with no sign-up.",
  genre: "Puzzle",
  gamePlatform: "Web browser",
  applicationCategory: "Game",
  operatingSystem: "Any",
  inLanguage: "en",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function SudokuScreen() {
  usePageMeta({
    title: "Daily Sudoku",
    description: "Play today's free Sudoku puzzle. A new puzzle every day, no sign-up needed.",
    path: "/sudoku",
  });

  const dateKey = todayKey();
  const { puzzle, solution } = useMemo(() => generatePuzzle(dateKey), [dateKey]);
  const saved = useMemo(() => load(dateKey), [dateKey]);

  const [grid, setGrid] = useState<Grid>(saved?.grid ?? puzzle);
  const [seconds, setSeconds] = useState(saved?.seconds ?? 0);
  const [solved, setSolved] = useState(saved?.solved ?? false);
  const [selected, setSelected] = useState<number | null>(null);

  const conflicts = useMemo(() => findConflicts(grid), [grid]);
  const filled = grid.filter(Boolean).length;

  useEffect(() => {
    if (solved) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [solved]);

  useEffect(() => save(dateKey, { grid, seconds, solved }), [dateKey, grid, seconds, solved]);

  const place = useCallback(
    (value: number) => {
      if (selected === null || solved || puzzle[selected]) return;
      const next = [...grid];
      next[selected] = value;
      setGrid(next);
      if (next.every((n, i) => n === solution[i])) setSolved(true);
    },
    [grid, puzzle, selected, solution, solved],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) return place(Number(e.key));
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") return place(0);
      const moves: Record<string, number> = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
      if (e.key in moves) {
        e.preventDefault();
        setSelected((s) => {
          const next = (s ?? 0) + moves[e.key];
          return next < 0 || next > LAST_CELL ? s : next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [place]);

  const restart = () => {
    setGrid(puzzle);
    setSeconds(0);
    setSolved(false);
    setSelected(null);
  };

  const clock = formatTimeLeft(seconds * 1000);
  const longDate = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <script type="application/ld+json">{JSON.stringify(JSON_LD)}</script>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,560px)_300px] lg:justify-between lg:items-start">
        <section aria-labelledby="sudoku-title" className="w-full max-w-[560px]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 id="sudoku-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Daily Sudoku
              </h1>
              <p className="mt-1 text-muted-foreground">{longDate}</p>
            </div>
            <p className="tabular text-2xl font-medium" aria-label={`Time ${clock}`}>
              {clock}
            </p>
          </div>

          <SudokuBoard grid={grid} puzzle={puzzle} conflicts={conflicts} selected={selected} onSelect={setSelected} />
        </section>

        <aside className="flex flex-col gap-6">
          {solved ? (
            <div className="rounded-xl bg-card p-6">
              <h2 className="text-xl font-semibold">Solved in {clock}</h2>
              <p className="mt-1 text-muted-foreground">A new puzzle is ready tomorrow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2" aria-label="Number pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <Button
                  key={n}
                  variant="secondary"
                  className="tabular h-14 rounded-lg text-xl"
                  onClick={() => place(n)}
                  disabled={selected === null || Boolean(puzzle[selected])}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="secondary"
                className="h-14 rounded-lg"
                onClick={() => place(0)}
                disabled={selected === null || Boolean(puzzle[selected])}
              >
                Erase
              </Button>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-card p-4">
              <dt className="text-sm text-muted-foreground">Filled</dt>
              <dd className="tabular mt-1 text-lg font-semibold">{filled} / 81</dd>
            </div>
            <div className="rounded-lg bg-card p-4">
              <dt className="text-sm text-muted-foreground">Clashes</dt>
              <dd className={`tabular mt-1 text-lg font-semibold ${conflicts.size ? "text-destructive" : ""}`}>
                {conflicts.size}
              </dd>
            </div>
          </dl>

          <Button variant="outline" onClick={restart}>
            Start over
          </Button>

          <div className="text-sm leading-relaxed text-muted-foreground">
            <h2 className="mb-2 text-base font-semibold text-foreground">How to play</h2>
            <p>
              Fill every row, column and 3×3 box with the numbers 1 to 9, each once. Pick a square, then tap a
              number or type it. Clashing numbers turn red. Your progress is saved on this device.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
