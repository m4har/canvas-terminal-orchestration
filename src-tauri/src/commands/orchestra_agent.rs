use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;
use workflow::{AgentProfile, McpServerRecord, OrchestraAgentRecord, WorkflowRepo};

use crate::commands::pty::PtyState;
use crate::orchestrator::OrchestratorState;

use crate::orchestrator_agent::{
    assemble_preamble,
    memory,
    mcp,
    preamble::{self, PreambleInput},
    runtime::{stream_completion, LlmProvider, LlmSettings},
    skills::{
        bundled_skill_paths, create_global_skill, default_skill_template, discover_installed_skills,
        load_skill_contents, read_skill, DiscoveredSkill,
    },
};
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestraAgentDto {
    pub id: String,
    pub slug: String,
    pub profile_id: String,
    pub model: String,
    pub custom_system_prompt: Option<String>,
    pub skill_paths: Vec<String>,
    pub mcp_server_ids: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrchestraAgentInput {
    pub slug: String,
    pub profile_id: String,
    pub model: String,
    pub custom_system_prompt: Option<String>,
    pub skill_paths: Vec<String>,
    pub mcp_server_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayOrchestraAgentInput {
    pub agent_id: String,
    pub node_id: String,
    pub cwd: String,
    pub prompt: String,
    pub mirror_pty_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpsertAgentProfileInput {
    pub id: String,
    pub name: String,
    pub system_prompt_template: String,
    pub default_skills_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateAgentProfileInput {
    pub src_id: String,
    pub new_id: String,
    pub new_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSkillInput {
    pub id: String,
    pub content: Option<String>,
}

fn now_iso() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{secs}")
}

fn with_repo<F, T>(state: &State<AppState>, f: F) -> Result<T, String>
where
    F: FnOnce(&WorkflowRepo) -> Result<T, String>,
{
    let repo = state.repo.lock().map_err(|e| e.to_string())?;
    f(&repo)
}

fn agent_to_dto(repo: &WorkflowRepo, agent: &OrchestraAgentRecord) -> Result<OrchestraAgentDto, String> {
    let skill_paths = repo
        .list_agent_skills(&agent.id)
        .map_err(|e| e.to_string())?;
    let mcp_bindings = repo
        .get_agent_mcp_bindings(&agent.id)
        .map_err(|e| e.to_string())?;
    let mcp_server_ids = mcp_bindings
        .into_iter()
        .filter(|(_, enabled)| *enabled)
        .map(|(id, _)| id)
        .collect();
    Ok(OrchestraAgentDto {
        id: agent.id.clone(),
        slug: agent.slug.clone(),
        profile_id: agent.profile_id.clone(),
        model: agent.model.clone(),
        custom_system_prompt: agent.custom_system_prompt.clone(),
        skill_paths,
        mcp_server_ids,
        created_at: agent.created_at.clone(),
        updated_at: agent.updated_at.clone(),
    })
}

#[tauri::command]
pub fn orchestra_agent_profiles_list(state: State<AppState>) -> Result<Vec<AgentProfile>, String> {
    with_repo(&state, |repo| repo.list_agent_profiles().map_err(|e| e.to_string()))
}

#[tauri::command]
pub fn orchestra_agent_profile_create(
    state: State<AppState>,
    input: UpsertAgentProfileInput,
) -> Result<AgentProfile, String> {
    with_repo(&state, |repo| {
        repo.create_agent_profile(
            &input.id,
            &input.name,
            &input.system_prompt_template,
            &input.default_skills_json,
        )?;
        repo.get_agent_profile(&input.id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "profile not found after create".to_string())
    })
}

#[tauri::command]
pub fn orchestra_agent_profile_update(
    state: State<AppState>,
    input: UpsertAgentProfileInput,
) -> Result<AgentProfile, String> {
    with_repo(&state, |repo| {
        repo.update_agent_profile(
            &input.id,
            &input.name,
            &input.system_prompt_template,
            &input.default_skills_json,
        )?;
        repo.get_agent_profile(&input.id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "profile not found after update".to_string())
    })
}

#[tauri::command]
pub fn orchestra_agent_profile_delete(state: State<AppState>, id: String) -> Result<(), String> {
    with_repo(&state, |repo| repo.delete_agent_profile(&id))
}

#[tauri::command]
pub fn orchestra_agent_profile_duplicate(
    state: State<AppState>,
    input: DuplicateAgentProfileInput,
) -> Result<AgentProfile, String> {
    with_repo(&state, |repo| {
        repo.duplicate_agent_profile(&input.src_id, &input.new_id, &input.new_name)?;
        repo.get_agent_profile(&input.new_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "profile not found after duplicate".to_string())
    })
}

#[tauri::command]
pub fn skills_list_installed() -> Result<Vec<DiscoveredSkill>, String> {
    Ok(discover_installed_skills())
}

#[tauri::command]
pub fn skills_create(input: CreateSkillInput) -> Result<DiscoveredSkill, String> {
    let content = input
        .content
        .filter(|c| !c.trim().is_empty())
        .unwrap_or_else(|| default_skill_template(&input.id));
    let path = create_global_skill(&input.id, &content)?;
    Ok(DiscoveredSkill {
        id: input.id,
        path,
        source: "agents".to_string(),
    })
}

#[tauri::command]
pub fn skills_read(path: String) -> Result<String, String> {
    read_skill(&path)
}

#[tauri::command]
pub fn orchestra_agent_list(state: State<AppState>) -> Result<Vec<OrchestraAgentDto>, String> {
    let repo = state.repo.lock().map_err(|e| e.to_string())?;
    let agents = repo.list_agents().map_err(|e| e.to_string())?;
    agents
        .iter()
        .map(|a| agent_to_dto(&repo, a))
        .collect()
}

#[tauri::command]
pub fn orchestra_agent_create(
    state: State<AppState>,
    input: CreateOrchestraAgentInput,
) -> Result<OrchestraAgentDto, String> {
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    let repo = state.repo.lock().map_err(|e| e.to_string())?;
    repo.create_agent(
        &id,
        &input.slug,
        &input.profile_id,
        &input.model,
        input.custom_system_prompt.as_deref(),
        &now,
    )
    .map_err(|e| e.to_string())?;
    repo.set_agent_skills(&id, &input.skill_paths)
        .map_err(|e| e.to_string())?;
    let bindings: Vec<(String, bool)> = input
        .mcp_server_ids
        .iter()
        .map(|m| (m.clone(), true))
        .collect();
    repo.set_agent_mcp_bindings(&id, &bindings)
        .map_err(|e| e.to_string())?;
    let agent = repo
        .get_agent(&id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "agent not found".to_string())?;
    agent_to_dto(&repo, &agent)
}

#[tauri::command]
pub fn orchestra_agent_update(
    state: State<AppState>,
    id: String,
    input: CreateOrchestraAgentInput,
) -> Result<OrchestraAgentDto, String> {
    let now = now_iso();
    let repo = state.repo.lock().map_err(|e| e.to_string())?;
    repo.update_agent(
        &id,
        &input.slug,
        &input.profile_id,
        &input.model,
        input.custom_system_prompt.as_deref(),
        &now,
    )
    .map_err(|e| e.to_string())?;
    repo.set_agent_skills(&id, &input.skill_paths)
        .map_err(|e| e.to_string())?;
    let bindings: Vec<(String, bool)> = input
        .mcp_server_ids
        .iter()
        .map(|m| (m.clone(), true))
        .collect();
    repo.set_agent_mcp_bindings(&id, &bindings)
        .map_err(|e| e.to_string())?;
    let agent = repo
        .get_agent(&id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "agent not found".to_string())?;
    agent_to_dto(&repo, &agent)
}

#[tauri::command]
pub fn orchestra_agent_delete(state: State<AppState>, id: String) -> Result<(), String> {
    with_repo(&state, |repo| repo.delete_agent(&id).map_err(|e| e.to_string()))
}

fn load_llm_settings(repo: &WorkflowRepo) -> LlmSettings {
    let provider = repo
        .get_setting("llm_provider")
        .ok()
        .flatten()
        .and_then(|p| {
            if p == "anthropic" {
                Some(LlmProvider::Anthropic)
            } else {
                Some(LlmProvider::Openai)
            }
        })
        .unwrap_or(LlmProvider::Openai);
    let base_url = repo
        .get_setting("llm_base_url")
        .ok()
        .flatten()
        .unwrap_or_else(|| {
            if provider == LlmProvider::Anthropic {
                "https://api.anthropic.com/v1".into()
            } else {
                "https://api.openai.com/v1".into()
            }
        });
    let api_key = repo
        .get_setting("llm_api_key")
        .ok()
        .flatten()
        .unwrap_or_default();
    LlmSettings {
        provider,
        base_url,
        api_key,
    }
}

#[tauri::command]
pub fn llm_settings_get(state: State<AppState>) -> Result<LlmSettings, String> {
    let repo = state.repo.lock().map_err(|e| e.to_string())?;
    Ok(load_llm_settings(&repo))
}

#[tauri::command]
pub fn llm_settings_set(state: State<AppState>, settings: LlmSettings) -> Result<(), String> {
    with_repo(&state, |repo| {
        let provider = match settings.provider {
            LlmProvider::Openai => "openai",
            LlmProvider::Anthropic => "anthropic",
        };
        repo.set_setting("llm_provider", provider)
            .map_err(|e| e.to_string())?;
        repo.set_setting("llm_base_url", &settings.base_url)
            .map_err(|e| e.to_string())?;
        repo.set_setting("llm_api_key", &settings.api_key)
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub async fn orchestra_agent_play(
    app: AppHandle,
    state: State<'_, AppState>,
    pty_state: State<'_, PtyState>,
    orchestrator: State<'_, OrchestratorState>,
    input: PlayOrchestraAgentInput,
) -> Result<(), String> {
    let (agent, profile, skill_paths, settings, home) = {
        let repo = state.repo.lock().map_err(|e| e.to_string())?;
        let agent = repo
            .get_agent(&input.agent_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "agent not found".to_string())?;
        let profiles = repo.list_agent_profiles().map_err(|e| e.to_string())?;
        let profile = profiles
            .into_iter()
            .find(|p| p.id == agent.profile_id)
            .ok_or_else(|| "profile not found".to_string())?;
        let mut paths = repo
            .list_agent_skills(&agent.id)
            .map_err(|e| e.to_string())?;
        if paths.is_empty() {
            paths = bundled_skill_paths(&profile.default_skills_json);
        }
        let settings = load_llm_settings(&repo);
        let home = dirs::home_dir().unwrap_or_default();
        (agent, profile, paths, settings, home)
    };

    let _ = app.emit(
        "orchestra-agent-status",
        serde_json::json!({ "nodeId": input.node_id, "status": "working" }),
    );

    let slug = agent.slug.clone();
    let global_path = preamble::global_memory_path(&home, &slug);
    let project_path = preamble::project_memory_path(std::path::Path::new(&input.cwd), &slug);
    let global_memory = memory::read_optional_file(&global_path);
    let project_memory = memory::read_optional_file(&project_path);
    let skill_contents = load_skill_contents(&skill_paths);

    let system_prompt = assemble_preamble(&PreambleInput {
        profile: &profile,
        custom_system_prompt: agent.custom_system_prompt.as_deref(),
        skill_contents: &skill_contents,
        global_memory: global_memory.as_deref(),
        project_memory: project_memory.as_deref(),
    });

    let node_id = input.node_id.clone();
    let prompt = input.prompt.clone();
    let full = stream_completion(&settings, &agent.model, &system_prompt, &prompt, |chunk| {
        let _ = app.emit(
            "orchestra-agent-chunk",
            serde_json::json!({ "nodeId": node_id, "chunk": chunk }),
        );
    })
    .await?;

    let _ = memory::append_global_memory(&global_path, &prompt, &full);

    if let Some(pty_id) = input.mirror_pty_id {
        let manager = pty_state.manager.lock().map_err(|e| e.to_string())?;
        let mut bus = orchestrator.bus.lock().map_err(|e| e.to_string())?;
        bus.dispatch_message(&manager, &pty_id, &full)?;
        bus.emit_current(&app, &pty_id);
    }

    let _ = app.emit(
        "orchestra-agent-status",
        serde_json::json!({
            "nodeId": input.node_id,
            "status": "done",
            "fullResponse": full
        }),
    );

    Ok(())
}

#[tauri::command]
pub fn mcp_server_list(state: State<AppState>) -> Result<Vec<McpServerRecord>, String> {
    with_repo(&state, |repo| repo.list_mcp_servers().map_err(|e| e.to_string()))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpsertMcpServerInput {
    pub id: Option<String>,
    pub name: String,
    pub transport: String,
    pub command: Option<String>,
    pub args_json: String,
    pub env_json: String,
    pub url: Option<String>,
    pub headers_json: String,
    pub enabled: bool,
}

#[tauri::command]
pub fn mcp_server_upsert(
    state: State<AppState>,
    input: UpsertMcpServerInput,
) -> Result<McpServerRecord, String> {
    let now = now_iso();
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let record = McpServerRecord {
        id: id.clone(),
        name: input.name,
        transport: input.transport,
        command: input.command,
        args_json: input.args_json,
        env_json: input.env_json,
        url: input.url,
        headers_json: input.headers_json,
        enabled: input.enabled,
        created_at: now.clone(),
        updated_at: now,
    };
    with_repo(&state, |repo| repo.upsert_mcp_server(&record).map_err(|e| e.to_string()))?;
    Ok(record)
}

#[tauri::command]
pub fn mcp_server_delete(state: State<AppState>, id: String) -> Result<(), String> {
    with_repo(&state, |repo| repo.delete_mcp_server(&id).map_err(|e| e.to_string()))
}

#[tauri::command]
pub async fn mcp_server_test(
    state: State<'_, AppState>,
    id: String,
) -> Result<mcp::McpTestResult, String> {
    let server = {
        let repo = state.repo.lock().map_err(|e| e.to_string())?;
        repo.get_mcp_server(&id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "mcp server not found".to_string())?
    };
    Ok(mcp::test_mcp_server(&server).await)
}

#[tauri::command]
pub fn mcp_import_json(state: State<AppState>, json: String) -> Result<Vec<McpServerRecord>, String> {
    let servers = mcp::parse_cursor_mcp_json(&json)?;
    with_repo(&state, |repo| {
        for server in &servers {
            repo.upsert_mcp_server(server).map_err(|e| e.to_string())?;
        }
        Ok(())
    })?;
    Ok(servers)
}

#[tauri::command]
pub fn mcp_export_json(state: State<AppState>) -> Result<String, String> {
    let servers = with_repo(&state, |repo| repo.list_mcp_servers().map_err(|e| e.to_string()))?;
    Ok(mcp::export_cursor_mcp_json(&servers))
}
