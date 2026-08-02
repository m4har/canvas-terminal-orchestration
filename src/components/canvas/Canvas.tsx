import {
  Background,
  Controls,
  ReactFlow,
  applyEdgeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { applyCanvasNodeChanges, sortNodesForRender } from "../../lib/nodeDimensions";
import { canAddHandoffEdge, createHandoffEdge } from "../../lib/edgeRules";
import { useCanvasStore } from "../../stores/canvasStore";
import { useTheme } from "../theme/ThemeProvider";
import { HandoffEdge } from "./edges/HandoffEdge";
import { HandoffDialog } from "./HandoffDialog";
import { MarkdownEditorDialog } from "../markdown/MarkdownEditorDialog";
import { MarkdownNode } from "./nodes/MarkdownNode";
import { SquareNode } from "./nodes/SquareNode";
import { TerminalNode } from "./nodes/TerminalNode";
import { TextNode } from "./nodes/TextNode";
import type { MarkdownNodeData, TerminalNodeData } from "../../lib/types";

const nodeTypes = {
  text: TextNode,
  square: SquareNode,
  terminal: TerminalNode,
  markdown: MarkdownNode,
};

const edgeTypes = {
  handoff: HandoffEdge,
};

export function Canvas() {
  const { resolved } = useTheme();
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const handoff = useCanvasStore((state) => state.handoff);
  const markdownEditor = useCanvasStore((state) => state.markdownEditor);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const openHandoff = useCanvasStore((state) => state.openHandoff);
  const closeHandoff = useCanvasStore((state) => state.closeHandoff);
  const sendHandoff = useCanvasStore((state) => state.sendHandoff);
  const closeMarkdownEditor = useCanvasStore((state) => state.closeMarkdownEditor);
  const updateMarkdownNode = useCanvasStore((state) => state.updateMarkdownNode);

  const renderNodes = useMemo(() => sortNodesForRender(nodes), [nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyCanvasNodeChanges(nodes, changes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!canAddHandoffEdge(connection, edges, sourceNode, targetNode)) return;
      setEdges([...edges, createHandoffEdge(connection)]);
    },
    [edges, nodes, setEdges]
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      return canAddHandoffEdge(connection, edges, sourceNode, targetNode);
    },
    [edges, nodes]
  );

  const onEdgeClick = useCallback(
    (_: unknown, edge: { target: string }) => {
      openHandoff(edge.target);
    },
    [openHandoff]
  );

  const onNodeClick = useCallback(
    (_: unknown, node: { id: string; type?: string }) => {
      if (node.type === "terminal") openHandoff(node.id);
    },
    [openHandoff]
  );

  const targetNode = nodes.find((n) => n.id === handoff.targetId);
  const targetLabel =
    targetNode?.type === "terminal"
      ? (targetNode.data as TerminalNodeData).label
      : "pane";

  const editingMarkdownNode = nodes.find((n) => n.id === markdownEditor.nodeId);
  const editingMarkdownData =
    editingMarkdownNode?.type === "markdown"
      ? (editingMarkdownNode.data as MarkdownNodeData)
      : null;

  return (
    <div className="h-full min-h-0 w-full bg-[var(--canvas-bg)]">
      <ReactFlow
        colorMode={resolved}
        nodes={renderNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "handoff" }}
        elevateNodesOnSelect={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="var(--canvas-dot)" />
        <Controls className="!bg-[var(--muted)] !border-[var(--border)]" />
      </ReactFlow>

      <HandoffDialog
        key={`handoff-${handoff.targetId ?? "closed"}`}
        open={handoff.open}
        targetLabel={targetLabel}
        payload={handoff.payload}
        onClose={closeHandoff}
        onSend={sendHandoff}
      />

      <MarkdownEditorDialog
        key={`markdown-${markdownEditor.nodeId ?? "closed"}`}
        open={markdownEditor.open}
        title={editingMarkdownData?.title ?? "Spec"}
        content={editingMarkdownData?.content ?? ""}
        onClose={closeMarkdownEditor}
        onChange={(content) => {
          if (markdownEditor.nodeId) {
            updateMarkdownNode(markdownEditor.nodeId, { content });
          }
        }}
      />
    </div>
  );
}
