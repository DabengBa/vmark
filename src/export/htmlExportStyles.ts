/**
 * HTML Export Styles — Single Source of Truth
 *
 * Purpose: Assemble the complete editor content CSS for export by combining
 * the actual editor CSS bundle (imported via ?raw from the real CSS files)
 * with export-only overrides. This eliminates style drift between the
 * WYSIWYG editor and exported output.
 *
 * @module export/htmlExportStyles
 * @coordinates-with editorCSSBundle.ts — actual editor + plugin CSS
 * @coordinates-with exportOverrides.ts — export-only layout, page breaks, print fixes
 */

import { getEditorCSSBundle } from "./editorCSSBundle";
import { getExportOverrides } from "./exportOverrides";

/**
 * Get the complete CSS for styled exports.
 *
 * Combines:
 * 1. Editor CSS bundle — actual editor.css + all plugin CSS (single source of truth)
 * 2. Export overrides — container layout, page breaks, print fixes, hide interactive elements
 */
export function getEditorContentCSS(): string {
  return [getEditorCSSBundle(), getExportOverrides()].join("\n").trim();
}
