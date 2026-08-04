import { useEffect, useRef } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { takePendingHmrCanvasSnapshot } from "../lib/hmrCanvasSnapshot";
import { isAutomationMode } from "../lib/runtimeFlags";
import {
  dtoToFlowEdges,
  dtoToFlowNodes,
  loadCanvas,
  saveCanvas,
  getAppSetting,
  APP_SETTING_INTRO_COMPLETED,
} from "../lib/workflow";

const DEBOUNCE_MS = 500;

export function useCanvasPersistence() {
  const workflowId = useCanvasStore((state) => state.workflowId);
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const introActive = useCanvasStore((state) => state.introActive);
  const hydrate = useCanvasStore((state) => state.hydrate);
  const loadDemoWorkflow = useCanvasStore((state) => state.loadDemoWorkflow);
  const setIntroActive = useCanvasStore((state) => state.setIntroActive);
  const initialized = useCanvasStore((state) => state.initialized);
  const setInitialized = useCanvasStore((state) => state.setInitialized);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pendingHmr = takePendingHmrCanvasSnapshot();

    async function load() {
      const { nodes: nodeDtos, edges: edgeDtos } = await loadCanvas(workflowId);
      if (cancelled) return;

      if (nodeDtos.length > 0) {
        hydrate(dtoToFlowNodes(nodeDtos), dtoToFlowEdges(edgeDtos));
      } else if (
        pendingHmr &&
        (pendingHmr.nodes.length > 0 || pendingHmr.edges.length > 0)
      ) {
        hydrate(pendingHmr.nodes, pendingHmr.edges);
        setIntroActive(pendingHmr.introActive);
      } else {
        const introCompleted = await getAppSetting(APP_SETTING_INTRO_COMPLETED);
        if (introCompleted === "true") {
          // Leave empty canvas
        } else {
          loadDemoWorkflow();
          setIntroActive(true);
        }
      }

      setInitialized(true);
      if (isAutomationMode()) {
        document.documentElement.dataset.e2eReady = "true";
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    workflowId,
    hydrate,
    loadDemoWorkflow,
    setIntroActive,
    setInitialized,
  ]);

  useEffect(() => {
    if (!initialized || introActive) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveCanvas(workflowId, nodes, edges).catch(console.error);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [workflowId, nodes, edges, initialized, introActive]);
}
