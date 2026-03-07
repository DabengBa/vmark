/**
 * Pandoc Export
 *
 * Purpose: Export markdown to various formats (DOCX, EPUB, LaTeX, ODT, RTF,
 *   plain text) via the Pandoc CLI tool. Pandoc must be installed separately.
 *
 * Pipeline: detect_pandoc → save dialog (format picker) → export_via_pandoc
 *
 * @coordinates-with useExportMenuEvents.ts — called from menu:export-pandoc
 * @coordinates-with pandoc/commands.rs — Rust backend for Pandoc execution
 * @module export/pandocExport
 */

import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";

import { joinPath } from "@/utils/pathUtils";

/** Pandoc detection result from Rust backend. */
interface PandocInfo {
  available: boolean;
  path: string | null;
  version: string | null;
}

/** Supported Pandoc export formats with dialog filter metadata. */
const PANDOC_FORMATS = [
  { name: "Word Document", extensions: ["docx"] },
  { name: "EPUB", extensions: ["epub"] },
  { name: "LaTeX", extensions: ["tex"] },
  { name: "OpenDocument Text", extensions: ["odt"] },
  { name: "Rich Text Format", extensions: ["rtf"] },
  { name: "Plain Text", extensions: ["txt"] },
] as const;

/**
 * Export markdown via Pandoc.
 *
 * 1. Checks if Pandoc is installed.
 * 2. Shows a save dialog with format filters.
 * 3. Invokes the Rust command to pipe markdown through Pandoc.
 */
export async function exportViaPandoc(options: {
  markdown: string;
  defaultName?: string;
  defaultDirectory?: string;
  sourceDirectory?: string;
}): Promise<boolean> {
  const { markdown, defaultName = "document", defaultDirectory, sourceDirectory } = options;

  // Check for empty content
  if (!markdown.trim()) {
    toast.error("No content to export!");
    return false;
  }

  try {
    // Detect Pandoc (inside try/catch so detection failures show toast)
    const info: PandocInfo = await invoke("detect_pandoc");

    if (!info.available) {
      toast.error("Pandoc is not installed. Install it from pandoc.org", {
        duration: 5000,
      });
      return false;
    }

    // Build combined filter for save dialog
    const defaultPath = defaultDirectory
      ? joinPath(defaultDirectory, `${defaultName}.docx`)
      : `${defaultName}.docx`;

    const selectedPath = await save({
      defaultPath,
      title: "Export via Pandoc",
      filters: PANDOC_FORMATS.map((f) => ({
        name: f.name,
        extensions: [...f.extensions],
      })),
    });

    if (!selectedPath) return false;

    // Export via Rust command
    await invoke("export_via_pandoc", {
      markdown,
      outputPath: selectedPath,
      sourceDir: sourceDirectory ?? null,
    });

    toast.success("Exported successfully");
    return true;
  } catch (error) {
    console.error("[Export] Pandoc export failed:", error);
    const detail = error instanceof Error ? error.message : String(error);
    toast.error(`Pandoc export failed: ${detail}`);
    return false;
  }
}
