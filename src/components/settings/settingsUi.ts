export const settingsBtnPrimary =
  "cursor-pointer rounded bg-[var(--foreground)] px-3 py-1.5 text-xs text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50";

export const settingsBtnPrimarySm =
  "cursor-pointer rounded bg-[var(--foreground)] px-2 py-1 text-[10px] text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50";

export const settingsBtnSecondary =
  "cursor-pointer rounded border border-[var(--border)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50";

export const settingsBtnSecondarySm =
  "cursor-pointer rounded border border-[var(--border)] px-2 py-0.5 text-[10px] disabled:cursor-not-allowed disabled:opacity-50";

export const settingsBtnGhost =
  "cursor-pointer text-xs text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50";

export type SettingsStatusTone = "success" | "error";

export interface SettingsStatus {
  tone: SettingsStatusTone;
  message: string;
}
