import { useEffect, useState } from "react";
import { Lock } from "@phosphor-icons/react";
import { listAgentProfiles, type AgentProfile } from "../../lib/orchestra/client";
import { ProfileEditor } from "./ProfileEditor";
import { settingsBtnSecondary } from "./settingsUi";

export function AgentProfilesSection() {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("edit");

  const refresh = () => void listAgentProfiles().then(setProfiles);

  useEffect(() => {
    refresh();
  }, []);

  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  const handleSaved = (profile: AgentProfile) => {
    refresh();
    setSelectedId(profile.id);
    setMode("edit");
  };

  const handleDeleted = (id: string) => {
    refresh();
    if (selectedId === id) {
      setSelectedId(null);
      setMode("edit");
    }
  };

  const handleDuplicated = (profile: AgentProfile) => {
    refresh();
    setSelectedId(profile.id);
    setMode("edit");
  };

  return (
    <section className="mb-6 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Agent Profiles
        </h3>
        <button
          type="button"
          data-testid="profile-new"
          className={settingsBtnSecondary}
          onClick={() => {
            setMode("create");
            setSelectedId(null);
          }}
        >
          New profile
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ul
          data-testid="profile-list"
          className="max-h-64 space-y-1 overflow-y-auto rounded border border-[var(--border)] p-1"
        >
          {profiles.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                data-testid={`profile-row-${profile.id}`}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs disabled:cursor-not-allowed ${
                  selectedId === profile.id && mode === "edit"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "hover:bg-[var(--muted)]"
                }`}
                onClick={() => {
                  setMode("edit");
                  setSelectedId(profile.id);
                }}
              >
                <span className="truncate">
                  {profile.name}{" "}
                  <span className="font-mono text-[10px] opacity-70">({profile.id})</span>
                </span>
                {profile.is_bundled && (
                  <Lock
                    size={12}
                    className={
                      selectedId === profile.id && mode === "edit"
                        ? "text-[var(--background)]"
                        : "text-[var(--muted-foreground)]"
                    }
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="min-w-0">
          <ProfileEditor
            profile={mode === "edit" ? selected : null}
            mode={mode}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onDuplicated={handleDuplicated}
          />
        </div>
      </div>
    </section>
  );
}
