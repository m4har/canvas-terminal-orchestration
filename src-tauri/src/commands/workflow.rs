use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct CanvasNodeDto {
    pub id: String,
    pub node_type: String,
    pub position_x: f64,
    pub position_y: f64,
    pub data_json: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CanvasEdgeDto {
    pub id: String,
    pub source_node_id: String,
    pub target_node_id: String,
    pub edge_type: String,
    pub payload_json: String,
}

#[derive(Debug, Serialize)]
pub struct CanvasSnapshot {
    pub nodes: Vec<CanvasNodeDto>,
    pub edges: Vec<CanvasEdgeDto>,
}

#[derive(Debug, Deserialize)]
pub struct SaveCanvasRequest {
    pub workflow_id: String,
    pub nodes: Vec<CanvasNodeDto>,
    pub edges: Vec<CanvasEdgeDto>,
}

#[tauri::command]
pub fn load_canvas(state: State<'_, AppState>, workflow_id: String) -> Result<CanvasSnapshot, String> {
    let repo = state.repo.lock().map_err(|e| e.to_string())?;

    let nodes = repo
        .load_nodes(&workflow_id)
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|node| CanvasNodeDto {
            id: node.id,
            node_type: node.node_type,
            position_x: node.position_x,
            position_y: node.position_y,
            data_json: node.data_json,
        })
        .collect();

    let edges = repo
        .load_edges(&workflow_id)
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|edge| CanvasEdgeDto {
            id: edge.id,
            source_node_id: edge.source_node_id,
            target_node_id: edge.target_node_id,
            edge_type: edge.edge_type,
            payload_json: edge.payload_json,
        })
        .collect();

    Ok(CanvasSnapshot { nodes, edges })
}

#[tauri::command]
pub fn save_canvas(state: State<'_, AppState>, payload: SaveCanvasRequest) -> Result<(), String> {
    let repo = state.repo.lock().map_err(|e| e.to_string())?;

    repo.clear_workflow(&payload.workflow_id)
        .map_err(|e| e.to_string())?;

    for node in payload.nodes {
        repo.save_node(
            &payload.workflow_id,
            &node.id,
            &node.node_type,
            node.position_x,
            node.position_y,
            &node.data_json,
        )
        .map_err(|e| e.to_string())?;
    }

    for edge in payload.edges {
        repo.save_edge(
            &payload.workflow_id,
            &edge.id,
            &edge.source_node_id,
            &edge.target_node_id,
            &edge.edge_type,
            &edge.payload_json,
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_project_cwd(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.project_cwd.clone())
}

#[tauri::command]
pub fn get_app_setting(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    let repo = state.repo.lock().map_err(|e| e.to_string())?;
    repo.get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_app_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let repo = state.repo.lock().map_err(|e| e.to_string())?;
    repo.set_setting(&key, &value).map_err(|e| e.to_string())?;
    Ok(())
}
