import { cn } from "@/lib/utils";

export interface DiagramTab {
  key: string;
  label: string;
}

interface DiagramTabsProps {
  tabs: DiagramTab[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

/** Segmented switcher between diagrams. */
export function DiagramTabs({ tabs, value, onChange, className }: DiagramTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Diagram"
      className={cn(
        "flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-card/70 p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
