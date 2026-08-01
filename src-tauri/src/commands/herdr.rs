use std::process::Command;

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
