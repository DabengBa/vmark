/**
 * HTML Export
 *
 * Generates HTML exports in multiple modes:
 * - Plain + Folder: No CSS, resources in assets folder
 * - Plain + Single: No CSS, resources as data URIs
 * - Styled + Folder: Full CSS, resources in assets folder
 * - Styled + Single: Full CSS, resources as data URIs
 */

import { writeTextFile } from "@tauri-apps/plugin-fs";
import { captureThemeCSS, isDarkTheme } from "./themeSnapshot";
import { resolveResources, getDocumentBaseDir } from "./resourceResolver";
import { generateExportFontCSS } from "./fontEmbedder";

export interface HtmlExportOptions {
  /** Style mode: 'plain' (no CSS) or 'styled' (full CSS) */
  style: "plain" | "styled";
  /** Packaging mode: 'folder' (assets folder) or 'single' (data URIs) */
  packaging: "folder" | "single";
  /** Document title */
  title?: string;
  /** Source file path (for resource resolution) */
  sourceFilePath?: string | null;
  /** Output file path */
  outputPath: string;
  /** User font settings */
  fontSettings?: {
    fontFamily?: string;
    monoFontFamily?: string;
  };
  /** Force light theme even if editor is in dark mode */
  forceLightTheme?: boolean;
}

export interface HtmlExportResult {
  /** Whether export succeeded */
  success: boolean;
  /** Output file path */
  outputPath: string;
  /** Assets folder path (if folder mode) */
  assetsPath?: string;
  /** Number of resources processed */
  resourceCount: number;
  /** Number of missing resources */
  missingCount: number;
  /** Total size of exported files */
  totalSize: number;
  /** Warning messages */
  warnings: string[];
  /** Error message (if failed) */
  error?: string;
}

/**
 * Get the base editor CSS for styled exports.
 * This is a minimal subset of editor.css needed for content rendering.
 */
function getEditorContentCSS(): string {
  // This CSS is derived from editor.css but only includes content styling
  // Interactive elements and UI chrome are excluded
  return `
/* Base content styles */
.export-surface-editor {
  font-family: var(--font-sans);
  font-size: var(--editor-font-size, 16px);
  line-height: var(--editor-line-height, 1.6);
  color: var(--text-color);
  background: var(--bg-color);
}

/* Typography */
.export-surface-editor h1,
.export-surface-editor h2,
.export-surface-editor h3,
.export-surface-editor h4,
.export-surface-editor h5,
.export-surface-editor h6 {
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.export-surface-editor h1 { font-size: 2em; }
.export-surface-editor h2 { font-size: 1.5em; }
.export-surface-editor h3 { font-size: 1.25em; }
.export-surface-editor h4 { font-size: 1em; }
.export-surface-editor h5 { font-size: 0.875em; }
.export-surface-editor h6 { font-size: 0.85em; }

.export-surface-editor p {
  margin: 0 0 1em 0;
}

/* Links */
.export-surface-editor a {
  color: var(--primary-color);
  text-decoration: none;
}

.export-surface-editor a:hover {
  text-decoration: underline;
}

/* Code */
.export-surface-editor code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--code-bg-color);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.export-surface-editor pre {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--code-bg-color);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
}

.export-surface-editor pre code {
  background: none;
  padding: 0;
}

/* Lists */
.export-surface-editor ul,
.export-surface-editor ol {
  margin: 0 0 1em 0;
  padding-left: 2em;
}

.export-surface-editor li {
  margin: 0.25em 0;
}

/* Blockquotes */
.export-surface-editor blockquote {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid var(--border-color);
  color: var(--text-secondary);
}

/* Tables */
.export-surface-editor table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.export-surface-editor th,
.export-surface-editor td {
  border: 1px solid var(--border-color);
  padding: 0.5em 1em;
  text-align: left;
}

.export-surface-editor th {
  background: var(--bg-secondary);
  font-weight: 600;
}

/* Images */
.export-surface-editor img {
  max-width: 100%;
  height: auto;
}

/* Horizontal rule */
.export-surface-editor hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 2em 0;
}

/* Task lists */
.export-surface-editor ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.export-surface-editor ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

/* Marks */
.export-surface-editor strong {
  font-weight: 600;
}

.export-surface-editor em {
  font-style: italic;
}

.export-surface-editor mark {
  background: var(--highlight-bg);
  color: var(--highlight-text);
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

.export-surface-editor s {
  text-decoration: line-through;
}

.export-surface-editor sub {
  font-size: 0.75em;
  vertical-align: sub;
}

.export-surface-editor sup {
  font-size: 0.75em;
  vertical-align: super;
}

.export-surface-editor u {
  text-decoration: underline;
}

/* Alert blocks */
.export-surface-editor .alert-block {
  margin: 1em 0;
  padding: 1em;
  border-left: 4px solid;
  border-radius: 0 6px 6px 0;
  background: var(--bg-secondary);
}

.export-surface-editor .alert-block[data-type="note"] {
  border-color: var(--alert-note);
}

.export-surface-editor .alert-block[data-type="tip"] {
  border-color: var(--alert-tip);
}

.export-surface-editor .alert-block[data-type="important"] {
  border-color: var(--alert-important);
}

.export-surface-editor .alert-block[data-type="warning"] {
  border-color: var(--alert-warning);
}

.export-surface-editor .alert-block[data-type="caution"] {
  border-color: var(--alert-caution);
}

/* Details blocks */
.export-surface-editor details {
  margin: 1em 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.5em 1em;
}

.export-surface-editor summary {
  font-weight: 600;
  cursor: pointer;
}

/* Math */
.export-surface-editor .math-inline,
.export-surface-editor .math-block {
  font-family: 'KaTeX_Math', 'Times New Roman', serif;
}

.export-surface-editor .math-block {
  display: block;
  margin: 1em 0;
  text-align: center;
}

/* Code preview (rendered math/mermaid) */
.export-surface-editor .code-block-preview {
  margin: 1em 0;
}

.export-surface-editor .mermaid-preview svg {
  max-width: 100%;
  height: auto;
}

/* Footnotes */
.export-surface-editor .footnote-ref {
  font-size: 0.75em;
  vertical-align: super;
  color: var(--primary-color);
}

.export-surface-editor .footnote-def {
  font-size: 0.9em;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  padding-top: 1em;
  margin-top: 2em;
}
`.trim();
}

/**
 * Generate the complete HTML document.
 */
function generateHtmlDocument(
  content: string,
  options: {
    title: string;
    themeCSS?: string;
    fontCSS?: string;
    contentCSS?: string;
    isDark?: boolean;
  }
): string {
  const { title, themeCSS, fontCSS, contentCSS, isDark } = options;

  const styleBlocks: string[] = [];

  if (themeCSS) {
    styleBlocks.push(`/* Theme Variables */\n${themeCSS}`);
  }

  if (fontCSS) {
    styleBlocks.push(`/* Fonts */\n${fontCSS}`);
  }

  if (contentCSS) {
    styleBlocks.push(`/* Content Styles */\n${contentCSS}`);
  }

  const styleTag = styleBlocks.length > 0
    ? `<style>\n${styleBlocks.join("\n\n")}\n</style>`
    : "";

  const themeClass = isDark ? "dark-theme" : "";

  return `<!DOCTYPE html>
<html lang="en" class="${themeClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${styleTag}
</head>
<body>
  <div class="export-surface">
    <div class="export-surface-editor">
${content}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Export HTML document.
 *
 * @param html - The rendered HTML content from ExportSurface
 * @param options - Export options
 * @returns Export result
 *
 * @example
 * ```ts
 * const result = await exportHtml(renderedHtml, {
 *   style: 'styled',
 *   packaging: 'folder',
 *   title: 'My Document',
 *   outputPath: '/path/to/output.html',
 * });
 * ```
 */
export async function exportHtml(
  html: string,
  options: HtmlExportOptions
): Promise<HtmlExportResult> {
  const {
    style,
    packaging,
    title = "Document",
    sourceFilePath,
    outputPath,
    fontSettings,
    forceLightTheme = true,
  } = options;

  const warnings: string[] = [];
  let totalSize = 0;
  let resourceCount = 0;
  let missingCount = 0;
  let assetsPath: string | undefined;

  try {
    // Resolve resources
    const baseDir = await getDocumentBaseDir(sourceFilePath ?? null);
    const { html: processedHtml, report } = await resolveResources(html, {
      baseDir,
      mode: packaging,
      outputDir: packaging === "folder" ? await getOutputDir(outputPath) : undefined,
      documentName: getDocumentName(outputPath),
    });

    resourceCount = report.resources.length;
    missingCount = report.missing.length;
    totalSize += report.totalSize;

    if (report.missing.length > 0) {
      warnings.push(`${report.missing.length} resource(s) not found`);
    }

    if (packaging === "folder") {
      assetsPath = `${getDocumentName(outputPath)}.assets`;
    }

    // Generate CSS based on style mode
    let themeCSS: string | undefined;
    let fontCSS: string | undefined;
    let contentCSS: string | undefined;

    if (style === "styled") {
      // Capture current theme
      themeCSS = captureThemeCSS();

      // Generate font CSS
      const fontResult = await generateExportFontCSS(
        processedHtml,
        fontSettings ?? {},
        packaging === "single"
      );
      fontCSS = fontResult.css;
      totalSize += fontResult.totalSize;

      // Add content CSS
      contentCSS = getEditorContentCSS();
    }

    // Determine theme
    const useDarkTheme = !forceLightTheme && isDarkTheme();

    // Generate final HTML document
    const finalHtml = generateHtmlDocument(processedHtml, {
      title,
      themeCSS,
      fontCSS,
      contentCSS,
      isDark: useDarkTheme,
    });

    // Write to file
    await writeTextFile(outputPath, finalHtml);
    totalSize += new TextEncoder().encode(finalHtml).length;

    return {
      success: true,
      outputPath,
      assetsPath,
      resourceCount,
      missingCount,
      totalSize,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      outputPath,
      resourceCount,
      missingCount,
      totalSize,
      warnings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the output directory from a file path.
 */
async function getOutputDir(filePath: string): Promise<string> {
  const parts = filePath.split(/[/\\]/);
  parts.pop(); // Remove filename
  return parts.join("/") || "/";
}

/**
 * Get the document name (without extension) from a file path.
 */
function getDocumentName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  const filename = parts.pop() ?? "document";
  return filename.replace(/\.[^.]+$/, "");
}

/**
 * Copy HTML to clipboard.
 *
 * @param html - The rendered HTML content
 * @param includeStyles - Whether to include styles
 */
export async function copyHtmlToClipboard(
  html: string,
  includeStyles: boolean = false
): Promise<void> {
  const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");

  if (includeStyles) {
    const themeCSS = captureThemeCSS();
    const contentCSS = getEditorContentCSS();
    const styledHtml = `<style>${themeCSS}\n${contentCSS}</style>\n${html}`;
    await writeText(styledHtml);
  } else {
    await writeText(html);
  }
}
