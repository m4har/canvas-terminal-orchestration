import { useEffect, useState } from "react";
import {
  exportMcpJson,
  getLlmSettings,
  importMcpJson,
  listMcpServers,
  setLlmSettings,
  testMcpServer,
  upsertMcpServer,
  deleteMcpServer,
  type LlmProvider,
  type LlmSettings,
  type McpServer,
} from "../../lib/orchestra/client";
import { AgentProfilesSection } from "./AgentProfilesSection";
import { SettingsStatusBanner } from "./SettingsStatusBanner";
import {
  settingsBtnGhost,
  settingsBtnPrimary,
  settingsBtnSecondary,
  settingsBtnSecondarySm,
  type SettingsStatus,
} from "./settingsUi";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [llm, setLlm] = useState<LlmSettings>({
    provider: "openai",
    base_url: "https://api.openai.com/v1",
    api_key: "",
  });
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [importText, setImportText] = useState("");
  const [llmSaving, setLlmSaving] = useState(false);
  const [llmStatus, setLlmStatus] = useState<SettingsStatus | null>(null);
  const [mcpStatus, setMcpStatus] = useState<SettingsStatus | null>(null);

  useEffect(() => {
    if (!open) return;
    setLlmStatus(null);
    setMcpStatus(null);
    void getLlmSettings().then(setLlm);
    void listMcpServers().then(setMcpServers);
  }, [open]);

  if (!open) return null;

  const saveLlm = async () => {
    setLlmSaving(true);
    setLlmStatus(null);
    try {
      await setLlmSettings(llm);
      setLlmStatus({ tone: "success", message: "LLM settings saved." });
    } catch (e) {
      setLlmStatus({
        tone: "error",
        message: e instanceof Error ? e.message : "Failed to save LLM settings.",
      });
    } finally {
      setLlmSaving(false);
    }
  };

  const addStdioMcp = async () => {
    setMcpStatus(null);
    try {
      const created = await upsertMcpServer({
        name: `mcp-${mcpServers.length + 1}`,
        transport: "stdio",
        command: "npx",
        args_json: JSON.stringify(["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]),
        env_json: "{}",
        headers_json: "{}",
        enabled: true,
      });
      setMcpServers((prev) => [...prev, created]);
      setMcpStatus({ tone: "success", message: `Added MCP server "${created.name}".` });
    } catch (e) {
      setMcpStatus({
        tone: "error",
        message: e instanceof Error ? e.message : "Failed to add MCP server.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Settings</h2>
          <button type="button" className={settingsBtnGhost} onClick={onClose}>
            Close
          </button>
        </div>

        <section className="mb-6 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            LLM
          </h3>
          <label className="block text-xs">
            Provider
            <select
              data-testid="llm-provider"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 text-xs"
              value={llm.provider}
              onChange={(e) =>
                setLlm((s) => ({
                  ...s,
                  provider: e.target.value as LlmProvider,
                  base_url:
                    e.target.value === "anthropic"
                      ? "https://api.anthropic.com/v1"
                      : "https://api.openai.com/v1",
                }))
              }
            >
              <option value="openai">OpenAI-compatible</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </label>
          <label className="block text-xs">
            Base URL
            <input
              data-testid="llm-base-url"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono text-xs"
              value={llm.base_url}
              onChange={(e) => setLlm((s) => ({ ...s, base_url: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            API key
            <input
              data-testid="llm-api-key"
              type="password"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-1.5 font-mono text-xs"
              value={llm.api_key}
              onChange={(e) => setLlm((s) => ({ ...s, api_key: e.target.value }))}
            />
          </label>
          <SettingsStatusBanner status={llmStatus} testId="llm-save-status" />
          <button
            type="button"
            data-testid="llm-save"
            className={settingsBtnPrimary}
            disabled={llmSaving}
            onClick={() => void saveLlm()}
          >
            {llmSaving ? "Saving…" : "Save LLM settings"}
          </button>
        </section>

        <AgentProfilesSection />

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              MCP Servers
            </h3>
            <button
              type="button"
              data-testid="mcp-add"
              className={settingsBtnSecondary}
              onClick={() => void addStdioMcp()}
            >
              Add MCP
            </button>
          </div>

          <SettingsStatusBanner status={mcpStatus} testId="mcp-status" />

          {mcpServers.map((server) => (
            <div
              key={server.id}
              className="rounded border border-[var(--border)] p-2 text-xs"
              data-testid={`mcp-row-${server.name}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{server.name}</span>
                <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  {server.transport}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  data-testid={`mcp-test-${server.id}`}
                  className={settingsBtnSecondarySm}
                  onClick={() =>
                    void testMcpServer(server.id).then((r) => {
                      if (r.ok) {
                        setMcpStatus({
                          tone: "success",
                          message: `${r.server_name}: ${r.tools.join(", ") || "(no tools)"}`,
                        });
                      } else {
                        setMcpStatus({
                          tone: "error",
                          message: r.error ?? "MCP test failed.",
                        });
                      }
                    })
                  }
                >
                  Test
                </button>
                <button
                  type="button"
                  className={`${settingsBtnSecondarySm} text-red-600`}
                  onClick={() => {
                    setMcpStatus(null);
                    void deleteMcpServer(server.id)
                      .then(() => {
                        setMcpServers((prev) => prev.filter((s) => s.id !== server.id));
                        setMcpStatus({ tone: "success", message: `Deleted "${server.name}".` });
                      })
                      .catch((e) =>
                        setMcpStatus({
                          tone: "error",
                          message: e instanceof Error ? e.message : "Failed to delete MCP server.",
                        })
                      );
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <label className="block text-xs">
            Import mcp.json
            <textarea
              data-testid="mcp-import"
              className="mt-1 h-20 w-full rounded border border-[var(--border)] bg-[var(--muted)] p-2 font-mono text-[10px]"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="mcp-import-btn"
              className={settingsBtnSecondary}
              onClick={() => {
                setMcpStatus(null);
                void importMcpJson(importText)
                  .then((servers) => {
                    setMcpServers(servers);
                    setImportText("");
                    setMcpStatus({
                      tone: "success",
                      message: `Imported ${servers.length} MCP server(s).`,
                    });
                  })
                  .catch((e) =>
                    setMcpStatus({
                      tone: "error",
                      message: e instanceof Error ? e.message : "Failed to import MCP JSON.",
                    })
                  );
              }}
            >
              Import
            </button>
            <button
              type="button"
              data-testid="mcp-export-btn"
              className={settingsBtnSecondary}
              onClick={() => {
                setMcpStatus(null);
                void exportMcpJson()
                  .then((json) => {
                    setImportText(json);
                    setMcpStatus({ tone: "success", message: "Exported MCP JSON to field below." });
                  })
                  .catch((e) =>
                    setMcpStatus({
                      tone: "error",
                      message: e instanceof Error ? e.message : "Failed to export MCP JSON.",
                    })
                  );
              }}
            >
              Export
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
