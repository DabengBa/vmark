//! Tauri commands for workflow execution.

use super::runner::run_workflow_sequential;
use super::types::RawWorkflow;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, State};

/// Shared state for workflow execution concurrency guard.
pub struct WorkflowRunnerState {
    pub running: AtomicBool,
}

/// Execute a workflow from YAML string.
/// Only one workflow can run at a time (concurrency guard).
#[tauri::command]
pub async fn run_workflow(
    app: AppHandle,
    yaml: String,
    env: HashMap<String, String>,
    workspace_root: String,
    state: State<'_, WorkflowRunnerState>,
) -> Result<String, String> {
    // Concurrency guard
    if state
        .running
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err("A workflow is already running. Wait for it to complete or cancel it.".to_string());
    }

    // Validate inputs
    if yaml.trim().is_empty() {
        state.running.store(false, Ordering::SeqCst);
        return Err("Workflow YAML is empty".to_string());
    }

    let workspace = PathBuf::from(&workspace_root);
    if !workspace.is_dir() {
        state.running.store(false, Ordering::SeqCst);
        return Err(format!(
            "Workspace root '{}' is not a valid directory",
            workspace_root
        ));
    }

    let workflow: RawWorkflow = match serde_yaml::from_str(&yaml) {
        Ok(w) => w,
        Err(e) => {
            state.running.store(false, Ordering::SeqCst);
            return Err(format!("Failed to parse workflow YAML: {}", e));
        }
    };

    // Validate step count
    if workflow.steps.len() > 50 {
        state.running.store(false, Ordering::SeqCst);
        return Err(format!(
            "Workflow has {} steps (max 50)",
            workflow.steps.len()
        ));
    }

    let result = run_workflow_sequential(&app, workflow, env, &workspace).await;

    // Release the guard
    state.running.store(false, Ordering::SeqCst);

    result
}

/// Cancel a running workflow.
#[tauri::command]
pub async fn cancel_workflow(
    _app: AppHandle,
    execution_id: String,
    state: State<'_, WorkflowRunnerState>,
) -> Result<(), String> {
    if !state.running.load(Ordering::SeqCst) {
        return Err(format!(
            "No workflow is currently running (requested cancel for '{}')",
            execution_id
        ));
    }
    // TODO: implement cancellation via a shared CancellationToken
    // For now, we log and return an error
    log::warn!(
        "Workflow cancellation requested for '{}' but not yet implemented",
        execution_id
    );
    Err("Cancellation not yet implemented — workflow will run to completion".to_string())
}
