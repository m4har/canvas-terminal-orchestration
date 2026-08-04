import { ensureHerdrPresent } from "./status";
import { isTauriRuntime } from "../workflow";

export async function runInstallViaApp(
  onProgress: (progress: number, message: string) => void
): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  onProgress(0.05, "starting");
  try {
    const status = await ensureHerdrPresent();
    onProgress(status.progress, status.message);
    return status.present;
  } catch (err) {
    onProgress(0, err instanceof Error ? err.message : String(err));
    return false;
  }
}
