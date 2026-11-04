import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { usePageMeta } from "../../hooks/usePageMeta";
import { TodayCard } from "../HomeScreen/TodayCard";

export default function NotFoundScreen() {
  usePageMeta({ title: "Page not found", description: "This page doesn't exist on Game Arena.", noindex: true });

  return (
    <section className="page-frame grid flex-1 items-center gap-16 py-20 sm:py-28 md:grid-cols-2">
      <div>
        <p aria-hidden className="tabular text-[clamp(96px,22vw,280px)] font-semibold leading-[0.85] tracking-[-0.05em] text-accent">
          404
        </p>
        <h1 className="mt-8 text-[clamp(32px,4vw,56px)] font-semibold leading-tight tracking-tight">Page not found</h1>
        <p className="mt-4 max-w-[44ch] text-lg">
          This link doesn't go anywhere. It may have been mistyped, or the room it pointed to has closed.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/">Go home</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/sudoku">Play today's Sudoku</Link>
          </Button>
        </div>
      </div>
      <div className="md:justify-self-end">
        <TodayCard />
      </div>
    </section>
  );
}
