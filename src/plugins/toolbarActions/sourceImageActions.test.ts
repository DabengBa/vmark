import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

vi.mock("@/plugins/sourcePopup/sourcePopupUtils", () => ({
  getAnchorRectFromRange: vi.fn(() => ({ top: 0, bottom: 20, left: 0, right: 100 })),
}));

vi.mock("@/utils/clipboardImagePath", () => ({
  readClipboardImagePath: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/hooks/useImageOperations", () => ({
  copyImageToAssets: vi.fn(() => Promise.resolve("assets/image.png")),
}));

vi.mock("@/utils/markdownUrl", () => ({
  encodeMarkdownUrl: vi.fn((url: string) => url.replace(/ /g, "%20")),
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      getDocument: () => ({ filePath: "/path/to/doc.md" }),
    }),
  },
}));

vi.mock("@/stores/mediaPopupStore", () => ({
  useMediaPopupStore: {
    getState: () => ({
      openPopup: vi.fn(),
    }),
  },
}));

vi.mock("@/utils/mediaPathDetection", () => ({
  hasVideoExtension: vi.fn(() => false),
  hasAudioExtension: vi.fn(() => false),
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      activeTabId: { main: "tab1" },
    }),
  },
}));

vi.mock("@/hooks/useWindowFocus", () => ({
  getWindowLabel: vi.fn(() => "main"),
}));

vi.mock("@/utils/markdownLinkPatterns", () => ({
  findMarkdownLinkAtPosition: vi.fn(() => null),
  findWikiLinkAtPosition: vi.fn(() => null),
}));

vi.mock("./sourceAdapterHelpers", () => ({
  insertText: vi.fn((view: EditorView, text: string, cursorOffset?: number) => {
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: {
        anchor: typeof cursorOffset === "number" ? from + cursorOffset : from + text.length,
      },
    });
  }),
}));

vi.mock("./sourceAdapterLinks", () => ({
  findWordAtCursorSource: vi.fn(() => null),
}));

import { unlinkAtCursor, insertImage, insertVideoTag, insertAudioTag } from "./sourceImageActions";
import { insertText } from "./sourceAdapterHelpers";
import { findMarkdownLinkAtPosition, findWikiLinkAtPosition } from "@/utils/markdownLinkPatterns";

function createView(doc: string, ranges: Array<{ from: number; to: number }>): EditorView {
  const parent = document.createElement("div");
  const selection = EditorSelection.create(
    ranges.map((r) => EditorSelection.range(r.from, r.to))
  );
  const state = EditorState.create({ doc, selection });
  return new EditorView({ state, parent });
}

describe("unlinkAtCursor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes regular markdown link preserving text", () => {
    const view = createView("[hello](https://example.com)", [{ from: 3, to: 3 }]);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue({
      from: 0,
      to: 28,
      text: "hello",
      href: "https://example.com",
    });

    const result = unlinkAtCursor(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("hello");
    view.destroy();
  });

  it("removes wiki link preserving target", () => {
    const view = createView("[[my-page]]", [{ from: 5, to: 5 }]);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue(null);
    vi.mocked(findWikiLinkAtPosition).mockReturnValue({
      from: 0,
      to: 11,
      target: "my-page",
    });

    const result = unlinkAtCursor(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("my-page");
    view.destroy();
  });

  it("removes wiki link preserving alias over target", () => {
    const view = createView("[[page|display text]]", [{ from: 10, to: 10 }]);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue(null);
    vi.mocked(findWikiLinkAtPosition).mockReturnValue({
      from: 0,
      to: 21,
      target: "page",
      alias: "display text",
    });

    const result = unlinkAtCursor(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("display text");
    view.destroy();
  });

  it("returns false when cursor is not in a link", () => {
    const view = createView("plain text", [{ from: 5, to: 5 }]);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue(null);
    vi.mocked(findWikiLinkAtPosition).mockReturnValue(null);

    const result = unlinkAtCursor(view);
    expect(result).toBe(false);
    expect(view.state.doc.toString()).toBe("plain text");
    view.destroy();
  });

  it("handles link with empty text", () => {
    const view = createView("[](https://example.com)", [{ from: 1, to: 1 }]);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue({
      from: 0,
      to: 23,
      text: "",
      href: "https://example.com",
    });

    const result = unlinkAtCursor(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("wiki link without alias uses target", () => {
    const view = createView("[[target]]", [{ from: 4, to: 4 }]);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue(null);
    vi.mocked(findWikiLinkAtPosition).mockReturnValue({
      from: 0,
      to: 10,
      target: "target",
    });

    const result = unlinkAtCursor(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("target");
    view.destroy();
  });
});

describe("insertImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true immediately (async fire-and-forget)", () => {
    const view = createView("hello", [{ from: 0, to: 0 }]);
    const result = insertImage(view);
    expect(result).toBe(true);
    view.destroy();
  });
});

describe("insertVideoTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts video HTML tag with cursor in src", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    insertVideoTag(view);
    expect(insertText).toHaveBeenCalledWith(
      view,
      '<video src="" controls></video>',
      12
    );
    view.destroy();
  });
});

describe("insertAudioTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts audio HTML tag with cursor in src", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    insertAudioTag(view);
    expect(insertText).toHaveBeenCalledWith(
      view,
      '<audio src="" controls></audio>',
      12
    );
    view.destroy();
  });
});
