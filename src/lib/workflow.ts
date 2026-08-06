import { invoke } from "@tauri-apps/api/core";
import type { Edge, Node } from "@xyflow/react";
import {
  dtoToFlowEdge,
  dtoToFlowNode,
  edgeToDto,
  flowToSnapshot,
  nodeToDto,
  type CanvasEdgeDto,
  type CanvasNodeDto,
} from "./canvasSerde";
import { loadCanvasFromStorage, saveCanvasToStorage } from "./canvasStorage";

export type { CanvasEdgeDto, CanvasNodeDto } from "./canvasSerde";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export const APP_SETTING_INTRO_COMPLETED = "intro_completed";

function appSettingStorageKey(key: string) {
  return `canvas-orchestra:setting:${key}`;
}

export async function getAppSetting(key: string): Promise<string | null> {
  if (isTauriRuntime()) {
    return invoke<string | null>("get_app_setting", { key });
  }

  return localStorage.getItem(appSettingStorageKey(key));
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("set_app_setting", { key, value });
    return;
  }

  localStorage.setItem(appSettingStorageKey(key), value);
}

export async function loadCanvas(
  workflowId: string
): Promise<{ nodes: CanvasNodeDto[]; edges: CanvasEdgeDto[] }> {
  if (isTauriRuntime()) {
    return invoke("load_canvas", { workflowId });
  }

  const { nodes, edges } = loadCanvasFromStorage(workflowId);
  return flowToSnapshot(nodes, edges);
}

export async function saveCanvas(
  workflowId: string,
  nodes: Node[],
  edges: Edge[]
): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("save_canvas", {
      workflowId,
      nodes: nodes.map(nodeToDto),
      edges: edges.map(edgeToDto),
    });
    return;
  }

  saveCanvasToStorage(workflowId, nodes, edges);
}

export function dtoToFlowNodes(dtos: CanvasNodeDto[]): Node[] {
  return dtos.map(dtoToFlowNode);
}

export function dtoToFlowEdges(dtos: CanvasEdgeDto[]): Edge[] {
  return dtos.map(dtoToFlowEdge);
}
