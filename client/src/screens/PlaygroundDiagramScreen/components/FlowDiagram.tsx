import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import "./flowDiagram.css";
import DiagramNode, { type DiagramFlowNode } from "./DiagramNode";
import { DetailPanel } from "./DetailPanel";
import type { DiagramConfig, DiagramNodeConfig } from "../diagram.types";

// Module scope: a new object per render makes React Flow warn and remount nodes.
const nodeTypes: NodeTypes = {
  frontend: DiagramNode,
  backend: DiagramNode,
  external: DiagramNode,
  data: DiagramNode,
  default: DiagramNode,
};

const MARKER_SIZE = 18;
const FIT_VIEW_OPTIONS = { padding: 0.15 };
const MIN_ZOOM = 0.15; // the default 0.5 clips the outer nodes of wide graphs
// Positions in the config are the top-centre of each node.
const CENTER = 0.5;
const NODE_ORIGIN: [number, number] = [CENTER, 0];

interface FlowDiagramProps {
  config: DiagramConfig;
  /** Arrowhead colour; must match the current theme's edge stroke. */
  edgeColor: string;
  /** Arrowhead colour of the selected edge; defaults to `edgeColor`. */
  selectedEdgeColor?: string;
}

export function FlowDiagram({ config, edgeColor, selectedEdgeColor = edgeColor }: FlowDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<DiagramNodeConfig | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // With a node selected, its own edges and neighbours stay lit; the rest dims.
  const focus = useMemo(() => {
    if (!selectedNode) return null;
    const edgeIds = new Set<string>();
    const nodeIds = new Set([selectedNode.id]);
    for (const edge of config.edges) {
      if (edge.source === selectedNode.id || edge.target === selectedNode.id) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
    }
    return { edgeIds, nodeIds };
  }, [config.edges, selectedNode]);

  const nodes = useMemo<DiagramFlowNode[]>(
    () =>
      config.nodes.map((node) => ({
        id: node.id,
        position: node.position,
        type: node.type ?? "default",
        data: node.data,
        selected: node.id === selectedNode?.id,
        className: focus && !focus.nodeIds.has(node.id) ? "is-dimmed" : undefined,
      })),
    [config.nodes, selectedNode, focus],
  );

  const edges = useMemo<Edge[]>(
    () =>
      config.edges.map((edge) => {
        const selected = edge.id === selectedEdgeId;
        const related = focus?.edgeIds.has(edge.id) ?? false;
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: edge.animated,
          selected,
          className: related ? "is-related" : focus ? "is-dimmed" : undefined,
          zIndex: related ? 1 : 0,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: MARKER_SIZE,
            height: MARKER_SIZE,
            color: selected || related ? selectedEdgeColor : edgeColor,
          },
          ...(edge.curvature !== undefined && {
            pathOptions: { curvature: edge.curvature },
          }),
        };
      }),
    [config.edges, edgeColor, selectedEdgeColor, selectedEdgeId, focus],
  );

  const handleNodeClick = useCallback<NodeMouseHandler<DiagramFlowNode>>(
    (_event, node) => {
      setSelectedEdgeId(null);
      setSelectedNode(config.nodes.find((entry) => entry.id === node.id) ?? null);
    },
    [config.nodes],
  );

  const handleEdgeClick = useCallback<EdgeMouseHandler>((_event, edge) => {
    setSelectedNode(null);
    setSelectedEdgeId(edge.id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdgeId(null);
  }, []);

  const closePanel = useCallback(() => setSelectedNode(null), []);

  return (
    <div className="flow-canvas relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodeOrigin={NODE_ORIGIN}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={clearSelection}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={MIN_ZOOM}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnScroll
        zoomOnScroll
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
      <DetailPanel node={selectedNode} onClose={closePanel} />
    </div>
  );
}
