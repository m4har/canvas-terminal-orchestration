import { useEffect, useMemo, useState } from "react";
import {
  createSkill,
  listInstalledSkills,
  type DiscoveredSkill,
} from "../../lib/orchestra/client";
import { SettingsStatusBanner } from "./SettingsStatusBanner";
import {
  settingsBtnGhost,
  settingsBtnPrimarySm,
  settingsBtnSecondary,
  type SettingsStatus,
} from "./settingsUi";

const SKILL_TEMPLATE = (id: string) =>
  `---\nname: ${id}\ndescription: Describe when to use this skill.\n---\n\n# ${id}\n\nAdd instructions here.\n`;

interface SkillPickerProps {
  selected: string[];
  onChange: (skills: string[]) => void;
  disabled?: boolean;
}

export function SkillPicker({ selected, onChange, disabled }: SkillPickerProps) {
  const [installed, setInstalled] = useState<DiscoveredSkill[]>([]);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newSkillId, setNewSkillId] = useState("");
  const [newSkillContent, setNewSkillContent] = useState("");
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => void listInstalledSkills().then(setInstalled);

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return installed;
    return installed.filter((s) => s.id.toLowerCase().includes(q));
  }, [installed, query]);

  const agentsSkills = filtered.filter((s) => s.source === "agents");
  const cursorSkills = filtered.filter((s) => s.source === "cursor");

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    );
  };

  const openCreate = () => {
    setShowCreate(true);
    setNewSkillId("");
    setNewSkillContent("");
    setStatus(null);
  };

  const saveNewSkill = async () => {
    setStatus(null);
    setSaving(true);
    try {
      const created = await createSkill({
        id: newSkillId.trim(),
        content: newSkillContent.trim() || undefined,
      });
      refresh();
      if (!selected.includes(created.id)) {
        onChange([...selected, created.id]);
      }
      setShowCreate(false);
      setStatus({ tone: "success", message: `Skill "${created.id}" created.` });
    } catch (e) {
      setStatus({
        tone: "error",
        message: e instanceof Error ? e.message : "Failed to create skill.",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (label: string, skills: DiscoveredSkill[]) => {
    if (skills.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="font-mono text-[10px] text-[var(--muted-foreground)]">{label}</p>
        <div className="flex flex-wrap gap-1">
          {skills.map((skill) => {
            const active = selected.includes(skill.id);
            return (
              <button
                key={`${skill.source}-${skill.id}`}
                type="button"
                data-testid={`skill-chip-${skill.id}`}
                disabled={disabled}
                className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-[10px] disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)]"
                }`}
                onClick={() => toggle(skill.id)}
              >
                {skill.id}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <input
          data-testid="skill-search"
          className="flex-1 rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono text-[10px]"
          placeholder="Search skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          data-testid="skill-create-toggle"
          className={settingsBtnSecondary}
          onClick={openCreate}
          disabled={disabled}
        >
          Create skill
        </button>
      </div>

      {renderGroup("~/.agents/skills", agentsSkills)}
      {renderGroup("~/.cursor/skills-cursor", cursorSkills)}

      {filtered.length === 0 && (
        <p className="text-[10px] text-[var(--muted-foreground)]">No skills found.</p>
      )}

      <SettingsStatusBanner status={status} testId="skill-status" />

      {showCreate && (
        <div
          data-testid="skill-create-form"
          className="space-y-2 rounded border border-[var(--border)] p-2"
        >
          <label className="block text-[10px]">
            Skill id
            <input
              data-testid="skill-create-id"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono text-[10px] normal-case"
              value={newSkillId}
              placeholder="my-workflow"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                const id = e.target.value;
                setNewSkillId(id);
                if (!newSkillContent || newSkillContent === SKILL_TEMPLATE(newSkillId)) {
                  setNewSkillContent(SKILL_TEMPLATE(id));
                }
              }}
            />
          </label>
          <label className="block text-[10px]">
            SKILL.md content
            <textarea
              data-testid="skill-create-content"
              className="mt-1 h-28 w-full resize-none rounded border border-[var(--border)] bg-[var(--muted)] p-2 font-mono text-[10px]"
              value={newSkillContent}
              onChange={(e) => setNewSkillContent(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="skill-create-save"
              className={settingsBtnPrimarySm}
              disabled={saving}
              onClick={() => void saveNewSkill()}
            >
              {saving ? "Saving…" : "Save skill"}
            </button>
            <button
              type="button"
              className={settingsBtnGhost}
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function parseProfileSkills(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

export function serializeProfileSkills(skills: string[]): string {
  return JSON.stringify(skills);
}
