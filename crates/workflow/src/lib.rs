pub mod repo;

use std::path::Path;

use rusqlite::Connection;

pub use repo::{
    AgentProfile, McpServerRecord, OrchestraAgentRecord, StoredEdge, StoredNode, WorkflowRepo,
};

pub fn open_db(path: &Path) -> rusqlite::Result<WorkflowRepo> {
    let repo = WorkflowRepo::new(Connection::open(path)?);
    repo.init_schema()?;
    Ok(repo)
}

#[cfg(test)]
mod tests {
    use crate::repo::WorkflowRepo;
    use rusqlite::Connection;

    fn in_memory_repo() -> WorkflowRepo {
        let conn = Connection::open_in_memory().unwrap();
        WorkflowRepo::new(conn)
    }

    #[test]
    fn saves_and_loads_a_node() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        repo.save_node(
            "wf-1",
            "node-1",
            "text",
            10.0,
            20.0,
            r#"{"label":"Hello","fontSize":18}"#,
        )
        .unwrap();

        let nodes = repo.load_nodes("wf-1").unwrap();
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].id, "node-1");
        assert_eq!(nodes[0].node_type, "text");
        assert_eq!(nodes[0].position_x, 10.0);
        assert_eq!(nodes[0].data_json, r#"{"label":"Hello","fontSize":18}"#);
    }

    #[test]
    fn saves_and_loads_edges() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        repo.save_node("wf-1", "n1", "markdown", 0.0, 0.0, "{}")
            .unwrap();
        repo.save_node("wf-1", "n2", "terminal", 100.0, 0.0, "{}")
            .unwrap();
        repo.save_edge("wf-1", "e1", "n1", "n2", "handoff", r#"{"summaryLines":50}"#)
            .unwrap();

        let edges = repo.load_edges("wf-1").unwrap();
        assert_eq!(edges.len(), 1);
        assert_eq!(edges[0].source_node_id, "n1");
        assert_eq!(edges[0].target_node_id, "n2");
        assert_eq!(edges[0].edge_type, "handoff");
    }

    #[test]
    fn saves_and_loads_app_settings() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        assert_eq!(repo.get_setting("intro_completed").unwrap(), None);

        repo.set_setting("intro_completed", "true").unwrap();
        assert_eq!(
            repo.get_setting("intro_completed").unwrap(),
            Some("true".to_string())
        );

        repo.set_setting("intro_completed", "false").unwrap();
        assert_eq!(
            repo.get_setting("intro_completed").unwrap(),
            Some("false".to_string())
        );
    }

    #[test]
    fn seeds_bundled_agent_profiles() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        let profiles = repo.list_agent_profiles().unwrap();
        assert_eq!(profiles.len(), 7);
        assert!(profiles.iter().all(|p| p.is_bundled));
        assert!(profiles.iter().any(|p| p.id == "planner"));
    }

    #[test]
    fn creates_and_lists_orchestra_agents() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        repo.create_agent(
            "a1",
            "planner-bot",
            "planner",
            "gpt-4o",
            None,
            "2026-08-10T00:00:00Z",
        )
        .unwrap();

        let agents = repo.list_agents().unwrap();
        assert_eq!(agents.len(), 1);
        assert_eq!(agents[0].slug, "planner-bot");
    }

    #[test]
    fn stores_mcp_servers_and_agent_bindings() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        let mcp = crate::McpServerRecord {
            id: "m1".into(),
            name: "filesystem".into(),
            transport: "stdio".into(),
            command: Some("npx".into()),
            args_json: r#"["-y","@modelcontextprotocol/server-filesystem","/tmp"]"#.into(),
            env_json: "{}".into(),
            url: None,
            headers_json: "{}".into(),
            enabled: true,
            created_at: "2026-08-10T00:00:00Z".into(),
            updated_at: "2026-08-10T00:00:00Z".into(),
        };
        repo.upsert_mcp_server(&mcp).unwrap();

        repo.create_agent("a1", "bot", "planner", "gpt-4o", None, "2026-08-10T00:00:00Z")
            .unwrap();
        repo.set_agent_mcp_bindings("a1", &[("m1".into(), true)])
            .unwrap();

        let bindings = repo.get_agent_mcp_bindings("a1").unwrap();
        assert_eq!(bindings, vec![("m1".to_string(), true)]);
    }

    #[test]
    fn creates_updates_and_deletes_custom_agent_profile() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        repo.create_agent_profile(
            "my-planner",
            "My Planner",
            "You plan things.",
            r#"["tdd"]"#,
        )
        .unwrap();

        let profile = repo.get_agent_profile("my-planner").unwrap().unwrap();
        assert!(!profile.is_bundled);
        assert_eq!(profile.name, "My Planner");

        repo.update_agent_profile(
            "my-planner",
            "My Planner v2",
            "You plan things better.",
            "[]",
        )
        .unwrap();

        let updated = repo.get_agent_profile("my-planner").unwrap().unwrap();
        assert_eq!(updated.name, "My Planner v2");

        repo.delete_agent_profile("my-planner").unwrap();
        assert!(repo.get_agent_profile("my-planner").unwrap().is_none());
    }

    #[test]
    fn cannot_update_or_delete_bundled_profile() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        let err = repo
            .update_agent_profile("planner", "X", "Y", "[]")
            .unwrap_err();
        assert!(err.contains("bundled"));

        let err = repo.delete_agent_profile("planner").unwrap_err();
        assert!(err.contains("bundled"));
    }

    #[test]
    fn duplicates_bundled_profile_as_custom() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        repo.duplicate_agent_profile("planner", "planner-custom", "Planner (custom)")
            .unwrap();

        let copy = repo.get_agent_profile("planner-custom").unwrap().unwrap();
        let bundled = repo.get_agent_profile("planner").unwrap().unwrap();
        assert!(!copy.is_bundled);
        assert_eq!(
            copy.system_prompt_template,
            bundled.system_prompt_template
        );
        assert_eq!(copy.default_skills_json, bundled.default_skills_json);
    }

    #[test]
    fn cannot_delete_profile_referenced_by_agent() {
        let repo = in_memory_repo();
        repo.init_schema().unwrap();

        repo.create_agent_profile("custom", "Custom", "Prompt", "[]")
            .unwrap();
        repo.create_agent("a1", "bot", "custom", "planner", None, "2026-08-10T00:00:00Z")
            .unwrap();

        let err = repo.delete_agent_profile("custom").unwrap_err();
        assert!(err.contains("referenced"));
    }
}
