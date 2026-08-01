import {
  ArrowsOut,
  FileText,
  Moon,
  GitBranch,
  PaperPlaneTilt,
  Play,
  Square,
  Sun,
  Terminal,
  TextT,
} from "@phosphor-icons/react";
import { useReactFlow } from "@xyflow/react";
import { useTheme } from "../theme/ThemeProvider";
import { useCanvasStore } from "../../stores/canvasStore";
import { HerdrStatusBadge } from "./HerdrStatusBadge";

export function CanvasToolbar() {
  const addTextNode = useCanvasStore((state) => state.addTextNode);
  const addSquareNode = useCanvasStore((state) => state.addSquareNode);
  const addTerminalNode = useCanvasStore((state) => state.addTerminalNode);
  const addMarkdownNode = useCanvasStore((state) => state.addMarkdownNode);
  const loadDemoWorkflow = useCanvasStore((state) => state.loadDemoWorkflow);
  const openHandoff = useCanvasStore((state) => state.openHandoff);
  const runParallelFanOut = useCanvasStore((state) => state.runParallelFanOut);
  const { resolved, toggleTheme } = useTheme();
  const { fitView } = useReactFlow();

  return (
    <header className="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--border)] px-3">
      <span className="mr-2 text-sm font-medium text-[var(--foreground)]">
        Canvas Orchestra
      </span>

      <ToolbarButton label="Add text" onClick={() => addTextNode("Label", 18)}>
        <TextT size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton label="Add square" onClick={() => addSquareNode()}>
        <Square size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton label="Add markdown" onClick={() => addMarkdownNode("Spec")}>
        <FileText size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton label="Add terminal" onClick={() => addTerminalNode("Terminal")}>
        <Terminal size={16} weight="regular" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-[var(--border)]" />

      <ToolbarButton label="Load demo workflow" onClick={() => { loadDemoWorkflow(); setTimeout(() => fitView({ padding: 0.15 }), 50); }}>
        <Play size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton label="Handoff plan to planner" onClick={() => openHandoff("term-planner")}>
        <PaperPlaneTilt size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton label="Fan-out to FE and BE" onClick={() => runParallelFanOut()}>
        <GitBranch size={16} weight="regular" />
      </ToolbarButton>

      <div className="flex-1" />

      <HerdrStatusBadge />

      <span className="hidden text-[10px] text-[var(--muted-foreground)] sm:inline">
        double-click label to edit
      </span>

      <ToolbarButton label="Fit view" onClick={() => fitView({ padding: 0.2 })}>
        <ArrowsOut size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton label="Toggle theme" onClick={toggleTheme}>
        {resolved === "dark" ? (
          <Sun size={16} weight="regular" />
        ) : (
          <Moon size={16} weight="regular" />
        )}
      </ToolbarButton>
    </header>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
