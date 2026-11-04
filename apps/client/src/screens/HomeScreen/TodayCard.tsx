import { useMemo } from "react";
import { Link } from "react-router-dom";
import { generatePuzzle, Grid, STORAGE_PREFIX, todayKey } from "../../lib/sudoku";
import { formatTimeLeft } from "../../utils/formatTimeLeft";

const CELLS = 81;
const NINE = [0, 1, 2, 3, 4, 5, 6, 7, 8];

interface Progress {
  grid: Grid;
  seconds: number;
  solved: boolean;
}

function readProgress(key: string): Progress | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as Progress) : null;
  } catch {
    return null;
  }
}

/** Today's real puzzle printed like a newspaper clipping, with this visitor's progress if they started it. */
export function TodayCard() {
  const key = todayKey();
  const { puzzle } = useMemo(() => generatePuzzle(key), [key]);
  const progress = useMemo(() => readProgress(key), [key]);

  const givens = puzzle.filter(Boolean).length;
  const cursor = puzzle.indexOf(0); // the first open square, marked the way the board marks a selection
  const filled = progress?.grid.filter(Boolean).length ?? givens;
  const status = progress?.solved
    ? `You solved it in ${formatTimeLeft(progress.seconds * 1000)}`
    : filled > givens
      ? `You've filled ${filled} of ${CELLS} squares`
      : `${givens} numbers given, the same for everyone`;
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <figure data-ui className="w-full max-w-[460px] bg-white p-5 text-black sm:p-7">
      <figcaption className="mb-4 flex items-baseline justify-between gap-4">
        <span className="text-lg font-semibold">Today's puzzle</span>
        <span className="text-sm text-[#444444]">{date}</span>
      </figcaption>

      <div aria-hidden className="grid grid-cols-3 gap-[2px] bg-black p-[2px]">
        {NINE.map((box) => (
          <div key={box} className="grid grid-cols-3 gap-px bg-[#b5b5b5]">
            {NINE.map((k) => {
              const index = (Math.floor(box / 3) * 3 + Math.floor(k / 3)) * 9 + (box % 3) * 3 + (k % 3);
              const value = puzzle[index];
              return (
                <span
                  key={k}
                  className={`tabular flex aspect-square items-center justify-center text-[clamp(13px,3.6vw,20px)] font-medium ${
                    index === cursor ? "turn-pulse bg-accent" : "bg-white"
                  }`}
                >
                  {value || ""}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="sr-only">Today's Sudoku has {givens} numbers given.</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#333333]">{status}</p>
        <Link
          to="/sudoku"
          className="inline-flex h-10 items-center rounded-full bg-black px-5 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[#262626] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {progress && !progress.solved ? "Carry on" : "Solve it"}
        </Link>
      </div>
    </figure>
  );
}
