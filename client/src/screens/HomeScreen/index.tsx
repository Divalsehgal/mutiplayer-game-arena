import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { usePageMeta } from "../../hooks/usePageMeta";

const GAMES = [
  { name: "Daily Sudoku", text: "One new puzzle a day, the same for everyone. No account needed.", who: "Solo", to: "/sudoku" },
  { name: "Tic-Tac-Toe", text: "Three in a row wins. Rounds take under a minute.", who: "2 players or vs computer", to: "/play" },
  { name: "Rock Paper Scissors", text: "Both pick at once and the moves show together.", who: "2 players or vs computer", to: "/play" },
  { name: "Snakes & Ladders", text: "Roll, climb ladders, slide down snakes. First to 100 wins.", who: "2 players or vs computer", to: "/play" },
];

const FAQ = [
  {
    q: "Do I need an account?",
    a: "Not for the daily Sudoku. To play other people you sign in with email or Google, so rooms know who's who.",
  },
  {
    q: "How do I play with a friend?",
    a: "Create a room, then send your friend the room code. They enter it on the Play page and you start when both are in.",
  },
  {
    q: "Can other people watch?",
    a: "Yes. Anyone who joins a full room watches, and takes a seat if a player leaves.",
  },
];

export default function HomeScreen() {
  usePageMeta({
    title: "Game Arena",
    description: "Free daily Sudoku and quick real-time games with friends: tic-tac-toe, rock paper scissors, snakes and ladders.",
    path: "/",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
      <section className="py-16 sm:py-24">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
          Quick games with friends
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Play tic-tac-toe, rock paper scissors or snakes and ladders in real time, or solve today's Sudoku. It
          all runs in your browser.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/play">Play with friends</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/sudoku">Today's Sudoku</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="games-title" className="pb-16 sm:pb-24">
        <h2 id="games-title" className="mb-6 text-2xl font-semibold">Games</h2>
        <ul className="flex flex-col gap-2">
          {GAMES.map((game) => (
            <li key={game.name}>
              <Link
                to={game.to}
                className="group flex flex-col gap-1 rounded-xl bg-card p-5 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:gap-6 sm:p-6"
              >
                <span className="text-lg font-semibold sm:w-56 sm:shrink-0">{game.name}</span>
                <span className="flex-1 text-muted-foreground">{game.text}</span>
                <span className="text-sm text-faint sm:text-right">{game.who}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-title" className="pb-20 sm:pb-28">
        <h2 id="faq-title" className="mb-6 text-2xl font-semibold">Questions</h2>
        <dl className="grid gap-8 sm:grid-cols-3">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-2 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
