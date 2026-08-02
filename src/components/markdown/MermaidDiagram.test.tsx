import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MermaidDiagram } from "./MermaidDiagram";

vi.mock("../theme/ThemeProvider", () => ({
  useTheme: () => ({ resolved: "dark" as const }),
}));

const renderMock = vi.fn().mockResolvedValue({ svg: '<svg data-testid="mermaid-svg"></svg>' });
const initializeMock = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: initializeMock,
    render: renderMock,
  },
}));

describe("MermaidDiagram", () => {
  beforeEach(() => {
    renderMock.mockClear();
    initializeMock.mockClear();
  });

  it("renders mermaid svg", async () => {
    render(<MermaidDiagram code="flowchart TD\n  A-->B" />);

    await waitFor(() => {
      expect(screen.getByTestId("mermaid-diagram").querySelector("svg")).toBeTruthy();
    });
    expect(initializeMock).toHaveBeenCalled();
    expect(renderMock).toHaveBeenCalled();
  });

  it("shows error fallback when render fails", async () => {
    renderMock.mockRejectedValueOnce(new Error("parse error"));

    render(<MermaidDiagram code="invalid" />);

    await waitFor(() => {
      expect(screen.getByTestId("mermaid-error")).toBeInTheDocument();
    });
    expect(screen.getByText(/parse error/)).toBeInTheDocument();
  });
});
