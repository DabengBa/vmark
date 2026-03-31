/**
 * Workflow Engine Feature Flag
 *
 * Reads from settingsStore.advanced.workflowEngine (persisted).
 * Toggle via: Settings > Advanced > Developer > Workflow Engine.
 *
 * For non-reactive contexts (Rust commands, initial load), use
 * `isWorkflowEnabled()`. For React components, use the store selector
 * `useSettingsStore(s => s.advanced.workflowEngine)` directly.
 */

import { useSettingsStore } from "@/stores/settingsStore";

/** Check if workflow engine is enabled (non-reactive, for imperative code). */
export function isWorkflowEnabled(): boolean {
  return useSettingsStore.getState().advanced.workflowEngine ?? false;
}

/**
 * Static export for tree-shaking compatibility in module-level guards.
 * Falls back to false during SSR/test where the store may not be initialized.
 */
export const WORKFLOW_ENABLED = false; // kept for backward compat; runtime reads store
