/**
 * Output shape of the generator. Mirrors DiagramConfig in
 * src/screens/PlaygroundDiagramScreen/diagram.types.ts; kept separate because
 * vite.config (tsconfig.node.json) can't import files owned by the app project.
 */
export type LldMemberKind =
  | "component"
  | "hook"
  | "function"
  | "class"
  | "method"
  | "const"
  | "route"
  | "listens"
  | "emits";

export interface LldMember {
  kind: LldMemberKind;
  name: string;
  signature?: string;
}

export type LldNodeType = "frontend" | "backend" | "external" | "data";

export interface LldNode {
  id: string;
  type?: LldNodeType;
  position: { x: number; y: number };
  data: { label: string; description?: string; members?: LldMember[] };
}

export interface LldEdge {
  id: string;
  source: string;
  target: string;
}

export interface LldDiagram {
  title: string;
  subtitle: string;
  nodes: LldNode[];
  edges: LldEdge[];
}
