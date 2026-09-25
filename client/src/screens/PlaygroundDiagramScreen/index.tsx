import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Workflow } from "lucide-react";
import { Button } from "../../components/ui/button";
import { usePageMeta } from "../../hooks/usePageMeta";
import { DiagramTabs } from "./components/DiagramTabs";
import { FlowDiagram } from "./components/FlowDiagram";
import { DIAGRAMS, DIAGRAM_TABS, resolveDiagramKey } from "./diagram.config";
import type { DiagramConfig } from "./diagram.types";
import { EDGE_COLORS, useDiagramTheme } from "./diagramTheme";
import "./playground.css";

const DEFAULT_TITLE = "Diagram playground";

interface PlaygroundDiagramScreenProps {
  /** Overrides the `?diagram=` lookup; mainly for tests. */
  config?: DiagramConfig;
}

export default function PlaygroundDiagramScreen({ config }: PlaygroundDiagramScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const diagramKey = resolveDiagramKey(searchParams.get("diagram"));
  const diagram = config ?? DIAGRAMS[diagramKey];
  const { theme, toggleTheme } = useDiagramTheme();
  const colors = EDGE_COLORS[theme];
  const title = diagram.title ?? DEFAULT_TITLE;
  const nextTheme = theme === "dark" ? "light" : "dark";

  usePageMeta(title, diagram.subtitle);

  return (
    <div
      data-theme={theme}
      className="diagram-playground flex flex-1 flex-col gap-4 bg-background p-4 text-foreground sm:p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Game Arena
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {diagram.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{diagram.subtitle}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${nextTheme} theme`}
          className="shrink-0 border border-border bg-card/70 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      <DiagramTabs
        tabs={DIAGRAM_TABS}
        value={diagramKey}
        onChange={(key) => setSearchParams({ diagram: key })}
        className="self-start"
      />

      <div className="diagram-playground__canvas overflow-hidden rounded-2xl border border-border bg-card">
        {diagram.nodes.length > 0 ? (
          <FlowDiagram
            key={diagramKey}
            config={diagram}
            edgeColor={colors.edge}
            selectedEdgeColor={colors.selected}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <Workflow className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">Nothing to show yet</p>
            <p className="text-sm text-muted-foreground">
              This diagram has no nodes. Add some to its config to render it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
