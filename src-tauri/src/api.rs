use serde::{Deserialize, Serialize};
use tauri::{AppHandle};

// Audio API Structs
#[derive(Debug, Serialize, Deserialize)]
pub struct AudioResponse {
    success: bool,
    transcription: Option<String>,
    error: Option<String>,
}

// Model API Structs
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Model {
    provider: String,
    name: String,
    id: String,
    model: String,
    description: String,
    modality: String,
    #[serde(rename = "isAvailable")]
    is_available: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemPromptResponse {
    prompt_name: String,
    system_prompt: String,
}

// Pluely Prompts API
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluelyPrompt {
    title: String,
    prompt: String,
    #[serde(rename = "modelId")]
    model_id: String,
    #[serde(rename = "modelName")]
    model_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PluelyPromptsResponse {
    prompts: Vec<PluelyPrompt>,
    total: i32,
    #[serde(rename = "last_updated")]
    last_updated: Option<String>,
}

// Audio API Command
#[tauri::command]
pub async fn transcribe_audio(
    _app: AppHandle,
    _audio_base64: String,
) -> Result<AudioResponse, String> {
    // 100% PRIVACY LOCKDOWN: Block all cloud STT routing.
    Err("Pluely Cloud STT is disabled for privacy. Please configure a custom STT provider in Settings.".into())
}

#[tauri::command]
pub async fn chat_stream_response(
    _app: AppHandle,
    _user_message: String,
    _system_prompt: Option<String>,
    _image_base64: Option<serde_json::Value>,
    _history: Option<String>,
) -> Result<String, String> {
    // 100% PRIVACY LOCKDOWN: Block all cloud AI routing.
    Err("Pluely Cloud AI is disabled for privacy. Please configure a custom AI provider in Settings.".into())
}

// Models API Command
#[tauri::command]
pub async fn fetch_models(_app: AppHandle) -> Result<Vec<Model>, String> {
    // TELEMETRY/NETWORK REMOVED
    Ok(vec![])
}

// Fetch Pluely Prompts API
#[tauri::command]
pub async fn fetch_prompts() -> Result<PluelyPromptsResponse, String> {
    // TELEMETRY/NETWORK REMOVED
    Ok(PluelyPromptsResponse {
        prompts: vec![],
        total: 0,
        last_updated: None,
    })
}

// Create System Prompt API Command
#[tauri::command]
pub async fn create_system_prompt(
    _app: AppHandle,
    _user_prompt: String,
) -> Result<SystemPromptResponse, String> {
    // Block server-side AI generation mechanism
    Err("Cloud generation is disabled for maximum privacy. Please write prompts manually.".into())
}

// Helper command to check if license is available
#[tauri::command]
pub async fn check_license_status(_app: AppHandle) -> Result<bool, String> {
    // Always return true
    Ok(true)
}

#[allow(dead_code)]
#[tauri::command]
pub async fn get_activity(_app: AppHandle) -> Result<serde_json::Value, String> {
    // Prevent network request, return empty tracking data
    Ok(serde_json::json!({
        "success": true,
        "data": [],
        "total_tokens_used": 0
    }))
}
