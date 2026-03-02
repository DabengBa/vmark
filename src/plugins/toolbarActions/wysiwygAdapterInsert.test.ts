import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  message: vi.fn(),
}));

vi.mock("@/plugins/syntaxReveal/marks", () => ({
  findWordAtCursor: vi.fn(),
}));

vi.mock("@/hooks/useImageOperations", () => ({
  copyImageToAssets: vi.fn(),
  insertBlockImageNode: vi.fn(),
}));

vi.mock("@/hooks/useMediaOperations", () => ({
  copyMediaToAssets: vi.fn(),
  insertBlockVideoNode: vi.fn(),
  insertBlockAudioNode: vi.fn(),
}));

vi.mock("@/hooks/useWindowFocus", () => ({
  getWindowLabel: vi.fn(() => "main"),
}));

vi.mock("@/utils/clipboardImagePath", () => ({
  readClipboardImagePath: vi.fn(),
}));

vi.mock("@/utils/reentryGuard", () => ({
  withReentryGuard: vi.fn((_label: string, _guard: string, fn: () => Promise<void>) => fn()),
}));

vi.mock("@/plugins/mermaid/constants", () => ({
  DEFAULT_MERMAID_DIAGRAM: "flowchart LR\n  A --> B",
}));

vi.mock("@/plugins/markmap/constants", () => ({
  DEFAULT_MARKMAP_CONTENT: "# Topic\n## Branch",
}));

vi.mock("@/utils/debug", () => ({
  wysiwygAdapterWarn: vi.fn(),
}));

vi.mock("./wysiwygAdapterUtils", () => ({
  isViewConnected: vi.fn(() => true),
  getActiveFilePath: vi.fn(() => "/path/to/doc.md"),
}));

import {
  handleInsertImage,
  insertMathBlock,
  insertDiagramBlock,
  insertMarkmapBlock,
  insertInlineMath,
  handleInsertVideo,
  handleInsertAudio,
} from "./wysiwygAdapterInsert";
import type { WysiwygToolbarContext } from "./types";

function createMockEditor() {
  const editor = {
    chain: vi.fn().mockReturnThis(),
    focus: vi.fn().mockReturnThis(),
    insertContent: vi.fn().mockReturnThis(),
    run: vi.fn().mockReturnThis(),
  };
  return editor;
}

function createBaseContext(overrides?: Partial<WysiwygToolbarContext>): WysiwygToolbarContext {
  return {
    surface: "wysiwyg",
    view: null,
    editor: null,
    context: null,
    ...overrides,
  };
}

describe("insertMathBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when editor is null", () => {
    const context = createBaseContext();
    expect(insertMathBlock(context)).toBe(false);
  });

  it("inserts a LaTeX code block", () => {
    const editor = createMockEditor();
    const context = createBaseContext({ editor: editor as never });

    const result = insertMathBlock(context);
    expect(result).toBe(true);
    expect(editor.chain).toHaveBeenCalled();
    expect(editor.focus).toHaveBeenCalled();
    expect(editor.insertContent).toHaveBeenCalledWith({
      type: "codeBlock",
      attrs: { language: "latex" },
      content: [{ type: "text", text: expect.stringContaining("sqrt") }],
    });
    expect(editor.run).toHaveBeenCalled();
  });
});

describe("insertDiagramBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when editor is null", () => {
    const context = createBaseContext();
    expect(insertDiagramBlock(context)).toBe(false);
  });

  it("inserts a Mermaid code block", () => {
    const editor = createMockEditor();
    const context = createBaseContext({ editor: editor as never });

    const result = insertDiagramBlock(context);
    expect(result).toBe(true);
    expect(editor.insertContent).toHaveBeenCalledWith({
      type: "codeBlock",
      attrs: { language: "mermaid" },
      content: [{ type: "text", text: "flowchart LR\n  A --> B" }],
    });
  });
});

describe("insertMarkmapBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when editor is null", () => {
    const context = createBaseContext();
    expect(insertMarkmapBlock(context)).toBe(false);
  });

  it("inserts a Markmap code block", () => {
    const editor = createMockEditor();
    const context = createBaseContext({ editor: editor as never });

    const result = insertMarkmapBlock(context);
    expect(result).toBe(true);
    expect(editor.insertContent).toHaveBeenCalledWith({
      type: "codeBlock",
      attrs: { language: "markmap" },
      content: [{ type: "text", text: "# Topic\n## Branch" }],
    });
  });
});

describe("handleInsertImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when view is null", () => {
    const context = createBaseContext();
    expect(handleInsertImage(context)).toBe(false);
  });

  it("returns true when view is provided (async fire-and-forget)", () => {
    const mockView = {
      state: {
        selection: { from: 0, to: 0, $from: { nodeAfter: null, nodeBefore: null } },
        doc: { textBetween: vi.fn(() => "") },
        schema: { nodes: { image: { create: vi.fn() } } },
      },
      dispatch: vi.fn(),
      focus: vi.fn(),
      dom: { isConnected: true },
    };
    const context = createBaseContext({ view: mockView as never });

    const result = handleInsertImage(context);
    expect(result).toBe(true);
  });
});

describe("handleInsertVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when view is null", () => {
    const context = createBaseContext();
    expect(handleInsertVideo(context)).toBe(false);
  });

  it("returns true when view is provided", () => {
    const mockView = { dom: { isConnected: true } };
    const context = createBaseContext({ view: mockView as never });

    const result = handleInsertVideo(context);
    expect(result).toBe(true);
  });
});

describe("handleInsertAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when view is null", () => {
    const context = createBaseContext();
    expect(handleInsertAudio(context)).toBe(false);
  });

  it("returns true when view is provided", () => {
    const mockView = { dom: { isConnected: true } };
    const context = createBaseContext({ view: mockView as never });

    const result = handleInsertAudio(context);
    expect(result).toBe(true);
  });
});

describe("insertInlineMath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when view is null", () => {
    const context = createBaseContext();
    expect(insertInlineMath(context)).toBe(false);
  });

  it("returns false when schema has no math_inline node type", () => {
    const mockView = {
      state: {
        selection: {
          from: 0,
          to: 0,
          $from: { nodeAfter: null, nodeBefore: null },
        },
        doc: { textBetween: vi.fn(() => "") },
        schema: { nodes: {} },
        tr: {},
      },
      dispatch: vi.fn(),
      focus: vi.fn(),
      dom: { querySelector: vi.fn() },
    };
    const context = createBaseContext({ view: mockView as never });

    const result = insertInlineMath(context);
    expect(result).toBe(false);
  });
});
