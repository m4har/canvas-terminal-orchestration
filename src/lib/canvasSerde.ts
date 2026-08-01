import type { Edge, Node } from "@xyflow/react";
import type { SquareNodeData } from "./types";

export interface CanvasNodeDto {
  id: string;
  node_type: string;
  position_x: number;
  position_y: number;
  data_json: string;
}

export interface CanvasEdgeDto {
  id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  payload_json: string;
}

interface FlowMeta {
  style?: { width?: number; height?: number };
  zIndex?: number;
  dragHandle?: string;
}

type StoredNodeData = Record<string, unknown> & { __flow?: FlowMeta };

export function nodeToDto(node: Node): CanvasNodeDto {
  const { __flow: _ignored, ...data } = (node.data ?? {}) as StoredNodeData;
  return {
    id: node.id,
    node_type: node.type ?? "text",
    position_x: node.position.x,
    position_y: node.position.y,
    data_json: JSON.stringify({
      ...data,
      __flow: {
        style: node.style,
        zIndex: node.zIndex,
        dragHandle: node.dragHandle,
      },
    }),
  };
}

export function dtoToFlowNode(dto: CanvasNodeDto): Node {
  const parsed = JSON.parse(dto.data_json) as StoredNodeData;
  const { __flow, ...data } = parsed;

  const node: Node = {
    id: dto.id,
    type: dto.node_type,
    position: { x: dto.position_x, y: dto.position_y },
    data,
  };

  if (__flow?.style) node.style = __flow.style;
  if (__flow?.zIndex !== undefined) node.zIndex = __flow.zIndex;
  if (__flow?.dragHandle) node.dragHandle = __flow.dragHandle;

  if (dto.node_type === "square") {
    const square = data as SquareNodeData;
    node.zIndex = node.zIndex ?? -1;
    node.dragHandle = node.dragHandle ?? ".square-drag-handle";
    node.style = node.style ?? { width: square.width, height: square.height };
  }

  return node;
}

export function edgeToDto(edge: Edge): CanvasEdgeDto {
  return {
    id: edge.id,
    source_node_id: edge.source,
    target_node_id: edge.target,
    edge_type: "handoff",
    payload_json: "{}",
  };
}

export function dtoToFlowEdge(dto: CanvasEdgeDto): Edge {
  return {
    id: dto.id,
    source: dto.source_node_id,
    target: dto.target_node_id,
    type: "handoff",
    label: "handoff",
    animated: true,
  };
}

export function flowToSnapshot(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map(nodeToDto),
    edges: edges.map(edgeToDto),
  };
}

export function snapshotToFlow(snapshot: {
  nodes: CanvasNodeDto[];
  edges: CanvasEdgeDto[];
}) {
  return {
    nodes: snapshot.nodes.map(dtoToFlowNode),
    edges: snapshot.edges.map(dtoToFlowEdge),
  };
}
