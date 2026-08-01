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
import { useCanvasStore } from "../../stores/canvasStore";
import { useTheme } from "../theme/ThemeProvider";
import { HandoffDialog } from "./HandoffDialog";
import { MarkdownNode } from "./nodes/MarkdownNode";
import { SquareNode } from "./nodes/SquareNode";
import { TerminalNode } from "./nodes/TerminalNode";
import { TextNode } from "./nodes/TextNode";
import type { TerminalNodeData } from "../../lib/types";

const nodeTypes = {
  text: TextNode,
  square: SquareNode,
  terminal: TerminalNode,
  markdown: MarkdownNode,
};

export function Canvas() {
  const { resolved } = useTheme();
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const handoff = useCanvasStore((state) => state.handoff);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const openHandoff = useCanvasStore((state) => state.openHandoff);
  const closeHandoff = useCanvasStore((state) => state.closeHandoff);
  const sendHandoff = useCanvasStore((state) => state.sendHandoff);

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
      if (!connection.source || !connection.target) return;
      setEdges([
        ...edges,
        {
          id: `e-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          type: "default",
          label: "handoff",
          animated: true,
        },
      ]);
    },
    [edges, setEdges]
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

  return (
    <div className="h-full min-h-0 w-full bg-[var(--canvas-bg)]">
      <ReactFlow
        colorMode={resolved}
        nodes={renderNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        elevateNodesOnSelect={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="var(--canvas-dot)" />
        <Controls className="!bg-[var(--muted)] !border-[var(--border)]" />
      </ReactFlow>

      <HandoffDialog
        key={handoff.targetId ?? "closed"}
        open={handoff.open}
        targetLabel={targetLabel}
        payload={handoff.payload}
        onClose={closeHandoff}
        onSend={sendHandoff}
      />
    </div>
  );
}
