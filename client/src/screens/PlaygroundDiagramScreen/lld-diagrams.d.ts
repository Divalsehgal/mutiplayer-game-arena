declare module "virtual:lld-diagrams" {
  import type { DiagramConfig } from "@/screens/PlaygroundDiagramScreen/diagram.types";

  /** Generated at dev/build time by scripts/lld/vitePlugin.ts. */
  const diagrams: Record<string, DiagramConfig>;
  export default diagrams;
}
