import { ArrowDown, ArrowUp, Circle, HandFist, LucideIcon, Scissors, X } from "lucide-react";
import { SNAKE_LADDER_BOARD } from "@arena/shared";

// Still frames of each game, built from the same pieces as the real arenas.
const FRAME = "w-full bg-card p-5 sm:p-7";

const TTT_BOARD = ["X", "O", "", "", "X", "", "O", "", ""];

export function TicTacToeFrame() {
  return (
    <div data-ui aria-hidden className={FRAME}>
      <div className="mb-5 flex items-baseline justify-between text-sm text-muted-foreground">
        <span>Your turn, X</span>
        <span className="tabular">You 2 · Dana 1</span>
      </div>
      <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-2">
        {TTT_BOARD.map((mark, i) => (
          <span
            key={i}
            className={`flex aspect-square items-center justify-center rounded-lg bg-secondary ${
              i === 8 ? "turn-pulse ring-2 ring-inset ring-white/60" : ""
            }`}
          >
            {mark === "X" && <X className="h-3/5 w-3/5 text-accent" strokeWidth={3} />}
            {mark === "O" && <Circle className="h-1/2 w-1/2 text-white" strokeWidth={3} />}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RockPaperScissorsFrame() {
  const slot = (label: string, who: string, Icon: LucideIcon, win: boolean) => (
    <div className="flex flex-col items-center gap-3">
      <span className={`flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl lg:h-32 lg:w-32 ${win ? "bg-accent text-black" : "bg-secondary"}`}>
        <Icon className="h-12 w-12" />
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className="text-sm text-muted-foreground">{who}</span>
    </div>
  );
  return (
    <div data-ui aria-hidden className={FRAME}>
      <div className="mb-6 flex items-baseline justify-between text-sm text-muted-foreground">
        <span>Round 4</span>
        <span className="tabular">You 2 · Computer 1</span>
      </div>
      <div className="flex items-start justify-center gap-4 lg:gap-10">
        {slot("Rock", "You", HandFist, true)}
        <span className="pt-10 text-lg font-semibold text-faint lg:pt-14">vs</span>
        {slot("Scissors", "Computer", Scissors, false)}
      </div>
      <p className="mt-6 text-center font-semibold">Rock blunts scissors. You win the round.</p>
    </div>
  );
}

// The top three rows of the real 100-square board, snaking the way the arena numbers them.
const TOP_ROWS = 3;
const SQUARES = 100;
const SNAKE_ROWS = Array.from({ length: TOP_ROWS }, (_, r) => {
  const row = Array.from({ length: 10 }, (_, c) => SQUARES - r * 10 - c);
  return r % 2 ? row.reverse() : row;
});
const YOU_AT = 91; // climbed the ladder from 71
const DANA_AT = 84;

export function SnakesFrame() {
  return (
    <div data-ui aria-hidden className={FRAME}>
      <div className="mb-5 flex items-baseline justify-between text-sm text-muted-foreground">
        <span>Ladder from 71 to 91</span>
        <span>Dana's turn</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {SNAKE_ROWS.flat().map((n) => {
          const ladder = SNAKE_LADDER_BOARD.ladders[n];
          const snake = SNAKE_LADDER_BOARD.snakes[n];
          return (
            <span
              key={n}
              className={`relative flex aspect-square items-center justify-center rounded-sm text-[11px] ${
                ladder ? "bg-[#222a10]" : snake ? "bg-[#2c1a20]" : n % 2 ? "bg-secondary" : "bg-[#171717]"
              }`}
            >
              <span className="absolute left-1 top-0.5 text-faint">{n}</span>
              {ladder && <ArrowUp className="h-4 w-4 text-success" />}
              {snake && <ArrowDown className="h-4 w-4 text-destructive" />}
              {n === YOU_AT && <span className="h-3 w-3 rounded-full bg-accent ring-1 ring-black" />}
              {n === DANA_AT && <span className="turn-pulse h-3 w-3 rounded-full bg-white ring-1 ring-black" />}
            </span>
          );
        })}
      </div>
      <div className="mt-5 flex justify-between text-sm">
        <span className="text-muted-foreground">Your last roll</span>
        <span className="tabular font-semibold">3</span>
      </div>
    </div>
  );
}
