import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView as CodeMirrorView } from "@codemirror/view";
import type { CursorContext as SourceContext } from "@/types/cursorContext";

vi.mock("@/plugins/multiCursor", () => {
  class MultiSelection {
    ranges: Array<{ $from: { depth: number; pos: number; node: () => { type: { name: string }; isTextblock: boolean; isBlock: boolean } }; $to: { depth: number; pos: number; node: () => { type: { name: string }; isTextblock: boolean; isBlock: boolean } } }>;
    constructor(ranges: unknown[]) {
      this.ranges = ranges as typeof this.ranges;
    }
  }
  return { MultiSelection };
});

import {
  getSourceMultiSelectionContext,
} from "./multiSelectionContext";

function createCmView(doc: string, ranges: Array<{ from: number; to: number }>): CodeMirrorView {
  const parent = document.createElement("div");
  const selection = EditorSelection.create(
    ranges.map((r) => EditorSelection.range(r.from, r.to))
  );
  const state = EditorState.create({
    doc,
    selection,
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  return new CodeMirrorView({ state, parent });
}

function emptySourceContext(): SourceContext {
  return {
    inTable: false,
    inList: false,
    inBlockquote: false,
    inHeading: false,
    inLink: false,
    inInlineMath: false,
    inFootnote: false,
    inImage: false,
    inCodeBlock: false,
    isEmpty: false,
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isHighlight: false,
    isCode: false,
    isUnderline: false,
    isSuperscript: false,
    isSubscript: false,
    headingLevel: 0,
    listType: null,
  };
}

describe("getSourceMultiSelectionContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns disabled context when view is null", () => {
    const result = getSourceMultiSelectionContext(null, null);
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe("none");
  });

  it("returns disabled context when context is null", () => {
    const view = createCmView("hello", [{ from: 0, to: 0 }]);
    const result = getSourceMultiSelectionContext(view, null);
    expect(result.enabled).toBe(false);
    view.destroy();
  });

  it("returns disabled context for single selection", () => {
    const view = createCmView("hello world", [{ from: 0, to: 0 }]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe("none");
    view.destroy();
  });

  it("returns enabled context for multiple selections", () => {
    const view = createCmView("hello world", [
      { from: 0, to: 5 },
      { from: 6, to: 11 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe("multi");
    view.destroy();
  });

  it("detects table lines", () => {
    const view = createCmView("| a | b |\n| c | d |", [
      { from: 2, to: 2 },
      { from: 12, to: 12 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.inTable).toBe(true);
    view.destroy();
  });

  it("detects blockquote lines", () => {
    const view = createCmView("> quote1\n> quote2", [
      { from: 2, to: 2 },
      { from: 11, to: 11 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.inBlockquote).toBe(true);
    view.destroy();
  });

  it("detects heading lines", () => {
    const view = createCmView("# Heading 1\n## Heading 2", [
      { from: 2, to: 2 },
      { from: 14, to: 14 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.inHeading).toBe(true);
    view.destroy();
  });

  it("detects list lines (bullet)", () => {
    const view = createCmView("- item1\n- item2", [
      { from: 2, to: 2 },
      { from: 10, to: 10 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.inList).toBe(true);
    view.destroy();
  });

  it("detects list lines (ordered)", () => {
    const view = createCmView("1. item1\n2. item2", [
      { from: 3, to: 3 },
      { from: 12, to: 12 },
    ]);
    const context: SourceContext = {
      ...emptySourceContext(),
      inList: true,
    };
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.inList).toBe(true);
    view.destroy();
  });

  it("detects task list lines", () => {
    const view = createCmView("- [ ] task1\n- [x] task2", [
      { from: 6, to: 6 },
      { from: 18, to: 18 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.inList).toBe(true);
    view.destroy();
  });

  it("detects mixed block types with sameBlockParent=false", () => {
    const view = createCmView("# Heading\nparagraph", [
      { from: 2, to: 2 },
      { from: 12, to: 12 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.sameBlockParent).toBe(false);
    view.destroy();
  });

  it("detects same block parent when both are paragraphs", () => {
    const view = createCmView("paragraph1\nparagraph2", [
      { from: 2, to: 2 },
      { from: 13, to: 13 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.sameBlockParent).toBe(true);
    expect(result.blockParentType).toBe("paragraph");
    view.destroy();
  });

  it("uses context flags for link, inlineMath, footnote, image", () => {
    const view = createCmView("hello\nworld", [
      { from: 0, to: 0 },
      { from: 6, to: 6 },
    ]);
    const context: SourceContext = {
      ...emptySourceContext(),
      inLink: true,
      inInlineMath: true,
      inFootnote: true,
      inImage: true,
    };
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.inLink).toBe(true);
    expect(result.inInlineMath).toBe(true);
    expect(result.inFootnote).toBe(true);
    expect(result.inImage).toBe(true);
    view.destroy();
  });

  it("detects code fence for inCodeBlock", () => {
    const doc = "```\ncode line\n```\noutside";
    const view = createCmView(doc, [
      { from: 5, to: 5 }, // inside code fence
      { from: 18, to: 18 }, // outside code fence
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    expect(result.enabled).toBe(true);
    expect(result.inCodeBlock).toBe(true);
    expect(result.inTextblock).toBe(false); // inside code block = not in textblock
    view.destroy();
  });

  it("handles line with pipe character in non-table context", () => {
    const view = createCmView("a | b\nc | d", [
      { from: 0, to: 0 },
      { from: 6, to: 6 },
    ]);
    const context = emptySourceContext();
    const result = getSourceMultiSelectionContext(view, context);
    // Lines containing | are classified as table
    expect(result.inTable).toBe(true);
    view.destroy();
  });
});
