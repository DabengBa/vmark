# Audit: Plugins A-L

**Scope:** `src/plugins/` — all plugin directories whose names begin with a-l:
  `actions`, `aiSuggestion`, `alertBlock`, `autoPair`, `blockEscape`, `blockquoteEscape`,
  `cjkLetterSpacing`, `codeBlockLineNumbers`, `codePaste`, `codePreview`, `codemirror`,
  `detailsBlock`, `editorPlugins`, `focusMode`, `footnotePopup`, `formatToolbar`, `highlight`,
  `htmlPaste`, `imagePasteToast`, `inlineCodeBoundary`, `latex`, `linkCreatePopup`, `linkPopup`,
  `listBackspace`, `listContinuation`, `listEscape`

**Files scanned:** ~75 source files (excluding test files)
**Findings:** 14

---

## Critical (must fix)

_None found._ Security posture is strong — all `innerHTML` uses static SVG constants or sanitized content. No `[data-theme]` selectors. No `error as Error` unsafe casts.

---

## Warning (should fix)

### [W1] Bare `console.log/warn/error` instead of named debug loggers

- **Files:** `footnotePopup/FootnotePopupView.ts:267,273,293,325,355`, `linkPopup/LinkPopupView.ts:168,190,199,210,232`, `linkPopup/tiptap.ts:121,151,200`, `codePaste/tiptap.ts:103`, `htmlPaste/tiptap.ts:71,121`, `editorPlugins/linkCommands.ts:107`, `codemirror/smartPaste.ts` (14 calls)
- **Issue:** Bare `console.*` in production. `actions/actionRegistry.ts:731,737` is acceptable (guarded by `import.meta.env.DEV`).
- **Fix:** Add named loggers to `debug.ts`.

### [W2] Files significantly over the 300-line guideline

| File | Lines | Split suggestion |
|------|-------|-----------------|
| `actions/actionRegistry.ts` | 744 | `menuMapping.ts`, `actionDefinitions.ts`, `devValidation.ts` |
| `codePreview/tiptap.ts` | 738 | Extract renderers: `renderLatex.ts`, `renderMermaid.ts`, etc. |
| `codemirror/smartPaste.ts` | 538 | Split single-image vs multi-image paths |
| `codemirror/sourceShortcuts.ts` | 503 | Group bindings by category |
| `latex/MathInlineNodeView.ts` | 482 | Extract edit-mode state machine |
| `aiSuggestion/tiptap.ts` | 479 | Extract decoration builders |
| `codeBlockLineNumbers/tiptap.ts` | 405 | Extract language dropdown |
| `footnotePopup/FootnotePopupView.ts` | 344 | Extract save/delete handlers |
| `editorPlugins.tiptap.ts` | 335 | Borderline; acceptable |

### [W3] Module-level mutable `currentEditorView` in `codePreview/tiptap.ts`

- **File:** `src/plugins/codePreview/tiptap.ts:52`
- **Issue:** Singleton breaks in multi-editor scenarios. Documented as known limitation.
- **Fix:** Close over `editorView` at widget-creation time instead.

### [W4] Missing `index.ts` convention for several plugins

- **Issue:** 11 plugins have only `tiptap.ts` (no `index.ts`). Acceptable for pure Tiptap extensions.
- **Fix:** Document this variant in `50-codebase-conventions.md`.

### [W5] `aiSuggestion/tiptap.ts` — validates against stale document size in multi-accept

- **File:** `src/plugins/aiSuggestion/tiptap.ts:419-421`
- **Issue:** `applySuggestionToTr` uses `state.doc.content.size` (original) instead of `tr.doc.content.size` (accumulated). Adjacent suggestions may pass validation incorrectly.
- **Fix:** Use `tr.doc.content.size` instead.

### [W6] `codePreview/tiptap.ts` — module-load-time MutationObserver never cleaned up

- **File:** `src/plugins/codePreview/tiptap.ts:67-88`
- **Issue:** `setupThemeObserver()` attaches MutationObserver at import time. Never disconnected. Leaks in tests.
- **Fix:** Move to plugin's `view()` lifecycle with cleanup in `destroy()`.

### [W7] `codeBlockLineNumbers/tiptap.ts` — potential listener leak on NodeView destroy

- **Issue:** Language dropdown attaches document listeners removed in `closeDropdown()`. If NodeView is destroyed with dropdown open, listeners may leak.
- **Fix:** Ensure `destroy()` calls `closeDropdown()` unconditionally.

### [W8] `codemirror/smartPaste.ts` — `isViewConnected` swallows TypeError on null view

- **File:** `src/plugins/codemirror/smartPaste.ts:41-47`
- **Issue:** Try/catch masks programming errors where null view is passed.
- **Fix:** Add explicit null check: `if (!view) return false;`

### [W9] `linkPopup/tiptap.ts:151` — `console.error` as raw `.catch` callback

- **Issue:** `openUrl(href).catch(console.error)` — not stripped in production, untraceable without prefix.
- **Fix:** Use arrow function with `[LinkPopup]` prefix or named logger.

### [W10] `actions/actionRegistry.ts` — `removeBlockquote` defined but unmapped to menu

- **File:** `src/plugins/actions/actionRegistry.ts:293-298`
- **Issue:** In `ACTION_DEFINITIONS` but has no `MENU_TO_ACTION` entry. Likely invoked programmatically.
- **Fix:** Add comment or separate programmatic-only action section.

### [W11] `footnotePopup/FootnotePopupView.ts` — `handleSave` silently strips markdown formatting

- **File:** `src/plugins/footnotePopup/FootnotePopupView.ts:278-288`
- **Issue:** Creates plain text node from textarea content, discarding bold/italic/links. Reopening and saving a formatted footnote permanently removes formatting — data loss bug.
- **Fix:** Use `createMarkdownPasteSlice` to parse markdown back into ProseMirror fragment.

---

## Info (consider)

### [I1] `alertBlock/alert-block.css` — print hardcoded hex colors are intentional

- **File:** `src/plugins/alertBlock/alert-block.css:157-175`
- **Note:** `@media print` uses hardcoded colors by design. Add to `31-design-tokens.md` acceptable exceptions.

### [I2] `codemirror/` directory growing beyond single-plugin scope

- **Note:** 40+ files. Consider whether new source-mode features should go into own directories.

### [I3] `editorPlugins.tiptap.ts` vs `editorPlugins/` naming collision

- **Note:** Root file and directory share base name. Consider renaming root file to `wysiwygKeymap.tiptap.ts`.

---

## Summary

- **Critical:** 0
- **Warning:** 11
- **Info:** 3
- **Healthiest areas:** CSS token compliance (all plugins use `var(--...)` correctly), dark theme (`.dark-theme` used throughout), focus indicators (all popups implement `:focus-visible`), security (no XSS vectors), Zustand usage (correct selectors and `getState()` patterns), import conventions (no `../../../` violations).
- **Most concerning areas:** File size violations (9 files over 300 lines), bare `console.*` in 7 production files, footnote save silently strips formatting (data loss).
