use std::collections::HashMap;

use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::orchestrator::parser::{append_tail, infer_status, AgentStatus};
use crate::pty::PtyManager;

#[derive(Debug, Clone, Serialize)]
pub struct OrchestratorStatusEvent {
    pub pty_id: String,
    pub status: String,
    pub output_tail: String,
}

#[derive(Debug, Clone)]
pub struct SessionSnapshot {
    pub status: AgentStatus,
    pub output_tail: String,
}

struct SessionState {
    agent_kind: Option<String>,
    status: AgentStatus,
    output_tail: String,
    force_done: bool,
}

pub struct OrchestratorBus {
    sessions: HashMap<String, SessionState>,
}

impl OrchestratorBus {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    pub fn register(&mut self, pty_id: &str, agent_kind: Option<String>) {
        self.sessions.insert(
            pty_id.to_string(),
            SessionState {
                agent_kind,
                status: AgentStatus::Idle,
                output_tail: String::new(),
                force_done: false,
            },
        );
    }

    pub fn unregister(&mut self, pty_id: &str) {
        self.sessions.remove(pty_id);
    }

    pub fn set_agent_kind(&mut self, pty_id: &str, agent_kind: Option<String>) {
        if let Some(session) = self.sessions.get_mut(pty_id) {
            session.agent_kind = agent_kind;
        }
    }

    pub fn on_output(&mut self, app: &AppHandle, pty_id: &str, data: &str) {
        let session = match self.sessions.get_mut(pty_id) {
            Some(s) => s,
            None => return,
        };

        append_tail(&mut session.output_tail, data);

        if session.force_done {
            return;
        }

        let inferred = infer_status(session.agent_kind.as_deref(), &session.output_tail);
        if inferred.is_none() {
            return;
        }

        let new_status = inferred.unwrap();
        if new_status == session.status {
            return;
        }

        session.status = new_status;
        let status = session.status;
        let output_tail = session.output_tail.clone();
        self.emit_status_payload(
            app,
            pty_id,
            status.as_str(),
            output_tail,
        );
    }

    pub fn dispatch_message(
        &mut self,
        pty: &PtyManager,
        pty_id: &str,
        text: &str,
    ) -> Result<(), String> {
        if !self.sessions.contains_key(pty_id) {
            self.register(pty_id, None);
        }

        let session = self.sessions.get_mut(pty_id).expect("session exists");
        session.force_done = false;
        session.status = AgentStatus::Working;

        pty.write(pty_id, text)?;
        if !text.ends_with('\n') {
            pty.write(pty_id, "\n")?;
        }

        Ok(())
    }

    pub fn force_done(&mut self, app: &AppHandle, pty_id: &str) {
        let session = match self.sessions.get_mut(pty_id) {
            Some(s) => s,
            None => return,
        };
        session.force_done = true;
        session.status = AgentStatus::Done;
        let status = session.status.as_str();
        let output_tail = session.output_tail.clone();
        self.emit_status_payload(app, pty_id, status, output_tail);
    }

    pub fn get_status(&self, pty_id: &str) -> Option<SessionSnapshot> {
        self.sessions.get(pty_id).map(|s| SessionSnapshot {
            status: s.status,
            output_tail: s.output_tail.clone(),
        })
    }

    fn emit_status_payload(
        &self,
        app: &AppHandle,
        pty_id: &str,
        status: &str,
        output_tail: String,
    ) {
        let _ = app.emit(
            "orchestrator-status",
            OrchestratorStatusEvent {
                pty_id: pty_id.to_string(),
                status: status.to_string(),
                output_tail,
            },
        );
    }

    fn emit_status(&self, app: &AppHandle, pty_id: &str, session: &SessionState) {
        self.emit_status_payload(
            app,
            pty_id,
            session.status.as_str(),
            session.output_tail.clone(),
        );
    }

    pub fn emit_current(&self, app: &AppHandle, pty_id: &str) {
        if let Some(session) = self.sessions.get(pty_id) {
            self.emit_status(app, pty_id, session);
        }
    }
}
