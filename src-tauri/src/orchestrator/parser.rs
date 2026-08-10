#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AgentStatus {
    Idle,
    Working,
    Blocked,
    Done,
}

impl AgentStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            AgentStatus::Idle => "idle",
            AgentStatus::Working => "working",
            AgentStatus::Blocked => "blocked",
            AgentStatus::Done => "done",
        }
    }
}

const TAIL_LIMIT: usize = 4096;

pub fn append_tail(existing: &mut String, chunk: &str) {
    existing.push_str(chunk);
    if existing.len() > TAIL_LIMIT {
        let keep = existing.len() - TAIL_LIMIT;
        *existing = existing[split_point(existing, keep)..].to_string();
    }
}

fn split_point(s: &str, byte_index: usize) -> usize {
    if byte_index >= s.len() {
        return 0;
    }
    s.char_indices()
        .map(|(i, _)| i)
        .find(|&i| i >= byte_index)
        .unwrap_or(s.len())
}

pub fn infer_status(agent_kind: Option<&str>, tail: &str) -> Option<AgentStatus> {
    let lower = tail.to_ascii_lowercase();

    if is_blocked(&lower) {
        return Some(AgentStatus::Blocked);
    }

    if is_done(agent_kind, &lower, tail) {
        return Some(AgentStatus::Done);
    }

    if is_working(&lower, tail) {
        return Some(AgentStatus::Working);
    }

    if is_idle(tail) {
        return Some(AgentStatus::Idle);
    }

    None
}

fn is_blocked(lower: &str) -> bool {
    lower.contains("waiting for approval")
        || lower.contains("allow this")
        || lower.contains("(y/n)")
        || lower.contains("press enter to confirm")
}

fn is_done(agent_kind: Option<&str>, lower: &str, tail: &str) -> bool {
    match agent_kind {
        Some("claude") => {
            lower.contains("mission accomplished")
                || lower.contains("task completed")
                || tail.contains("✓")
        }
        Some("codex") => lower.contains("codex") && lower.contains("done"),
        Some("opencode") => lower.contains("completed") || lower.contains("finished"),
        _ => lower.contains("task completed")
            || lower.contains("✓ done")
            || lower.ends_with("done\n")
            || tail.trim_end().ends_with("done"),
    }
}

fn is_working(lower: &str, tail: &str) -> bool {
    lower.contains("working")
        || lower.contains("esc to interrupt")
        || lower.contains("thinking")
        || tail.contains('⠋')
        || tail.contains('⠙')
        || tail.contains('⠹')
        || tail.contains('◐')
}

fn is_idle(tail: &str) -> bool {
    let trimmed = tail.trim_end();
    trimmed.ends_with("$")
        || trimmed.ends_with("$ ")
        || trimmed.ends_with("❯")
        || trimmed.ends_with("❯ ")
        || trimmed.ends_with("%")
        || trimmed.ends_with("% ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_working_from_spinner() {
        let status = infer_status(Some("claude"), "⠋ Working...\n");
        assert_eq!(status, Some(AgentStatus::Working));
    }

    #[test]
    fn detects_blocked_from_approval_prompt() {
        let status = infer_status(None, "Waiting for approval (y/n)\n");
        assert_eq!(status, Some(AgentStatus::Blocked));
    }

    #[test]
    fn detects_done_from_generic_marker() {
        let status = infer_status(None, "✓ Task completed\n");
        assert_eq!(status, Some(AgentStatus::Done));
    }

    #[test]
    fn detects_idle_shell_prompt() {
        let status = infer_status(None, "user@host project % ");
        assert_eq!(status, Some(AgentStatus::Idle));
    }

    #[test]
    fn fixture_claude_working() {
        let tail = include_str!("../../tests/fixtures/agent_output/claude_working.txt");
        assert_eq!(infer_status(Some("claude"), tail), Some(AgentStatus::Working));
    }

    #[test]
    fn fixture_blocked_approval() {
        let tail = include_str!("../../tests/fixtures/agent_output/blocked_approval.txt");
        assert_eq!(infer_status(None, tail), Some(AgentStatus::Blocked));
    }

    #[test]
    fn fixture_generic_done() {
        let tail = include_str!("../../tests/fixtures/agent_output/generic_done.txt");
        assert_eq!(infer_status(None, tail), Some(AgentStatus::Done));
    }
}
