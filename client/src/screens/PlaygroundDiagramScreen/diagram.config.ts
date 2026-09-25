import type { DiagramConfig } from "./diagram.types";
import { architectureDiagram } from "./configs/architecture";
import { moveLifecycleDiagram } from "./configs/moveLifecycle";
// Generated from the server and client source by scripts/lld (see vite.config.ts).
import lldDiagrams from "virtual:lld-diagrams";

/** Diagrams selectable with `?diagram=<key>`, in tab order. */
export const DIAGRAMS: Record<string, DiagramConfig> = {
  architecture: architectureDiagram,
  "move-lifecycle": moveLifecycleDiagram,
  ...lldDiagrams,
};

/** Short tab names for the diagram switcher. */
export const DIAGRAM_TABS: { key: string; label: string }[] = [
  { key: "architecture", label: "Architecture" },
  { key: "move-lifecycle", label: "Move lifecycle" },
  { key: "lld-server", label: "Server LLD" },
  { key: "lld-client", label: "Client LLD" },
].filter((tab) => tab.key in DIAGRAMS);

export const DEFAULT_DIAGRAM_KEY = "architecture";

/** Returns `key` if it names a diagram, otherwise the default key. */
export const resolveDiagramKey = (key: string | null): string =>
  key && Object.prototype.hasOwnProperty.call(DIAGRAMS, key) ? key : DEFAULT_DIAGRAM_KEY;

export const getDiagram = (key: string | null): DiagramConfig => DIAGRAMS[resolveDiagramKey(key)];
