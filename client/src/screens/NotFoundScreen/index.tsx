import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function NotFoundScreen() {
  usePageMeta({ title: "Page not found", noindex: true });

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Page not found</h1>
      <p className="mb-6 text-muted-foreground">This link doesn't go anywhere.</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
