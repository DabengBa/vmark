import { describe, it, expect } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { MultiSelectionContext } from "./types";
import { performSourceToolbarAction, setSourceHeadingLevel } from "./sourceAdapter";

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

const multiSelection: MultiSelectionContext = {
  enabled: true,
  reason: "multi",
  inCodeBlock: false,
  inTable: false,
  inList: false,
  inBlockquote: false,
  inHeading: false,
  inLink: false,
  inInlineMath: false,
  inFootnote: false,
  inImage: false,
  inTextblock: true,
  sameBlockParent: true,
  blockParentType: "paragraph",
};

const singleSelection: MultiSelectionContext = {
  ...multiSelection,
  enabled: false,
};

describe("performSourceToolbarAction", () => {
  it("clears formatting across multiple selections", () => {
    const view = createView("**one** **two**", [
      { from: 0, to: 7 },
      { from: 8, to: 15 },
    ]);

    const applied = performSourceToolbarAction("clearFormatting", {
      surface: "source",
      view,
      context: null,
      multiSelection,
    });

    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("one two");
    view.destroy();
  });

  it("toggles blockquote on and off", () => {
    const view = createView("Hello", [{ from: 0, to: 0 }]);

    const applied = performSourceToolbarAction("insertBlockquote", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });

    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("> Hello");

    const toggled = performSourceToolbarAction("insertBlockquote", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });

    expect(toggled).toBe(true);
    expect(view.state.doc.toString()).toBe("Hello");
    view.destroy();
  });

  it("creates a bullet list from a paragraph", () => {
    const view = createView("Item", [{ from: 0, to: 0 }]);

    const applied = performSourceToolbarAction("bulletList", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });

    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("- Item");
    view.destroy();
  });

  it("converts a bullet list to an ordered list", () => {
    const view = createView("- Item", [{ from: 2, to: 2 }]);

    const applied = performSourceToolbarAction("orderedList", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });

    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("1. Item");
    view.destroy();
  });

  describe("unlink action", () => {
    it("removes markdown link syntax preserving text", () => {
      // Cursor inside link text
      const view = createView("[hello](https://example.com)", [{ from: 3, to: 3 }]);

      const applied = performSourceToolbarAction("unlink", {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });

      expect(applied).toBe(true);
      expect(view.state.doc.toString()).toBe("hello");
      view.destroy();
    });

    it("removes wiki link syntax preserving target", () => {
      // Cursor inside wiki link
      const view = createView("[[my-page]]", [{ from: 5, to: 5 }]);

      const applied = performSourceToolbarAction("unlink", {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });

      expect(applied).toBe(true);
      expect(view.state.doc.toString()).toBe("my-page");
      view.destroy();
    });

    it("removes wiki link preserving alias over target", () => {
      // Wiki link with alias: [[target|display text]]
      const view = createView("[[page|display text]]", [{ from: 10, to: 10 }]);

      const applied = performSourceToolbarAction("unlink", {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });

      expect(applied).toBe(true);
      expect(view.state.doc.toString()).toBe("display text");
      view.destroy();
    });

    it("returns false when cursor not in a link", () => {
      const view = createView("plain text", [{ from: 5, to: 5 }]);

      const applied = performSourceToolbarAction("unlink", {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });

      expect(applied).toBe(false);
      expect(view.state.doc.toString()).toBe("plain text");
      view.destroy();
    });

    it("handles link with empty text", () => {
      const view = createView("[](https://example.com)", [{ from: 1, to: 1 }]);

      const applied = performSourceToolbarAction("unlink", {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });

      expect(applied).toBe(true);
      expect(view.state.doc.toString()).toBe("");
      view.destroy();
    });

    it("handles link with title attribute", () => {
      const view = createView('[text](url "title")', [{ from: 3, to: 3 }]);

      const applied = performSourceToolbarAction("unlink", {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });

      expect(applied).toBe(true);
      expect(view.state.doc.toString()).toBe("text");
      view.destroy();
    });
  });

  it("returns false for null view", () => {
    const applied = performSourceToolbarAction("bold", {
      surface: "source",
      view: null,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
  });

  it("returns false for unknown action", () => {
    const view = createView("hello", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("unknownAction", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
    view.destroy();
  });

  it("inserts code block", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertCodeBlock", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("```\n\n```");
    view.destroy();
  });

  it("inserts divider", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertDivider", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("---\n");
    view.destroy();
  });

  it("inserts table", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertTable", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("| Header 1 |");
    view.destroy();
  });

  it("insertTableBlock works same as insertTable", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertTableBlock", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("| Header 1 |");
    view.destroy();
  });

  it("inserts bullet list marker", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertBulletList", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("- ");
    view.destroy();
  });

  it("inserts ordered list marker", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertOrderedList", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("1. ");
    view.destroy();
  });

  it("inserts task list marker", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertTaskList", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("- [ ] ");
    view.destroy();
  });

  it("converts ordered list to task list", () => {
    const view = createView("1. Item", [{ from: 3, to: 3 }]);
    const applied = performSourceToolbarAction("taskList", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("- [ ] Item");
    view.destroy();
  });

  it("returns false for indent/outdent/removeList when not in list", () => {
    const view = createView("not a list", [{ from: 0, to: 0 }]);
    for (const action of ["indent", "outdent", "removeList"]) {
      const applied = performSourceToolbarAction(action, {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });
      expect(applied).toBe(false);
    }
    view.destroy();
  });

  it("returns false for blockquote operations when not in blockquote", () => {
    const view = createView("not a quote", [{ from: 0, to: 0 }]);
    for (const action of ["nestBlockquote", "unnestBlockquote", "removeBlockquote"]) {
      const applied = performSourceToolbarAction(action, {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });
      expect(applied).toBe(false);
    }
    view.destroy();
  });

  it("returns false when multi-selection disallows insert actions", () => {
    const view = createView("hello", [{ from: 0, to: 0 }]);
    const disallowedMulti: MultiSelectionContext = {
      ...multiSelection,
      enabled: true,
    };
    const applied = performSourceToolbarAction("insertCodeBlock", {
      surface: "source",
      view,
      context: null,
      multiSelection: disallowedMulti,
    });
    expect(applied).toBe(false);
    view.destroy();
  });

  it("clears formatting on single selection with text", () => {
    const view = createView("**bold text**", [{ from: 0, to: 13 }]);
    const applied = performSourceToolbarAction("clearFormatting", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("returns false for clearFormatting with collapsed single selection", () => {
    const view = createView("hello", [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("clearFormatting", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
    view.destroy();
  });
});

describe("setSourceHeadingLevel", () => {
  it("returns false when view is null", () => {
    const result = setSourceHeadingLevel(
      { surface: "source", view: null, context: null, multiSelection: singleSelection },
      1
    );
    expect(result).toBe(false);
  });

  it("converts paragraph to heading level 1", () => {
    const view = createView("Hello", [{ from: 0, to: 0 }]);
    const result = setSourceHeadingLevel(
      { surface: "source", view, context: null, multiSelection: singleSelection },
      1
    );
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("# Hello");
    view.destroy();
  });

  it("converts paragraph to heading level 3", () => {
    const view = createView("Hello", [{ from: 0, to: 0 }]);
    const result = setSourceHeadingLevel(
      { surface: "source", view, context: null, multiSelection: singleSelection },
      3
    );
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("### Hello");
    view.destroy();
  });

  it("changes heading level from 1 to 2", () => {
    const view = createView("# Hello", [{ from: 2, to: 2 }]);
    const result = setSourceHeadingLevel(
      { surface: "source", view, context: null, multiSelection: singleSelection },
      2
    );
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("## Hello");
    view.destroy();
  });

  it("removes heading when level is 0", () => {
    const view = createView("## Hello", [{ from: 3, to: 3 }]);
    const result = setSourceHeadingLevel(
      { surface: "source", view, context: null, multiSelection: singleSelection },
      0
    );
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("Hello");
    view.destroy();
  });

  it("returns false for level 0 on a paragraph (no heading to remove)", () => {
    const view = createView("Hello", [{ from: 0, to: 0 }]);
    const result = setSourceHeadingLevel(
      { surface: "source", view, context: null, multiSelection: singleSelection },
      0
    );
    expect(result).toBe(false);
    view.destroy();
  });
});
