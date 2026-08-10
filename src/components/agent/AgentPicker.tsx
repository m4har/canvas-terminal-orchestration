import { useEffect, useState } from "react";
import {
  createOrchestraAgent,
  listAgentProfiles,
  listMcpServers,
  listOrchestraAgents,
  updateOrchestraAgent,
  type AgentProfile,
  type McpServer,
  type OrchestraAgent,
} from "../../lib/orchestra/client";

interface AgentPickerProps {
  open: boolean;
  initialSlug?: string;
  initialAgentId?: string;
  onClose: () => void;
  onSelect: (agent: OrchestraAgent) => void;
}

export function AgentPicker({
  open,
  initialSlug,
  initialAgentId,
  onClose,
  onSelect,
}: AgentPickerProps) {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [agents, setAgents] = useState<OrchestraAgent[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [mode, setMode] = useState<"pick" | "create">(initialAgentId ? "pick" : "create");
  const [slug, setSlug] = useState(initialSlug ?? "my-agent");
  const [profileId, setProfileId] = useState("planner");
  const [model, setModel] = useState("planner");
  const [modelTouched, setModelTouched] = useState(false);
  const [selectedMcp, setSelectedMcp] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setModelTouched(false);
    void listAgentProfiles().then((p) => {
      setProfiles(p);
      if (p.length > 0 && !p.some((x) => x.id === profileId)) {
        const nextProfileId = p[0].id;
        setProfileId(nextProfileId);
        setModel(nextProfileId);
      }
    });
    void listOrchestraAgents().then(setAgents);
    void listMcpServers().then(setMcpServers);
    if (initialSlug) setSlug(initialSlug);
  }, [open, initialSlug, profileId]);

  if (!open) return null;

  const submitCreate = async () => {
    const agent = await createOrchestraAgent({
      slug,
      profile_id: profileId,
      model,
      skill_paths: [],
      mcp_server_ids: selectedMcp,
    });
    onSelect(agent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
        <h2 className="mb-3 text-sm font-semibold">OrchestraAgent</h2>

        <div className="mb-3 flex gap-2 text-xs">
          <button
            type="button"
            className={`rounded px-2 py-1 ${mode === "pick" ? "bg-[var(--foreground)] text-[var(--background)]" : "border border-[var(--border)]"}`}
            onClick={() => setMode("pick")}
          >
            Reuse existing
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 ${mode === "create" ? "bg-[var(--foreground)] text-[var(--background)]" : "border border-[var(--border)]"}`}
            onClick={() => setMode("create")}
          >
            Create new
          </button>
        </div>

        {mode === "pick" ? (
          <ul className="mb-3 max-h-40 space-y-1 overflow-y-auto">
            {agents.map((agent) => (
              <li key={agent.id}>
                <button
                  type="button"
                  data-testid={`pick-agent-${agent.slug}`}
                  className="w-full rounded border border-[var(--border)] px-2 py-1.5 text-left text-xs hover:bg-[var(--muted)]"
                  onClick={() => {
                    onSelect(agent);
                    onClose();
                  }}
                >
                  {agent.slug} <span className="text-[var(--muted-foreground)]">({agent.profile_id})</span>
                </button>
              </li>
            ))}
            {agents.length === 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">No agents yet — create one.</p>
            )}
          </ul>
        ) : (
          <div className="mb-3 space-y-2 text-xs">
            <label className="block">
              Name (slug)
              <input
                data-testid="agent-slug"
                className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </label>
            <label className="block">
              Profile
              <select
                data-testid="agent-profile"
                className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5"
                value={profileId}
                onChange={(e) => {
                  const nextProfileId = e.target.value;
                  setProfileId(nextProfileId);
                  if (!modelTouched) setModel(nextProfileId);
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Model
              <input
                data-testid="agent-model"
                className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono normal-case"
                value={model}
                placeholder="planner"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => {
                  setModelTouched(true);
                  setModel(e.target.value);
                }}
              />
              <span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">
                Case-sensitive — e.g. planner, deepseek-4-flash
              </span>
            </label>
            {mcpServers.length > 0 && (
              <fieldset>
                <legend className="mb-1 text-[var(--muted-foreground)]">MCP servers</legend>
                {mcpServers.map((s) => (
                  <label key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMcp.includes(s.id)}
                      onChange={(e) =>
                        setSelectedMcp((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id)
                        )
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </fieldset>
            )}
            <button
              type="button"
              data-testid="agent-create"
              className="w-full rounded bg-[var(--foreground)] py-1.5 text-[var(--background)]"
              onClick={() => void submitCreate()}
            >
              Create agent
            </button>
          </div>
        )}

        <button type="button" className="text-xs text-[var(--muted-foreground)]" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface AgentInspectorProps {
  open: boolean;
  agentId: string | null;
  onClose: () => void;
  onUpdated: (agent: OrchestraAgent) => void;
}

export function AgentInspector({ open, agentId, onClose, onUpdated }: AgentInspectorProps) {
  const [agent, setAgent] = useState<OrchestraAgent | null>(null);
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);

  useEffect(() => {
    if (!open || !agentId) return;
    void listOrchestraAgents().then((list) => setAgent(list.find((a) => a.id === agentId) ?? null));
    void listAgentProfiles().then(setProfiles);
    void listMcpServers().then(setMcpServers);
  }, [open, agentId]);

  if (!open || !agent) return null;

  const save = async () => {
    const updated = await updateOrchestraAgent(agent.id, {
      slug: agent.slug,
      profile_id: agent.profile_id,
      model: agent.model,
      custom_system_prompt: agent.custom_system_prompt,
      skill_paths: agent.skill_paths,
      mcp_server_ids: agent.mcp_server_ids,
    });
    onUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
        <h2 className="mb-3 text-sm font-semibold">Agent config — {agent.slug}</h2>
        <div className="space-y-2 text-xs">
          <label className="block">
            Profile
            <select
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5"
              value={agent.profile_id}
              onChange={(e) => setAgent({ ...agent, profile_id: e.target.value })}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Model
            <input
              data-testid="agent-inspector-model"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono normal-case"
              value={agent.model}
              placeholder="planner"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setAgent({ ...agent, model: e.target.value })}
            />
            <span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">
              Case-sensitive — e.g. planner, deepseek-4-flash
            </span>
          </label>
          {mcpServers.length > 0 && (
            <fieldset>
              <legend className="mb-1 text-[var(--muted-foreground)]">Enabled MCP</legend>
              {mcpServers.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agent.mcp_server_ids.includes(s.id)}
                    onChange={(e) =>
                      setAgent({
                        ...agent,
                        mcp_server_ids: e.target.checked
                          ? [...agent.mcp_server_ids, s.id]
                          : agent.mcp_server_ids.filter((id) => id !== s.id),
                      })
                    }
                  />
                  {s.name}
                </label>
              ))}
            </fieldset>
          )}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="text-xs text-[var(--muted-foreground)]" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            data-testid="agent-inspector-save"
            className="rounded bg-[var(--foreground)] px-3 py-1.5 text-xs text-[var(--background)]"
            onClick={() => void save()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
