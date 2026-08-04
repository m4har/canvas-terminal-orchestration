#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PtyOutputEvent {
    pub pty_id: String,
    pub data: String,
    #[serde(default)]
    pub full: bool,
}
