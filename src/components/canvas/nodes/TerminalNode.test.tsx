import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { TerminalNode } from "./TerminalNode";
import { createTerminalNodeData } from "../../../lib/nodes";

const bindHerdr = vi.fn();
const rebindHerdr = vi.fn();

vi.mock("../../../stores/canvasStore", () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      updateTerminalNode: vi.fn(),
      bindHerdr,
      rebindHerdr,
      herdrOnline: false,
      herdrLifecycle: "missing",
    }),
}));

vi.mock("../../terminal/XtermView", () => ({
  XtermView: ({ fallbackText }: { fallbackText?: string }) => (
    <div data-testid="terminal-output">{fallbackText}</div>
  ),
}));

vi.mock("../../../lib/herdr/client", () => ({
  getPaneStatus: vi.fn().mockResolvedValue("idle"),
}));

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

function renderWithFlow(ui: React.ReactElement) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

describe("TerminalNode", () => {
  afterEach(() => cleanup());

  it("renders Install Herdr when herdr missing", () => {
    renderWithFlow(
      <TerminalNode
        id="t1"
        type="terminal"
        selected={false}
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createTerminalNodeData({
          label: "Planner",
          cwd: "/project",
          agentKind: "opencode",
        })}
      />
    );

    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByTestId("terminal-bind-herdr")).toHaveTextContent("Install Herdr");
    expect(screen.getByTestId("terminal-pane-id")).toHaveTextContent("local");
  });

  it("dispatches bind on click", () => {
    renderWithFlow(
      <TerminalNode
        id="t1"
        type="terminal"
        selected
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createTerminalNodeData({
          label: "FE",
          cwd: "/fe",
          ptyId: "pty-9",
        })}
      />
    );

    fireEvent.click(screen.getByTestId("terminal-bind-herdr"));
    expect(bindHerdr).toHaveBeenCalledWith("t1", "pty-9", 80, 24);
  });

  it("shows pane id only when herdr bound", () => {
    renderWithFlow(
      <TerminalNode
        id="t1"
        type="terminal"
        selected={false}
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createTerminalNodeData({
          label: "FE",
          cwd: "/fe",
          herdrPaneId: "w1:p2",
          herdrBound: true,
          status: "working",
          outputPreview: "$ npm test\nrunning...",
        })}
      />
    );

    expect(screen.getByTestId("terminal-output")).toHaveTextContent("running");
    expect(screen.getByTestId("terminal-pane-id")).toHaveTextContent("w1:p2");
    expect(screen.queryByTestId("terminal-bind-herdr")).not.toBeInTheDocument();
  });

  it("keeps bind button when pane id provisioned but not yet bound", () => {
    renderWithFlow(
      <TerminalNode
        id="t1"
        type="terminal"
        selected
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createTerminalNodeData({
          label: "FE",
          cwd: "/fe",
          herdrPaneId: "w5:p1",
          herdrBound: false,
          ptyId: "pty-9",
        })}
      />
    );

    expect(screen.getByTestId("terminal-bind-herdr")).toBeInTheDocument();
    expect(screen.getByTestId("terminal-pane-id")).toHaveTextContent("local");
  });

  it("auto-completes bind when pane id and pty are ready", () => {
    renderWithFlow(
      <TerminalNode
        id="t1"
        type="terminal"
        selected
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createTerminalNodeData({
          label: "FE",
          cwd: "/fe",
          herdrPaneId: "w5:p1",
          herdrBound: false,
          ptyId: "pty-9",
        })}
      />
    );

    expect(bindHerdr).toHaveBeenCalledWith("t1", "pty-9", 80, 24);
  });

  it("rebinds herdr when a new pty id arrives on a persisted bound terminal", async () => {
    const { rerender } = renderWithFlow(
      <TerminalNode
        id="t1"
        type="terminal"
        selected
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createTerminalNodeData({
          label: "FE",
          cwd: "/fe",
          herdrPaneId: "w3:p4",
          herdrBound: true,
        })}
      />
    );

    rerender(
      <ReactFlowProvider>
        <TerminalNode
          id="t1"
          type="terminal"
          selected
          dragging={false}
          zIndex={0}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          data={createTerminalNodeData({
            label: "FE",
            cwd: "/fe",
            herdrPaneId: "w3:p4",
            herdrBound: true,
            ptyId: "pty-new",
          })}
        />
      </ReactFlowProvider>
    );

    expect(rebindHerdr).toHaveBeenCalledWith("t1", "pty-new", 80, 24);
  });
});
