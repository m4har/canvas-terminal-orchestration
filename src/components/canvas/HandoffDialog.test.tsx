import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HandoffDialog } from "./HandoffDialog";

describe("HandoffDialog", () => {
  it("renders payload and sends on confirm", () => {
    const onSend = vi.fn();
    const onClose = vi.fn();

    render(
      <HandoffDialog
        open
        targetLabel="Planner"
        payload="# Plan\n\ntask"
        onClose={onClose}
        onSend={onSend}
      />
    );

    expect(screen.getByText(/Handoff → Planner/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("handoff-send"));
    expect(onSend).toHaveBeenCalledWith(expect.stringContaining("# Plan"));
  });

  it("returns null when closed", () => {
    const { container } = render(
      <HandoffDialog
        open={false}
        targetLabel="X"
        payload=""
        onClose={vi.fn()}
        onSend={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
