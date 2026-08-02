import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPreview } from "./MarkdownPreview";

vi.mock("./MermaidDiagram", () => ({
  MermaidDiagram: ({ code }: { code: string }) => (
    <div data-testid="mermaid-mock">{code}</div>
  ),
}));

describe("MarkdownPreview", () => {
  it("renders heading and list from markdown", () => {
    render(
      <MarkdownPreview content={"# Hello\n\n- item one\n- item two"} />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Hello" })).toBeInTheDocument();
    expect(screen.getByText("item one")).toBeInTheDocument();
    expect(screen.getByText("item two")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MarkdownPreview content="text" className="custom-preview" />
    );

    expect(container.firstChild).toHaveClass("custom-preview");
  });

  it("renders mermaid code blocks via MermaidDiagram", () => {
    render(
      <MarkdownPreview content={"```mermaid\nflowchart TD\n  A-->B\n```"} />
    );

    expect(screen.getByTestId("mermaid-mock")).toHaveTextContent("flowchart TD");
  });
});
