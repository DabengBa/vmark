import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useDocumentFilePath, useDocumentIsDirty } from "./useDocumentState";
import { useSettingsStore } from "@/stores/settingsStore";
import { getFileName } from "@/utils/pathUtils";

/**
 * Update window title based on document state and settings.
 * Format: [• ]filename (when showFilenameInTitlebar is enabled)
 * Format: (empty) (when showFilenameInTitlebar is disabled)
 *
 * Also sets document.title (without extension) for the print dialog's
 * default PDF filename — otherwise it would always show "VMark".
 */
export function useWindowTitle() {
  const filePath = useDocumentFilePath();
  const isDirty = useDocumentIsDirty();
  // Default to false for undefined (localStorage migration)
  const showFilename = useSettingsStore((state) => state.appearance.showFilenameInTitlebar ?? false);

  useEffect(() => {
    const updateTitle = async () => {
      const window = getCurrentWebviewWindow();

      // Extract filename from path or use "Untitled"
      const filename = filePath ? getFileName(filePath) || "Untitled" : "Untitled";

      // Always update document.title for print dialog PDF filename
      // Remove extension for cleaner PDF naming
      const baseName = filename.replace(/\.[^.]+$/, "");
      document.title = baseName;

      if (showFilename) {
        // Add dirty indicator for window title
        const dirtyIndicator = isDirty ? "• " : "";
        const title = `${dirtyIndicator}${filename}`;

        await window.setTitle(title);
      } else {
        // Empty titlebar when setting is off
        await window.setTitle("");
      }
    };

    updateTitle();
  }, [filePath, isDirty, showFilename]);
}
