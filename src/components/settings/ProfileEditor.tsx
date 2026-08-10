import { useEffect, useState } from "react";
import { Lock } from "@phosphor-icons/react";
import {
  createAgentProfile,
  deleteAgentProfile,
  duplicateAgentProfile,
  updateAgentProfile,
  type AgentProfile,
} from "../../lib/orchestra/client";
import { parseProfileSkills, serializeProfileSkills, SkillPicker } from "./SkillPicker";
import { SettingsStatusBanner } from "./SettingsStatusBanner";
import {
  settingsBtnPrimarySm,
  settingsBtnSecondary,
  settingsBtnSecondarySm,
  type SettingsStatus,
} from "./settingsUi";

export type ProfileEditorMode = "create" | "edit";

interface ProfileEditorProps {
  profile: AgentProfile | null;
  mode: ProfileEditorMode;
  onSaved: (profile: AgentProfile) => void;
  onDeleted: (id: string) => void;
  onDuplicated: (profile: AgentProfile) => void;
}

export function ProfileEditor({
  profile,
  mode,
  onSaved,
  onDeleted,
  onDuplicated,
}: ProfileEditorProps) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [duplicateId, setDuplicateId] = useState("");
  const [duplicateName, setDuplicateName] = useState("");
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);

  const isBundled = profile?.is_bundled ?? false;
  const readOnly = mode === "edit" && isBundled;

  useEffect(() => {
    if (mode === "create") {
      setId("");
      setName("");
      setPrompt("You are a helpful agent.");
      setSkills([]);
      setShowDuplicate(false);
      setStatus(null);
      return;
    }
    if (!profile) return;
    setId(profile.id);
    setName(profile.name);
    setPrompt(profile.system_prompt_template);
    setSkills(parseProfileSkills(profile.default_skills_json));
    setDuplicateId(`${profile.id}-custom`);
    setDuplicateName(`${profile.name} (custom)`);
    setShowDuplicate(false);
    setStatus(null);
  }, [profile, mode]);

  if (mode === "edit" && !profile) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Select a profile to edit, or create a new one.
      </p>
    );
  }

  const save = async () => {
    setStatus(null);
    setSaving(true);
    const input = {
      id: id.trim(),
      name: name.trim(),
      system_prompt_template: prompt,
      default_skills_json: serializeProfileSkills(skills),
    };
    try {
      const saved =
        mode === "create"
          ? await createAgentProfile(input)
          : await updateAgentProfile(input);
      setStatus({
        tone: "success",
        message: mode === "create" ? `Profile "${saved.name}" created.` : `Profile "${saved.name}" saved.`,
      });
      onSaved(saved);
    } catch (e) {
      setStatus({
        tone: "error",
        message: e instanceof Error ? e.message : "Failed to save profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!profile || !window.confirm(`Delete profile "${profile.name}"?`)) return;
    setStatus(null);
    setSaving(true);
    try {
      await deleteAgentProfile(profile.id);
      setStatus({ tone: "success", message: `Profile "${profile.name}" deleted.` });
      onDeleted(profile.id);
    } catch (e) {
      setStatus({
        tone: "error",
        message: e instanceof Error ? e.message : "Failed to delete profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    if (!profile) return;
    setStatus(null);
    setSaving(true);
    try {
      const copy = await duplicateAgentProfile({
        src_id: profile.id,
        new_id: duplicateId.trim(),
        new_name: duplicateName.trim(),
      });
      setStatus({ tone: "success", message: `Profile duplicated as "${copy.name}".` });
      onDuplicated(copy);
      setShowDuplicate(false);
    } catch (e) {
      setStatus({
        tone: "error",
        message: e instanceof Error ? e.message : "Failed to duplicate profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      {readOnly && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
          <Lock size={12} />
          Bundled profile — duplicate to customize
        </div>
      )}

      <label className="block">
        ID
        <input
          data-testid="profile-id"
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono text-xs normal-case"
          value={id}
          placeholder="my-profile"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={mode === "edit"}
          onChange={(e) => setId(e.target.value)}
        />
      </label>

      <label className="block">
        Display name
        <input
          data-testid="profile-name"
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 text-xs"
          value={name}
          disabled={readOnly}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block">
        System prompt
        <textarea
          data-testid="profile-prompt"
          className="mt-1 h-32 w-full resize-none rounded border border-[var(--border)] bg-[var(--muted)] p-2 font-mono text-[10px]"
          value={prompt}
          disabled={readOnly}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </label>

      <fieldset>
        <legend className="mb-1 text-[var(--muted-foreground)]">Default skills</legend>
        <SkillPicker selected={skills} onChange={setSkills} disabled={readOnly} />
      </fieldset>

      <SettingsStatusBanner status={status} testId="profile-status" />

      <div className="flex flex-wrap gap-2 pt-1">
        {!readOnly && (
          <>
            <button
              type="button"
              data-testid="profile-save"
              className={settingsBtnPrimarySm}
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : mode === "create" ? "Create profile" : "Save"}
            </button>
            {mode === "edit" && (
              <button
                type="button"
                data-testid="profile-delete"
                className={`${settingsBtnSecondary} text-[10px] text-red-600`}
                disabled={saving}
                onClick={() => void remove()}
              >
                Delete
              </button>
            )}
          </>
        )}
        {mode === "edit" && profile && (
          <button
            type="button"
            data-testid="profile-duplicate"
            className={`${settingsBtnSecondary} text-[10px]`}
            disabled={saving}
            onClick={() => setShowDuplicate(true)}
          >
            Duplicate
          </button>
        )}
      </div>

      {showDuplicate && profile && (
        <div
          data-testid="profile-duplicate-form"
          className="space-y-2 rounded border border-[var(--border)] p-2"
        >
          <label className="block text-[10px]">
            New profile id
            <input
              data-testid="profile-duplicate-id"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono text-[10px]"
              value={duplicateId}
              onChange={(e) => setDuplicateId(e.target.value)}
            />
          </label>
          <label className="block text-[10px]">
            New display name
            <input
              data-testid="profile-duplicate-name"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 text-[10px]"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
            />
          </label>
          <button
            type="button"
            data-testid="profile-duplicate-confirm"
            className={settingsBtnPrimarySm}
            disabled={saving}
            onClick={() => void duplicate()}
          >
            {saving ? "Creating…" : "Create duplicate"}
          </button>
        </div>
      )}
    </div>
  );
}
