use serde::{Deserialize, Serialize};
use workflow::McpServerRecord;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpTestResult {
    pub ok: bool,
    pub server_name: String,
    pub tools: Vec<String>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CursorMcpFile {
    #[serde(rename = "mcpServers", default)]
    mcp_servers: std::collections::HashMap<String, CursorMcpEntry>,
}

#[derive(Debug, Deserialize, Serialize)]
struct CursorMcpEntry {
    #[serde(default)]
    command: Option<String>,
    #[serde(default)]
    args: Vec<String>,
    #[serde(default)]
    env: std::collections::HashMap<String, String>,
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    headers: std::collections::HashMap<String, String>,
}

pub fn parse_cursor_mcp_json(json: &str) -> Result<Vec<McpServerRecord>, String> {
    let parsed: CursorMcpFile =
        serde_json::from_str(json).map_err(|e| format!("invalid mcp.json: {e}"))?;
    let now = chrono_now();
    Ok(parsed
        .mcp_servers
        .into_iter()
        .map(|(name, entry)| {
            let transport = if entry.url.is_some() {
                "http"
            } else {
                "stdio"
            };
            McpServerRecord {
                id: uuid::Uuid::new_v4().to_string(),
                name,
                transport: transport.into(),
                command: entry.command,
                args_json: serde_json::to_string(&entry.args).unwrap_or_else(|_| "[]".into()),
                env_json: serde_json::to_string(&entry.env).unwrap_or_else(|_| "{}".into()),
                url: entry.url,
                headers_json: serde_json::to_string(&entry.headers)
                    .unwrap_or_else(|_| "{}".into()),
                enabled: true,
                created_at: now.clone(),
                updated_at: now.clone(),
            }
        })
        .collect())
}

pub fn export_cursor_mcp_json(servers: &[McpServerRecord]) -> String {
    let mut map = serde_json::Map::new();
    for server in servers {
        let mut entry = serde_json::Map::new();
        if server.transport == "stdio" {
            if let Some(cmd) = &server.command {
                entry.insert("command".into(), serde_json::Value::String(cmd.clone()));
            }
            if let Ok(args) = serde_json::from_str::<Vec<String>>(&server.args_json) {
                entry.insert(
                    "args".into(),
                    serde_json::Value::Array(
                        args.into_iter().map(serde_json::Value::String).collect(),
                    ),
                );
            }
            if let Ok(env) =
                serde_json::from_str::<std::collections::HashMap<String, String>>(&server.env_json)
            {
                entry.insert(
                    "env".into(),
                    serde_json::to_value(env).unwrap_or(serde_json::json!({})),
                );
            }
        } else if let Some(url) = &server.url {
            entry.insert("url".into(), serde_json::Value::String(url.clone()));
            if let Ok(headers) = serde_json::from_str::<std::collections::HashMap<String, String>>(
                &server.headers_json,
            ) {
                entry.insert(
                    "headers".into(),
                    serde_json::to_value(headers).unwrap_or(serde_json::json!({})),
                );
            }
        }
        map.insert(server.name.clone(), serde_json::Value::Object(entry));
    }
    serde_json::to_string_pretty(&serde_json::json!({ "mcpServers": map }))
        .unwrap_or_else(|_| "{}".into())
}

pub async fn test_mcp_server(server: &McpServerRecord) -> McpTestResult {
    if server.transport == "stdio" {
        test_stdio_mcp(server).await
    } else {
        test_http_mcp(server).await
    }
}

async fn test_stdio_mcp(server: &McpServerRecord) -> McpTestResult {
    let command = match &server.command {
        Some(c) => c.clone(),
        None => {
            return McpTestResult {
                ok: false,
                server_name: server.name.clone(),
                tools: vec![],
                error: Some("stdio transport requires command".into()),
            }
        }
    };
    let args: Vec<String> = serde_json::from_str(&server.args_json).unwrap_or_default();

    // ponytail: minimal MCP initialize + tools/list over stdio JSON-RPC
    match mcp_stdio_list_tools(&command, &args, &server.env_json).await {
        Ok(tools) => McpTestResult {
            ok: true,
            server_name: server.name.clone(),
            tools,
            error: None,
        },
        Err(e) => McpTestResult {
            ok: false,
            server_name: server.name.clone(),
            tools: vec![],
            error: Some(e),
        },
    }
}

async fn test_http_mcp(server: &McpServerRecord) -> McpTestResult {
    let url = match &server.url {
        Some(u) => u.clone(),
        None => {
            return McpTestResult {
                ok: false,
                server_name: server.name.clone(),
                tools: vec![],
                error: Some("http transport requires url".into()),
            }
        }
    };

    let client = match reqwest::Client::builder().build() {
        Ok(c) => c,
        Err(e) => {
            return McpTestResult {
                ok: false,
                server_name: server.name.clone(),
                tools: vec![],
                error: Some(e.to_string()),
            }
        }
    };

    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
        "params": {}
    });

    let mut req = client.post(&url).json(&body);
    if let Ok(headers) =
        serde_json::from_str::<std::collections::HashMap<String, String>>(&server.headers_json)
    {
        for (k, v) in headers {
            req = req.header(k, v);
        }
    }

    match req.send().await {
        Ok(resp) => {
            let text = resp.text().await.unwrap_or_default();
            match parse_tools_from_response(&text) {
                Ok(tools) => McpTestResult {
                    ok: true,
                    server_name: server.name.clone(),
                    tools,
                    error: None,
                },
                Err(e) => McpTestResult {
                    ok: false,
                    server_name: server.name.clone(),
                    tools: vec![],
                    error: Some(e),
                },
            }
        }
        Err(e) => McpTestResult {
            ok: false,
            server_name: server.name.clone(),
            tools: vec![],
            error: Some(e.to_string()),
        },
    }
}

async fn mcp_stdio_list_tools(
    command: &str,
    args: &[String],
    env_json: &str,
) -> Result<Vec<String>, String> {
    use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
    use tokio::process::Command;

    let mut cmd = Command::new(command);
    cmd.args(args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null());

    if let Ok(env) =
        serde_json::from_str::<std::collections::HashMap<String, String>>(env_json)
    {
        for (k, v) in env {
            cmd.env(k, v);
        }
    }

    let mut child = cmd.spawn().map_err(|e| e.to_string())?;
    let stdin = child.stdin.take().ok_or("no stdin")?;
    let stdout = child.stdout.take().ok_or("no stdout")?;

    let init = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": { "name": "canvas-orchestra", "version": "0.1.0" }
        }
    });
    let list = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    });

    let mut stdin = stdin;
    stdin
        .write_all(format!("{init}\n").as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    stdin
        .write_all(format!("{list}\n").as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    stdin.shutdown().await.map_err(|e| e.to_string())?;

    let mut reader = BufReader::new(stdout);
    let mut line = String::new();
    let mut tools = Vec::new();
    let deadline = tokio::time::Instant::now() + std::time::Duration::from_secs(8);

    while tokio::time::Instant::now() < deadline {
        line.clear();
        let read = tokio::time::timeout(std::time::Duration::from_secs(2), reader.read_line(&mut line))
            .await;
        match read {
            Ok(Ok(0)) => break,
            Ok(Ok(_)) => {
                if let Ok(parsed) = parse_tools_from_response(&line) {
                    if !parsed.is_empty() {
                        tools = parsed;
                        break;
                    }
                }
            }
            _ => break,
        }
    }

    let _ = child.kill().await;

    if tools.is_empty() {
        return Err("no tools returned (server may need initialized notification)".into());
    }
    Ok(tools)
}

fn parse_tools_from_response(text: &str) -> Result<Vec<String>, String> {
    let value: serde_json::Value =
        serde_json::from_str(text.trim()).map_err(|e| format!("parse error: {e}"))?;
    let tools = value
        .pointer("/result/tools")
        .or_else(|| value.pointer("/tools"))
        .and_then(|t| t.as_array())
        .ok_or_else(|| "no tools array in response".to_string())?;

    Ok(tools
        .iter()
        .filter_map(|t| t.get("name").and_then(|n| n.as_str()).map(str::to_string))
        .collect())
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{secs}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_cursor_mcp_json() {
        let json = r#"{
          "mcpServers": {
            "fs": {
              "command": "npx",
              "args": ["-y", "server"],
              "env": { "FOO": "bar" }
            }
          }
        }"#;
        let servers = parse_cursor_mcp_json(json).unwrap();
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].name, "fs");
        assert_eq!(servers[0].transport, "stdio");
    }

    #[test]
    fn exports_cursor_mcp_json() {
        let servers = vec![McpServerRecord {
            id: "1".into(),
            name: "fs".into(),
            transport: "stdio".into(),
            command: Some("npx".into()),
            args_json: r#"["-y","server"]"#.into(),
            env_json: "{}".into(),
            url: None,
            headers_json: "{}".into(),
            enabled: true,
            created_at: "0".into(),
            updated_at: "0".into(),
        }];
        let json = export_cursor_mcp_json(&servers);
        assert!(json.contains("mcpServers"));
        assert!(json.contains("fs"));
    }
}
