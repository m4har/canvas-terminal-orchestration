import { isAutomationMode } from "../runtimeFlags";
import { isRealHerdrPane } from "./dispatch";
import { readPaneAnsi, sendPaneInput } from "./client";

const POLL_MS = 1000;
const INPUT_POLL_DEBOUNCE_MS = 50;
const INPUT_GRACE_MS = 200;

export function syncPaneOutput(prev: string, next: string): { action: "skip" } | { action: "append"; text: string } | { action: "reset"; text: string } {
  if (next === prev) return { action: "skip" };
  if (!next && prev) return { action: "skip" };
  if (prev && next.startsWith(prev)) {
    return { action: "append", text: next.slice(prev.length) };
  }
  return { action: "reset", text: next };
}

export function startPaneTerminalSync(
  paneId: string,
  onSync: (update: ReturnType<typeof syncPaneOutput>) => void,
  onInput: (data: string) => void,
  lines = 24,
  active = true
) {
  let snapshot = "";
  let stopped = false;
  let inputPollTimer: number | undefined;
  let pollTimer: number | undefined;
  let inputGraceUntil = 0;
  const live =
    active && !isAutomationMode() && isRealHerdrPane(paneId);

  const poll = async () => {
    if (stopped || !live) return;
    try {
      const next = await readPaneAnsi(paneId, lines);
      const update = syncPaneOutput(snapshot, next);
      if (update.action === "reset" && Date.now() < inputGraceUntil) return;
      if (update.action !== "skip") {
        snapshot = next;
        onSync(update);
      }
    } catch {
      // ponytail: poll errors are transient while pane warms up
    }
  };

  const schedulePoll = () => {
    if (!live) return;
    if (inputPollTimer) window.clearTimeout(inputPollTimer);
    inputPollTimer = window.setTimeout(() => {
      inputPollTimer = undefined;
      void poll();
    }, INPUT_POLL_DEBOUNCE_MS);
  };

  if (live) {
    pollTimer = window.setInterval(() => void poll(), POLL_MS);
    void poll();
  }

  return {
    pushMock(text: string) {
      const update = syncPaneOutput(snapshot, text);
      if (update.action !== "skip") {
        snapshot = text;
        onSync(update);
      }
    },
    send(data: string) {
      if (isRealHerdrPane(paneId) && !isAutomationMode()) {
        inputGraceUntil = Date.now() + INPUT_GRACE_MS;
        void sendPaneInput(paneId, data);
        onInput(data);
        schedulePoll();
      } else {
        onInput(data);
      }
    },
    dispose() {
      stopped = true;
      if (pollTimer) window.clearInterval(pollTimer);
      if (inputPollTimer) window.clearTimeout(inputPollTimer);
    },
  };
}
