import { describe, expect, it } from "vitest";
import {
  HERDR_INSTALL_CMD,
  deriveHerdrActionLabel,
  mapSnapshotToReadyState,
  readyStateFromStore,
} from "./requireHerdr";
import type { HerdrStatusSnapshot } from "./status";

function snapshot(partial: Partial<HerdrStatusSnapshot>): HerdrStatusSnapshot {
  return {
    platform: "macos",
    lifecycle: "offline",
    present: false,
    connected: false,
    spawnedByUs: false,
    progress: 0,
    message: "",
    ...partial,
  };
}

describe("mapSnapshotToReadyState", () => {
  it("returns ready when connected", () => {
    expect(mapSnapshotToReadyState(snapshot({ connected: true, present: true }))).toBe(
      "ready"
    );
  });

  it("returns missing when binary not present", () => {
    expect(mapSnapshotToReadyState(snapshot({ present: false }))).toBe("missing");
  });

  it("returns offline when present but not connected", () => {
    expect(mapSnapshotToReadyState(snapshot({ present: true, connected: false }))).toBe(
      "offline"
    );
  });

  it("returns unsupported for windows lifecycle", () => {
    expect(
      mapSnapshotToReadyState(
        snapshot({ lifecycle: "unsupported", present: false })
      )
    ).toBe("unsupported");
  });
});

describe("deriveHerdrActionLabel", () => {
  it("maps ready state to Bind Herdr", () => {
    expect(deriveHerdrActionLabel("ready")).toBe("Bind Herdr");
  });

  it("maps missing to Install Herdr", () => {
    expect(deriveHerdrActionLabel("missing")).toBe("Install Herdr");
  });

  it("maps offline to Connect Herdr", () => {
    expect(deriveHerdrActionLabel("offline")).toBe("Connect Herdr");
  });

  it("derives ready from store when online", () => {
    expect(readyStateFromStore(true, "connected")).toBe("ready");
    expect(readyStateFromStore(false, "missing")).toBe("missing");
    expect(readyStateFromStore(false, "present")).toBe("offline");
  });

  it("returns null while binding", () => {
    expect(deriveHerdrActionLabel("ready", true)).toBeNull();
  });
});

describe("HERDR_INSTALL_CMD", () => {
  it("uses official install script", () => {
    expect(HERDR_INSTALL_CMD).toContain("herdr.dev/install.sh");
  });
});
