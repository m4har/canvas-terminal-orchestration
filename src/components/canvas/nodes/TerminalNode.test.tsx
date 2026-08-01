import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TerminalNode } from "./TerminalNode";
import { createTerminalNodeData } from "../../../lib/nodes";

vi.mock("../../terminal/XtermView", () => ({
  XtermView: ({ fallbackText }: { fallbackText?: string }) => (
    <div data-testid="terminal-output">{fallbackText}</div>
  ),
}));

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe("TerminalNode", () => {
  afterEach(() => cleanup());

  it("renders label with idle status", () => {
    render(
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
          herdrPaneId: "pane-1",
          cwd: "/project",
          agentKind: "opencode",
        })}
      />
    );

    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByLabelText("idle")).toBeInTheDocument();
    expect(screen.getByText("opencode")).toBeInTheDocument();
    expect(screen.getByTestId("terminal-pane-id")).toHaveTextContent("pane-1");
  });

  it("shows output preview", () => {
    render(
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
          herdrPaneId: "pane-2",
          cwd: "/fe",
          status: "working",
          outputPreview: "$ npm test\nrunning...",
        })}
      />
    );

    expect(screen.getByTestId("terminal-output")).toHaveTextContent("running");
    expect(screen.getByLabelText("working")).toBeInTheDocument();
  });
});
