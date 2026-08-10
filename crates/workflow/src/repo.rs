use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq)]
pub struct StoredNode {
    pub id: String,
    pub node_type: String,
    pub position_x: f64,
    pub position_y: f64,
    pub data_json: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StoredEdge {
    pub id: String,
    pub source_node_id: String,
    pub target_node_id: String,
    pub edge_type: String,
    pub payload_json: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AgentProfile {
    pub id: String,
    pub name: String,
    pub system_prompt_template: String,
    pub default_skills_json: String,
    pub is_bundled: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OrchestraAgentRecord {
    pub id: String,
    pub slug: String,
    pub profile_id: String,
    pub model: String,
    pub custom_system_prompt: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct McpServerRecord {
    pub id: String,
    pub name: String,
    pub transport: String,
    pub command: Option<String>,
    pub args_json: String,
    pub env_json: String,
    pub url: Option<String>,
    pub headers_json: String,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

pub struct WorkflowRepo {
    conn: Connection,
}

fn is_valid_profile_id(id: &str) -> bool {
    let mut chars = id.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    if !first.is_ascii_lowercase() && !first.is_ascii_digit() {
        return false;
    }
    chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '_')
}

const BUNDLED_PROFILES: &[(&str, &str, &str, &str)] = &[
    (
        "planner",
        "Planner",
        "You are a strategic planner. Break work into clear phases with acceptance criteria.",
        r#"["planning","brainstorming"]"#,
    ),
    (
        "designer",
        "Designer",
        "You are a UI/UX designer focused on clear, accessible interfaces.",
        r#"["design-taste-frontend","ui-designer"]"#,
    ),
    (
        "architect",
        "Architect",
        "You are a software architect. Favor simple, maintainable system design.",
        r#"["codebase-design","domain-modeling"]"#,
    ),
    (
        "frontend",
        "Frontend",
        "You are a frontend engineer. Ship accessible, performant UI.",
        r#"["frontend-developer","shadcn"]"#,
    ),
    (
        "backend",
        "Backend",
        "You are a backend engineer. Design reliable APIs and data layers.",
        r#"["backend-architect","tdd"]"#,
    ),
    (
        "qa",
        "QA",
        "You are a QA engineer. Find edge cases and write actionable test plans.",
        r#"["qa","accessibility-auditor"]"#,
    ),
    (
        "digital_marketing",
        "Digital Marketing",
        "You are a digital marketing strategist. Clear messaging and channel fit.",
        r#"["content-creator","social-media-strategist"]"#,
    ),
];

impl WorkflowRepo {
    pub fn new(conn: Connection) -> Self {
        Self { conn }
    }

    pub fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                type TEXT NOT NULL,
                position_x REAL NOT NULL,
                position_y REAL NOT NULL,
                data_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS edges (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                source_node_id TEXT NOT NULL,
                target_node_id TEXT NOT NULL,
                type TEXT NOT NULL,
                payload_json TEXT
            );
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS agent_profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                system_prompt_template TEXT NOT NULL,
                default_skills_json TEXT NOT NULL DEFAULT '[]',
                is_bundled INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                slug TEXT UNIQUE NOT NULL,
                profile_id TEXT NOT NULL,
                model TEXT NOT NULL,
                custom_system_prompt TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS agent_skills (
                agent_id TEXT NOT NULL,
                skill_path TEXT NOT NULL,
                PRIMARY KEY (agent_id, skill_path)
            );
            CREATE TABLE IF NOT EXISTS mcp_servers (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                transport TEXT NOT NULL,
                command TEXT,
                args_json TEXT NOT NULL DEFAULT '[]',
                env_json TEXT NOT NULL DEFAULT '{}',
                url TEXT,
                headers_json TEXT NOT NULL DEFAULT '{}',
                enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS agent_mcp_servers (
                agent_id TEXT NOT NULL,
                mcp_server_id TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (agent_id, mcp_server_id)
            );
            ",
        )?;
        self.seed_bundled_profiles()?;
        Ok(())
    }

    fn seed_bundled_profiles(&self) -> Result<()> {
        for (id, name, template, skills) in BUNDLED_PROFILES {
            self.conn.execute(
                "INSERT OR IGNORE INTO agent_profiles (id, name, system_prompt_template, default_skills_json, is_bundled)
                 VALUES (?1, ?2, ?3, ?4, 1)",
                params![id, name, template, skills],
            )?;
        }
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let mut stmt = self.conn.prepare("SELECT value FROM app_settings WHERE key = ?1")?;
        let mut rows = stmt.query_map(params![key], |row| row.get(0))?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn save_node(
        &self,
        workflow_id: &str,
        id: &str,
        node_type: &str,
        position_x: f64,
        position_y: f64,
        data_json: &str,
    ) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO nodes (id, workflow_id, type, position_x, position_y, data_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, workflow_id, node_type, position_x, position_y, data_json],
        )?;
        Ok(())
    }

    pub fn load_nodes(&self, workflow_id: &str) -> Result<Vec<StoredNode>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, type, position_x, position_y, data_json FROM nodes WHERE workflow_id = ?1",
        )?;

        let nodes = stmt
            .query_map(params![workflow_id], |row| {
                Ok(StoredNode {
                    id: row.get(0)?,
                    node_type: row.get(1)?,
                    position_x: row.get(2)?,
                    position_y: row.get(3)?,
                    data_json: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(nodes)
    }

    pub fn save_edge(
        &self,
        workflow_id: &str,
        id: &str,
        source_node_id: &str,
        target_node_id: &str,
        edge_type: &str,
        payload_json: &str,
    ) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO edges (id, workflow_id, source_node_id, target_node_id, type, payload_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                id,
                workflow_id,
                source_node_id,
                target_node_id,
                edge_type,
                payload_json
            ],
        )?;
        Ok(())
    }

    pub fn clear_workflow(&self, workflow_id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM nodes WHERE workflow_id = ?1", params![workflow_id])?;
        self.conn
            .execute("DELETE FROM edges WHERE workflow_id = ?1", params![workflow_id])?;
        Ok(())
    }

    pub fn load_edges(&self, workflow_id: &str) -> Result<Vec<StoredEdge>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, source_node_id, target_node_id, type, payload_json
             FROM edges WHERE workflow_id = ?1",
        )?;

        let edges = stmt
            .query_map(params![workflow_id], |row| {
                Ok(StoredEdge {
                    id: row.get(0)?,
                    source_node_id: row.get(1)?,
                    target_node_id: row.get(2)?,
                    edge_type: row.get(3)?,
                    payload_json: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(edges)
    }

    fn row_to_agent_profile(row: &rusqlite::Row<'_>) -> Result<AgentProfile> {
        Ok(AgentProfile {
            id: row.get(0)?,
            name: row.get(1)?,
            system_prompt_template: row.get(2)?,
            default_skills_json: row.get(3)?,
            is_bundled: row.get::<_, i32>(4)? != 0,
        })
    }

    pub fn list_agent_profiles(&self) -> Result<Vec<AgentProfile>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, system_prompt_template, default_skills_json, is_bundled
             FROM agent_profiles ORDER BY is_bundled DESC, name ASC",
        )?;
        let rows = stmt
            .query_map([], Self::row_to_agent_profile)?
            .collect::<Result<Vec<_>>>()?;
        Ok(rows)
    }

    pub fn get_agent_profile(&self, id: &str) -> Result<Option<AgentProfile>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, system_prompt_template, default_skills_json, is_bundled
             FROM agent_profiles WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![id], Self::row_to_agent_profile)?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn create_agent_profile(
        &self,
        id: &str,
        name: &str,
        system_prompt_template: &str,
        default_skills_json: &str,
    ) -> std::result::Result<(), String> {
        if !is_valid_profile_id(id) {
            return Err("profile id must be lowercase alphanumeric with hyphens or underscores".into());
        }
        if self.get_agent_profile(id).map_err(|e| e.to_string())?.is_some() {
            return Err(format!("profile id already exists: {id}"));
        }
        self.conn
            .execute(
                "INSERT INTO agent_profiles (id, name, system_prompt_template, default_skills_json, is_bundled)
                 VALUES (?1, ?2, ?3, ?4, 0)",
                params![id, name, system_prompt_template, default_skills_json],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_agent_profile(
        &self,
        id: &str,
        name: &str,
        system_prompt_template: &str,
        default_skills_json: &str,
    ) -> std::result::Result<(), String> {
        let profile = self
            .get_agent_profile(id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("profile not found: {id}"))?;
        if profile.is_bundled {
            return Err("cannot update bundled profile — duplicate it first".into());
        }
        self.conn
            .execute(
                "UPDATE agent_profiles SET name = ?2, system_prompt_template = ?3, default_skills_json = ?4
                 WHERE id = ?1",
                params![id, name, system_prompt_template, default_skills_json],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_agent_profile(&self, id: &str) -> std::result::Result<(), String> {
        let profile = self
            .get_agent_profile(id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("profile not found: {id}"))?;
        if profile.is_bundled {
            return Err("cannot delete bundled profile".into());
        }
        let count: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM agents WHERE profile_id = ?1",
                params![id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if count > 0 {
            return Err("cannot delete profile referenced by OrchestraAgent(s)".into());
        }
        self.conn
            .execute("DELETE FROM agent_profiles WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn duplicate_agent_profile(
        &self,
        src_id: &str,
        new_id: &str,
        new_name: &str,
    ) -> std::result::Result<(), String> {
        let src = self
            .get_agent_profile(src_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("profile not found: {src_id}"))?;
        self.create_agent_profile(
            new_id,
            new_name,
            &src.system_prompt_template,
            &src.default_skills_json,
        )
    }

    pub fn list_agents(&self) -> Result<Vec<OrchestraAgentRecord>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, slug, profile_id, model, custom_system_prompt, created_at, updated_at
             FROM agents ORDER BY slug ASC",
        )?;
        let rows = stmt
            .query_map([], |row| {
                Ok(OrchestraAgentRecord {
                    id: row.get(0)?,
                    slug: row.get(1)?,
                    profile_id: row.get(2)?,
                    model: row.get(3)?,
                    custom_system_prompt: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;
        Ok(rows)
    }

    pub fn get_agent(&self, id: &str) -> Result<Option<OrchestraAgentRecord>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, slug, profile_id, model, custom_system_prompt, created_at, updated_at
             FROM agents WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(OrchestraAgentRecord {
                id: row.get(0)?,
                slug: row.get(1)?,
                profile_id: row.get(2)?,
                model: row.get(3)?,
                custom_system_prompt: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn create_agent(
        &self,
        id: &str,
        slug: &str,
        profile_id: &str,
        model: &str,
        custom_system_prompt: Option<&str>,
        now: &str,
    ) -> Result<()> {
        self.conn.execute(
            "INSERT INTO agents (id, slug, profile_id, model, custom_system_prompt, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
            params![id, slug, profile_id, model, custom_system_prompt, now],
        )?;
        Ok(())
    }

    pub fn update_agent(
        &self,
        id: &str,
        slug: &str,
        profile_id: &str,
        model: &str,
        custom_system_prompt: Option<&str>,
        now: &str,
    ) -> Result<()> {
        self.conn.execute(
            "UPDATE agents SET slug = ?2, profile_id = ?3, model = ?4, custom_system_prompt = ?5, updated_at = ?6
             WHERE id = ?1",
            params![id, slug, profile_id, model, custom_system_prompt, now],
        )?;
        Ok(())
    }

    pub fn delete_agent(&self, id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM agent_skills WHERE agent_id = ?1", params![id])?;
        self.conn.execute(
            "DELETE FROM agent_mcp_servers WHERE agent_id = ?1",
            params![id],
        )?;
        self.conn.execute("DELETE FROM agents WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn list_agent_skills(&self, agent_id: &str) -> Result<Vec<String>> {
        let mut stmt = self
            .conn
            .prepare("SELECT skill_path FROM agent_skills WHERE agent_id = ?1 ORDER BY skill_path")?;
        let rows = stmt
            .query_map(params![agent_id], |row| row.get(0))?
            .collect::<Result<Vec<_>>>()?;
        Ok(rows)
    }

    pub fn set_agent_skills(&self, agent_id: &str, paths: &[String]) -> Result<()> {
        self.conn
            .execute("DELETE FROM agent_skills WHERE agent_id = ?1", params![agent_id])?;
        for path in paths {
            self.conn.execute(
                "INSERT INTO agent_skills (agent_id, skill_path) VALUES (?1, ?2)",
                params![agent_id, path],
            )?;
        }
        Ok(())
    }

    pub fn list_mcp_servers(&self) -> Result<Vec<McpServerRecord>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, transport, command, args_json, env_json, url, headers_json, enabled, created_at, updated_at
             FROM mcp_servers ORDER BY name ASC",
        )?;
        let rows = stmt
            .query_map([], |row| {
                Ok(McpServerRecord {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    transport: row.get(2)?,
                    command: row.get(3)?,
                    args_json: row.get(4)?,
                    env_json: row.get(5)?,
                    url: row.get(6)?,
                    headers_json: row.get(7)?,
                    enabled: row.get::<_, i32>(8)? != 0,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;
        Ok(rows)
    }

    pub fn get_mcp_server(&self, id: &str) -> Result<Option<McpServerRecord>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, transport, command, args_json, env_json, url, headers_json, enabled, created_at, updated_at
             FROM mcp_servers WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(McpServerRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                transport: row.get(2)?,
                command: row.get(3)?,
                args_json: row.get(4)?,
                env_json: row.get(5)?,
                url: row.get(6)?,
                headers_json: row.get(7)?,
                enabled: row.get::<_, i32>(8)? != 0,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn upsert_mcp_server(&self, record: &McpServerRecord) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO mcp_servers
             (id, name, transport, command, args_json, env_json, url, headers_json, enabled, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                record.id,
                record.name,
                record.transport,
                record.command,
                record.args_json,
                record.env_json,
                record.url,
                record.headers_json,
                if record.enabled { 1 } else { 0 },
                record.created_at,
                record.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn delete_mcp_server(&self, id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM agent_mcp_servers WHERE mcp_server_id = ?1",
            params![id],
        )?;
        self.conn
            .execute("DELETE FROM mcp_servers WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_agent_mcp_bindings(&self, agent_id: &str) -> Result<Vec<(String, bool)>> {
        let mut stmt = self.conn.prepare(
            "SELECT mcp_server_id, enabled FROM agent_mcp_servers WHERE agent_id = ?1",
        )?;
        let rows = stmt
            .query_map(params![agent_id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)? != 0))
            })?
            .collect::<Result<Vec<_>>>()?;
        Ok(rows)
    }

    pub fn set_agent_mcp_bindings(&self, agent_id: &str, bindings: &[(String, bool)]) -> Result<()> {
        self.conn.execute(
            "DELETE FROM agent_mcp_servers WHERE agent_id = ?1",
            params![agent_id],
        )?;
        for (mcp_id, enabled) in bindings {
            self.conn.execute(
                "INSERT INTO agent_mcp_servers (agent_id, mcp_server_id, enabled) VALUES (?1, ?2, ?3)",
                params![agent_id, mcp_id, if *enabled { 1 } else { 0 }],
            )?;
        }
        Ok(())
    }
}
