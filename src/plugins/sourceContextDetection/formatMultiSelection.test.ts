import { describe, it, expect } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { applyInlineFormatToSelections } from "./formatMultiSelection";

function createView(doc: string, ranges: Array<{ from: number; to: number }>): EditorView {
  const parent = document.createElement("div");
  const selection = EditorSelection.create(
    ranges.map((range) => EditorSelection.range(range.from, range.to))
  );
  const state = EditorState.create({
    doc,
    selection,
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  return new EditorView({ state, parent });
}

describe("applyInlineFormatToSelections", () => {
  it("wraps multiple selections with underline markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);

    const applied = applyInlineFormatToSelections(view, "underline");

    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("++one++ ++two++ three");
    view.destroy();
  });

  it("returns false for single selection", () => {
    const view = createView("one two three", [{ from: 0, to: 3 }]);
    const applied = applyInlineFormatToSelections(view, "bold");
    expect(applied).toBe(false);
    view.destroy();
  });

  it("wraps multiple selections with bold markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("**one** **two** three");
    view.destroy();
  });

  it("wraps multiple selections with italic markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "italic");
    expect(view.state.doc.toString()).toBe("*one* *two* three");
    view.destroy();
  });

  it("wraps multiple selections with code markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "code");
    expect(view.state.doc.toString()).toBe("`one` `two` three");
    view.destroy();
  });

  it("wraps multiple selections with strikethrough markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "strikethrough");
    expect(view.state.doc.toString()).toBe("~~one~~ ~~two~~ three");
    view.destroy();
  });

  it("wraps multiple selections with highlight markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "highlight");
    expect(view.state.doc.toString()).toBe("==one== ==two== three");
    view.destroy();
  });

  it("handles three selections", () => {
    const view = createView("aaa bbb ccc", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
      { from: 8, to: 11 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("**aaa** **bbb** **ccc**");
    view.destroy();
  });

  it("handles CJK text in selections", () => {
    const view = createView("你好 世界", [
      { from: 0, to: 2 },
      { from: 3, to: 5 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("**你好** **世界**");
    view.destroy();
  });

  it("unwraps already-wrapped selections", () => {
    const view = createView("**one** **two** three", [
      { from: 2, to: 5 },
      { from: 10, to: 13 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("one two three");
    view.destroy();
  });
});
