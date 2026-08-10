import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../workflow";

export type LlmProvider = "openai" | "anthropic";

export interface LlmSettings {
  provider: LlmProvider;
  base_url: string;
  api_key: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  system_prompt_template: string;
  default_skills_json: string;
  is_bundled: boolean;
}

export interface UpsertAgentProfileInput {
  id: string;
  name: string;
  system_prompt_template: string;
  default_skills_json: string;
}

export interface DuplicateAgentProfileInput {
  src_id: string;
  new_id: string;
  new_name: string;
}

export interface DiscoveredSkill {
  id: string;
  path: string;
  source: string;
}

export interface CreateSkillInput {
  id: string;
  content?: string | null;
}

export interface OrchestraAgent {
  id: string;
  slug: string;
  profile_id: string;
  model: string;
  custom_system_prompt?: string | null;
  skill_paths: string[];
  mcp_server_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrchestraAgentInput {
  slug: string;
  profile_id: string;
  model: string;
  custom_system_prompt?: string | null;
  skill_paths: string[];
  mcp_server_ids: string[];
}

export interface McpServer {
  id: string;
  name: string;
  transport: "stdio" | "http";
  command?: string | null;
  args_json: string;
  env_json: string;
  url?: string | null;
  headers_json: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpsertMcpServerInput {
  id?: string;
  name: string;
  transport: string;
  command?: string | null;
  args_json: string;
  env_json: string;
  url?: string | null;
  headers_json: string;
  enabled: boolean;
}

export interface McpTestResult {
  ok: boolean;
  server_name: string;
  tools: string[];
  error?: string | null;
}

export interface OrchestraAgentChunkEvent {
  nodeId: string;
  chunk: string;
}

export interface OrchestraAgentStatusEvent {
  nodeId: string;
  status: string;
  fullResponse?: string;
}

export async function listOrchestraAgents(): Promise<OrchestraAgent[]> {
  if (!isTauriRuntime()) return [];
  return invoke<OrchestraAgent[]>("orchestra_agent_list");
}

export async function listAgentProfiles(): Promise<AgentProfile[]> {
  if (!isTauriRuntime()) return [];
  return invoke<AgentProfile[]>("orchestra_agent_profiles_list");
}

export async function createAgentProfile(
  input: UpsertAgentProfileInput
): Promise<AgentProfile> {
  return invoke<AgentProfile>("orchestra_agent_profile_create", { input });
}

export async function updateAgentProfile(
  input: UpsertAgentProfileInput
): Promise<AgentProfile> {
  return invoke<AgentProfile>("orchestra_agent_profile_update", { input });
}

export async function deleteAgentProfile(id: string): Promise<void> {
  await invoke("orchestra_agent_profile_delete", { id });
}

export async function duplicateAgentProfile(
  input: DuplicateAgentProfileInput
): Promise<AgentProfile> {
  return invoke<AgentProfile>("orchestra_agent_profile_duplicate", { input });
}

export async function listInstalledSkills(): Promise<DiscoveredSkill[]> {
  if (!isTauriRuntime()) return [];
  return invoke<DiscoveredSkill[]>("skills_list_installed");
}

export async function createSkill(input: CreateSkillInput): Promise<DiscoveredSkill> {
  return invoke<DiscoveredSkill>("skills_create", { input });
}

export async function readSkill(path: string): Promise<string> {
  return invoke<string>("skills_read", { path });
}

export async function createOrchestraAgent(
  input: CreateOrchestraAgentInput
): Promise<OrchestraAgent> {
  return invoke<OrchestraAgent>("orchestra_agent_create", { input });
}

export async function updateOrchestraAgent(
  id: string,
  input: CreateOrchestraAgentInput
): Promise<OrchestraAgent> {
  return invoke<OrchestraAgent>("orchestra_agent_update", { id, input });
}

export async function deleteOrchestraAgent(id: string): Promise<void> {
  await invoke("orchestra_agent_delete", { id });
}

export async function getLlmSettings(): Promise<LlmSettings> {
  if (!isTauriRuntime()) {
    return { provider: "openai", base_url: "https://api.openai.com/v1", api_key: "" };
  }
  return invoke<LlmSettings>("llm_settings_get");
}

export async function setLlmSettings(settings: LlmSettings): Promise<void> {
  await invoke("llm_settings_set", { settings });
}

export async function playOrchestraAgent(input: {
  agentId: string;
  nodeId: string;
  cwd: string;
  prompt: string;
  mirrorPtyId?: string;
}): Promise<void> {
  await invoke("orchestra_agent_play", {
    input: {
      agent_id: input.agentId,
      node_id: input.nodeId,
      cwd: input.cwd,
      prompt: input.prompt,
      mirror_pty_id: input.mirrorPtyId ?? null,
    },
  });
}

export async function listMcpServers(): Promise<McpServer[]> {
  if (!isTauriRuntime()) return [];
  return invoke<McpServer[]>("mcp_server_list");
}

export async function upsertMcpServer(input: UpsertMcpServerInput): Promise<McpServer> {
  return invoke<McpServer>("mcp_server_upsert", { input });
}

export async function deleteMcpServer(id: string): Promise<void> {
  await invoke("mcp_server_delete", { id });
}

export async function testMcpServer(id: string): Promise<McpTestResult> {
  return invoke<McpTestResult>("mcp_server_test", { id });
}

export async function importMcpJson(json: string): Promise<McpServer[]> {
  return invoke<McpServer[]>("mcp_import_json", { json });
}

export async function exportMcpJson(): Promise<string> {
  return invoke<string>("mcp_export_json");
}

export function listenOrchestraAgentChunk(
  handler: (event: OrchestraAgentChunkEvent) => void
): Promise<UnlistenFn> {
  return listen<OrchestraAgentChunkEvent>("orchestra-agent-chunk", (e) => {
    handler(e.payload);
  });
}

export function listenOrchestraAgentStatus(
  handler: (event: OrchestraAgentStatusEvent) => void
): Promise<UnlistenFn> {
  return listen<OrchestraAgentStatusEvent>("orchestra-agent-status", (e) => {
    handler(e.payload);
  });
}
