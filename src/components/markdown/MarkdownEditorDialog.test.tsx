import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MarkdownEditorDialog } from "./MarkdownEditorDialog";

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="codemirror-mock"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("../theme/ThemeProvider", () => ({
  useTheme: () => ({ resolved: "dark" as const }),
}));

vi.mock("./MarkdownToolbar", () => ({
  MarkdownToolbar: ({ onCommand }: { onCommand: (cmd: string) => void }) => (
    <div data-testid="markdown-toolbar">
      <button type="button" data-testid="markdown-toolbar-mermaid" onClick={() => onCommand("mermaid")}>
        Mermaid
      </button>
    </div>
  ),
}));

describe("MarkdownEditorDialog", () => {
  const onClose = vi.fn();
  const onChange = vi.fn();

  beforeEach(() => {
    cleanup();
    onClose.mockClear();
    onChange.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders nothing when closed", () => {
    render(
      <MarkdownEditorDialog
        open={false}
        title="Plan"
        content="# Hello"
        onClose={onClose}
        onChange={onChange}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders code editor by default when open", () => {
    render(
      <MarkdownEditorDialog
        open
        title="Plan"
        content="# Hello"
        onClose={onClose}
        onChange={onChange}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByTestId("codemirror-mock")).toBeInTheDocument();
    expect(screen.getByTestId("markdown-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("codemirror-mock")).toHaveValue("# Hello");
  });

  it("hides toolbar in preview mode", () => {
    render(
      <MarkdownEditorDialog
        open
        title="Plan"
        content="# Hello"
        onClose={onClose}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId("markdown-mode-preview"));

    expect(screen.queryByTestId("markdown-toolbar")).not.toBeInTheDocument();
  });

  it("inserts mermaid snippet via toolbar when editor unavailable", () => {
    render(
      <MarkdownEditorDialog
        open
        title="Plan"
        content=""
        onClose={onClose}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId("markdown-toolbar-mermaid"));

    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("```mermaid"));
  });

  it("switches to preview mode", () => {
    render(
      <MarkdownEditorDialog
        open
        title="Plan"
        content="# Hello"
        onClose={onClose}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId("markdown-mode-preview"));

    expect(screen.queryByTestId("codemirror-mock")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Hello" })).toBeInTheDocument();
  });

  it("calls onChange when editing in code mode", () => {
    render(
      <MarkdownEditorDialog
        open
        title="Plan"
        content="old"
        onClose={onClose}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByTestId("codemirror-mock"), {
      target: { value: "new content" },
    });

    expect(onChange).toHaveBeenCalledWith("new content");
  });

  it("calls onClose when clicking backdrop", () => {
    render(
      <MarkdownEditorDialog
        open
        title="Plan"
        content="# Hello"
        onClose={onClose}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId("markdown-editor-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking close button", () => {
    render(
      <MarkdownEditorDialog
        open
        title="Plan"
        content="# Hello"
        onClose={onClose}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId("markdown-editor-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
