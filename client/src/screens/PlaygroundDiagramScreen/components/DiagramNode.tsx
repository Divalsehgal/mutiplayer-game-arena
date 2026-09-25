import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Cloud, Database, Globe, LayoutGrid, Server, type LucideIcon } from "lucide-react";
import type { DiagramNodeData, DiagramNodeType } from "../diagram.types";

const ICONS: Record<DiagramNodeType, LucideIcon> = {
  frontend: Globe,
  backend: Server,
  external: Cloud,
  data: Database,
  default: LayoutGrid,
};

export type DiagramFlowNode = Node<DiagramNodeData, DiagramNodeType>;

function DiagramNode({ data, type, selected }: NodeProps<DiagramFlowNode>) {
  const variant: DiagramNodeType = type in ICONS ? type : "default";
  const Icon = ICONS[variant];

  return (
    <div
      className="diagram-node"
      data-type={variant}
      data-selected={selected ? "true" : "false"}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Icon className="diagram-node__icon" aria-hidden="true" />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

export default memo(DiagramNode);
