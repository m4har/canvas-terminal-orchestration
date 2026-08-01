import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./components/canvas/Canvas";
import { CanvasToolbar } from "./components/canvas/CanvasToolbar";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { useCanvasPersistence } from "./hooks/useCanvasPersistence";

function AppShell() {
  useCanvasPersistence();

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--background)] text-[var(--foreground)]">
      <ReactFlowProvider>
        <CanvasToolbar />
        <main className="min-h-0 flex-1">
          <Canvas />
        </main>
      </ReactFlowProvider>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
