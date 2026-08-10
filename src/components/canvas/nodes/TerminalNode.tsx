import { useCallback, useEffect, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useTerminalFontSize } from "../../../hooks/useTerminalFontSize";
import {
  isHerdrBound,
  terminalPaneIdLabel,
} from "../../../lib/herdr/bind";
import { isTauriRuntime } from "../../../lib/workflow";
import { getPaneStatus } from "../../../lib/herdr/client";
import { isRealHerdrPane } from "../../../lib/herdr/dispatch";
import {
  deriveHerdrActionLabel,
  readyStateFromStore,
} from "../../../lib/herdr/requireHerdr";
import type { TerminalNodeData } from "../../../lib/types";
import { XtermView } from "../../terminal/XtermView";
import { NodeSizeResizer } from "./NodeSizeResizer";
import { SourceHandle, TargetHandle } from "./NodeHandles";
import { StatusIcon } from "./StatusIcon";

function PaneIdBadge({ paneId, local }: { paneId: string; local: boolean }) {
  const [copied, setCopied] = useState(false);

  if (local) {
    return (
      <span
        data-testid="terminal-pane-id"
        title="Local shell — bind Herdr optionally for multiplexer"
        className="ml-auto shrink-0 rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--muted-foreground)]"
      >
        local
      </span>
    );
  }

  return (
    <button
      type="button"
      data-testid="terminal-pane-id"
      title="Copy pane id for markdown references"
      className="nodrag nopan nowheel ml-auto shrink-0 rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(paneId).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? "copied" : paneId}
    </button>
  );
}

export function TerminalNode({
  id,
  data,
  selected,
}: NodeProps & { data: TerminalNodeData }) {
  const updateTerminal = useCanvasStore((s) => s.updateTerminalNode);
  const bindHerdr = useCanvasStore((s) => s.bindHerdr);
  const rebindHerdr = useCanvasStore((s) => s.rebindHerdr);
  const herdrOnline = useCanvasStore((s) => s.herdrOnline);
  const herdrLifecycle = useCanvasStore((s) => s.herdrLifecycle);
  const { fontSize } = useTerminalFontSize();
  const [editingLabel, setEditingLabel] = useState(false);
  const terminalSizeRef = useRef({ cols: 80, rows: 24 });
  const prevPtyIdRef = useRef<string | undefined>(data.ptyId);
  const herdrWasOnlineRef = useRef(herdrOnline === true);
  const paneIdLabel = terminalPaneIdLabel(data);
  const bound = isHerdrBound(data);

  const handlePtyId = useCallback(
    (ptyId: string) => {
      if (data.ptyId !== ptyId) {
        updateTerminal(id, { ptyId });
      }
    },
    [data.ptyId, id, updateTerminal]
  );

  const handleTerminalSize = useCallback((cols: number, rows: number) => {
    terminalSizeRef.current = { cols, rows };
  }, []);

  const handleBindHerdr = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { cols, rows } = terminalSizeRef.current;
    const ptyId = data.ptyId ?? (isTauriRuntime() ? "" : "mock-pty");
    bindHerdr(id, ptyId, cols, rows);
  };

  useEffect(() => {
    if (
      !selected ||
      bound ||
      !data.ptyId ||
      !isRealHerdrPane(data.herdrPaneId)
    ) {
      return;
    }

    const { cols, rows } = terminalSizeRef.current;
    bindHerdr(id, data.ptyId, cols, rows);
  }, [selected, bound, data.ptyId, data.herdrPaneId, id, bindHerdr]);

  useEffect(() => {
    if (!selected || !bound || !data.ptyId || !isRealHerdrPane(data.herdrPaneId)) {
      prevPtyIdRef.current = data.ptyId;
      return;
    }

    const prev = prevPtyIdRef.current;
    prevPtyIdRef.current = data.ptyId;
    if (prev !== data.ptyId) {
      const { cols, rows } = terminalSizeRef.current;
      rebindHerdr(id, data.ptyId, cols, rows);
    }
  }, [selected, data.ptyId, bound, data.herdrPaneId, id, rebindHerdr]);

  useEffect(() => {
    const online = herdrOnline === true;
    if (
      online &&
      !herdrWasOnlineRef.current &&
      selected &&
      bound &&
      data.ptyId &&
      isRealHerdrPane(data.herdrPaneId)
    ) {
      const { cols, rows } = terminalSizeRef.current;
      rebindHerdr(id, data.ptyId, cols, rows);
    }
    herdrWasOnlineRef.current = online;
  }, [herdrOnline, selected, bound, data.ptyId, data.herdrPaneId, id, rebindHerdr]);

  useEffect(() => {
    if (!bound || !isRealHerdrPane(data.herdrPaneId)) return;

    const poll = async () => {
      const status = await getPaneStatus(data.herdrPaneId);
      if (status !== data.status) {
        updateTerminal(id, { status });
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 2000);
    return () => window.clearInterval(timer);
  }, [data.herdrBound, data.herdrPaneId, data.status, id, updateTerminal, bound]);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLabel(true);
  };

  const binding = data.status === "working" && !bound;
  const herdrState = readyStateFromStore(herdrOnline, herdrLifecycle);
  const bindLabel = deriveHerdrActionLabel(herdrState, binding);
  const awaitingPty = isTauriRuntime() && !bound && !data.ptyId;

  return (
    <div
      className={`relative flex h-full min-h-[160px] min-w-[240px] flex-col rounded-md border border-[var(--border)] bg-[var(--node-fill)] shadow-sm ${
        selected ? "ring-1 ring-[var(--ring)]" : ""
      }`}
    >
      <TargetHandle />
      <SourceHandle />
      <NodeSizeResizer selected={!!selected} minWidth={240} minHeight={160} />

      <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 py-1.5">
        <StatusIcon status={data.status} />
        {editingLabel || selected ? (
          <input
            data-testid="terminal-label-input"
            className="nodrag nopan nowheel min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
            value={data.label}
            autoFocus={editingLabel}
            onBlur={() => setEditingLabel(false)}
            onFocus={() => setEditingLabel(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditingLabel(false);
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => updateTerminal(id, { label: e.target.value })}
          />
        ) : (
          <span
            data-testid="terminal-label"
            className="min-w-0 flex-1 cursor-text truncate text-sm font-medium"
            onDoubleClick={startEdit}
          >
            {data.label}
          </span>
        )}
        {data.agentKind && (
          <span className="shrink-0 rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--muted-foreground)]">
            {data.agentKind}
          </span>
        )}
        {bound && paneIdLabel ? (
          <PaneIdBadge paneId={paneIdLabel} local={false} />
        ) : null}
        {!bound && bindLabel ? (
          <button
            type="button"
            data-testid="terminal-bind-herdr"
            disabled={binding || awaitingPty}
            title={awaitingPty ? "Wait for local shell to connect" : undefined}
            className="nodrag nopan nowheel shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
            onClick={handleBindHerdr}
          >
            {bindLabel}
          </button>
        ) : null}
        {!bound ? (
          <PaneIdBadge paneId="" local />
        ) : null}
        {binding ? (
          <span className="shrink-0 text-[9px] text-[var(--warning)]">binding…</span>
        ) : null}
      </div>
      <XtermView
        ptyId={data.ptyId}
        cwd={data.cwd}
        herdrPaneId={bound ? data.herdrPaneId : undefined}
        fallbackText={data.outputPreview || `$ ${data.label}\n`}
        lines={10}
        fontSize={fontSize}
        active={!!selected}
        onPtyId={handlePtyId}
        onTerminalSize={handleTerminalSize}
        herdrBound={bound}
        className="min-h-0 flex-1 border-t border-[var(--border)] bg-transparent p-1"
      />
    </div>
  );
}
