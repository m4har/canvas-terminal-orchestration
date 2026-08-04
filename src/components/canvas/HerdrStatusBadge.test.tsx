import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HerdrStatusBadge } from "./HerdrStatusBadge";

const openHerdrInstall = vi.fn();
const refreshHerdrConnection = vi.fn().mockResolvedValue(false);

vi.mock("../../stores/canvasStore", () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      herdrOnline: false,
      herdrLifecycle: "missing",
      openHerdrInstall,
    }),
}));

vi.mock("../../hooks/useHerdrConnection", () => ({
  refreshHerdrConnection: (...args: unknown[]) => refreshHerdrConnection(...args),
}));

describe("HerdrStatusBadge", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows install label when herdr missing", () => {
    render(<HerdrStatusBadge />);
    expect(screen.getByTestId("herdr-status-badge")).toHaveTextContent("herdr install");
  });

  it("opens install modal when missing and clicked", () => {
    render(<HerdrStatusBadge />);
    fireEvent.click(screen.getByTestId("herdr-status-badge"));
    expect(openHerdrInstall).toHaveBeenCalledWith({ reason: "toolbar" });
  });
});
