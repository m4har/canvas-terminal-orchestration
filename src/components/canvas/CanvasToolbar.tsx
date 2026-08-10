import {
  ArrowsOut,
  FileText,
  Gear,
  Moon,
  GitBranch,
  PaperPlaneTilt,
  Play,
  Robot,
  Square,
  Sun,
  Terminal,
  TextT,
} from "@phosphor-icons/react";
import { useReactFlow } from "@xyflow/react";
import { useTheme } from "../theme/ThemeProvider";
import { useTerminalFontSize, TERMINAL_FONT_SIZES } from "../../hooks/useTerminalFontSize";
import { useViewportCenter } from "../../hooks/useViewportCenter";
import { useCanvasStore } from "../../stores/canvasStore";
import { HerdrStatusBadge } from "./HerdrStatusBadge";

export function CanvasToolbar() {
  const addTextNode = useCanvasStore((state) => state.addTextNode);
  const addSquareNode = useCanvasStore((state) => state.addSquareNode);
  const addTerminalNode = useCanvasStore((state) => state.addTerminalNode);
  const addMarkdownNode = useCanvasStore((state) => state.addMarkdownNode);
  const addAgentNode = useCanvasStore((state) => state.addAgentNode);
  const openSettings = useCanvasStore((state) => state.openSettings);
  const loadDemoWorkflow = useCanvasStore((state) => state.loadDemoWorkflow);
  const openHandoff = useCanvasStore((state) => state.openHandoff);
  const runParallelFanOut = useCanvasStore((state) => state.runParallelFanOut);
  const { resolved, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useTerminalFontSize();
  const { fitView } = useReactFlow();
  const centerAt = useViewportCenter();

  const TEXT_SIZE = { w: 200, h: 56 };
  const SQUARE_SIZE = { w: 400, h: 300 };
  const MARKDOWN_SIZE = { w: 256, h: 200 };
  const TERMINAL_SIZE = { w: 288, h: 200 };
  const AGENT_SIZE = { w: 280, h: 200 };

  return (
    <header className="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--border)] px-3">
      <span className="mr-2 text-sm font-medium text-[var(--foreground)]">
        Canvas Orchestra
      </span>

      <ToolbarButton
        label="Add text"
        onClick={() =>
          addTextNode("Label", 18, centerAt(TEXT_SIZE.w, TEXT_SIZE.h))
        }
      >
        <TextT size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton
        label="Add square"
        onClick={() =>
          addSquareNode(SQUARE_SIZE.w, SQUARE_SIZE.h, centerAt(SQUARE_SIZE.w, SQUARE_SIZE.h))
        }
      >
        <Square size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton
        label="Add markdown"
        onClick={() =>
          addMarkdownNode("Spec", centerAt(MARKDOWN_SIZE.w, MARKDOWN_SIZE.h))
        }
      >
        <FileText size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton
        label="Add terminal"
        onClick={() =>
          addTerminalNode("Terminal", undefined, centerAt(TERMINAL_SIZE.w, TERMINAL_SIZE.h))
        }
      >
        <Terminal size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton
        label="Add agent"
        onClick={() => addAgentNode(centerAt(AGENT_SIZE.w, AGENT_SIZE.h))}
      >
        <Robot size={16} weight="regular" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-[var(--border)]" />

      <ToolbarButton label="Load demo workflow" onClick={() => { loadDemoWorkflow(); setTimeout(() => fitView({ padding: 0.15 }), 50); }}>
        <Play size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarButton label="Handoff to implement" onClick={() => openHandoff("term-implement")}>
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

      <label className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
        <span className="hidden sm:inline">Terminal</span>
        <select
          data-testid="terminal-font-size"
          aria-label="Terminal font size"
          className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5 text-[10px] text-[var(--foreground)]"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value) as typeof fontSize)}
        >
          {TERMINAL_FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </label>

      <ToolbarButton label="Settings" onClick={() => openSettings()}>
        <Gear size={16} weight="regular" />
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
