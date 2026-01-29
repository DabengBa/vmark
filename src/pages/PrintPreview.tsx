/**
 * Print Preview Page (v2)
 *
 * Uses ExportSurface for visual-parity rendering.
 * Waits for all assets (fonts, images, Math, Mermaid) before printing.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { ExportSurface, type ExportSurfaceRef } from "@/export";
import { waitForAssets } from "@/export/waitForAssets";
import "@/export/exportStyles.css";

/** Event name for print request from main window */
const PRINT_REQUEST_EVENT = "export:print-request";

/** Fallback: Storage key for print content (legacy support) */
const PRINT_CONTENT_KEY = "vmark-print-content";

/** Maximum time to wait for rendering (ms) */
const MAX_RENDER_TIMEOUT = 10000;

interface PrintRequestPayload {
  markdown: string;
  title?: string;
  lightTheme?: boolean;
}

interface PrintStatus {
  stage: "loading" | "rendering" | "ready" | "error";
  message?: string;
}

export function PrintPreviewPage() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [_title, setTitle] = useState<string>("Document");
  const [lightTheme, setLightTheme] = useState(true);
  const [status, setStatus] = useState<PrintStatus>({ stage: "loading" });
  const surfaceRef = useRef<ExportSurfaceRef>(null);
  const hasTriggeredPrint = useRef(false);

  // Handle print when ready
  const handlePrint = useCallback(async () => {
    if (hasTriggeredPrint.current) return;

    const container = surfaceRef.current?.getContainer();
    if (!container) {
      setStatus({ stage: "error", message: "Failed to get content container" });
      return;
    }

    setStatus({ stage: "rendering", message: "Waiting for assets..." });

    // Wait for all assets to be ready
    const result = await waitForAssets(container, {
      timeout: MAX_RENDER_TIMEOUT,
      onProgress: (s) => {
        const pending: string[] = [];
        if (!s.fontsReady) pending.push("fonts");
        if (!s.imagesReady) pending.push("images");
        if (!s.mathReady) pending.push("math");
        if (!s.mermaidReady) pending.push("diagrams");

        if (pending.length > 0) {
          setStatus({
            stage: "rendering",
            message: `Loading ${pending.join(", ")}...`,
          });
        }
      },
    });

    if (result.warnings.length > 0) {
      console.warn("[PrintPreview] Asset warnings:", result.warnings);
    }

    setStatus({ stage: "ready" });
    hasTriggeredPrint.current = true;

    // Trigger print after a short delay for final layout
    setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  // Listen for print request from main window
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen<PrintRequestPayload>(PRINT_REQUEST_EVENT, (event) => {
        const { markdown: md, title: t, lightTheme: lt } = event.payload;
        setMarkdown(md);
        if (t) setTitle(t);
        if (lt !== undefined) setLightTheme(lt);
      });
    };

    setupListener();

    // Fallback: check localStorage for legacy support
    const fallbackTimeout = setTimeout(() => {
      if (markdown === null) {
        const stored = localStorage.getItem(PRINT_CONTENT_KEY);
        if (stored !== null) {
          setMarkdown(stored);
          localStorage.removeItem(PRINT_CONTENT_KEY);
        }
      }
    }, 500);

    // Error timeout if no content arrives
    const errorTimeout = setTimeout(() => {
      if (markdown === null) {
        setStatus({
          stage: "error",
          message: "No content received. Please try again.",
        });
      }
    }, 5000);

    return () => {
      unlisten?.();
      clearTimeout(fallbackTimeout);
      clearTimeout(errorTimeout);
    };
  }, [markdown]);

  // Render status UI
  const renderStatus = () => {
    if (status.stage === "loading") {
      return (
        <div className="print-status print-status-loading">
          Loading content...
        </div>
      );
    }

    if (status.stage === "rendering") {
      return (
        <div className="print-status print-status-rendering">
          {status.message ?? "Preparing for print..."}
        </div>
      );
    }

    if (status.stage === "error") {
      return (
        <div className="print-status print-status-error">
          {status.message ?? "An error occurred"}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`print-preview-container ${lightTheme ? "" : "dark-theme"}`}>
      <style>{printPreviewStyles}</style>

      {markdown !== null ? (
        <ExportSurface
          ref={surfaceRef}
          markdown={markdown}
          lightTheme={lightTheme}
          onReady={handlePrint}
          onError={(error) => {
            setStatus({ stage: "error", message: error.message });
          }}
        />
      ) : (
        renderStatus()
      )}

      {/* Status overlay (hidden when printing) */}
      {status.stage !== "ready" && (
        <div className="print-status-overlay">{renderStatus()}</div>
      )}
    </div>
  );
}

/** Print preview styles */
const printPreviewStyles = `
.print-preview-container {
  min-height: 100vh;
  background: var(--bg-color, #ffffff);
}

.print-status {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary, #666666);
}

.print-status-error {
  color: var(--error-color, #cf222e);
}

.print-status-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-color, #ffffff);
  z-index: 1000;
}

@media print {
  .print-status-overlay {
    display: none !important;
  }

  .print-preview-container {
    background: white !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    margin: 1.5cm;
  }
}
`;
