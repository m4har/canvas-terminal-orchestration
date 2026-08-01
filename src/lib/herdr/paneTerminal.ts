import { isRealHerdrPane } from "./dispatch";
import { readPaneAnsi, sendPaneInput } from "./client";

const POLL_MS = 500;

export function syncPaneOutput(prev: string, next: string): { action: "skip" } | { action: "append"; text: string } | { action: "reset"; text: string } {
  if (next === prev) return { action: "skip" };
  if (prev && next.startsWith(prev)) {
    return { action: "append", text: next.slice(prev.length) };
  }
  return { action: "reset", text: next };
}

export function startPaneTerminalSync(
  paneId: string,
  onSync: (update: ReturnType<typeof syncPaneOutput>) => void,
  onInput: (data: string) => void,
  lines = 24
) {
  let snapshot = "";
  let stopped = false;
  const live = isRealHerdrPane(paneId);

  const poll = async () => {
    if (stopped || !live) return;
    try {
      const next = await readPaneAnsi(paneId, lines);
      const update = syncPaneOutput(snapshot, next);
      if (update.action !== "skip") {
        snapshot = next;
        onSync(update);
      }
    } catch {
      // ponytail: poll errors are transient while pane warms up
    }
  };

  const timer = live ? window.setInterval(() => void poll(), POLL_MS) : undefined;
  if (live) void poll();

  return {
    pushMock(text: string) {
      const update = syncPaneOutput(snapshot, text);
      if (update.action !== "skip") {
        snapshot = text;
        onSync(update);
      }
    },
    async send(data: string) {
      if (live) {
        await sendPaneInput(paneId, data);
        onInput(data);
        await poll();
      } else {
        onInput(data);
      }
    },
    dispose() {
      stopped = true;
      if (timer) window.clearInterval(timer);
    },
  };
}
