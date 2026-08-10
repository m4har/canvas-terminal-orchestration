import type { SettingsStatus } from "./settingsUi";

interface SettingsStatusBannerProps {
  status: SettingsStatus | null;
  testId?: string;
}

export function SettingsStatusBanner({ status, testId }: SettingsStatusBannerProps) {
  if (!status) return null;

  return (
    <p
      data-testid={testId}
      role="status"
      aria-live="polite"
      className={`rounded border px-2 py-1.5 text-[10px] ${
        status.tone === "success"
          ? "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]"
          : "border-[var(--border)] bg-[var(--muted)] text-red-600"
      }`}
    >
      {status.message}
    </p>
  );
}
