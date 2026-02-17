# Audit: Plugins M-Z

**Scope:** `src/plugins/` directories starting m-z (markdownArtifacts through wikiLinkPopup)
**Files scanned:** ~130 source files (.ts, .css)
**Findings:** 10

---

## Critical (must fix)

### [C1] Mermaid preview renders unsanitized SVG via innerHTML — XSS risk

- **File:** `src/plugins/mermaidPreview/MermaidPreviewView.ts:474`
- **Issue:** `this.preview.innerHTML = svg` assigns raw SVG from `renderMermaid()` without sanitization. Mermaid's `antiscript` security level only strips `<script>` tags — HTML elements and event handlers in text nodes remain (multiple CVEs). The same file correctly uses `sanitizeSvg()` on line 421 for the SVG block path. `sanitizeSvg` is already imported on line 13.
- **Fix:** Change line 474 to `this.preview.innerHTML = sanitizeSvg(svg);`

---

## Warning (should fix)

### [W1] mermaid/index.ts `isDarkMode()` misses primary `.dark-theme` class

- **File:** `src/plugins/mermaid/index.ts:21-23`
- **Issue:** Only checks `.dark`, not `.dark-theme`. The project's primary selector is `.dark-theme`. Sister plugin `markmap/index.ts` correctly checks both.
- **Fix:** `return cl.contains("dark-theme") || cl.contains("dark");`

### [W2] toolbarActions/sourceAdapter.ts is 1062 lines — 3.5x over guideline

- **File:** `src/plugins/toolbarActions/sourceAdapter.ts` (1062 lines)
- **Issue:** Entire source-mode toolbar dispatcher in one file. Helpers partially extracted but main file remains far over limit.
- **Fix:** Extract table actions (~150 lines), CJK formatting (~100 lines), text transforms (~80 lines) into focused modules.

### [W3] multiCursor/commands.ts is 457 lines

- **File:** `src/plugins/multiCursor/commands.ts` (457 lines)
- **Issue:** Multiple extractable responsibilities. Test file `addCursorVertical.test.ts` already exists.
- **Fix:** Extract vertical cursor movement into `addCursorVertical.ts`.

### [W4] mermaidPreview/MermaidPreviewView.ts is 527 lines

- **File:** `src/plugins/mermaidPreview/MermaidPreviewView.ts` (527 lines)
- **Issue:** Single class handling drag, resize, zoom, and multi-language rendering dispatch.
- **Fix:** Extract drag/resize behavior into composable. Extract language-dispatch rendering into helper.

### [W5] wikiLinkPopup/WikiLinkPopupView.ts is 443 lines

- **File:** `src/plugins/wikiLinkPopup/WikiLinkPopupView.ts` (443 lines)
- **Issue:** Path utility functions mixed into popup class file.
- **Fix:** Extract `wikiLinkPathUtils.ts` for pure functions.

### [W6] search/search.css uses hardcoded rgba colors instead of tokens

- **File:** `src/plugins/search/search.css:10,25`
- **Issue:** `text-decoration-color: rgba(255, 180, 0, 0.8)` and `rgba(255, 200, 0, 0.7)` — hardcoded instead of tokens. No `--search-match-color` token exists yet.
- **Fix:** Add `--search-match-color` token to `src/styles/index.css` with dark variant.

### [W7] diagramExport.ts appends export menu to document.body

- **File:** `src/plugins/shared/diagramExport.ts:83,87`
- **Issue:** Export theme-picker menu appended to `document.body` instead of editor container. Rule: "Editor popups MUST be inside editor container."
- **Fix:** Use `getPopupHostForDom()` pattern or verify `.dark-theme` inheritance from `document.documentElement`.

---

## Info (consider)

### [I1] WysiwygPopupView base class uses wrong container for vertical boundary

- **File:** `src/plugins/shared/WysiwygPopupView.ts:201-203`
- **Issue:** Base `updatePosition()` passes `editorView.dom` for both horizontal and vertical boundaries. Concrete popup classes correctly pass `.editor-container` as vertical boundary. Subclasses inheriting base method may get incorrect flip behavior.
- **Fix:** Update base class to look up `.editor-container` for vertical boundary.

### [I2] Bare console.warn/error in production code across multiple plugins

- **Files:** `markmap/index.ts`, `mermaid/index.ts`, `mermaid/mermaidExport.ts`, `wikiLinkPopup/WikiLinkPopupView.ts`, `sourceWikiLinkPopup/sourceWikiLinkActions.ts`, `tableUI/tableActions.tiptap.ts`, etc.
- **Issue:** Unconditional `console.warn/error` in production. Most are in catch blocks for render failures.
- **Fix:** Gate non-user-facing warn calls behind `import.meta.env.DEV` or add named loggers.

### [I3] markmap/index.ts bare console.warn on render failures

- **File:** `src/plugins/markmap/index.ts:126,185,213`
- **Issue:** Three `console.warn` calls fire unconditionally on markmap render failures from user input.
- **Fix:** Gate with `import.meta.env.DEV` or remove if error UI is shown.

---

## Summary

- **Critical:** 1
- **Warning:** 7 (including 4 file-size violations)
- **Info:** 3
- **Healthiest areas:** `multiCursor` (well-tested, clean separation, proper cleanup refs), `shared/diagramCleanup.ts` (elegant registry pattern), CSS files generally (tokens used correctly, `.dark-theme` selector consistent).
- **Most concerning areas:** `mermaidPreview/MermaidPreviewView.ts` (XSS risk from unsanitized innerHTML + 527 lines), `toolbarActions/sourceAdapter.ts` (1062 lines — most extreme file size violation).
