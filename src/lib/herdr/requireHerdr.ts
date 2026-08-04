import { checkHerdrAvailable } from "./dispatch";
import { fetchHerdrStatus, type HerdrStatusSnapshot } from "./status";
import { isTauriRuntime } from "../workflow";

export type HerdrInstallReason = "bind" | "handoff" | "toolbar";

export const HERDR_INSTALL_CMD = "curl -fsSL https://herdr.dev/install.sh | sh";

export type HerdrReadyState = "ready" | "missing" | "offline" | "unsupported";

export interface HerdrReadyAssessment {
  state: HerdrReadyState;
  snapshot: HerdrStatusSnapshot;
}

export function mapSnapshotToReadyState(snapshot: HerdrStatusSnapshot): HerdrReadyState {
  if (snapshot.lifecycle === "unsupported") return "unsupported";
  if (snapshot.connected) return "ready";
  if (!snapshot.present) return "missing";
  return "offline";
}

export function deriveHerdrActionLabel(
  state: HerdrReadyState,
  binding = false
): string | null {
  if (binding) return null;
  switch (state) {
    case "ready":
      return "Bind Herdr";
    case "missing":
    case "unsupported":
      return "Install Herdr";
    case "offline":
      return "Connect Herdr";
    default:
      return "Bind Herdr";
  }
}

export function readyStateFromStore(
  online: boolean | null,
  lifecycle: import("./status").HerdrLifecycle | null
): HerdrReadyState {
  if (lifecycle === "unsupported") return "unsupported";
  if (online === true || lifecycle === "connected") return "ready";
  if (lifecycle === "present" || lifecycle === "offline" || lifecycle === "starting") {
    return "offline";
  }
  return "missing";
}

export async function assessHerdrReady(forceConnect = false): Promise<HerdrReadyAssessment> {
  if (isTauriRuntime()) {
    let snapshot = await fetchHerdrStatus();
    if (snapshot.connected) {
      return { state: "ready", snapshot };
    }
    if (forceConnect) {
      const online = await checkHerdrAvailable(true);
      snapshot = await fetchHerdrStatus();
      return {
        state: online ? "ready" : mapSnapshotToReadyState(snapshot),
        snapshot,
      };
    }
    return { state: mapSnapshotToReadyState(snapshot), snapshot };
  }

  const online = forceConnect
    ? await checkHerdrAvailable(true)
    : await checkHerdrAvailable(false);
  if (online) {
    const snapshot = await fetchHerdrStatus();
    return {
      state: "ready",
      snapshot: { ...snapshot, connected: true, present: true, lifecycle: "connected" },
    };
  }
  return { state: "missing", snapshot: await fetchHerdrStatus() };
}
