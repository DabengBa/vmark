# Plugin Audit Report

**Date**: 2026-02-19
**Branch**: `audit/plugins`
**Scope**: All 69 plugin directories in `src/plugins/`

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Plugin directories | 69 |
| Total non-test LOC | ~40,000 |
| Dead plugins | 0 |
| Plugins with tests | 67 (97%) |
| Plugins without tests | 2 (3%) |
| Convention violations | 185 total findings — **148 resolved** |

**Key findings:**
1. No dead plugins — every directory is imported and used.
2. ~~CSS import convention is widely violated (30/39 plugins with CSS).~~ **FIXED** — all 30 plugins now co-locate CSS imports.
3. ~~36 production files exceed the 300-line guideline.~~ 6 files over 500 lines split; 25 files in 300-500 range remain (monitoring).
4. ~~19 plugins have zero test coverage (2 are high-risk at 500+ LOC).~~ **FIXED** — 17 plugins now have tests; 2 trivial remain (smartPaste plugin factory, blockVideo).
5. ~~One orphaned CSS file (`syntaxReveal/syntax-reveal.css`) is never imported — a bug.~~ **FIXED**.

---

## 1. Plugin Inventory

### Registration Architecture

Plugins register in three places:
- `src/utils/tiptapExtensions.ts` — WYSIWYG Tiptap extensions
- `src/utils/sourceEditorExtensions.ts` — Source mode CodeMirror extensions
- `src/export/createExportExtensions.ts` — Export-only Tiptap instance

Not all plugin directories are Tiptap extensions. Several are:
- **Utility libraries**: `shared`, `syntaxReveal`, `formatToolbar`, `toolbarActions`, `toolbarContext`, `sourceContextDetection`, `sourcePopup`
- **CodeMirror plugins**: `sourceImagePopup`, `sourceLinkPopup`, `sourceLinkCreatePopup`, `sourceWikiLinkPopup`, `sourceFootnotePopup`, `mermaidPreview`, `mathPreview`, `imagePreview`, `imagePasteToast`, `codemirror`
- **Dependency utilities**: `blockquoteEscape`, `listEscape` (consumed only by `blockEscape`)
- **Non-extension helpers**: `svg`, `markmap`, `mermaid` (rendering/export utils)

### Top 15 Plugins by LOC

| Plugin | ~LOC | Files | Tests |
|--------|------|-------|-------|
| codemirror | 5,991 | 40+ | 14 test files |
| toolbarActions | 4,797 | 24 | 5 test files |
| sourceContextDetection | 4,078 | 30 | 11 test files |
| multiCursor | 2,190 | 16 | 13 test files |
| editorPlugins | 1,434 | 8 | 1 test file |
| footnotePopup | 1,209 | 8 | 2 test files |
| codePreview | 1,112 | 9 | 1 test file |
| tableUI | 1,047 | 6 | 4 test files |
| actions | 976 | 5 | 1 test file |
| sourcePopup | 937 | 4 | 1 test file |
| latex | 863 | 6 | 2 test files |
| imageHandler | ~850 | 4 | 1 test file |
| shared | 849 | 8 | 2 test files |
| mediaPopup | 825 | 4 | 3 test files |
| autoPair | 740 | 4 | 4 test files |

---

## 2. Convention Violations

### 2.1 CSS Import Location (Rule 3) — ~~30 Violations~~ **RESOLVED**

**Convention**: CSS should be imported in whichever `.ts` file creates the plugin.

All 30 non-compliant plugins have been fixed. CSS imports now live in plugin entry points.

#### All 39 plugins with CSS — now compliant

| Plugin | Importing file |
|--------|---------------|
| blockAudio | `tiptap.ts` |
| blockImage | `tiptap.ts` |
| blockVideo | `tiptap.ts` |
| multiCursor | `tiptap.ts` |
| videoEmbed | `tiptap.ts` |
| imagePreview | `index.ts` |
| linkCreatePopup | `index.ts` |
| mediaPopup | `MediaPopupView.ts` |
| codemirror | `index.ts` (source-table.css, source-blocks.css) |
| aiSuggestion | `tiptap.ts` |
| alertBlock | `tiptap.ts` |
| cjkLetterSpacing | `index.ts` |
| codeBlockLineNumbers | `tiptap.ts` |
| codePreview | `tiptap.ts` |
| detailsBlock | `tiptap.ts` |
| focusMode | `tiptap.ts` |
| footnotePopup | `tiptap.ts` |
| highlight | `tiptap.ts` |
| imagePasteToast | `index.ts` |
| latex | `tiptapInlineMath.ts` |
| linkPopup | `tiptap.ts` |
| markdownArtifacts | `index.ts` |
| markmap | `index.ts` |
| mathPopup | `tiptap.ts` |
| mathPreview | `MathPreviewView.ts` |
| mermaid | `index.ts` |
| mermaidPreview | `index.ts` |
| search | `tiptap.ts` |
| sourceFootnotePopup | `index.ts` |
| sourceImagePopup | `index.ts` |
| sourceLinkPopup | `index.ts` |
| sourcePeekInline | `tiptap.ts` |
| sourceWikiLinkPopup | `index.ts` |
| subSuperscript | `tiptap.ts` |
| syntaxReveal | `marks.ts` |
| tableUI | `tiptap.ts` |
| typewriterMode | `tiptap.ts` |
| underline | `tiptap.ts` |
| wikiLinkPopup | `tiptap.ts` |

### 2.2 Orphaned CSS — ~~Bug~~ **RESOLVED**

`syntaxReveal/syntax-reveal.css` is now imported in `syntaxReveal/marks.ts`.

### 2.3 File Size (Rule 4) — ~~36 Files Over 300 Lines~~ 6 Split, 25 Monitoring

**Split (completed):**

| Original | Files After Split |
|----------|-------------------|
| imageHandler/tiptap.ts (853) | tiptap.ts (~319) + imageHandlerUtils.ts + imageHandlerInsert.ts + imageHandlerToast.ts |
| codemirror/smartPaste.ts (612) | smartPaste.ts (~85) + smartPasteUtils.ts + smartPasteImage.ts |
| codemirror/sourceShortcuts.ts (584) | sourceShortcuts.ts (~277) + sourceShortcutsHelpers.ts (~350) |
| toolbarActions/sourceAdapterLinks.ts (572) | sourceAdapterLinks.ts (~367) + sourceMathActions.ts (~222) |
| mermaidPreview/MermaidPreviewView.ts (527) | MermaidPreviewView.ts (~300) + mermaidPreviewDOM.ts + mermaidPreviewRender.ts |
| sourcePeekInline/tiptap.ts (514) | tiptap.ts (~150) + sourcePeekHeader.ts + sourcePeekEditor.ts + sourcePeekActions.ts |

**Skipped (per plan):**
- `latex/MathInlineNodeView.ts` (557) — tightly coupled class, splitting is awkward
- `actions/actionDefinitions.ts` (537) — pure data file, splitting loses completeness check

**300-500 lines (25 files — monitoring):**
autoPair/handlers.ts, aiSuggestion/tiptap.ts, codeBlockLineNumbers/tiptap.ts, codePreview/tiptap.ts,
editorPlugins.tiptap.ts, footnotePopup/FootnotePopupView.ts, imagePreview/ImagePreviewView.ts,
imageView/index.ts, linkCreatePopup/LinkCreatePopupView.ts, mediaPopup/MediaPopupView.ts,
multiCursor/commands.ts, sourceContextDetection/* (4 files), sourceLinkCreatePopup/*.ts,
sourcePopup/* (2 files), tabIndent/tabEscape.ts, tableUI/tableActions.tiptap.ts,
toolbarActions/* (5 files), codemirror/tableTabNav.ts, codemirror/sourceTableContextMenu.ts,
wikiLinkPopup/WikiLinkPopupView.ts

### 2.4 Debug Logging (Rule 9) — ~~116 `console.*` Calls~~ **RESOLVED**

All `console.warn` and `console.debug` calls in plugin files have been routed through named loggers in `src/utils/debug.ts`. `console.error` calls are kept as-is (real failures that should always surface).

**New loggers added:**
`imageHandlerWarn`, `smartPasteWarn`, `footnotePopupWarn`, `linkPopupWarn`, `mediaPopupWarn`, `wysiwygAdapterWarn`, `diagramWarn`, `pasteWarn`, `imageViewWarn`, `sourcePopupWarn`, `actionRegistryWarn`, `markdownCopyWarn`

**Remaining `console.warn`/`console.debug` in plugins: 0**

### 2.5 Import Conventions (Rule 7) — ~~2 Violations~~ **RESOLVED**

Both `codePreview/renderers/` files now use `@/plugins/latex` and `@/plugins/mermaid`.

### 2.6 File Structure (Rule 1) — 1 Violation (unchanged)

`syntaxReveal/` has no `index.ts` or `tiptap.ts`. It exports from `marks.ts` and `utils.ts` directly. This is functional but inconsistent with the plugin convention.

### 2.7 Error Handling & Barrel Exports — Clean

- No `error as Error` unsafe casts found.
- No problematic barrel exports (codemirror's large barrel is convention-sanctioned).

---

## 3. Test Coverage Gaps

### ~~19~~ 2 Plugins Without Tests

| Plugin | ~LOC | Risk | Notes |
|--------|------|------|-------|
| smartPaste (factory) | 62 | Low | Plugin factory only — logic tested via smartPasteImage/smartPasteUtils |
| blockVideo | 304 | Low-Med | Node view — has existing test in blockVideo.test.ts per agent report |

### Plugins with tests added in this audit

| Plugin | Tests Added | Key Coverage |
|--------|-------------|--------------|
| imageHandler | 45 tests | fileUrlToPath, validateLocalPath, expandHomePath, isImageFile, generateFilename |
| aiSuggestion | 39 tests | isValidPosition, getDecorationClass, isButtonEvent, store operations |
| markdownArtifacts | 30 tests | Extension metadata, parseHTML for all 5 sub-extensions |
| search | 21 tests | escapeRegExp, findMatchesInDoc with various options |
| detailsBlock | 23 tests | Input pattern regex, extension metadata |
| alertBlock | 23 tests | normalizeAlertType, alert types, extension metadata |
| blockImage | 7 tests | Extension metadata, parseHTML |
| subSuperscript | 8 tests | parseHTML, renderHTML for both marks |
| underline | 5 tests | parseHTML, renderHTML |
| focusMode | 6 tests | createFocusDecoration with ProseMirror schema |
| mermaidPreview | 20 tests | DOM construction, render dispatch |
| linkCreatePopup | 9 tests | Store lifecycle, extension structure |
| sourceLinkCreatePopup | 5 tests | Plugin structure, markdown generation |
| mediaHandler | 39 tests | Extension structure, media path detection |
| cjkLetterSpacing | 14 tests | CJK regex, extension structure |
| typewriterMode | 3 tests | Extension structure |
| inlineNodeEditing | 5 tests | Extension structure, plugin state |

---

## 4. Phase 4 — Deep Code Quality Audit

**Status**: Not yet performed.

This phase will send each plugin to Codex for a full 6-dimension audit:
logic bugs, duplication, dead code, refactoring debt, shortcuts, and comments.

Priority order for deep audit (by risk):
1. imageHandler (now split into 4 files, has tests)
2. aiSuggestion (522 LOC, now has tests)
3. codemirror cluster (5,991 LOC)
4. toolbarActions (4,797 LOC)
5. sourceContextDetection (4,078 LOC)
6. multiCursor (2,190 LOC)
7. footnotePopup (1,209 LOC)
8. codePreview (1,112 LOC)
9. remaining plugins in LOC order

---

## 5. Recommended Actions

### Immediate (bugs)
- [x] Import `syntaxReveal/syntax-reveal.css` in the appropriate `.ts` file
- [x] Fix 2 import convention violations in `codePreview/renderers/`

### Short-term (convention debt)
- [x] Move CSS imports from Editor.tsx into plugin `.ts` files (30 plugins)
- [x] Split files over 500 lines (6 of 8 — 2 skipped with justification)
- [x] Route `console.warn`/`console.debug` calls through `debug.ts` loggers

### Medium-term (test coverage)
- [x] Add tests for imageHandler (highest risk)
- [x] Add tests for aiSuggestion
- [x] Add tests for remaining untested plugins (17 of 19)

### Long-term (quality)
- [ ] Split remaining 25 files in 300-500 line range (as they grow or are modified)
- [ ] Run Phase 4 deep audit on all plugins
- [ ] Add `index.ts` barrel export to `syntaxReveal/`
