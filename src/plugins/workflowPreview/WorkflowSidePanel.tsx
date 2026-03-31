/**
 * Workflow Side Panel
 *
 * Purpose: Persistent side panel for standalone .yml workflow files.
 * Shows the React Flow graph alongside the CodeMirror YAML editor.
 *
 * @coordinates-with workflowPreviewStore.ts — reads panel state
 * @coordinates-with WorkflowPreview.tsx — renders the React Flow canvas
 * @coordinates-with Editor.tsx — mounted alongside editor-content
 * @module plugins/workflowPreview/WorkflowSidePanel
 */

import { useCallback, useRef, useState, useEffect } from "react";
import { useWorkflowPreviewStore } from "@/stores/workflowPreviewStore";
import { WorkflowPreview } from "./WorkflowPreview";
import { useTranslation } from "react-i18next";
import "./workflow-side-panel.css";

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH_RATIO = 0.8; // max 80% of container
const DEFAULT_PANEL_WIDTH = 400;

export function WorkflowSidePanel() {
  const { t } = useTranslation();
  const panelOpen = useWorkflowPreviewStore((s) => s.panelOpen);
  const graph = useWorkflowPreviewStore((s) => s.graph);
  const parseError = useWorkflowPreviewStore((s) => s.parseError);
  const activeStepId = useWorkflowPreviewStore((s) => s.activeStepId);

  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const panelRef = useRef<HTMLDivElement>(null);

  // Resize handler refs for cleanup (project convention: rules/50 section 2)
  const handlersRef = useRef<{
    move: ((e: MouseEvent) => void) | null;
    up: (() => void) | null;
  }>({ move: null, up: null });

  const cleanup = useCallback(() => {
    if (handlersRef.current.move) {
      document.removeEventListener("mousemove", handlersRef.current.move);
    }
    if (handlersRef.current.up) {
      document.removeEventListener("mouseup", handlersRef.current.up);
    }
    handlersRef.current = { move: null, up: null };
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const handleNodeClick = useCallback((stepId: string, _yamlLine?: number) => {
    useWorkflowPreviewStore.getState().setActiveStepId(stepId);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    cleanup(); // Clean up any previous handlers

    const startX = e.clientX;
    const startWidth = panelWidth;
    const containerWidth = panelRef.current?.parentElement?.clientWidth ?? window.innerWidth;
    const maxWidth = containerWidth * MAX_PANEL_WIDTH_RATIO;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(maxWidth, startWidth + delta)));
    };

    const onUp = () => {
      cleanup();
    };

    handlersRef.current = { move: onMove, up: onUp };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [panelWidth, cleanup]);

  if (!panelOpen) return null;

  return (
    <div
      className="workflow-side-panel"
      style={{ width: panelWidth }}
      ref={panelRef}
    >
      <div
        className="workflow-side-panel__resize-handle"
        onMouseDown={handleResizeStart}
        role="separator"
        aria-label={t("common:resize")}
      />
      <div className="workflow-side-panel__content">
        {parseError ? (
          <div className="workflow-side-panel__error">
            <span className="workflow-side-panel__error-icon">&#x26A0;</span>
            <span className="workflow-side-panel__error-text">{parseError}</span>
          </div>
        ) : graph ? (
          <div className="workflow-preview-canvas">
            <WorkflowPreview
              graph={graph}
              activeStepId={activeStepId}
              onNodeClick={handleNodeClick}
            />
          </div>
        ) : (
          <div className="workflow-side-panel__empty">
            {t("editor:workflow.noPreview")}
          </div>
        )}
      </div>
    </div>
  );
}
