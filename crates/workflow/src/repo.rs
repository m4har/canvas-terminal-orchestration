use rusqlite::{params, Connection, Result};

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

pub struct WorkflowRepo {
    conn: Connection,
}

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
            ",
        )?;
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
}
