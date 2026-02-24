/**
 * PDF HTML Template Builder
 *
 * Builds a self-contained HTML page with Paged.js for paginated PDF export.
 * The template includes @page CSS rules, typography overrides, and a
 * completion signal handler that the Rust renderer polls for.
 *
 * @module export/pdfHtmlTemplate
 * @coordinates-with pdf_export/renderer.rs — polls document.title for completion
 * @coordinates-with PdfExportDialog.tsx — passes options from the dialog UI
 */

// Paged.js polyfill (minified, ~500KB) — bundled for offline use
import pagedPolyfillRaw from "./assets/paged.polyfill.js?raw";

export interface PdfOptions {
  pageSize: "a4" | "letter" | "a3" | "legal";
  orientation: "portrait" | "landscape";
  margins: "normal" | "narrow" | "wide";
  showPageNumbers: boolean;
  showHeader: boolean;
  showFooter: boolean;
  title?: string;
  fontSize: number;
  lineHeight: number;
  cjkLetterSpacing: string;
  latinFont: string;
  cjkFont: string;
}

const PAGE_SIZES: Record<string, string> = {
  a4: "210mm 297mm",
  letter: "8.5in 11in",
  a3: "297mm 420mm",
  legal: "8.5in 14in",
};

const MARGIN_VALUES: Record<string, string> = {
  normal: "2.54cm",
  narrow: "1.27cm",
  wide: "3.81cm",
};

/** Escape a string for use in CSS `content: "..."` property. */
function escapeCSSString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\a ")
    .replace(/\r/g, "")
    .replace(/\t/g, " ");
}

/** Resolve font name to a CSS font-family value. */
function resolveFontFamily(font: string, fallback: string): string {
  if (!font || font === "system" || font === "System Default") {
    return fallback;
  }
  // Wrap in quotes if it contains spaces
  return font.includes(" ") ? `"${font}"` : font;
}

/** Build @page CSS rules from options. */
function buildPageCSS(options: PdfOptions): string {
  const sizeSpec = PAGE_SIZES[options.pageSize] ?? PAGE_SIZES.a4;
  const size =
    options.orientation === "landscape"
      ? `${sizeSpec} landscape`
      : sizeSpec;
  const margin = MARGIN_VALUES[options.margins] ?? MARGIN_VALUES.normal;

  const marginBoxes: string[] = [];

  if (options.showHeader && options.title) {
    marginBoxes.push(`
    @top-center {
      content: "${escapeCSSString(options.title)}";
      font-size: 9pt;
      color: #999;
    }`);
  }

  if (options.showPageNumbers) {
    marginBoxes.push(`
    @bottom-center {
      content: counter(page) " / " counter(pages);
      font-size: 9pt;
      color: #999;
    }`);
  }

  if (options.showFooter) {
    marginBoxes.push(`
    @bottom-right {
      content: "${new Date().toLocaleDateString()}";
      font-size: 8pt;
      color: #bbb;
    }`);
  }

  return `
@page {
  size: ${size};
  margin: ${margin};
  ${marginBoxes.join("\n  ")}
}`;
}

/** Build typography CSS overrides from options. */
function buildTypographyCSS(options: PdfOptions): string {
  const latin = resolveFontFamily(options.latinFont, "system-ui");
  const cjk = resolveFontFamily(options.cjkFont, "system-ui");
  const fontStack = `${latin}, ${cjk}, system-ui, -apple-system, sans-serif`;

  return `
:root {
  --editor-font-size: ${options.fontSize}pt;
  --editor-line-height: ${options.lineHeight};
  --cjk-letter-spacing: ${options.cjkLetterSpacing};
  --font-sans: ${fontStack};
}`;
}

/**
 * Force light theme CSS variables for PDF output.
 * This ensures readable output even when the app is in dark theme,
 * because captureThemeCSS() captures the current (possibly dark) computed values.
 */
function forceLightThemeCSS(): string {
  return `
:root {
  --bg-color: #ffffff;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #f0f0f0;
  --text-color: #1a1a1a;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --primary-color: #0066cc;
  --border-color: #d5d4d4;
  --code-bg-color: #f5f5f5;
  --code-text-color: #1a1a1a;
  --code-border-color: #d5d4d4;
  --strong-color: rgb(63,86,99);
  --emphasis-color: rgb(91,4,17);
  --md-char-color: #777777;
  --table-border-color: #d5d4d4;
  --highlight-bg: #fff3a3;
  --highlight-text: inherit;
  --accent-primary: #0066cc;
  --accent-bg: rgba(0,102,204,0.1);
  --error-color: #cf222e;
  --warning-color: #9a6700;
  --success-color: #16a34a;
  --alert-note: #0969da;
  --alert-tip: #1a7f37;
  --alert-important: #8250df;
  --alert-warning: #9a6700;
  --alert-caution: #cf222e;
}`;
}

/**
 * Build a complete HTML document for PDF export via Paged.js.
 *
 * @param content - Rendered HTML content (from ExportSurface)
 * @param themeCSS - Captured theme CSS variables (light theme only)
 * @param contentCSS - Editor content CSS styles
 * @param options - PDF configuration options
 * @returns Complete HTML string ready for WKWebView rendering
 */
export function buildPdfHtml(
  content: string,
  themeCSS: string,
  contentCSS: string,
  options: PdfOptions,
): string {
  const pageCSS = buildPageCSS(options);
  const typographyCSS = buildTypographyCSS(options);
  const lightOverrides = forceLightThemeCSS();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rendering...</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
  <style>
/* Theme Variables (captured from app) */
${themeCSS}

/* Force light theme for PDF — overrides any dark values above */
${lightOverrides}

/* Typography Overrides */
${typographyCSS}

/* Page Rules */
${pageCSS}

/* Content Styles */
${contentCSS}

/* PDF-specific overrides */
body {
  background: #e8e8e8;
  color: #1a1a1a;
  margin: 0;
  padding: 0;
}
/* No horizontal scroll; hide vertical scrollbar but keep programmatic scroll */
html, body {
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none;
}

/* Separate pages visually in preview (does not affect exported PDF) */
.pagedjs_page {
  background: white;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.export-surface {
  max-width: none;
  padding: 0;
}

/* Ensure tables don't break across pages poorly */
.export-surface-editor .table-scroll-wrapper {
  overflow-x: visible;
}
.export-surface-editor .table-scroll-wrapper table {
  width: 100% !important;
  table-layout: fixed;
}
.export-surface-editor td,
.export-surface-editor th {
  overflow-wrap: break-word;
  word-break: break-word;
}
.export-surface-editor td img {
  max-width: 100%;
  height: auto;
}

/* Avoid breaking inside code blocks and images */
pre, .code-block-wrapper {
  break-inside: avoid;
}
img {
  break-inside: avoid;
}

/* Avoid orphan headings */
h1, h2, h3, h4, h5, h6 {
  break-after: avoid;
}
  </style>
</head>
<body>
  <div class="export-surface">
    <div class="export-surface-editor">
${content}
    </div>
  </div>
  <script>
${pagedPolyfillRaw}
  </script>
  <script>
// Completion signal handler — Rust renderer polls document.title for this
class CompletionHandler extends Paged.Handler {
  afterRendered(pages) {
    document.title = "PAGEDJS_COMPLETE:" + pages.length;
    // Also notify parent iframe (for live preview in dialog)
    try {
      if (window.parent !== window) {
        window.parent.postMessage(
          { type: "pagedjs-complete", pageCount: pages.length },
          "*"
        );
      }
    } catch (e) {
      // Cross-origin restriction — ignore
    }
  }
}
Paged.registerHandlers(CompletionHandler);
  </script>
</body>
</html>`;
}
