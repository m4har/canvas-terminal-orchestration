use std::path::Path;

use workflow::AgentProfile;

pub struct PreambleInput<'a> {
    pub profile: &'a AgentProfile,
    pub custom_system_prompt: Option<&'a str>,
    pub skill_contents: &'a [String],
    pub global_memory: Option<&'a str>,
    pub project_memory: Option<&'a str>,
}

pub fn assemble_preamble(input: &PreambleInput<'_>) -> String {
    let mut parts = Vec::new();
    parts.push(input.profile.system_prompt_template.clone());

    if let Some(custom) = input.custom_system_prompt {
        if !custom.trim().is_empty() {
            parts.push(custom.trim().to_string());
        }
    }

    for content in input.skill_contents {
        if !content.trim().is_empty() {
            parts.push(content.trim().to_string());
        }
    }

    if let Some(mem) = input.global_memory {
        if !mem.trim().is_empty() {
            parts.push(format!("## Global memory\n{mem}"));
        }
    }

    if let Some(proj) = input.project_memory {
        if !proj.trim().is_empty() {
            parts.push(format!("## Project context\n{proj}"));
        }
    }

    parts.join("\n\n")
}

pub fn global_memory_path(home: &Path, slug: &str) -> std::path::PathBuf {
    home.join(".canvas-orchestra")
        .join("agents")
        .join(slug)
        .join("MEMORY.md")
}

pub fn project_memory_path(cwd: &Path, slug: &str) -> std::path::PathBuf {
    cwd.join(".orchestra")
        .join("agents")
        .join(slug)
        .join("PROJECT.md")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn planner_profile() -> AgentProfile {
        AgentProfile {
            id: "planner".into(),
            name: "Planner".into(),
            system_prompt_template: "You are a planner.".into(),
            default_skills_json: "[]".into(),
            is_bundled: true,
        }
    }

    #[test]
    fn assembles_profile_skills_and_memory() {
        let profile = planner_profile();
        let preamble = assemble_preamble(&PreambleInput {
            profile: &profile,
            custom_system_prompt: Some("Be concise."),
            skill_contents: &["Skill: always cite sources.".into()],
            global_memory: Some("User prefers bullet lists."),
            project_memory: Some("Repo: auth refactor."),
        });

        assert!(preamble.contains("You are a planner."));
        assert!(preamble.contains("Be concise."));
        assert!(preamble.contains("Skill: always cite sources."));
        assert!(preamble.contains("Global memory"));
        assert!(preamble.contains("Project context"));
    }
}
