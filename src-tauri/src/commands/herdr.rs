use std::process::Command;
use std::thread;
use std::time::Duration;

fn server_running() -> Result<bool, String> {
    let output = Command::new("herdr")
        .args(["status", "server", "--json"])
        .output()
        .map_err(|e| format!("failed to run herdr: {e}"))?;

    if !output.status.success() {
        return Ok(false);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value =
        serde_json::from_str(stdout.trim()).map_err(|e| format!("invalid herdr status json: {e}"))?;

    Ok(
        parsed.get("status").and_then(|v| v.as_str()) == Some("running")
            || parsed.get("running").and_then(|v| v.as_bool()) == Some(true),
    )
}

#[tauri::command]
pub fn herdr_run(args: Vec<String>) -> Result<String, String> {
    let output = Command::new("herdr")
        .args(&args)
        .output()
        .map_err(|e| format!("failed to run herdr: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(if stderr.is_empty() {
            stdout.into_owned()
        } else {
            stderr.into_owned()
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub fn herdr_connect() -> Result<bool, String> {
    if server_running()? {
        return Ok(true);
    }

    Command::new("herdr")
        .arg("server")
        .spawn()
        .map_err(|e| format!("failed to spawn herdr server: {e}"))?;

    for _ in 0..30 {
        thread::sleep(Duration::from_millis(200));
        if server_running()? {
            return Ok(true);
        }
    }

    Ok(false)
}
