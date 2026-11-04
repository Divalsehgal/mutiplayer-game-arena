import { Grid, PEERS } from "../../lib/sudoku";

interface SudokuBoardProps {
  grid: Grid;
  puzzle: Grid;
  conflicts: Set<number>;
  selected: number | null;
  onSelect: (index: number) => void;
}

const NINE = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** Nine 3×3 boxes; the wider gap between boxes draws the thick lines. */
export function SudokuBoard({ grid, puzzle, conflicts, selected, onSelect }: SudokuBoardProps) {
  const selectedValue = selected !== null ? grid[selected] : 0;
  const peers = selected !== null ? new Set(PEERS[selected]) : null;

  const cell = (i: number) => {
    const value = grid[i];
    const given = Boolean(puzzle[i]);
    const isSelected = selected === i;
    const conflict = conflicts.has(i) && !given;

    const background = isSelected
      ? "bg-accent text-accent-foreground"
      : selectedValue !== 0 && value === selectedValue
        ? "bg-[#33401a]"
        : peers?.has(i)
          ? "bg-[#1c1c1c]"
          : "bg-card hover:bg-secondary";
    const ink = isSelected ? "" : conflict ? "text-destructive" : given ? "font-semibold" : "text-accent";

    return (
      <button
        key={i}
        type="button"
        aria-label={`Row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1}, ${value || "empty"}${given ? ", given" : ""}`}
        aria-pressed={isSelected}
        onClick={() => onSelect(i)}
        className={`tabular flex aspect-square items-center justify-center text-[clamp(18px,5vw,28px)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${background} ${ink}`}
      >
        {value || ""}
      </button>
    );
  };

  return (
    <div
      aria-label="Sudoku board"
      className="grid w-full max-w-[560px] grid-cols-3 gap-[3px] overflow-hidden rounded-xl bg-raised p-[3px]"
    >
      {NINE.map((box) => (
        <div key={box} className="grid grid-cols-3 gap-px">
          {NINE.map((k) => cell((Math.floor(box / 3) * 3 + Math.floor(k / 3)) * 9 + (box % 3) * 3 + (k % 3)))}
        </div>
      ))}
    </div>
  );
}
