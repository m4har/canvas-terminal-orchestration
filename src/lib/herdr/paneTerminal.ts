import { isAutomationMode } from "../runtimeFlags";
import { encodeXtermInput } from "../terminal/xtermInput";
import { isRealHerdrPane } from "./dispatch";
import { readPaneRecent, readPaneVisible, sendPaneInput } from "./client";

const POLL_MS = 150;
const ENTER_DEBOUNCE_MS = 80;
const VISIBLE_RESYNC_AFTER_EMPTY = 3;

export type PaneSyncUpdate =
  | { action: "skip" }
  | { action: "append"; text: string }
  | { action: "reset"; text: string };

export function syncVisibleOutput(prev: string, next: string): PaneSyncUpdate {
  if (next === prev) return { action: "skip" };
  if (!next && prev) return { action: "skip" };
  return { action: "reset", text: next };
}

export function startPaneTerminalSync(
  paneId: string,
  onSync: (update: PaneSyncUpdate) => void,
  onInput: (data: string) => void,
  lines = 24,
  active = true
) {
  let visibleSnapshot = "";
  let stopped = false;
  let pollTimer: number | undefined;
  let enterTimer: number | undefined;
  let polling = false;
  let emptyRecentCount = 0;
  const live =
    active && !isAutomationMode() && isRealHerdrPane(paneId);

  const resyncVisible = async () => {
    if (stopped || !live) return;
    try {
      const next = await readPaneVisible(paneId, lines);
      const update = syncVisibleOutput(visibleSnapshot, next);
      if (update.action !== "skip") {
        visibleSnapshot = next;
        onSync(update);
      }
    } catch {
      // ponytail: pane may still be warming up
    }
  };

  const pollRecent = async () => {
    if (stopped || !live || polling) return;
    polling = true;
    try {
      const recent = await readPaneRecent(paneId, lines);
      if (recent) {
        emptyRecentCount = 0;
        onSync({ action: "append", text: recent });
      } else {
        emptyRecentCount += 1;
        if (emptyRecentCount >= VISIBLE_RESYNC_AFTER_EMPTY) {
          emptyRecentCount = 0;
          await resyncVisible();
        }
      }
    } catch {
      // ponytail: poll errors are transient while pane warms up
    } finally {
      polling = false;
      scheduleNextPoll();
    }
  };

  const scheduleNextPoll = () => {
    if (stopped || !live) return;
    if (pollTimer) window.clearTimeout(pollTimer);
    pollTimer = window.setTimeout(() => {
      pollTimer = undefined;
      void pollRecent();
    }, POLL_MS);
  };

  const scheduleVisibleResync = () => {
    if (!live) return;
    if (enterTimer) window.clearTimeout(enterTimer);
    enterTimer = window.setTimeout(() => {
      enterTimer = undefined;
      void resyncVisible();
    }, ENTER_DEBOUNCE_MS);
  };

  if (live) {
    void resyncVisible().then(() => scheduleNextPoll());
  }

  return {
    pushMock(text: string) {
      const update = syncVisibleOutput(visibleSnapshot, text);
      if (update.action !== "skip") {
        visibleSnapshot = text;
        onSync(update);
      }
    },
    send(data: string) {
      if (isRealHerdrPane(paneId) && !isAutomationMode()) {
        const input = encodeXtermInput(data);
        const isEnter = input.kind === "keys" && input.keys[0] === "enter";
        void sendPaneInput(paneId, data);
        onInput(data);
        if (isEnter) {
          scheduleVisibleResync();
        }
      } else {
        onInput(data);
      }
    },
    dispose() {
      stopped = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (enterTimer) window.clearTimeout(enterTimer);
    },
  };
}
