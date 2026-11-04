import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Reveal } from "../../components/Reveal";
import { usePageMeta } from "../../hooks/usePageMeta";
import { RockPaperScissorsFrame, SnakesFrame, TicTacToeFrame } from "./GameFragments";
import { HowItWorks } from "./HowItWorks";
import { TodayCard } from "./TodayCard";

const GAMES = [
  {
    name: "Tic-Tac-Toe",
    text: "Three in a row wins. Rounds take under a minute, and the score carries over until someone leaves.",
    Frame: TicTacToeFrame,
  },
  {
    name: "Rock Paper Scissors",
    text: "You both pick in secret and the moves show together, so nobody can wait and react.",
    Frame: RockPaperScissorsFrame,
  },
  {
    name: "Snakes & Ladders",
    text: "Roll, climb the ladders, slide down the snakes. The first to reach square 100 wins.",
    Frame: SnakesFrame,
  },
];

const FAQ = [
  { q: "Is it free?", a: "Yes. Every game is free, with no ads and nothing to buy." },
  {
    q: "Do I need an account?",
    a: "Not for the daily Sudoku. To play other people you sign in with email or Google, so rooms know who's who.",
  },
  {
    q: "How do I play with a friend?",
    a: "Create a room, then send your friend the room code. They enter it on the Play page and you start when both are in.",
  },
  { q: "Can I play alone?", a: "Yes. Solve the daily Sudoku, or turn on “vs computer” when you create a room." },
  {
    q: "Does it work on a phone?",
    a: "Yes. It runs in any modern browser on a phone, tablet or computer, with nothing to install.",
  },
];

const HOME_DESCRIPTION =
  "Free daily Sudoku and quick real-time games with friends: tic-tac-toe, rock paper scissors and snakes and ladders, in your browser.";

export default function HomeScreen() {
  usePageMeta({ title: "Daily Sudoku and quick games with friends", description: HOME_DESCRIPTION, path: "/" });

  return (
    <div className="page-frame">
      <section className="grid items-center gap-12 pb-12 pt-10 sm:pb-20 sm:pt-16 md:grid-cols-2 md:gap-10 lg:min-h-[calc(100svh-64px)] lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16 lg:py-12">
        {/* Not animated: the headline is the largest paint, and fading it in would delay it. */}
        <div>
          <h1 className="text-[clamp(44px,6.4vw,96px)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Quick games with friends
          </h1>
          <p className="mt-8 max-w-[40ch] text-lg sm:text-xl">
            Play tic-tac-toe, rock paper scissors or snakes and ladders in real time, or solve today's Sudoku. It
            all runs in your browser.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/play">Play with friends</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/sudoku">Today's Sudoku</Link>
            </Button>
          </div>
        </div>
        <Reveal immediate order={2} className="md:justify-self-end">
          <TodayCard />
        </Reveal>
      </section>

      <section aria-labelledby="games-title" className="py-16 sm:py-32">
        <Reveal>
          <h2 id="games-title" className="max-w-[16ch] text-[clamp(36px,4.4vw,64px)] font-semibold leading-[1.02] tracking-tight">
            Three games for two players
          </h2>
        </Reveal>
        <ul className="mt-14 flex flex-col gap-16 sm:mt-20 sm:gap-24">
          {GAMES.map(({ name, text, Frame }, i) => (
            <li key={name} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <Reveal order={1} className={i % 2 ? "md:order-2" : ""}>
                <h3 className="text-[clamp(26px,2.4vw,32px)] font-semibold tracking-tight">{name}</h3>
                <p className="mt-4 max-w-[40ch] text-lg">{text}</p>
                <p className="mt-3 text-muted-foreground">Against a friend, a stranger or the computer.</p>
                <Link
                  to="/play"
                  className="mt-6 inline-block font-medium text-accent underline-offset-4 hover:underline"
                >
                  Play {name}
                </Link>
              </Reveal>
              <Reveal order={2}>
                <Frame />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <HowItWorks />

      <section aria-labelledby="faq-title" className="grid gap-10 pb-24 pt-16 sm:pb-36 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
        <Reveal>
          <h2 id="faq-title" className="text-[clamp(36px,4.4vw,64px)] font-semibold leading-[1.02] tracking-tight">
            Questions
          </h2>
        </Reveal>
        <dl className="flex flex-col gap-2">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} order={i} className={`rounded-xl p-6 sm:p-7 ${i % 2 ? "bg-secondary" : "bg-card"}`}>
              <dt className="text-lg font-semibold">{item.q}</dt>
              <dd className="mt-2 text-lg">{item.a}</dd>
            </Reveal>
          ))}
        </dl>
      </section>
    </div>
  );
}
