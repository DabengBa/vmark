//! Sequential workflow runner.
//!
//! Executes workflow steps in order, emitting status events to the frontend.
//! All file operations are sandboxed to the workspace root directory.
//!
//! Key decisions:
//!   - Path sandboxing via `sandbox::validate_path` for all file I/O
//!   - Resource limits: max 1000 files, 10MB per file, 100MB total in read-folder
//!   - Event emission failures are logged, not silently dropped
//!   - Unimplemented step types (genie, webhook) return Err, not fake Ok
//!   - Returns Err when any step fails (not Ok with silent failure)
//!   - Env substitution uses regex for embedded `${VAR}` patterns

use super::sandbox::validate_path;
use super::types::*;
use regex::Regex;
use std::collections::HashMap;
use std::path::Path;
use std::sync::LazyLock;
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

// Resource limits for file actions
const MAX_FILES_PER_FOLDER: usize = 1000;
const MAX_FILE_SIZE_BYTES: u64 = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_READ_BYTES: u64 = 100 * 1024 * 1024; // 100MB
const MAX_OUTPUT_SIZE_BYTES: usize = 5 * 1024 * 1024; // 5MB per step output in IPC

static ENV_VAR_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\$\{(\w+)\}").expect("Invalid env var regex"));

/// Emit a Tauri event, logging failures instead of silently dropping them.
fn emit_event<S: serde::Serialize + Clone>(app: &AppHandle, event: &str, payload: S) {
    if let Err(e) = app.emit(event, payload.clone()) {
        log::error!("Failed to emit '{}': {}", event, e);
        // Retry once for critical completion events
        if event == "workflow:complete" {
            if let Err(e2) = app.emit(event, payload) {
                log::error!("Retry failed for '{}': {}", event, e2);
            }
        }
    }
}

/// Execute a parsed workflow sequentially.
///
/// Returns the execution ID on success, or an error if any step fails.
/// Emits `workflow:step-update` for each step and `workflow:complete` when done.
pub async fn run_workflow_sequential(
    app: &AppHandle,
    workflow: RawWorkflow,
    env: HashMap<String, String>,
    workspace_root: &Path,
) -> Result<String, String> {
    let execution_id = Uuid::new_v4().to_string();
    let mut outputs: HashMap<String, String> = HashMap::new();

    // Merge workflow env with provided env (provided takes precedence)
    let mut merged_env = workflow.env.clone();
    merged_env.extend(env);

    let step_count = workflow.steps.len();
    let mut failed = false;
    let mut failed_step = String::new();

    log::info!(
        "Workflow '{}' starting: {} steps",
        workflow.name,
        step_count
    );

    for (i, step) in workflow.steps.into_iter().enumerate() {
        let step_id = step
            .id
            .clone()
            .unwrap_or_else(|| step.uses.split('/').last().unwrap_or("step").to_string());

        // Skip if a previous step failed
        if failed {
            emit_event(
                app,
                "workflow:step-update",
                StepStatusEvent {
                    execution_id: execution_id.clone(),
                    step_id: step_id.clone(),
                    status: "skipped".to_string(),
                    output: None,
                    error: None,
                    duration: None,
                },
            );
            continue;
        }

        // Emit running status
        emit_event(
            app,
            "workflow:step-update",
            StepStatusEvent {
                execution_id: execution_id.clone(),
                step_id: step_id.clone(),
                status: "running".to_string(),
                output: None,
                error: None,
                duration: None,
            },
        );

        let start = Instant::now();

        // Resolve parameters: output refs + env substitution
        let resolved_params =
            resolve_params(&step.with, &outputs, &merged_env, workspace_root)?;

        // Execute step based on type
        let result = execute_step(&step.uses, &resolved_params, workspace_root).await;
        let duration_ms = start.elapsed().as_millis() as u64;

        match result {
            Ok(output) => {
                // Truncate large outputs before storing (prevent memory bloat)
                let stored_output = if output.len() > MAX_OUTPUT_SIZE_BYTES {
                    format!(
                        "{}...\n[Output truncated: {} bytes total]",
                        &output[..MAX_OUTPUT_SIZE_BYTES],
                        output.len()
                    )
                } else {
                    output.clone()
                };
                outputs.insert(step_id.clone(), stored_output.clone());
                emit_event(
                    app,
                    "workflow:step-update",
                    StepStatusEvent {
                        execution_id: execution_id.clone(),
                        step_id,
                        status: "success".to_string(),
                        output: Some(stored_output),
                        error: None,
                        duration: Some(duration_ms),
                    },
                );
            }
            Err(error) => {
                failed = true;
                failed_step = step_id.clone();
                emit_event(
                    app,
                    "workflow:step-update",
                    StepStatusEvent {
                        execution_id: execution_id.clone(),
                        step_id,
                        status: "error".to_string(),
                        output: None,
                        error: Some(error),
                        duration: Some(duration_ms),
                    },
                );
            }
        }

        log::info!(
            "Workflow '{}': step {}/{} ({}) {}",
            workflow.name,
            i + 1,
            step_count,
            if failed { "FAILED" } else { "ok" },
            if duration_ms > 0 {
                format!("({}ms)", duration_ms)
            } else {
                String::new()
            }
        );
    }

    // Emit completion
    let final_status = if failed { "failed" } else { "completed" };
    emit_event(
        app,
        "workflow:complete",
        ExecutionCompleteEvent {
            execution_id: execution_id.clone(),
            status: final_status.to_string(),
        },
    );

    log::info!("Workflow '{}' {}", workflow.name, final_status);

    if failed {
        Err(format!(
            "Workflow '{}' failed at step '{}'",
            workflow.name, failed_step
        ))
    } else {
        Ok(execution_id)
    }
}

/// Resolve step parameters: substitute ${VAR} env refs and step.output refs.
fn resolve_params(
    params: &HashMap<String, String>,
    outputs: &HashMap<String, String>,
    env: &HashMap<String, String>,
    workspace_root: &Path,
) -> Result<HashMap<String, String>, String> {
    let mut resolved = HashMap::new();

    for (key, value) in params {
        let mut val = value.clone();

        // 1. Env variable substitution (regex-based, handles embedded ${VAR})
        val = ENV_VAR_RE
            .replace_all(&val, |caps: &regex::Captures| {
                let var_name = &caps[1];
                env.get(var_name).cloned().unwrap_or_else(|| {
                    log::warn!(
                        "Unresolved env variable '${{{}}}'",
                        var_name
                    );
                    String::new()
                })
            })
            .to_string();

        // 2. Output reference resolution (stepId.output)
        if val.ends_with(".output") {
            let ref_id = val.trim_end_matches(".output");
            if let Some(output) = outputs.get(ref_id) {
                val = output.clone();
            } else {
                log::warn!(
                    "Unresolved output reference '{}.output' — step may not have run or produced output",
                    ref_id
                );
                return Err(format!(
                    "Step output reference '{}.output' not found — the step may have failed or been skipped",
                    ref_id
                ));
            }
        }

        // 3. Re-validate paths after substitution (prevents injection via output refs)
        if key == "path" {
            validate_path(&val, workspace_root).map_err(|e| {
                format!("Path validation failed after parameter resolution: {}", e)
            })?;
        }

        resolved.insert(key.clone(), val);
    }

    Ok(resolved)
}

/// Execute a single step based on its `uses:` prefix.
async fn execute_step(
    uses: &str,
    params: &HashMap<String, String>,
    workspace_root: &Path,
) -> Result<String, String> {
    if uses.starts_with("action/") {
        execute_action(uses, params, workspace_root).await
    } else if uses.starts_with("genie/") {
        Err(format!(
            "Genie '{}' execution not yet implemented — requires AI provider adapter",
            uses
        ))
    } else if uses.starts_with("webhook/") {
        Err(format!(
            "Webhook '{}' execution not yet implemented",
            uses
        ))
    } else {
        Err(format!("Unknown step type: {}", uses))
    }
}

/// Execute a built-in action step.
/// All file paths are validated against the workspace root.
async fn execute_action(
    uses: &str,
    params: &HashMap<String, String>,
    workspace_root: &Path,
) -> Result<String, String> {
    let action = uses.strip_prefix("action/").unwrap_or(uses);
    match action {
        "read-file" => {
            let path_str = params
                .get("path")
                .ok_or("action/read-file requires 'path' parameter")?;
            let path = validate_path(path_str, workspace_root)?;
            let meta = tokio::fs::metadata(&path)
                .await
                .map_err(|e| format!("Cannot access '{}': {}", path_str, e))?;
            if meta.len() > MAX_FILE_SIZE_BYTES {
                return Err(format!(
                    "File '{}' is too large ({} bytes, max {})",
                    path_str,
                    meta.len(),
                    MAX_FILE_SIZE_BYTES
                ));
            }
            tokio::fs::read_to_string(&path)
                .await
                .map_err(|e| format!("Failed to read '{}': {}", path_str, e))
        }
        "read-folder" => {
            let path_str = params
                .get("path")
                .ok_or("action/read-folder requires 'path' parameter")?;
            let path = validate_path(path_str, workspace_root)?;
            let accept = params.get("accept").map(|s| s.as_str()).unwrap_or("*");
            let mut entries = Vec::new();
            let mut total_bytes: u64 = 0;
            let mut file_count: usize = 0;
            let mut dir = tokio::fs::read_dir(&path)
                .await
                .map_err(|e| format!("Failed to read directory '{}': {}", path_str, e))?;

            while let Some(entry) = dir
                .next_entry()
                .await
                .map_err(|e| format!("Failed to read entry: {}", e))?
            {
                // Resource limits
                file_count += 1;
                if file_count > MAX_FILES_PER_FOLDER {
                    return Err(format!(
                        "Directory '{}' exceeds max file limit ({})",
                        path_str, MAX_FILES_PER_FOLDER
                    ));
                }

                let name = entry.file_name().to_string_lossy().to_string();
                if !matches_accept(&name, accept) {
                    continue;
                }

                // Check file size before reading
                let meta = match tokio::fs::metadata(entry.path()).await {
                    Ok(m) => m,
                    Err(e) => {
                        log::warn!("Skipping unreadable file '{}': {}", name, e);
                        continue;
                    }
                };
                if !meta.is_file() {
                    continue;
                }
                if meta.len() > MAX_FILE_SIZE_BYTES {
                    log::warn!(
                        "Skipping oversized file '{}' ({} bytes)",
                        name,
                        meta.len()
                    );
                    continue;
                }
                total_bytes += meta.len();
                if total_bytes > MAX_TOTAL_READ_BYTES {
                    return Err(format!(
                        "Total read size exceeds limit ({} bytes)",
                        MAX_TOTAL_READ_BYTES
                    ));
                }

                match tokio::fs::read_to_string(entry.path()).await {
                    Ok(content) => {
                        entries.push(format!("--- {} ---\n{}", name, content));
                    }
                    Err(e) => {
                        log::warn!("Skipping unreadable file '{}': {}", name, e);
                    }
                }
            }
            Ok(entries.join("\n\n"))
        }
        "save-file" => {
            let path_str = params
                .get("path")
                .ok_or("action/save-file requires 'path' parameter")?;
            let path = validate_path(path_str, workspace_root)?;
            let input = params
                .get("input")
                .ok_or("action/save-file requires 'input' parameter")?;
            // Create parent directories if they don't exist
            if let Some(parent) = path.parent() {
                tokio::fs::create_dir_all(parent)
                    .await
                    .map_err(|e| format!("Failed to create directory for '{}': {}", path_str, e))?;
            }
            tokio::fs::write(&path, input)
                .await
                .map_err(|e| format!("Failed to write '{}': {}", path_str, e))?;
            Ok(format!("Saved to {}", path_str))
        }
        "notify" => {
            let message = params.get("message").cloned().unwrap_or_default();
            log::info!("Workflow notification: {}", message);
            Ok(message)
        }
        "copy" => {
            let input = params.get("input").cloned().unwrap_or_default();
            Ok(input)
        }
        "prompt" => {
            Err("Interactive prompt not supported in workflow execution".to_string())
        }
        _ => Err(format!("Unknown action: {}", action)),
    }
}

/// Check if a filename matches an accept pattern.
/// Supports: `*` (all), `*.ext` (extension match), `.ext` (extension match).
fn matches_accept(name: &str, accept: &str) -> bool {
    if accept == "*" {
        return true;
    }
    let ext = accept.trim_start_matches('*');
    name.ends_with(ext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_action_notify() {
        let mut params = HashMap::new();
        params.insert("message".to_string(), "Hello".to_string());
        let root = std::path::Path::new("/tmp");
        let result = execute_action("action/notify", &params, root).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Hello");
    }

    #[tokio::test]
    async fn test_execute_action_copy() {
        let mut params = HashMap::new();
        params.insert("input".to_string(), "test data".to_string());
        let root = std::path::Path::new("/tmp");
        let result = execute_action("action/copy", &params, root).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test data");
    }

    #[tokio::test]
    async fn test_execute_action_unknown() {
        let params = HashMap::new();
        let root = std::path::Path::new("/tmp");
        let result = execute_action("action/unknown", &params, root).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_execute_step_unknown_type() {
        let params = HashMap::new();
        let root = std::path::Path::new("/tmp");
        let result = execute_step("unknown/thing", &params, root).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_genie_step_returns_error() {
        let params = HashMap::new();
        let root = std::path::Path::new("/tmp");
        let result = execute_step("genie/summarize", &params, root).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not yet implemented"));
    }

    #[tokio::test]
    async fn test_webhook_step_returns_error() {
        let params = HashMap::new();
        let root = std::path::Path::new("/tmp");
        let result = execute_step("webhook/stripe", &params, root).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not yet implemented"));
    }

    #[tokio::test]
    async fn test_prompt_returns_error() {
        let params = HashMap::new();
        let root = std::path::Path::new("/tmp");
        let result = execute_action("action/prompt", &params, root).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_matches_accept() {
        assert!(matches_accept("readme.md", "*"));
        assert!(matches_accept("readme.md", "*.md"));
        assert!(matches_accept("readme.md", ".md"));
        assert!(!matches_accept("readme.md", "*.txt"));
        assert!(!matches_accept("readme.md", ".txt"));
    }

    #[test]
    fn test_env_substitution_regex() {
        let env: HashMap<String, String> =
            [("DIR".to_string(), "notes".to_string())].into();
        let input = "output/${DIR}/file.md";
        let result = ENV_VAR_RE
            .replace_all(input, |caps: &regex::Captures| {
                env.get(&caps[1]).cloned().unwrap_or_default()
            })
            .to_string();
        assert_eq!(result, "output/notes/file.md");
    }

    #[test]
    fn test_env_substitution_multiple_vars() {
        let env: HashMap<String, String> = [
            ("A".to_string(), "hello".to_string()),
            ("B".to_string(), "world".to_string()),
        ]
        .into();
        let input = "${A}/${B}";
        let result = ENV_VAR_RE
            .replace_all(input, |caps: &regex::Captures| {
                env.get(&caps[1]).cloned().unwrap_or_default()
            })
            .to_string();
        assert_eq!(result, "hello/world");
    }

    #[test]
    fn test_resolve_params_output_ref_missing() {
        let mut params = HashMap::new();
        params.insert("input".to_string(), "missing.output".to_string());
        let outputs = HashMap::new();
        let env = HashMap::new();
        let root = std::path::Path::new("/tmp");
        let result = resolve_params(&params, &outputs, &env, root);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }
}
