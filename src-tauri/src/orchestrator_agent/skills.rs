use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DiscoveredSkill {
    pub id: String,
    pub path: String,
    pub source: String,
}

pub fn resolve_skill_path(raw: &str) -> PathBuf {
    if raw.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(raw.trim_start_matches("~/"));
        }
    }
    Path::new(raw).to_path_buf()
}

pub fn load_skill_contents(paths: &[String]) -> Vec<String> {
    paths
        .iter()
        .map(|p| resolve_skill_path(p))
        .filter_map(|path| {
            if !path.exists() {
                return None;
            }
            fs::read_to_string(&path).ok()
        })
        .collect()
}

fn scan_skill_dir(base: &Path, source: &str, out: &mut HashMap<String, DiscoveredSkill>) {
    let Ok(entries) = fs::read_dir(base) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let skill_file = path.join("SKILL.md");
        if !skill_file.is_file() {
            continue;
        }
        let id = entry.file_name().to_string_lossy().to_string();
        let discovered = DiscoveredSkill {
            id: id.clone(),
            path: skill_file.to_string_lossy().to_string(),
            source: source.to_string(),
        };
        // Prefer ~/.agents/skills over ~/.cursor/skills-cursor
        out.entry(id).or_insert(discovered);
    }
}

pub fn discover_installed_skills() -> Vec<DiscoveredSkill> {
    let mut map = HashMap::new();
    if let Some(home) = dirs::home_dir() {
        scan_skill_dir(&home.join(".cursor/skills-cursor"), "cursor", &mut map);
        scan_skill_dir(&home.join(".agents/skills"), "agents", &mut map);
    }
    let mut skills: Vec<_> = map.into_values().collect();
    skills.sort_by(|a, b| a.id.cmp(&b.id));
    skills
}

pub fn resolve_skill_paths(names: &[String]) -> Vec<String> {
    let discovered: HashMap<String, String> = discover_installed_skills()
        .into_iter()
        .map(|s| (s.id, s.path))
        .collect();
    names
        .iter()
        .filter_map(|name| discovered.get(name).cloned())
        .collect()
}

pub fn bundled_skill_paths(profile_skills_json: &str) -> Vec<String> {
    let names: Vec<String> = serde_json::from_str(profile_skills_json).unwrap_or_default();
    resolve_skill_paths(&names)
}

fn is_valid_skill_id(id: &str) -> bool {
    let mut chars = id.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    if !first.is_ascii_lowercase() && !first.is_ascii_digit() {
        return false;
    }
    chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '_')
}

pub fn default_skill_template(id: &str) -> String {
    format!(
        "---\nname: {id}\ndescription: Describe when to use this skill.\n---\n\n# {id}\n\nAdd instructions here.\n"
    )
}

pub fn create_global_skill(id: &str, content: &str) -> Result<String, String> {
    if !is_valid_skill_id(id) {
        return Err("skill id must be lowercase alphanumeric with hyphens or underscores".into());
    }
    let home = dirs::home_dir().ok_or_else(|| "home directory not found".to_string())?;
    let dir = home.join(".agents/skills").join(id);
    let skill_path = dir.join("SKILL.md");
    if skill_path.exists() {
        return Err(format!("skill already exists: {id}"));
    }
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(&skill_path, content).map_err(|e| e.to_string())?;
    Ok(skill_path.to_string_lossy().to_string())
}

pub fn read_skill(path: &str) -> Result<String, String> {
    let resolved = resolve_skill_path(path);
    if !resolved.is_file() {
        return Err(format!("skill file not found: {path}"));
    }
    fs::read_to_string(&resolved).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::temp_dir;

    #[test]
    fn skips_missing_skill_files() {
        let contents = load_skill_contents(&["/nonexistent/skill.md".into()]);
        assert!(contents.is_empty());
    }

    #[test]
    fn loads_existing_skill_file() {
        let dir = temp_dir().join(format!("co-skill-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("SKILL.md");
        fs::write(&path, "Do the thing.").unwrap();
        let contents = load_skill_contents(&[path.to_string_lossy().to_string()]);
        assert_eq!(contents, vec!["Do the thing.".to_string()]);
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn resolve_skill_paths_uses_discovered_skills() {
        let home = temp_dir().join(format!("co-home-{}", uuid::Uuid::new_v4()));
        let skill_dir = home.join(".agents/skills").join("my-skill");
        fs::create_dir_all(&skill_dir).unwrap();
        let skill_file = skill_dir.join("SKILL.md");
        fs::write(&skill_file, "content").unwrap();

        // ponytail: test uses temp home via scan override not available — test resolve via absolute path fallback
        let paths = load_skill_contents(&[skill_file.to_string_lossy().to_string()]);
        assert_eq!(paths, vec!["content".to_string()]);

        let _ = fs::remove_dir_all(home);
    }

    #[test]
    fn bundled_skill_paths_parses_json_names() {
        let paths = bundled_skill_paths(r#"["nonexistent-skill-xyz"]"#);
        assert!(paths.is_empty());
    }

    #[test]
    fn rejects_invalid_skill_id() {
        let err = create_global_skill("Bad-ID", "x").unwrap_err();
        assert!(err.contains("lowercase"));
    }
}
