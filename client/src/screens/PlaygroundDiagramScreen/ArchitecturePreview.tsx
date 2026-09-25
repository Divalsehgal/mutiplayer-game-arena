import { FlowDiagram } from "./components/FlowDiagram";
import { getDiagram } from "./diagram.config";
import { EDGE_COLORS } from "./diagramTheme";

/**
 * One diagram in the app's dark theme. Default export so screens outside the
 * playground can `lazy()` it without pulling in React Flow up front.
 */
export default function ArchitecturePreview({ diagramKey }: { diagramKey: string }) {
  return (
    <FlowDiagram
      key={diagramKey}
      config={getDiagram(diagramKey)}
      edgeColor={EDGE_COLORS.dark.edge}
      selectedEdgeColor={EDGE_COLORS.dark.selected}
    />
  );
}
