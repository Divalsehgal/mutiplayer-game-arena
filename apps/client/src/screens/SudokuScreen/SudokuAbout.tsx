const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, "");

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": ["WebApplication", "VideoGame"],
  name: "Daily Sudoku",
  url: `${SITE_URL}/sudoku`,
  description: "A free Sudoku puzzle every day, the same for everyone, played in the browser with no sign-up.",
  genre: "Puzzle",
  gamePlatform: "Web browser",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  inLanguage: "en",
  isAccessibleForFree: true,
  numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  isPartOf: { "@type": "WebSite", name: "Game Arena", url: `${SITE_URL}/` },
};

const KEYS = [
  { keys: "1 to 9", does: "Place a number" },
  { keys: "Backspace or 0", does: "Clear the square" },
  { keys: "Arrow keys", does: "Move between squares" },
];

/** The rules and what makes the daily puzzle daily: the indexable text of the page. */
export function SudokuAbout() {
  return (
    <div className="mt-20 grid gap-12 sm:mt-28 lg:grid-cols-2 lg:gap-16">
      <script type="application/ld+json">{JSON.stringify(JSON_LD)}</script>

      <section aria-labelledby="rules-title">
        <h2 id="rules-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">How to play</h2>
        <p className="mt-5 max-w-[56ch] text-lg">
          Fill every row, every column and every 3×3 box with the numbers 1 to 9, each exactly once. Pick a square,
          then tap a number or type it. A number that repeats in its row, column or box turns red.
        </p>
        <dl className="mt-8 flex max-w-[56ch] flex-col gap-2">
          {KEYS.map((k) => (
            <div key={k.keys} className="flex flex-wrap justify-between gap-x-6 gap-y-1 rounded-lg bg-card px-5 py-4">
              <dt className="font-semibold">{k.keys}</dt>
              <dd className="text-muted-foreground">{k.does}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="daily-title">
        <h2 id="daily-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">One puzzle a day</h2>
        <p className="mt-5 max-w-[56ch] text-lg">
          Everyone gets the same puzzle on the same date, and a new one appears at midnight in your time zone. Each
          starts with about 32 numbers and has exactly one solution, so it can always be solved by logic alone.
        </p>
        <p className="mt-4 max-w-[56ch] text-lg">
          Your progress and time are saved in this browser, so you can close the tab and finish later. No account is
          needed.
        </p>
      </section>
    </div>
  );
}
