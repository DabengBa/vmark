# Test Coverage Promotion Plan

## Phase 1 — Completed
Baseline ~43% → 80%. 298 test files, 11,553 tests.

## Phase 2 — Completed
80% → 84%. 59 test files, 12,336 tests. Covered toolbar actions, CodeMirror plugins,
Tiptap plugin logic, popup views, source context detection, hooks/components/utils.

---

## Phase 3 — Completed
84% → 90%. 561 test files, 12,955 tests. Deepened coverage on partially tested files
(<70%) and extended files in the 70-85% range across 6 batches (Tiptap plugins,
toolbar adapters, CodeMirror plugins, popup views, hooks/context, components/utils).

**Baseline:** 84.2% statements, 76.4% branches, 87.7% functions, 85.5% lines
**Result:** 89.56% statements, 81.65% branches, 91.23% functions, 90.86% lines
**Target:** 88%+ statements, 80%+ branches, 90%+ functions, 89%+ lines — all exceeded

### Strategy

Phase 2 agents made progress on many files but didn't fully cover them. Phase 3 focuses
on **deepening coverage** on files that are partially tested (still <70%) and **extending**
files in the 70-85% range. Sorted by uncovered statement count — biggest gains first.

There are 2,874 uncovered statements in 45 files under 70%, and 1,017 uncovered statements
in 49 files in the 70-85% range. Total: ~3,891 uncovered statements across 94 files.

---

### Batch 7 — Deepen Tiptap Plugin Coverage (files still <40%)

Files that Phase 2 started testing but need much deeper coverage.
Focus on the logic inside `addProseMirrorPlugins()`, `addKeyboardShortcuts()`,
`addInputRules()`, paste handlers, and `appendTransaction()`.

| File | Stmts | Cov% | Uncov |
|------|-------|------|-------|
| `plugins/codeBlockLineNumbers/tiptap.ts` | 232 | 2% | 228 |
| `plugins/aiSuggestion/tiptap.ts` | 195 | 18% | 160 |
| `plugins/textDragDrop/tiptap.ts` | 126 | 6% | 118 |
| `plugins/imageHandler/tiptap.ts` | 120 | 4% | 115 |
| `plugins/codePreview/tiptap.ts` | 181 | 39% | 110 |
| `plugins/editorPlugins.tiptap.ts` | 168 | 25% | 126 |
| `plugins/footnotePopup/tiptap.ts` | 148 | 27% | 108 |
| `plugins/search/tiptap.ts` | 117 | 26% | 87 |
| `plugins/tabIndent/tiptap.ts` | 83 | 4% | 80 |

**Total uncovered:** ~1,132
**Approach:** These need a full Tiptap editor setup to test plugin lifecycle.
Use `Editor` from `@tiptap/core` with minimal extensions. Extract and test
individual commands, input rules, and transaction filters directly.

---

### Batch 8 — Deepen Toolbar & Source Adapter Coverage

Toolbar adapter files that were started but need more paths covered.

| File | Stmts | Cov% | Uncov |
|------|-------|------|-------|
| `plugins/toolbarActions/wysiwygAdapterInsert.ts` | 201 | 34% | 132 |
| `plugins/toolbarActions/sourceAdapter.ts` | 180 | 37% | 113 |
| `plugins/toolbarActions/wysiwygAdapter.ts` | 162 | 58% | 68 |
| `plugins/toolbarActions/multiSelectionContext.ts` | 151 | 46% | 81 |
| `plugins/toolbarActions/sourceImageActions.ts` | 106 | 55% | 48 |
| `plugins/toolbarActions/tiptapSelectionActions.ts` | 100 | 48% | 52 |
| `plugins/toolbarActions/enableRules.ts` | 129 | 74% | 34 |
| `plugins/toolbarActions/wysiwygAdapterLinkEditor.ts` | 77 | 70% | 23 |

**Total uncovered:** ~551
**Approach:** Test deeper branches — error paths, disabled states, multi-selection
combinations, format toggling, link editing edge cases.

---

### Batch 9 — CodeMirror & Source Mode Plugins

Source mode plugins and CodeMirror integrations that need more coverage.

| File | Stmts | Cov% | Uncov |
|------|-------|------|-------|
| `plugins/codemirror/sourceTableContextMenu.ts` | 111 | 2% | 109 |
| `plugins/codemirror/smartPasteImage.ts` | 168 | 36% | 108 |
| `plugins/sourcePopup/createSourcePopupPlugin.ts` | 117 | 26% | 87 |
| `plugins/codePreview/blockMathKeymap.ts` | 66 | 5% | 63 |
| `plugins/smartSelectAll/tiptap.ts` | 56 | 20% | 45 |
| `plugins/markdownCopy/tiptap.ts` | 55 | 22% | 43 |
| `plugins/codemirror/tabEscape.ts` | 62 | 32% | 42 |
| `plugins/codemirror/smartPaste.ts` | 25 | 4% | 24 |
| `plugins/codemirror/tableTabNav.ts` | 132 | 77% | 30 |
| `plugins/compositionGuard/tiptap.ts` | 124 | 74% | 32 |

**Total uncovered:** ~583
**Approach:** Create actual CodeMirror `EditorView` instances where mocking
falls short. Test key handler functions, paste interceptors, and popup lifecycle.

---

### Batch 10 — Popup Views & Preview Components

Popup view classes and preview rendering.

| File | Stmts | Cov% | Uncov |
|------|-------|------|-------|
| `plugins/latex/MathInlineNodeView.ts` | 292 | 79% | 60 |
| `plugins/mermaidPreview/MermaidPreviewView.ts` | 220 | 73% | 59 |
| `plugins/footnotePopup/FootnotePopupView.ts` | 198 | 68% | 63 |
| `plugins/imagePreview/ImagePreviewView.ts` | 181 | 67% | 60 |
| `plugins/linkCreatePopup/LinkCreatePopupView.ts` | 191 | 10% | 172 |
| `plugins/wikiLinkPopup/tiptap.ts` | 62 | 26% | 46 |
| `plugins/linkPopup/tiptap.ts` | 104 | 51% | 51 |
| `plugins/sourcePopup/SourcePopupView.ts` | 97 | 77% | 22 |
| `plugins/sourceWikiLinkPopup/SourceWikiLinkPopupView.ts` | 80 | 74% | 21 |

**Total uncovered:** ~554
**Approach:** DOM creation with mocked dependencies. Test popup lifecycle
(show/hide/destroy), DOM event handlers, keyboard navigation, edge cases.

---

### Batch 11 — Hooks & Context Deepening

Hooks and context providers that need more branch coverage.

| File | Stmts | Cov% | Uncov |
|------|-------|------|-------|
| `contexts/WindowContext.tsx` | 170 | 51% | 84 |
| `hooks/useFileOpen.ts` | 84 | 45% | 46 |
| `hooks/useSourceOutlineSync.ts` | 86 | 60% | 34 |
| `hooks/useUnifiedMenuCommands.ts` | 123 | 71% | 36 |
| `hooks/useExternalFileChanges.ts` | 161 | 75% | 40 |
| `hooks/mcpBridge/batchOpHandlers.ts` | 271 | 82% | 50 |
| `hooks/useUpdateChecker.ts` | 133 | 80% | 27 |
| `hooks/useFileShortcuts.ts` | 87 | 76% | 21 |
| `hooks/useFinderFileOpen.ts` | 79 | 82% | 14 |
| `hooks/useSourceEditorSync.ts` | 69 | 83% | 12 |

**Total uncovered:** ~364
**Approach:** renderHook with carefully staged Tauri API mocks.
Test error paths, race conditions, cleanup behavior.

---

### Batch 12 — Components, Utils & Remaining Gaps

Editor components and utility files.

| File | Stmts | Cov% | Uncov |
|------|-------|------|-------|
| `components/Editor/TiptapEditor.tsx` | 201 | 62% | 77 |
| `components/Editor/SourceEditor.tsx` | 105 | 65% | 37 |
| `components/Editor/UniversalToolbar/UniversalToolbar.tsx` | 223 | 80% | 45 |
| `components/Terminal/createTerminalInstance.ts` | 87 | 63% | 32 |
| `components/Terminal/useTerminalPosition.ts` | 49 | 41% | 29 |
| `plugins/sourceContextDetection/formatMultiSelection.ts` | 66 | 52% | 32 |
| `plugins/sourceContextDetection/listDetection.ts` | 143 | 55% | 64 |
| `plugins/editorPlugins/lineOperationCommands.ts` | 106 | 61% | 41 |
| `plugins/formatToolbar/nodeActions.tiptap.ts` | 146 | 76% | 35 |
| `plugins/mediaHandler/tiptap.ts` | 87 | 71% | 25 |

**Total uncovered:** ~417

---

## Execution Order

1. Run **Batch 7 + 8 + 9** in parallel (3 agents) — highest uncovered counts
2. Run **Batch 10 + 11 + 12** in parallel (3 agents) — remaining gaps
3. Run `pnpm test` to verify
4. Ratchet thresholds
5. Commit

## Success Criteria

- All tests pass (`pnpm test`)
- Coverage: statements 88+, branches 80+, functions 90+, lines 89+
- Thresholds ratcheted to new floor
- Edge cases covered: empty inputs, boundaries, Unicode/CJK, error paths
