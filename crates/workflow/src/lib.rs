pub mod repo;

use std::path::Path;

use rusqlite::Connection;

pub use repo::WorkflowRepo;

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
}
