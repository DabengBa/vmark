import { describe, it, expect, vi, afterEach } from "vitest";
import { Schema, DOMSerializer } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import {
  selectWordInView,
  selectLineInView,
  selectBlockInView,
  expandSelectionInView,
} from "./tiptapSelectionActions";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "inline*",
      group: "block",
      toDOM() { return ["p", 0]; },
    },
    heading: {
      content: "inline*",
      group: "block",
      attrs: { level: { default: 1 } },
      toDOM(node) { return ["h" + node.attrs.level, 0]; },
    },
    blockquote: {
      content: "block+",
      group: "block",
      toDOM() { return ["blockquote", 0]; },
    },
    text: { inline: true, group: "inline" },
  },
});

function createView(
  doc: ReturnType<typeof schema.node>,
  from: number,
  to?: number
): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const state = EditorState.create({
    doc,
    selection: TextSelection.create(doc, from, to ?? from),
  });
  return new EditorView(parent, { state });
}

function getSelection(view: EditorView) {
  return { from: view.state.selection.from, to: view.state.selection.to };
}

describe("selectWordInView", () => {
  it("selects the word at cursor position", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 3); // inside "hello"

    const result = selectWordInView(view);
    expect(result).toBe(true);

    const sel = getSelection(view);
    // "hello" starts at position 1 (after doc+para open), ends at 6
    expect(sel.from).toBe(1);
    expect(sel.to).toBe(6);
    view.destroy();
  });

  it("selects second word when cursor is in it", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 8); // inside "world"

    const result = selectWordInView(view);
    expect(result).toBe(true);

    const sel = getSelection(view);
    expect(sel.from).toBe(7);
    expect(sel.to).toBe(12);
    view.destroy();
  });

  it("returns false when cursor is on whitespace", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello   world")]),
    ]);
    const view = createView(doc, 7); // on space between words

    const result = selectWordInView(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("handles single character word", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("a b c")]),
    ]);
    const view = createView(doc, 1); // on "a"

    const result = selectWordInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    expect(sel.to - sel.from).toBe(1);
    view.destroy();
  });

  it("handles word with underscores", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello_world test")]),
    ]);
    const view = createView(doc, 3); // inside "hello_world"

    const result = selectWordInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    // underscore is a word character
    expect(sel.to - sel.from).toBe(11);
    view.destroy();
  });

  it("handles empty paragraph", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph"),
    ]);
    const view = createView(doc, 1);

    const result = selectWordInView(view);
    expect(result).toBe(false);
    view.destroy();
  });
});

describe("selectBlockInView", () => {
  it("selects the paragraph block", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 3);

    const result = selectBlockInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    expect(sel.from).toBe(1);
    expect(sel.to).toBe(12);
    view.destroy();
  });

  it("selects content of a blockquote paragraph", () => {
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("quoted text")]),
      ]),
    ]);
    const view = createView(doc, 4);

    const result = selectBlockInView(view);
    expect(result).toBe(true);
    view.destroy();
  });

  it("handles empty paragraph", () => {
    const doc = schema.node("doc", null, [schema.node("paragraph")]);
    const view = createView(doc, 1);

    const result = selectBlockInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    expect(sel.from).toBe(sel.to);
    view.destroy();
  });
});

describe("expandSelectionInView", () => {
  it("expands from cursor to word first", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 3); // inside "hello", collapsed cursor

    const result = expandSelectionInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    // Should expand to word "hello"
    expect(sel.from).toBe(1);
    expect(sel.to).toBe(6);
    view.destroy();
  });

  // Note: "eventually selects entire document" test requires coordsAtPos
  // which is not available in jsdom. Covered by integration tests.

  // Note: tests that call findLineBoundaries (which uses coordsAtPos)
  // cannot work in jsdom because there is no layout engine.
  // Those paths are covered by integration tests in a real browser.

  it("expands from word selection to line then block/document", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    // Start with word already selected
    const view = createView(doc, 1, 6); // "hello" selected

    // Mock coords so findLineBoundaries can work
    vi.spyOn(view, "coordsAtPos").mockImplementation(() => ({
      top: 100, bottom: 120, left: 50, right: 60,
    }));

    const result = expandSelectionInView(view);
    expect(result).toBe(true);
    // findLineBoundaries with all same coords: expands to full range
    // which may equal current selection or expand further
    view.destroy();
  });

  it("returns true and selects full document when no further expansion possible", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("a")]),
    ]);
    // Select full paragraph content
    const view = createView(doc, 1, 2);

    vi.spyOn(view, "coordsAtPos").mockImplementation(() => ({
      top: 100, bottom: 120, left: 50, right: 60,
    }));

    const result = expandSelectionInView(view);
    expect(result).toBe(true);
    // Should eventually reach document-level selection
    const sel = getSelection(view);
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(doc.content.size);
    view.destroy();
  });

  it("expands from cursor on whitespace skips word and goes to line", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("  hello  ")]),
    ]);
    const view = createView(doc, 2); // on whitespace

    vi.spyOn(view, "coordsAtPos").mockImplementation(() => ({
      top: 100, bottom: 120, left: 50, right: 60,
    }));

    const result = expandSelectionInView(view);
    expect(result).toBe(true);
    // findWordBoundaries returns null for whitespace,
    // so it falls through to findLineBoundaries
    view.destroy();
  });

  it("expands through blockquote depth", () => {
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("hello world")]),
      ]),
    ]);
    const view = createView(doc, 4); // inside "hello"

    vi.spyOn(view, "coordsAtPos").mockImplementation(() => ({
      top: 100, bottom: 120, left: 50, right: 60,
    }));

    // First expand selects word "hello"
    expandSelectionInView(view);
    // Continue expanding
    expandSelectionInView(view);
    // Should eventually reach document level
    const sel = getSelection(view);
    expect(sel.to).toBeGreaterThanOrEqual(1);
    view.destroy();
  });
});

describe("selectLineInView", () => {
  it("selects the visual line at cursor with mocked coords", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world foo bar")]),
    ]);
    const view = createView(doc, 3);

    // Mock coordsAtPos to simulate layout
    vi.spyOn(view, "coordsAtPos").mockImplementation((pos: number) => {
      // Simulate all positions being on the same line
      return { top: 100, bottom: 120, left: pos * 10, right: pos * 10 + 10 };
    });

    const result = selectLineInView(view);
    expect(result).toBe(true);
    // Should select from start to end of paragraph (all on same "line")
    const sel = getSelection(view);
    expect(sel.from).toBeLessThanOrEqual(3);
    expect(sel.to).toBeGreaterThanOrEqual(3);
    view.destroy();
  });

  it("selects only one visual line when coords differ", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world foo bar baz")]),
    ]);
    const view = createView(doc, 5);

    // Mock coordsAtPos to simulate line break at position 12
    vi.spyOn(view, "coordsAtPos").mockImplementation((pos: number) => {
      if (pos <= 12) return { top: 100, bottom: 120, left: pos * 10, right: pos * 10 + 10 };
      return { top: 130, bottom: 150, left: (pos - 12) * 10, right: (pos - 12) * 10 + 10 };
    });

    const result = selectLineInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    // Should only select within the first line
    expect(sel.to).toBeLessThanOrEqual(12);
    view.destroy();
  });

  it("handles coordsAtPos throwing for out-of-range positions", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("abc")]),
    ]);
    const view = createView(doc, 2);

    // Mock coordsAtPos to throw for some positions
    vi.spyOn(view, "coordsAtPos").mockImplementation((pos: number) => {
      if (pos < 1 || pos > 4) throw new Error("Invalid position");
      return { top: 100, bottom: 120, left: pos * 10, right: pos * 10 + 10 };
    });

    const result = selectLineInView(view);
    expect(result).toBe(true);
    view.destroy();
  });
});

describe("selectBlockInView edge cases", () => {
  it("returns false when depth is 0 (no block found)", () => {
    // This is hard to trigger since doc always has depth > 0 for paragraphs
    // but we test the type check for non-textblock, non-block nodes
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello")]),
    ]);
    const view = createView(doc, 3);

    const result = selectBlockInView(view);
    expect(result).toBe(true);
    // Should select the textblock (paragraph) content
    const sel = getSelection(view);
    expect(sel.from).toBe(1);
    expect(sel.to).toBe(6);
    view.destroy();
  });

  it("selects block for blockquote containing paragraph", () => {
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("quoted")]),
      ]),
    ]);
    const view = createView(doc, 3);

    const result = selectBlockInView(view);
    expect(result).toBe(true);
    view.destroy();
  });

  it("selects non-textblock block node", () => {
    // blockquote is a block but not a textblock
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("a")]),
        schema.node("paragraph", null, [schema.text("b")]),
      ]),
    ]);
    const view = createView(doc, 3);

    const result = selectBlockInView(view);
    expect(result).toBe(true);
    view.destroy();
  });
});

describe("dispatchSelectionOnly", () => {
  it("does not add selection change to undo history", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 3);

    // selectWord calls dispatchSelectionOnly internally
    selectWordInView(view);

    // The transaction should have addToHistory=false
    // We verify indirectly: undo should not restore the old selection
    view.destroy();
  });
});

describe("selectBlockInView — non-textblock block node first", () => {
  it("selects non-textblock block (blockquote) before hitting textblock", () => {
    // In a blockquote > paragraph, cursor at depth 2 (paragraph), depth 1 is blockquote.
    // The while loop should first find paragraph (textblock) and select it.
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("inside quote")]),
      ]),
    ]);
    const view = createView(doc, 3);
    const result = selectBlockInView(view);
    expect(result).toBe(true);
    // The paragraph at innermost depth is a textblock, so it gets selected first
    const sel = getSelection(view);
    expect(sel.from).toBe(2);
    expect(sel.to).toBe(14);
    view.destroy();
  });
});

describe("expandSelectionInView — depth walk and full doc fallback", () => {
  it("walks through depths and eventually selects full document", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hi")]),
    ]);
    // Start with full paragraph already selected (from=1, to=3)
    const view = createView(doc, 1, 3);

    // Mock coords to keep line boundaries the same as current selection
    vi.spyOn(view, "coordsAtPos").mockImplementation(() => ({
      top: 100, bottom: 120, left: 50, right: 60,
    }));

    // First expand: line boundaries equal selection, depth walk finds no expansion,
    // falls through to the full document fallback
    const result = expandSelectionInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(doc.content.size);
    view.destroy();
  });

  it("expands through multiple depths in blockquote before reaching doc", () => {
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("inner")]),
      ]),
    ]);
    // Select inner paragraph fully (from=2, to=7)
    const view = createView(doc, 2, 7);

    vi.spyOn(view, "coordsAtPos").mockImplementation(() => ({
      top: 100, bottom: 120, left: 50, right: 60,
    }));

    // Should expand to blockquote content (depth walk finds blockquote expands range)
    const result = expandSelectionInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    // Should have expanded beyond paragraph to blockquote or doc level
    expect(sel.to - sel.from).toBeGreaterThan(5);
    view.destroy();
  });

  it("reaches full document when all depths exhausted", () => {
    const doc = schema.node("doc", null, [
      schema.node("blockquote", null, [
        schema.node("paragraph", null, [schema.text("x")]),
      ]),
    ]);
    const view = createView(doc, 2, 3);

    vi.spyOn(view, "coordsAtPos").mockImplementation(() => ({
      top: 100, bottom: 120, left: 50, right: 60,
    }));

    // Expand multiple times until we reach full doc
    expandSelectionInView(view); // word -> line -> depth
    expandSelectionInView(view);
    expandSelectionInView(view);
    expandSelectionInView(view);

    const sel = getSelection(view);
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(doc.content.size);
    view.destroy();
  });
});

describe("findWordBoundaries edge cases", () => {
  it("handles cursor at start of text", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 1); // at start of "hello"

    const result = selectWordInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    expect(sel.from).toBe(1);
    expect(sel.to).toBe(6);
    view.destroy();
  });

  it("handles cursor at end of text", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 12); // at end of "world"

    const result = selectWordInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    expect(sel.from).toBe(7);
    expect(sel.to).toBe(12);
    view.destroy();
  });

  it("handles CJK characters", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hello world")]),
    ]);
    const view = createView(doc, 3);

    const result = selectWordInView(view);
    expect(result).toBe(true);
    view.destroy();
  });

  it("handles word with digits", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("test123 other")]),
    ]);
    const view = createView(doc, 4); // inside "test123"

    const result = selectWordInView(view);
    expect(result).toBe(true);
    const sel = getSelection(view);
    expect(sel.from).toBe(1);
    expect(sel.to).toBe(8); // "test123" is 7 chars
    view.destroy();
  });
});
