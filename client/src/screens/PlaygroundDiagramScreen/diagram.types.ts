export type DiagramNodeType = "frontend" | "backend" | "external" | "data" | "default";

export type DiagramMemberKind =
  | "component"
  | "hook"
  | "function"
  | "class"
  | "method"
  | "const"
  | "route"
  | "listens"
  | "emits";

/** A code-level entry (function, class, socket event…) listed in the detail panel. */
export interface DiagramMember {
  kind: DiagramMemberKind;
  name: string;
  signature?: string;
}

export interface DiagramNodeData extends Record<string, unknown> {
  label: string;
  /** Shown in the detail panel when the node is selected. */
  description?: string;
  members?: DiagramMember[];
}

export interface DiagramNodeConfig {
  id: string;
  position: { x: number; y: number };
  /** Visual variant; a missing type renders as "default". */
  type?: Exclude<DiagramNodeType, "default">;
  data: DiagramNodeData;
}

export interface DiagramEdgeConfig {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  /**
   * Bows the bezier path. Use it to pull apart edges that would otherwise
   * share a path (e.g. two edges fanning out of the same node).
   */
  curvature?: number;
}

export interface DiagramConfig {
  title?: string;
  subtitle?: string;
  nodes: DiagramNodeConfig[];
  edges: DiagramEdgeConfig[];
}
