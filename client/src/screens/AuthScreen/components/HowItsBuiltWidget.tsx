import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ExternalLink, Workflow, X } from "lucide-react";
import { DiagramTabs } from "../../PlaygroundDiagramScreen/components/DiagramTabs";

// Lazy so React Flow only downloads when someone opens the dialog.
const ArchitecturePreview = lazy(
  () => import("../../PlaygroundDiagramScreen/ArchitecturePreview"),
);

const RISE_PX = 12;
const DURATION_S = 0.18;
const TITLE_ID = "how-its-built-title";

// Keys match the playground's diagram registry (kept here so the login page
// doesn't import the diagrams until the dialog opens).
const TABS = [
  { key: "architecture", label: "High level" },
  { key: "lld-server", label: "Server LLD" },
  { key: "lld-client", label: "Client LLD" },
];
const [DEFAULT_TAB] = TABS;

export function HowItsBuiltWidget() {
  const [open, setOpen] = useState(false);
  const [diagramKey, setDiagramKey] = useState(DEFAULT_TAB.key);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="group mt-4 flex w-full items-center gap-3 rounded-xl border border-border bg-card/60 p-3 text-left backdrop-blur-md transition-colors hover:border-primary/60 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Workflow className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">How it's built</span>
          <span className="block text-xs text-muted-foreground">
            See how the app, servers and database fit together
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION_S }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={TITLE_ID}
              className="flex h-[min(85dvh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              initial={{ opacity: 0, y: RISE_PX }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: RISE_PX }}
              transition={{ duration: DURATION_S, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="flex items-start justify-between gap-4 border-b border-border p-4">
                <div className="min-w-0">
                  <h2 id={TITLE_ID} className="text-lg font-semibold text-foreground">
                    How Game Arena is built
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Click any box to see what it does. The low-level views are
                    generated from the code, so they stay current.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    to={`/playground/diagram?diagram=${diagramKey}`}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Full view
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </header>
              <DiagramTabs
                tabs={TABS}
                value={diagramKey}
                onChange={setDiagramKey}
                className="mx-4 mt-3 self-start"
              />
              <div className="min-h-0 flex-1">
                <Suspense
                  fallback={
                    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Loading diagram…
                    </p>
                  }
                >
                  <ArchitecturePreview diagramKey={diagramKey} />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
