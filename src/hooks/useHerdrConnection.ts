import { useEffect } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { connectHerdr } from "../lib/herdr/connect";
import { checkHerdrAvailable, reconcileTerminalPanes } from "../lib/herdr/dispatch";
import { isAutomationMode } from "../lib/runtimeFlags";

const POLL_MS = 3000;

export function useHerdrConnection() {
  const setHerdrOnline = useCanvasStore((s) => s.setHerdrOnline);

  useEffect(() => {
    if (isAutomationMode()) {
      setHerdrOnline(false);
      return;
    }

    let cancelled = false;
    let wasOnline = false;

    const sync = async () => {
      const online = await checkHerdrAvailable(false);
      if (cancelled) return;

      setHerdrOnline(online);
      if (online && !wasOnline) {
        await reconcileTerminalPanes(
          () => useCanvasStore.getState(),
          (partial) => useCanvasStore.setState(partial)
        );
      }
      wasOnline = online;
    };

    void connectHerdr().then(() => sync());
    const id = window.setInterval(() => void sync(), POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [setHerdrOnline]);
}

export async function refreshHerdrConnection(): Promise<boolean> {
  if (isAutomationMode()) return false;

  const online = await connectHerdr();
  useCanvasStore.getState().setHerdrOnline(online);
  if (online) {
    await reconcileTerminalPanes(
      () => useCanvasStore.getState(),
      (partial) => useCanvasStore.setState(partial)
    );
  }
  return online;
}
