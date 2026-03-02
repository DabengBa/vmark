import { describe, it, expect, vi } from "vitest";
import { Schema, DOMSerializer } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import {
  selectWordInView,
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
});
