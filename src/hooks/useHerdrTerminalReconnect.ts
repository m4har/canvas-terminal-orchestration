import { useEffect, useRef } from "react";
import { reconnectBoundTerminals } from "../lib/herdr/bind";
import { isAutomationMode } from "../lib/runtimeFlags";
import { isTauriRuntime } from "../lib/workflow";
import { useCanvasStore } from "../stores/canvasStore";

/** Reconnect persisted Herdr-bound terminals when the app opens or Herdr comes back online. */
export function useHerdrTerminalReconnect() {
  const initialized = useCanvasStore((s) => s.initialized);
  const introActive = useCanvasStore((s) => s.introActive);
  const herdrOnline = useCanvasStore((s) => s.herdrOnline);
  const wasOnlineRef = useRef(false);

  useEffect(() => {
    if (isAutomationMode() || !isTauriRuntime()) return;
    if (!initialized || introActive) return;

    const online = herdrOnline === true;
    if (online && !wasOnlineRef.current) {
      void reconnectBoundTerminals(() => useCanvasStore.getState());
    }
    wasOnlineRef.current = online;
  }, [initialized, introActive, herdrOnline]);
}
