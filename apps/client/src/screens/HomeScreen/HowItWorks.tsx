import { Reveal } from "../../components/Reveal";

const STAGES = [
  {
    when: "Before you start",
    rows: [
      { what: "Sign in with email or Google", time: "20 sec" },
      { what: "Pick a game, public or private", time: "5 sec" },
    ],
  },
  {
    when: "In the room",
    rows: [
      { what: "Send your friend the room code", time: "10 sec" },
      { what: "They join from the Play page", time: "10 sec" },
      { what: "Start once both seats are taken", time: "now" },
    ],
  },
];

// A zigzag cut along the bottom edge, like a slip torn from a till roll.
const TEETH = 24;
const ZIGZAG = `polygon(0 0, 100% 0, 100% calc(100% - 10px), ${Array.from({ length: TEETH }, (_, i) => {
  const right = 100 - (i * 100) / TEETH;
  const mid = right - 50 / TEETH;
  return `${right}% calc(100% - 10px), ${mid}% 100%`;
}).join(", ")}, 0 calc(100% - 10px))`;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="grid gap-10 py-16 sm:py-32 md:grid-cols-2 lg:gap-16">
      <Reveal>
        <h2 id="how-title" className="text-[clamp(36px,4.4vw,64px)] font-semibold leading-[1.02] tracking-tight">
          From sign-in to first move
        </h2>
        <p className="mt-6 max-w-[34ch] text-lg">
          Rooms have short codes, so starting a game is as quick as reading one out. Anyone who joins a full room
          watches, and takes a seat if a player leaves.
        </p>
      </Reveal>

      <Reveal order={1} className="md:justify-self-end">
        <div className="tabular w-full max-w-[460px] bg-white px-6 pb-10 pt-4 text-black sm:px-8" style={{ clipPath: ZIGZAG }}>
          {STAGES.map((stage) => (
            <div key={stage.when}>
              <h3 className="mb-3 mt-6 font-semibold">{stage.when}</h3>
              <ul className="flex flex-col gap-2.5">
                {stage.rows.map((row) => (
                  <li key={row.what} className="flex items-end gap-2">
                    <span>{row.what}</span>
                    <span aria-hidden className="mb-1.5 min-w-4 flex-1 border-b-4 border-dotted border-[#9a9a9a]" />
                    <span className="shrink-0">{row.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="-mx-6 mt-8 flex h-11 items-center justify-between bg-black px-6 font-semibold text-white sm:-mx-8 sm:px-8">
            <span>Playing together</span>
            <span>under a minute</span>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
