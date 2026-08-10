use std::fs;
use std::path::Path;

pub fn read_optional_file(path: &Path) -> Option<String> {
    if !path.exists() {
        return None;
    }
    fs::read_to_string(path).ok().filter(|s| !s.trim().is_empty())
}

pub fn append_global_memory(path: &Path, user_prompt: &str, assistant_response: &str) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let entry = format!(
        "\n\n---\n**User:** {user_prompt}\n\n**Assistant:** {assistant_response}\n"
    );
    use std::io::Write;
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)?;
    file.write_all(entry.as_bytes())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::temp_dir;

    #[test]
    fn appends_to_memory_file() {
        let dir = temp_dir().join(format!("co-mem-{}", uuid::Uuid::new_v4()));
        let path = dir.join("MEMORY.md");
        append_global_memory(&path, "hello", "world").unwrap();
        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("hello"));
        assert!(content.contains("world"));
        let _ = fs::remove_dir_all(dir);
    }
}
