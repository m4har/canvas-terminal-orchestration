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
import { PlayDialog } from "./PlayDialog";
import { AgentInspector, AgentPicker } from "../agent/AgentPicker";
import { SettingsDialog } from "../settings/SettingsDialog";
import { HerdrInstallDialog } from "./HerdrInstallDialog";
import { MarkdownEditorDialog } from "../markdown/MarkdownEditorDialog";
import { AgentNode } from "./nodes/AgentNode";
import { MarkdownNode } from "./nodes/MarkdownNode";
import { SquareNode } from "./nodes/SquareNode";
import { TerminalNode } from "./nodes/TerminalNode";
import { TextNode } from "./nodes/TextNode";
import type { AgentNodeData, MarkdownNodeData, TerminalNodeData } from "../../lib/types";

const nodeTypes = {
  text: TextNode,
  square: SquareNode,
  terminal: TerminalNode,
  markdown: MarkdownNode,
  agent: AgentNode,
};

const edgeTypes = {
  handoff: HandoffEdge,
};

export function Canvas() {
  const { resolved } = useTheme();
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const handoff = useCanvasStore((state) => state.handoff);
  const play = useCanvasStore((state) => state.play);
  const markdownEditor = useCanvasStore((state) => state.markdownEditor);
  const agentPicker = useCanvasStore((state) => state.agentPicker);
  const agentInspector = useCanvasStore((state) => state.agentInspector);
  const settings = useCanvasStore((state) => state.settings);
  const herdrInstall = useCanvasStore((state) => state.herdrInstall);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);
  const openHandoff = useCanvasStore((state) => state.openHandoff);
  const closeHandoff = useCanvasStore((state) => state.closeHandoff);
  const sendHandoff = useCanvasStore((state) => state.sendHandoff);
  const closePlay = useCanvasStore((state) => state.closePlay);
  const runPlay = useCanvasStore((state) => state.runPlay);
  const closeAgentPicker = useCanvasStore((state) => state.closeAgentPicker);
  const bindAgentToNode = useCanvasStore((state) => state.bindAgentToNode);
  const closeAgentInspector = useCanvasStore((state) => state.closeAgentInspector);
  const updateAgentNode = useCanvasStore((state) => state.updateAgentNode);
  const closeSettings = useCanvasStore((state) => state.closeSettings);
  const closeMarkdownEditor = useCanvasStore((state) => state.closeMarkdownEditor);
  const updateMarkdownNode = useCanvasStore((state) => state.updateMarkdownNode);
  const closeHerdrInstall = useCanvasStore((state) => state.closeHerdrInstall);
  const retryHerdrInstall = useCanvasStore((state) => state.retryHerdrInstall);
  const installHerdrViaApp = useCanvasStore((state) => state.installHerdrViaApp);

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
  const playTarget = nodes.find((n) => n.id === play.targetId);
  const playLabel =
    playTarget?.type === "agent" ? (playTarget.data as AgentNodeData).label : "agent";

  const inspectorNode = nodes.find((n) => n.id === agentInspector.nodeId);
  const inspectorAgentId =
    inspectorNode?.type === "agent"
      ? (inspectorNode.data as AgentNodeData).orchestraAgentId
      : null;
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
        fitViewOptions={{ padding: 0.12 }}
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

      <PlayDialog
        key={`play-${play.targetId ?? "closed"}`}
        open={play.open}
        targetLabel={playLabel}
        payload={play.payload}
        onClose={closePlay}
        onPlay={runPlay}
      />

      <AgentPicker
        open={agentPicker.open}
        onClose={closeAgentPicker}
        onSelect={(agent) => {
          if (agentPicker.pendingNodeId) {
            bindAgentToNode(agentPicker.pendingNodeId, agent);
          }
        }}
      />

      <AgentInspector
        open={agentInspector.open}
        agentId={inspectorAgentId}
        onClose={closeAgentInspector}
        onUpdated={(agent) => {
          if (agentInspector.nodeId) {
            updateAgentNode(agentInspector.nodeId, {
              orchestraAgentSlug: agent.slug,
              profileId: agent.profile_id,
              label: agent.slug,
            });
          }
        }}
      />

      <SettingsDialog open={settings.open} onClose={closeSettings} />

      <HerdrInstallDialog
        open={herdrInstall.open}
        reason={herdrInstall.reason}
        installing={herdrInstall.installing}
        installProgress={herdrInstall.installProgress}
        installMessage={herdrInstall.installMessage}
        onClose={closeHerdrInstall}
        onRetry={retryHerdrInstall}
        onInstallViaApp={installHerdrViaApp}
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
