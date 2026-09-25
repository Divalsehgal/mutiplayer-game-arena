import { useCallback, useState } from "react";

export type DiagramTheme = "dark" | "light";

/**
 * Mirror `--muted-foreground` and `--primary` for each theme (global.css /
 * playground.css). React Flow applies a marker's colour as an inline style,
 * so CSS can't restyle arrowheads; the values have to be passed from JS.
 */
export const EDGE_COLORS: Record<DiagramTheme, { edge: string; selected: string }> = {
  dark: { edge: "hsl(215 20% 65%)", selected: "hsl(262 83% 58%)" },
  light: { edge: "hsl(215 16% 40%)", selected: "hsl(262 83% 52%)" },
};

/** The app is dark by default; the playground can preview a light palette. */
export function useDiagramTheme(initial: DiagramTheme = "dark") {
  const [theme, setTheme] = useState<DiagramTheme>(initial);
  const toggleTheme = useCallback(
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    [],
  );
  return { theme, toggleTheme };
}
