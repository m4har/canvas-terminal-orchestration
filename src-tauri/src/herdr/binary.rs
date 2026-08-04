use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde::Deserialize;

use super::platform::OsPlatform;

const GITHUB_RELEASES_API: &str = "https://api.github.com/repos/herdrdev/herdr/releases/latest";

pub fn path_binary_name(platform: OsPlatform) -> Option<&'static str> {
    let arch = std::env::consts::ARCH;
    match (platform, arch) {
        (OsPlatform::Macos, "aarch64") => Some("herdr-macos-aarch64"),
        (OsPlatform::Macos, "x86_64") => Some("herdr-macos-x86_64"),
        (OsPlatform::Linux, "aarch64") => Some("herdr-linux-aarch64"),
        (OsPlatform::Linux, "x86_64") => Some("herdr-linux-x86_64"),
        _ => None,
    }
}

pub fn managed_binary_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("herdr").join("bin").join("herdr")
}

pub fn resolve_path_binary() -> Option<PathBuf> {
    let path_var = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path_var) {
        let candidate = dir.join("herdr");
        if candidate.is_file() && is_executable(&candidate) {
            return Some(candidate);
        }
    }
    None
}

fn is_executable(path: &Path) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::metadata(path)
            .map(|m| m.permissions().mode() & 0o111 != 0)
            .unwrap_or(false)
    }
    #[cfg(not(unix))]
    {
        path.is_file()
    }
}

pub fn resolve_binary(app_data_dir: &Path) -> Option<PathBuf> {
    resolve_path_binary().or_else(|| {
        let managed = managed_binary_path(app_data_dir);
        if managed.is_file() {
            Some(managed)
        } else {
            None
        }
    })
}

pub fn is_present(app_data_dir: &Path) -> bool {
    resolve_binary(app_data_dir).is_some()
}

#[derive(Debug, Deserialize)]
struct GhRelease {
    assets: Vec<GhAsset>,
}

#[derive(Debug, Deserialize)]
struct GhAsset {
    name: String,
    browser_download_url: String,
}

pub fn download_managed_binary(
    app_data_dir: &Path,
    platform: OsPlatform,
    mut on_progress: impl FnMut(f32, &str),
) -> Result<PathBuf, String> {
    if !platform.supports_managed_binary() {
        return Err("herdr auto-install is not supported on this platform".into());
    }

    let asset_name = path_binary_name(platform)
        .ok_or_else(|| format!("unsupported arch for herdr: {}", std::env::consts::ARCH))?;

    on_progress(0.05, "fetching release metadata");

    let agent = format!("canvas-orchestra/{}", env!("CARGO_PKG_VERSION"));
    let response = ureq::get(GITHUB_RELEASES_API)
        .set("User-Agent", &agent)
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(|e| format!("failed to fetch herdr release: {e}"))?;

    if response.status() >= 400 {
        return Err(format!("github releases API returned {}", response.status()));
    }

    let body = response
        .into_string()
        .map_err(|e| format!("failed to read release body: {e}"))?;
    let release: GhRelease =
        serde_json::from_str(&body).map_err(|e| format!("invalid release json: {e}"))?;

    let asset = release
        .assets
        .iter()
        .find(|a| a.name == asset_name)
        .ok_or_else(|| format!("release asset not found: {asset_name}"))?;

    on_progress(0.15, "downloading herdr");

    let download = ureq::get(&asset.browser_download_url)
        .set("User-Agent", &agent)
        .call()
        .map_err(|e| format!("failed to download herdr: {e}"))?;

    if download.status() >= 400 {
        return Err(format!("download failed with status {}", download.status()));
    }

    let mut reader = download.into_reader();
    let mut bytes = Vec::new();
    reader
        .read_to_end(&mut bytes)
        .map_err(|e| format!("failed to read download: {e}"))?;

    on_progress(0.85, "installing herdr");

    let bin_dir = app_data_dir.join("herdr").join("bin");
    fs::create_dir_all(&bin_dir).map_err(|e| format!("failed to create bin dir: {e}"))?;
    let dest = bin_dir.join("herdr");
    fs::write(&dest, &bytes).map_err(|e| format!("failed to write herdr binary: {e}"))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&dest)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&dest, perms).map_err(|e| e.to_string())?;
    }

    on_progress(1.0, "herdr installed");

    Ok(dest)
}

pub fn resize_pane_terminal(
    binary: &Path,
    pane_id: &str,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let release = crate::herdr::session::encode_terminal_release();
    let mut child = Command::new(binary)
        .args([
            "terminal",
            "session",
            "control",
            pane_id,
            "--takeover",
            "--cols",
            &cols.to_string(),
            "--rows",
            &rows.to_string(),
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to resize pane terminal: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(release.as_bytes())
            .map_err(|e| format!("failed to write terminal release: {e}"))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("failed to wait on terminal resize: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(if stderr.is_empty() {
            format!("terminal resize exited {}", output.status)
        } else {
            stderr.into_owned()
        });
    }
    Ok(())
}

pub fn run_cli(binary: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new(binary)
        .args(args)
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

pub fn server_running(binary: &Path) -> Result<bool, String> {
    let out = run_cli(binary, &["status", "server", "--json"])?;
    let parsed: serde_json::Value =
        serde_json::from_str(out.trim()).map_err(|e| format!("invalid herdr status json: {e}"))?;
    Ok(parsed.get("status").and_then(|v| v.as_str()) == Some("running")
        || parsed.get("running").and_then(|v| v.as_bool()) == Some(true))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn binary_name_matches_platform_arch() {
        let platform = OsPlatform::detect();
        if platform.supports_managed_binary() {
            assert!(path_binary_name(platform).is_some());
        }
    }

    #[test]
    fn managed_binary_path_under_app_data() {
        let path = managed_binary_path(Path::new("/tmp/app"));
        assert_eq!(path, Path::new("/tmp/app/herdr/bin/herdr"));
    }
}
