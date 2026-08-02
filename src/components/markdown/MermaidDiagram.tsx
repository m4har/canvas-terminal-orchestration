import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { getMermaidConfig } from "../../lib/markdown/mermaidConfig";

type MermaidModule = typeof import("mermaid");

let mermaidModulePromise: Promise<MermaidModule["default"]> | null = null;

function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then((mod) => mod.default);
  }
  return mermaidModulePromise;
}

let renderQueue: Promise<void> = Promise.resolve();

function enqueueRender(fn: () => Promise<void>) {
  renderQueue = renderQueue.then(fn, fn).then(() => {
    renderQueue = Promise.resolve();
  });
}

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, "_");
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolved } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = await loadMermaid();
        if (cancelled) return;

        mermaid.initialize(getMermaidConfig(resolved === "dark"));
        const { svg } = await mermaid.render(`mermaid-${id}`, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Invalid mermaid syntax");
          document.getElementById(`dmermaid-${id}`)?.remove();
        }
      }
    };

    enqueueRender(render);
    return () => {
      cancelled = true;
    };
  }, [code, resolved, id]);

  if (error) {
    return (
      <div className="mermaid-error" data-testid="mermaid-error">
        <p className="mb-1 text-[var(--muted-foreground)]">Diagram error: {error}</p>
        <pre className="overflow-x-auto rounded bg-[var(--muted)] p-2 font-mono text-[0.85em]">
          {code}
        </pre>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-diagram" data-testid="mermaid-diagram" />;
}
