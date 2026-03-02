import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { performWysiwygToolbarAction, setWysiwygHeadingLevel } from "./wysiwygAdapter";
import type { WysiwygToolbarContext, MultiSelectionContext } from "./types";

const baseContext: WysiwygToolbarContext = {
  surface: "wysiwyg",
  view: null,
  editor: null,
  context: null,
};

function createMockEditor(overrides?: Record<string, unknown>) {
  return {
    commands: {
      undo: vi.fn(() => true),
      redo: vi.fn(() => true),
      insertAlertBlock: vi.fn(),
      insertDetailsBlock: vi.fn(),
    },
    chain: vi.fn().mockReturnThis(),
    focus: vi.fn().mockReturnThis(),
    setParagraph: vi.fn().mockReturnThis(),
    setHeading: vi.fn().mockReturnThis(),
    setCodeBlock: vi.fn().mockReturnThis(),
    setHorizontalRule: vi.fn().mockReturnThis(),
    insertTable: vi.fn().mockReturnThis(),
    run: vi.fn().mockReturnThis(),
    ...overrides,
  } as unknown as TiptapEditor;
}

const disabledMultiSelection: MultiSelectionContext = {
  enabled: false,
  reason: "none",
  inCodeBlock: false,
  inTable: false,
  inList: false,
  inBlockquote: false,
  inHeading: false,
  inLink: false,
  inInlineMath: false,
  inFootnote: false,
  inImage: false,
  inTextblock: false,
  sameBlockParent: true,
  blockParentType: null,
};

describe("performWysiwygToolbarAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls alert insertion commands with the correct type", () => {
    const actions: Record<string, string> = {
      insertAlertNote: "NOTE",
      insertAlertTip: "TIP",
      insertAlertImportant: "IMPORTANT",
      insertAlertWarning: "WARNING",
      insertAlertCaution: "CAUTION",
    };

    for (const [action, alertType] of Object.entries(actions)) {
      const insertAlertBlock = vi.fn();
      const editor = { commands: { insertAlertBlock } } as unknown as TiptapEditor;
      const applied = performWysiwygToolbarAction(action, {
        ...baseContext,
        editor,
      });
      expect(applied).toBe(true);
      expect(insertAlertBlock).toHaveBeenCalledWith(alertType);
    }
  });

  it("returns false for unknown action", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("unknownAction", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(false);
  });

  it("handles undo with editor", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("undo", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(true);
    expect(editor.commands.undo).toHaveBeenCalled();
  });

  it("returns false for undo without editor", () => {
    const result = performWysiwygToolbarAction("undo", baseContext);
    expect(result).toBe(false);
  });

  it("handles redo with editor", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("redo", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(true);
    expect(editor.commands.redo).toHaveBeenCalled();
  });

  it("returns false for redo without editor", () => {
    const result = performWysiwygToolbarAction("redo", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for inline formatting without view", () => {
    const formats = ["bold", "italic", "underline", "strikethrough", "highlight", "superscript", "subscript", "code"];
    for (const format of formats) {
      const result = performWysiwygToolbarAction(format, baseContext);
      expect(result).toBe(false);
    }
  });

  it("returns false for clearFormatting without view", () => {
    const result = performWysiwygToolbarAction("clearFormatting", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for increaseHeading without editor", () => {
    const result = performWysiwygToolbarAction("increaseHeading", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for decreaseHeading without editor", () => {
    const result = performWysiwygToolbarAction("decreaseHeading", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for insertCodeBlock without editor", () => {
    const result = performWysiwygToolbarAction("insertCodeBlock", baseContext);
    expect(result).toBe(false);
  });

  it("inserts code block with editor", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("insertCodeBlock", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(true);
    expect(editor.chain).toHaveBeenCalled();
  });

  it("returns false for insertDivider without editor", () => {
    const result = performWysiwygToolbarAction("insertDivider", baseContext);
    expect(result).toBe(false);
  });

  it("inserts divider with editor", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("insertDivider", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(true);
    expect(editor.chain).toHaveBeenCalled();
  });

  it("returns false for insertTable without editor", () => {
    const result = performWysiwygToolbarAction("insertTable", baseContext);
    expect(result).toBe(false);
  });

  it("handles insertTable with editor", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("insertTable", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(true);
  });

  it("handles insertTableBlock same as insertTable", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("insertTableBlock", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(true);
  });

  it("returns false for insertFootnote without editor", () => {
    const result = performWysiwygToolbarAction("insertFootnote", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for insertDetails without editor", () => {
    const result = performWysiwygToolbarAction("insertDetails", baseContext);
    expect(result).toBe(false);
  });

  it("inserts details block with editor", () => {
    const editor = createMockEditor();
    const result = performWysiwygToolbarAction("insertDetails", {
      ...baseContext,
      editor,
    });
    expect(result).toBe(true);
    expect(editor.commands.insertDetailsBlock).toHaveBeenCalled();
  });

  it("returns false for insertBlockquote without editor", () => {
    const result = performWysiwygToolbarAction("insertBlockquote", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for toggleQuoteStyle without editor", () => {
    const result = performWysiwygToolbarAction("toggleQuoteStyle", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for insertBulletList without view", () => {
    const result = performWysiwygToolbarAction("insertBulletList", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for insertOrderedList without view", () => {
    const result = performWysiwygToolbarAction("insertOrderedList", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for insertTaskList without editor", () => {
    const result = performWysiwygToolbarAction("insertTaskList", baseContext);
    expect(result).toBe(false);
  });

  it("returns false for selection actions without view", () => {
    const actions = ["selectWord", "selectLine", "selectBlock", "expandSelection"];
    for (const action of actions) {
      const result = performWysiwygToolbarAction(action, baseContext);
      expect(result).toBe(false);
    }
  });

  it("returns false for table operations without view", () => {
    const actions = [
      "addRowAbove", "addRow", "addColLeft", "addCol",
      "deleteRow", "deleteCol", "deleteTable",
      "alignLeft", "alignCenter", "alignRight",
      "alignAllLeft", "alignAllCenter", "alignAllRight",
    ];
    for (const action of actions) {
      const result = performWysiwygToolbarAction(action, baseContext);
      expect(result).toBe(false);
    }
  });

  it("returns false for blockquote operations without view", () => {
    const actions = ["nestBlockquote", "unnestBlockquote", "removeBlockquote"];
    for (const action of actions) {
      const result = performWysiwygToolbarAction(action, baseContext);
      expect(result).toBe(false);
    }
  });

  it("returns false when multi-selection disallows the action", () => {
    const editor = createMockEditor();
    const multi: MultiSelectionContext = {
      ...disabledMultiSelection,
      enabled: true,
      reason: "multi",
    };
    // "insertCodeBlock" is disallowed in multi-selection
    const result = performWysiwygToolbarAction("insertCodeBlock", {
      ...baseContext,
      editor,
      multiSelection: multi,
    });
    expect(result).toBe(false);
  });
});

describe("setWysiwygHeadingLevel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when editor is null", () => {
    const result = setWysiwygHeadingLevel(baseContext, 1);
    expect(result).toBe(false);
  });

  it("sets paragraph when level is 0", () => {
    const editor = createMockEditor();
    const result = setWysiwygHeadingLevel(
      { ...baseContext, editor },
      0
    );
    expect(result).toBe(true);
    expect(editor.chain).toHaveBeenCalled();
  });

  it("sets heading level 1-6", () => {
    for (let level = 1; level <= 6; level++) {
      const editor = createMockEditor();
      const result = setWysiwygHeadingLevel(
        { ...baseContext, editor },
        level
      );
      expect(result).toBe(true);
      expect(editor.chain).toHaveBeenCalled();
    }
  });

  it("returns false when multi-selection disallows heading", () => {
    const editor = createMockEditor();
    const multi: MultiSelectionContext = {
      ...disabledMultiSelection,
      enabled: true,
      reason: "multi",
      inCodeBlock: true, // code block disallows conditional actions
    };
    const result = setWysiwygHeadingLevel(
      { ...baseContext, editor, multiSelection: multi },
      2
    );
    expect(result).toBe(false);
  });
});
