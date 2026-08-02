import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MarkdownToolbar } from "./MarkdownToolbar";

describe("MarkdownToolbar", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("calls onCommand for bold", () => {
    const onCommand = vi.fn();
    render(<MarkdownToolbar onCommand={onCommand} />);

    fireEvent.click(screen.getByTestId("markdown-toolbar-bold"));

    expect(onCommand).toHaveBeenCalledWith("bold");
  });

  it("calls onCommand for mermaid from more menu", () => {
    const onCommand = vi.fn();
    render(<MarkdownToolbar onCommand={onCommand} />);

    fireEvent.click(screen.getByTestId("markdown-toolbar-more-trigger"));
    fireEvent.click(screen.getByTestId("markdown-toolbar-mermaid"));

    expect(onCommand).toHaveBeenCalledWith("mermaid");
  });
});
