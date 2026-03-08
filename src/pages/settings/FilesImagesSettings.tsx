/**
 * Files & Images Settings Section
 *
 * File browser, auto-save, document history, image configuration,
 * and document export tools (Pandoc).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SettingRow, SettingsGroup, Toggle, Select } from "./components";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useSettingsStore, type ImageAutoResizeOption } from "@/stores/settingsStore";
import { updateWorkspaceConfig } from "@/hooks/workspaceConfig";
import { RefreshCw, ExternalLink } from "lucide-react";

const autoResizeOptions: { value: string; label: string }[] = [
  { value: "0", label: "Off" },
  { value: "800", label: "800px" },
  { value: "1200", label: "1200px" },
  { value: "1920", label: "1920px (Full HD)" },
  { value: "2560", label: "2560px (2K)" },
];

export function FilesImagesSettings() {
  const isWorkspaceMode = useWorkspaceStore((state) => state.isWorkspaceMode);
  const showHiddenFiles = useWorkspaceStore(
    (state) => state.config?.showHiddenFiles ?? false
  );
  const showAllFiles = useWorkspaceStore(
    (state) => state.config?.showAllFiles ?? false
  );

  const general = useSettingsStore((state) => state.general);
  const updateGeneralSetting = useSettingsStore((state) => state.updateGeneralSetting);

  const autoResizeMax = useSettingsStore((state) => state.image.autoResizeMax);
  const copyToAssets = useSettingsStore((state) => state.image.copyToAssets);
  const cleanupOrphansOnClose = useSettingsStore((state) => state.image.cleanupOrphansOnClose);
  const updateImageSetting = useSettingsStore((state) => state.updateImageSetting);

  return (
    <div>
      {/* File Browser */}
      <SettingsGroup title="File Browser">
        <SettingRow
          label="Show hidden files"
          description="Include dotfiles and hidden system items in the file explorer"
          disabled={!isWorkspaceMode}
        >
          <Toggle
            checked={showHiddenFiles}
            onChange={(value) => {
              void updateWorkspaceConfig({ showHiddenFiles: value });
            }}
            disabled={!isWorkspaceMode}
          />
        </SettingRow>
        <SettingRow
          label="Show all files"
          description="Show non-markdown files in the file explorer (opens with system default app)"
          disabled={!isWorkspaceMode}
        >
          <Toggle
            checked={showAllFiles}
            onChange={(value) => {
              void updateWorkspaceConfig({ showAllFiles: value });
            }}
            disabled={!isWorkspaceMode}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Quit Behavior */}
      <SettingsGroup title="Quit Behavior">
        <SettingRow
          label="Confirm quit"
          description={`Press ${navigator.platform.includes("Mac") ? "⌘Q" : "Ctrl+Q"} twice to quit — prevents accidental exits`}
        >
          <Toggle
            checked={general.confirmQuit}
            onChange={(v) => updateGeneralSetting("confirmQuit", v)}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Saving */}
      <SettingsGroup title="Saving">
        <SettingRow
          label="Enable auto-save"
          description="Automatically save files when edited"
        >
          <Toggle
            checked={general.autoSaveEnabled}
            onChange={(v) => updateGeneralSetting("autoSaveEnabled", v)}
          />
        </SettingRow>
        <SettingRow
          label="Save interval"
          description="Time between auto-saves"
          disabled={!general.autoSaveEnabled}
        >
          <Select
            value={String(general.autoSaveInterval)}
            options={[
              { value: "10", label: "10 seconds" },
              { value: "30", label: "30 seconds" },
              { value: "60", label: "1 minute" },
              { value: "120", label: "2 minutes" },
              { value: "300", label: "5 minutes" },
            ]}
            onChange={(v) => updateGeneralSetting("autoSaveInterval", Number(v))}
            disabled={!general.autoSaveEnabled}
          />
        </SettingRow>
        <SettingRow
          label="Keep document history"
          description="Track versions for undo and recovery"
        >
          <Toggle
            checked={general.historyEnabled}
            onChange={(v) => updateGeneralSetting("historyEnabled", v)}
          />
        </SettingRow>
        <SettingRow
          label="Maximum versions"
          description="Number of snapshots to keep"
          disabled={!general.historyEnabled}
        >
          <Select
            value={String(general.historyMaxSnapshots)}
            options={[
              { value: "10", label: "10 versions" },
              { value: "25", label: "25 versions" },
              { value: "50", label: "50 versions" },
              { value: "100", label: "100 versions" },
            ]}
            onChange={(v) => updateGeneralSetting("historyMaxSnapshots", Number(v))}
            disabled={!general.historyEnabled}
          />
        </SettingRow>
        <SettingRow
          label="Keep versions for"
          description="Maximum age of history"
          disabled={!general.historyEnabled}
        >
          <Select
            value={String(general.historyMaxAgeDays)}
            options={[
              { value: "1", label: "1 day" },
              { value: "7", label: "7 days" },
              { value: "14", label: "14 days" },
              { value: "30", label: "30 days" },
            ]}
            onChange={(v) => updateGeneralSetting("historyMaxAgeDays", Number(v))}
            disabled={!general.historyEnabled}
          />
        </SettingRow>
        <SettingRow
          label="Merge window"
          description="Consecutive auto-saves within this window consolidate into one snapshot"
          disabled={!general.historyEnabled}
        >
          <Select
            value={String(general.historyMergeWindow)}
            options={[
              { value: "0", label: "Off" },
              { value: "10", label: "10 seconds" },
              { value: "30", label: "30 seconds" },
              { value: "60", label: "1 minute" },
              { value: "120", label: "2 minutes" },
            ]}
            onChange={(v) => updateGeneralSetting("historyMergeWindow", Number(v))}
            disabled={!general.historyEnabled}
          />
        </SettingRow>
        <SettingRow
          label="Max file size for history"
          description="Skip history snapshots for files larger than this"
          disabled={!general.historyEnabled}
        >
          <Select
            value={String(general.historyMaxFileSize)}
            options={[
              { value: "256", label: "256 KB" },
              { value: "512", label: "512 KB" },
              { value: "1024", label: "1 MB" },
              { value: "5120", label: "5 MB" },
              { value: "0", label: "Unlimited" },
            ]}
            onChange={(v) => updateGeneralSetting("historyMaxFileSize", Number(v))}
            disabled={!general.historyEnabled}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Images */}
      <SettingsGroup title="Images">
        <SettingRow
          label="Auto-resize on paste"
          description="Automatically resize large images before saving to assets"
        >
          <Select
            value={String(autoResizeMax)}
            options={autoResizeOptions}
            onChange={(v) =>
              updateImageSetting(
                "autoResizeMax",
                Number(v) as ImageAutoResizeOption
              )
            }
          />
        </SettingRow>
        <SettingRow
          label="Copy to assets folder"
          description="Copy pasted/dropped images to the document's assets folder"
        >
          <Toggle
            checked={copyToAssets}
            onChange={(value) => updateImageSetting("copyToAssets", value)}
          />
        </SettingRow>
        <SettingRow
          label="Clean up unused images on close"
          description="Automatically delete images from assets folder that are no longer referenced in the document"
        >
          <Toggle
            checked={cleanupOrphansOnClose}
            onChange={(value) => updateImageSetting("cleanupOrphansOnClose", value)}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Document Tools */}
      <DocumentToolsSettings />
    </div>
  );
}

// ============================================================================
// Document Tools Settings (Pandoc)
// ============================================================================

interface PandocInfo {
  available: boolean;
  path: string | null;
  version: string | null;
}

function DocumentToolsSettings() {
  const [pandoc, setPandoc] = useState<PandocInfo | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const detect = useCallback(async () => {
    setDetecting(true);
    setDetectError(null);
    try {
      const info = await invoke<PandocInfo>("detect_pandoc");
      if (mountedRef.current) setPandoc(info);
    } catch (err) {
      if (mountedRef.current) {
        setPandoc(null);
        setDetectError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) setDetecting(false);
    }
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    detect();
    return () => { mountedRef.current = false; };
  }, [detect]);

  return (
    <SettingsGroup title="Document Tools">
      <SettingRow
        label="Pandoc"
        description="Universal document converter — enables Export → Other Formats"
      >
        <div className="flex items-center gap-3">
          {pandoc && (
            <span
              className={`text-xs ${
                pandoc.available
                  ? "text-[var(--success-color)]"
                  : "text-[var(--text-tertiary)]"
              }`}
            >
              {pandoc.available
                ? `v${pandoc.version ?? "unknown"}`
                : "Not found"}
            </span>
          )}
          <button
            onClick={detect}
            disabled={detecting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md
              bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
              hover:bg-[var(--hover-bg-strong)] hover:text-[var(--text-color)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            <RefreshCw size={12} className={detecting ? "animate-spin" : ""} />
            Detect
          </button>
        </div>
      </SettingRow>

      {detectError && (
        <div className="text-xs text-[var(--error-color)] mt-1 px-1">
          Detection failed: {detectError}
        </div>
      )}

      {pandoc && !pandoc.available && (
        <div className="text-xs text-[var(--text-tertiary)] mt-1 px-1">
          Install Pandoc to export to DOCX, EPUB, LaTeX, and more.{" "}
          <a
            href="https://pandoc.org/installing.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary-color)] hover:underline inline-flex items-center gap-0.5"
          >
            Installation guide
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      {pandoc?.available && pandoc.path && (
        <div className="mt-2 px-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">Path</span>
            <code className="text-[var(--text-secondary)] font-mono text-[11px]">
              {pandoc.path}
            </code>
          </div>
        </div>
      )}
    </SettingsGroup>
  );
}
