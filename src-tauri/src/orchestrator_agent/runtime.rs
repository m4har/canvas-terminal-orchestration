use futures::StreamExt;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LlmProvider {
    Openai,
    Anthropic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmSettings {
    pub provider: LlmProvider,
    pub base_url: String,
    pub api_key: String,
}

impl Default for LlmSettings {
    fn default() -> Self {
        Self {
            provider: LlmProvider::Openai,
            base_url: "https://api.openai.com/v1".into(),
            api_key: String::new(),
        }
    }
}

pub async fn stream_completion<F>(
    settings: &LlmSettings,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    mut on_chunk: F,
) -> Result<String, String>
where
    F: FnMut(&str),
{
    match settings.provider {
        LlmProvider::Openai => {
            stream_openai(settings, model, system_prompt, user_prompt, on_chunk).await
        }
        LlmProvider::Anthropic => {
            stream_anthropic(settings, model, system_prompt, user_prompt, on_chunk).await
        }
    }
}

async fn stream_openai<F>(
    settings: &LlmSettings,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    mut on_chunk: F,
) -> Result<String, String>
where
    F: FnMut(&str),
{
    let url = format!(
        "{}/chat/completions",
        settings.base_url.trim_end_matches('/')
    );
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model,
        "stream": true,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_prompt }
        ]
    });

    let resp = {
        let mut req = client.post(&url).json(&body);
        if !settings.api_key.is_empty() {
            req = req.bearer_auth(&settings.api_key);
        }
        req.send().await.map_err(|e| e.to_string())?
    };

    if !resp.status().is_success() {
        let err = resp.text().await.unwrap_or_default();
        return Err(format!("openai error: {err}"));
    }

    let mut full = String::new();
    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let line = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();
            for part in line.lines() {
                let part = part.trim();
                if !part.starts_with("data: ") {
                    continue;
                }
                let data = part.trim_start_matches("data: ").trim();
                if data == "[DONE]" {
                    continue;
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(delta) = json
                        .pointer("/choices/0/delta/content")
                        .and_then(|v| v.as_str())
                    {
                        full.push_str(delta);
                        on_chunk(delta);
                    }
                }
            }
        }
    }

    Ok(full)
}

async fn stream_anthropic<F>(
    settings: &LlmSettings,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    mut on_chunk: F,
) -> Result<String, String>
where
    F: FnMut(&str),
{
    let url = format!("{}/messages", settings.base_url.trim_end_matches('/'));
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model,
        "max_tokens": 4096,
        "stream": true,
        "system": system_prompt,
        "messages": [
            { "role": "user", "content": user_prompt }
        ]
    });

    let resp = {
        let mut req = client
            .post(&url)
            .header("anthropic-version", "2023-06-01")
            .json(&body);
        if !settings.api_key.is_empty() {
            req = req.header("x-api-key", &settings.api_key);
        }
        req.send().await.map_err(|e| e.to_string())?
    };

    if !resp.status().is_success() {
        let err = resp.text().await.unwrap_or_default();
        return Err(format!("anthropic error: {err}"));
    }

    let mut full = String::new();
    let mut stream = resp.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let line = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();
            for part in line.lines() {
                let part = part.trim();
                if !part.starts_with("data: ") {
                    continue;
                }
                let data = part.trim_start_matches("data: ").trim();
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if json.get("type").and_then(|t| t.as_str()) == Some("content_block_delta") {
                        if let Some(text) = json
                            .pointer("/delta/text")
                            .and_then(|v| v.as_str())
                        {
                            full.push_str(text);
                            on_chunk(text);
                        }
                    }
                }
            }
        }
    }

    Ok(full)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_llm_settings_use_openai() {
        let s = LlmSettings::default();
        assert_eq!(s.provider, LlmProvider::Openai);
        assert!(s.base_url.contains("openai"));
    }
}
