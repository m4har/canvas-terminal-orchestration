import { useEffect, useRef } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { isAutomationMode } from "../lib/runtimeFlags";
import {
  dtoToFlowEdges,
  dtoToFlowNodes,
  loadCanvas,
  saveCanvas,
} from "../lib/workflow";

const DEBOUNCE_MS = 500;

export function useCanvasPersistence() {
  const workflowId = useCanvasStore((state) => state.workflowId);
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const hydrate = useCanvasStore((state) => state.hydrate);
  const loadDemoWorkflow = useCanvasStore((state) => state.loadDemoWorkflow);
  const initialized = useCanvasStore((state) => state.initialized);
  const setInitialized = useCanvasStore((state) => state.setInitialized);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadCanvas(workflowId).then(({ nodes: nodeDtos, edges: edgeDtos }) => {
      if (cancelled) return;

      if (nodeDtos.length > 0) {
        hydrate(dtoToFlowNodes(nodeDtos), dtoToFlowEdges(edgeDtos));
      } else {
        loadDemoWorkflow();
      }
      setInitialized(true);
      if (isAutomationMode()) {
        document.documentElement.dataset.e2eReady = "true";
      }
    });

    return () => {
      cancelled = true;
    };
  }, [workflowId, hydrate, loadDemoWorkflow, setInitialized]);

  useEffect(() => {
    if (!initialized) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveCanvas(workflowId, nodes, edges).catch(console.error);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [workflowId, nodes, edges, initialized]);
}
