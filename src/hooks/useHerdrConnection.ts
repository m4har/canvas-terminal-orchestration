import { useEffect } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { connectHerdr } from "../lib/herdr/connect";
import { checkHerdrAvailable, reconcileTerminalPanes } from "../lib/herdr/dispatch";
import { fetchHerdrStatus } from "../lib/herdr/status";
import { isAutomationMode } from "../lib/runtimeFlags";
import { isTauriRuntime } from "../lib/workflow";

const POLL_MS = 3000;

export function useHerdrConnection() {
  const setHerdrOnline = useCanvasStore((s) => s.setHerdrOnline);
  const setHerdrLifecycle = useCanvasStore((s) => s.setHerdrLifecycle);

  useEffect(() => {
    if (isAutomationMode()) {
      setHerdrOnline(false);
      setHerdrLifecycle("offline");
      return;
    }

    let cancelled = false;
    let wasOnline = false;

    const sync = async () => {
      if (isTauriRuntime()) {
        const status = await fetchHerdrStatus();
        if (cancelled) return;
        setHerdrLifecycle(status.lifecycle);
      }

      const online = await checkHerdrAvailable(false);
      if (cancelled) return;

      setHerdrOnline(online);
      if (online) {
        setHerdrLifecycle("connected");
      }
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
  }, [setHerdrOnline, setHerdrLifecycle]);
}

export async function refreshHerdrConnection(): Promise<boolean> {
  if (isAutomationMode()) return false;

  const online = await connectHerdr();
  if (isTauriRuntime()) {
    const status = await fetchHerdrStatus();
    useCanvasStore.getState().setHerdrLifecycle(status.lifecycle);
  }
  useCanvasStore.getState().setHerdrOnline(online);
  if (online) {
    useCanvasStore.getState().setHerdrLifecycle("connected");
    await reconcileTerminalPanes(
      () => useCanvasStore.getState(),
      (partial) => useCanvasStore.setState(partial)
    );
  }
  return online;
}
