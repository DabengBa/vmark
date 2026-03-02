/**
 * sourceEditorExtensions tests
 *
 * Tests createSourceEditorExtensions and exported compartments.
 */

import { describe, it, expect, vi } from "vitest";

// --- Mocks ---

vi.mock("@codemirror/state", () => {
  class MockCompartment {
    of = vi.fn((ext: unknown) => ext);
    reconfigure = vi.fn((ext: unknown) => ext);
  }
  return {
    Compartment: MockCompartment,
    EditorState: { allowMultipleSelections: { of: vi.fn(() => "allow-multi") } },
  };
});

vi.mock("@codemirror/view", () => ({
  EditorView: {
    lineWrapping: "lineWrapping",
    updateListener: { of: vi.fn((cb: unknown) => cb) },
    theme: vi.fn(() => "theme"),
    baseTheme: vi.fn(() => "baseTheme"),
  },
  keymap: { of: vi.fn((keys: unknown) => keys) },
  drawSelection: vi.fn(() => "drawSelection"),
  dropCursor: vi.fn(() => "dropCursor"),
  lineNumbers: vi.fn(() => "lineNumbers"),
}));

vi.mock("@codemirror/commands", () => ({
  defaultKeymap: [],
  history: vi.fn(() => "history"),
}));

vi.mock("@codemirror/lang-markdown", () => ({
  markdown: vi.fn(() => "markdown-lang"),
  markdownLanguage: { data: { of: vi.fn(() => "md-brackets") } },
}));

vi.mock("@codemirror/language-data", () => ({
  languages: [],
}));

vi.mock("@codemirror/language", () => ({
  syntaxHighlighting: vi.fn(() => "syntax-highlight"),
}));

vi.mock("@codemirror/autocomplete", () => ({
  closeBrackets: vi.fn(() => "closeBrackets"),
  closeBracketsKeymap: [],
}));

vi.mock("@codemirror/search", () => ({
  search: vi.fn(() => "search"),
  selectNextOccurrence: vi.fn(),
  selectSelectionMatches: vi.fn(),
}));

vi.mock("@/stores/editorStore", () => ({
  useEditorStore: { getState: () => ({ toggleWordWrap: vi.fn() }) },
}));

vi.mock("@/utils/workspaceStorage", () => ({
  getCurrentWindowLabel: () => "main",
}));

vi.mock("@/hooks/useUnifiedHistory", () => ({
  performUnifiedUndo: vi.fn(),
  performUnifiedRedo: vi.fn(),
}));

vi.mock("@/plugins/codemirror", () => ({
  sourceEditorTheme: "sourceEditorTheme",
  codeHighlightStyle: "codeHighlightStyle",
  createBrHidingPlugin: vi.fn((hide: boolean) => `brHiding:${hide}`),
  createListBlankLinePlugin: vi.fn(() => "listBlankLine"),
  createMarkdownAutoPairPlugin: vi.fn(() => "mdAutoPair"),
  markdownPairBackspace: { key: "Backspace", run: vi.fn() },
  tabEscapeKeymap: { key: "Tab", run: vi.fn() },
  tabIndentFallbackKeymap: { key: "Tab-fallback", run: vi.fn() },
  shiftTabIndentFallbackKeymap: { key: "Shift-Tab-fallback", run: vi.fn() },
  listContinuationKeymap: { key: "Enter", run: vi.fn() },
  tableTabKeymap: { key: "Tab-table", run: vi.fn() },
  tableShiftTabKeymap: { key: "Shift-Tab-table", run: vi.fn() },
  tableModEnterKeymap: { key: "Mod-Enter", run: vi.fn() },
  tableModShiftEnterKeymap: { key: "Mod-Shift-Enter", run: vi.fn() },
  tableArrowUpKeymap: { key: "ArrowUp", run: vi.fn() },
  tableArrowDownKeymap: { key: "ArrowDown", run: vi.fn() },
  createSmartPastePlugin: vi.fn(() => "smartPaste"),
  createSourceCopyOnSelectPlugin: vi.fn(() => "copyOnSelect"),
  createSourceFocusModePlugin: vi.fn(() => "focusMode"),
  createSourceTypewriterPlugin: vi.fn(() => "typewriter"),
  createImeGuardPlugin: vi.fn(() => "imeGuard"),
  createSourceCursorContextPlugin: vi.fn(() => "cursorContext"),
  createSourceMathPreviewPlugin: vi.fn(() => "mathPreview"),
  createSourceImagePreviewPlugin: vi.fn(() => "imagePreview"),
  sourceMultiCursorExtensions: ["multiCursor"],
  sourceTableContextMenuExtensions: ["tableContextMenu"],
  sourceTableCellHighlightExtensions: ["tableCellHighlight"],
  sourceDiagramPreviewExtensions: ["diagramPreview"],
  sourceAlertDecorationExtensions: ["alertDecoration"],
  sourceDetailsDecorationExtensions: ["detailsDecoration"],
  sourceMediaDecorationExtensions: ["mediaDecoration"],
  visualLineUpKeymap: { key: "ArrowUp-visual", run: vi.fn() },
  visualLineDownKeymap: { key: "ArrowDown-visual", run: vi.fn() },
  visualLineUpSelectKeymap: { key: "Shift-ArrowUp-visual", run: vi.fn() },
  visualLineDownSelectKeymap: { key: "Shift-ArrowDown-visual", run: vi.fn() },
  smartHomeKeymap: { key: "Home", run: vi.fn() },
  smartHomeSelectKeymap: { key: "Shift-Home", run: vi.fn() },
  structuralBackspaceKeymap: { key: "Backspace-structural", run: vi.fn() },
  structuralDeleteKeymap: { key: "Delete-structural", run: vi.fn() },
  listSmartIndentKeymap: { key: "Tab-list", run: vi.fn() },
  listSmartOutdentKeymap: { key: "Shift-Tab-list", run: vi.fn() },
}));

vi.mock("@/plugins/codemirror/sourceShortcuts", () => ({
  buildSourceShortcutKeymap: vi.fn(() => []),
}));

vi.mock("@/plugins/sourceContextDetection/taskListActions", () => ({
  toggleTaskList: vi.fn(),
}));

vi.mock("@/utils/imeGuard", () => ({
  guardCodeMirrorKeyBinding: vi.fn((binding: unknown) => binding),
}));

vi.mock("@/utils/shortcutMatch", () => ({
  isMacPlatform: vi.fn(() => true),
}));

vi.mock("@/plugins/sourceImagePopup", () => ({
  createSourceImagePopupPlugin: vi.fn(() => "imagePopup"),
}));

vi.mock("@/plugins/sourceLinkPopup", () => ({
  createSourceLinkPopupPlugin: vi.fn(() => "linkPopup"),
}));

vi.mock("@/plugins/sourceLinkCreatePopup", () => ({
  createSourceLinkCreatePopupPlugin: vi.fn(() => "linkCreatePopup"),
}));

vi.mock("@/plugins/sourceWikiLinkPopup", () => ({
  createSourceWikiLinkPopupPlugin: vi.fn(() => "wikiLinkPopup"),
}));

vi.mock("@/plugins/sourceFootnotePopup", () => ({
  createSourceFootnotePopupPlugin: vi.fn(() => "footnotePopup"),
}));

import {
  createSourceEditorExtensions,
  lineWrapCompartment,
  brVisibilityCompartment,
  autoPairCompartment,
  lineNumbersCompartment,
  shortcutKeymapCompartment,
} from "./sourceEditorExtensions";

describe("createSourceEditorExtensions", () => {
  it("returns a non-empty array of extensions", () => {
    const exts = createSourceEditorExtensions({
      initialWordWrap: true,
      initialShowBrTags: false,
      initialAutoPair: true,
      initialShowLineNumbers: true,
      updateListener: "listener" as any,
    });
    expect(Array.isArray(exts)).toBe(true);
    expect(exts.length).toBeGreaterThan(0);
  });

  it("includes the update listener in the output", () => {
    const listener = "my-update-listener";
    const exts = createSourceEditorExtensions({
      initialWordWrap: false,
      initialShowBrTags: true,
      initialAutoPair: false,
      initialShowLineNumbers: false,
      updateListener: listener as any,
    });
    expect(exts).toContain(listener);
  });

  it("includes spread plugin arrays (multi-cursor, table, etc.)", () => {
    const exts = createSourceEditorExtensions({
      initialWordWrap: false,
      initialShowBrTags: false,
      initialAutoPair: false,
      initialShowLineNumbers: false,
      updateListener: "listener" as any,
    });
    expect(exts).toContain("multiCursor");
    expect(exts).toContain("tableContextMenu");
    expect(exts).toContain("tableCellHighlight");
    expect(exts).toContain("diagramPreview");
    expect(exts).toContain("alertDecoration");
    expect(exts).toContain("detailsDecoration");
    expect(exts).toContain("mediaDecoration");
  });
});

describe("exported compartments", () => {
  it("exports all five compartments", () => {
    expect(lineWrapCompartment).toBeDefined();
    expect(brVisibilityCompartment).toBeDefined();
    expect(autoPairCompartment).toBeDefined();
    expect(lineNumbersCompartment).toBeDefined();
    expect(shortcutKeymapCompartment).toBeDefined();
  });

  it("compartments have an 'of' method", () => {
    expect(typeof lineWrapCompartment.of).toBe("function");
    expect(typeof brVisibilityCompartment.of).toBe("function");
    expect(typeof autoPairCompartment.of).toBe("function");
    expect(typeof lineNumbersCompartment.of).toBe("function");
    expect(typeof shortcutKeymapCompartment.of).toBe("function");
  });
});
