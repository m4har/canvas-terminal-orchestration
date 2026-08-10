import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { IntroOverlay } from "./IntroOverlay";

vi.mock("../../stores/canvasStore", () => ({
  useCanvasStore: vi.fn(),
}));

import { useCanvasStore } from "../../stores/canvasStore";

describe("IntroOverlay", () => {
  const completeIntro = vi.fn();

  beforeEach(() => {
    completeIntro.mockClear();
    vi.mocked(useCanvasStore).mockImplementation((selector) =>
      selector({
        introActive: true,
        completeIntro,
      } as never)
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("shows welcome modal on first step", () => {
    render(<IntroOverlay />);
    expect(screen.getByText("Canvastor")).toBeInTheDocument();
  });

  it("advances through modal steps", () => {
    render(<IntroOverlay />);
    fireEvent.click(screen.getByTestId("intro-next"));
    expect(screen.getByText("Node types")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("intro-next"));
    expect(screen.getByText("Play + Handoff")).toBeInTheDocument();
  });

  it("calls completeIntro when user picks start blank", () => {
    render(<IntroOverlay />);
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByTestId("intro-next"));
    }
    fireEvent.click(screen.getByTestId("intro-start-blank"));
    expect(completeIntro).toHaveBeenCalledWith(false);
  });

  it("calls completeIntro when user keeps demo", () => {
    render(<IntroOverlay />);
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByTestId("intro-next"));
    }
    fireEvent.click(screen.getByTestId("intro-keep-demo"));
    expect(completeIntro).toHaveBeenCalledWith(true);
  });

  it("renders nothing when intro is not active", () => {
    vi.mocked(useCanvasStore).mockImplementation((selector) =>
      selector({
        introActive: false,
        completeIntro,
      } as never)
    );
    const { container } = render(<IntroOverlay />);
    expect(container.firstChild).toBeNull();
  });
});
