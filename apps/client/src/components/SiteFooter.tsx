import { Link, useLocation } from "react-router-dom";
import { Reveal } from "./Reveal";

const LINKS = [
  { to: "/sudoku", label: "Solve the daily Sudoku" },
  { to: "/play", label: "Start a game" },
  { to: "/login", label: "Create an account" },
];

/** The site's close: the name at full width, then the few places to go. Hidden inside a room or game. */
export default function SiteFooter() {
  const { pathname } = useLocation();
  if (/^\/(room|game)\//.test(pathname)) return null;

  return (
    <footer className="mt-auto bg-card">
      <div className="page-frame pb-10 pt-16 sm:pt-24">
        <Reveal>
          <p aria-hidden className="text-[clamp(56px,13.5vw,196px)] font-semibold leading-[0.9] tracking-[-0.04em]">
            Game Arena
          </p>
        </Reveal>
        <Reveal order={1} className="mt-12 flex flex-col gap-10 sm:mt-16 sm:flex-row sm:items-end sm:justify-between">
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-2">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[clamp(22px,2.4vw,32px)] font-medium text-accent underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="max-w-[38ch] text-muted-foreground">
            Free games in the browser. A new Sudoku every day at midnight, your time.
          </p>
        </Reveal>
        <div className="mt-16 flex justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Game Arena</span>
          <a href="#top" className="hover:text-foreground">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
