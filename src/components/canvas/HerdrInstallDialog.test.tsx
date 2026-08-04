import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HerdrInstallDialog } from "./HerdrInstallDialog";
import { HERDR_INSTALL_CMD } from "../../lib/herdr/requireHerdr";

vi.mock("../../lib/workflow", () => ({
  isTauriRuntime: vi.fn(() => false),
}));

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe("HerdrInstallDialog", () => {
  afterEach(() => cleanup());

  it("renders install command", () => {
    render(
      <HerdrInstallDialog
        open
        reason="bind"
        installing={false}
        installProgress={0}
        installMessage=""
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onInstallViaApp={vi.fn()}
      />
    );

    expect(screen.getByTestId("herdr-install-command")).toHaveTextContent(
      HERDR_INSTALL_CMD
    );
  });

  it("calls onClose when cancel clicked", () => {
    const onClose = vi.fn();
    render(
      <HerdrInstallDialog
        open
        reason="bind"
        installing={false}
        installProgress={0}
        installMessage=""
        onClose={onClose}
        onRetry={vi.fn()}
        onInstallViaApp={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onRetry when retry clicked", () => {
    const onRetry = vi.fn();
    render(
      <HerdrInstallDialog
        open
        reason="handoff"
        installing={false}
        installProgress={0}
        installMessage=""
        onClose={vi.fn()}
        onRetry={onRetry}
        onInstallViaApp={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("herdr-install-retry"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("copies install command", async () => {
    render(
      <HerdrInstallDialog
        open
        reason="toolbar"
        installing={false}
        installProgress={0}
        installMessage=""
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onInstallViaApp={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("herdr-install-copy"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(HERDR_INSTALL_CMD);
  });
});
