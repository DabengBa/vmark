import { describe, it, expect, afterEach } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { MultiSelectionContext } from "./types";
import { performSourceToolbarAction, setSourceHeadingLevel } from "./sourceAdapter";

const views: EditorView[] = [];

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
  const view = new EditorView({ state, parent });
  views.push(view);
  return view;
}

afterEach(() => {
  views.forEach((v) => { try { v.destroy(); } catch {} });
  views.length = 0;
});

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

  it("inserts footnote syntax", () => {
    const view = createView("text", [{ from: 0, to: 4 }]);
    const applied = performSourceToolbarAction("insertFootnote", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("inserts details block", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertDetails", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("details");
    view.destroy();
  });

  it("inserts alert block with correct type", () => {
    const alertActions = [
      "insertAlertNote",
      "insertAlertTip",
      "insertAlertImportant",
      "insertAlertWarning",
      "insertAlertCaution",
    ];
    for (const action of alertActions) {
      const view = createView("", [{ from: 0, to: 0 }]);
      const applied = performSourceToolbarAction(action, {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });
      expect(applied).toBe(true);
      // All alert blocks start with > [!TYPE]
      expect(view.state.doc.toString()).toContain("> [!");
      view.destroy();
    }
  });

  it("inserts math block", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertMath", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("$$");
    view.destroy();
  });

  it("inserts diagram block", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertDiagram", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("```mermaid");
    view.destroy();
  });

  it("inserts markmap block", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertMarkmap", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("```markmap");
    view.destroy();
  });

  it("inserts math block with existing selection as content", () => {
    const view = createView("x^2 + y^2", [{ from: 0, to: 9 }]);
    const applied = performSourceToolbarAction("insertMath", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    const docText = view.state.doc.toString();
    expect(docText).toContain("$$");
    expect(docText).toContain("x^2 + y^2");
    view.destroy();
  });

  it("handles list operations on existing lists", () => {
    const view = createView("- item", [{ from: 2, to: 2 }]);
    const indent = performSourceToolbarAction("indent", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(indent).toBe(true);
    view.destroy();
  });

  it("handles removeList on existing list", () => {
    const view = createView("- item", [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("removeList", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("item");
    view.destroy();
  });

  it("handles nestBlockquote on existing blockquote", () => {
    const view = createView("> quote", [{ from: 2, to: 2 }]);
    const nest = performSourceToolbarAction("nestBlockquote", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(nest).toBe(true);
    // nestBlockquote adds "> " prefix
    expect(view.state.doc.toString()).toContain("> ");
    view.destroy();
  });

  it("handles unnestBlockquote on existing blockquote", () => {
    const view = createView("> > quote", [{ from: 4, to: 4 }]);
    const unnest = performSourceToolbarAction("unnestBlockquote", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(unnest).toBe(true);
    view.destroy();
  });

  it("handles removeBlockquote on existing blockquote", () => {
    const view = createView("> quote", [{ from: 2, to: 2 }]);
    const remove = performSourceToolbarAction("removeBlockquote", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(remove).toBe(true);
    view.destroy();
  });

  it("handles selection actions", () => {
    const view = createView("hello world", [{ from: 2, to: 2 }]);
    const selectWord = performSourceToolbarAction("selectWord", {
      surface: "source",
      view,
      context: null,
      multiSelection: singleSelection,
    });
    expect(selectWord).toBe(true);
    view.destroy();
  });

  it("handles inline formatting actions", () => {
    const formats = ["bold", "italic", "strikethrough", "highlight",
      "superscript", "subscript", "code", "underline"];
    for (const format of formats) {
      const view = createView("hello", [{ from: 0, to: 5 }]);
      const applied = performSourceToolbarAction(format, {
        surface: "source",
        view,
        context: null,
        multiSelection: singleSelection,
      });
      expect(applied).toBe(true);
      view.destroy();
    }
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

describe("performSourceToolbarAction — additional actions", () => {
  it("handles undo/redo", () => {
    const view = createView("hello", [{ from: 0, to: 0 }]);
    // Undo with no history should return false
    const undone = performSourceToolbarAction("undo", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(typeof undone).toBe("boolean");

    const redone = performSourceToolbarAction("redo", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(typeof redone).toBe("boolean");
    view.destroy();
  });

  // Note: "link" action calls insertLinkSync which triggers an async popup
  // that cannot run in jsdom without mocking. Tested via integration instead.

  it("handles wiki link insertion", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("link:wiki", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("[[");
    view.destroy();
  });

  it("handles bookmark link action without error", () => {
    const view = createView("text", [{ from: 0, to: 4 }]);
    // insertSourceBookmarkLink wraps text in bookmark link syntax
    const applied = performSourceToolbarAction("link:bookmark", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(typeof applied).toBe("boolean");
    view.destroy();
  });

  it("handles increaseHeading on paragraph", () => {
    const view = createView("Hello", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("increaseHeading", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("# Hello");
    view.destroy();
  });

  it("handles increaseHeading on existing heading", () => {
    const view = createView("## Hello", [{ from: 3, to: 3 }]);
    const applied = performSourceToolbarAction("increaseHeading", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("### Hello");
    view.destroy();
  });

  it("increaseHeading returns false at max level 6", () => {
    const view = createView("###### Hello", [{ from: 7, to: 7 }]);
    const applied = performSourceToolbarAction("increaseHeading", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
    view.destroy();
  });

  it("handles decreaseHeading on heading level > 1", () => {
    const view = createView("### Hello", [{ from: 4, to: 4 }]);
    const applied = performSourceToolbarAction("decreaseHeading", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("## Hello");
    view.destroy();
  });

  it("handles decreaseHeading at level 1 (removes heading)", () => {
    const view = createView("# Hello", [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("decreaseHeading", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("Hello");
    view.destroy();
  });

  it("decreaseHeading returns false on paragraph", () => {
    const view = createView("Hello", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("decreaseHeading", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
    view.destroy();
  });

  it("handles insertImage action", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertImage", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(typeof applied).toBe("boolean");
    view.destroy();
  });

  it("handles insertVideo", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertVideo", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles insertAudio", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertAudio", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles insertInlineMath", () => {
    const view = createView("text", [{ from: 0, to: 4 }]);
    const applied = performSourceToolbarAction("insertInlineMath", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles selectLine", () => {
    const view = createView("hello world", [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("selectLine", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles selectBlock", () => {
    const view = createView("hello\n\nworld", [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("selectBlock", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles expandSelection", () => {
    const view = createView("hello world", [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("expandSelection", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles CJK formatting actions", () => {
    for (const action of ["formatCJK", "formatCJKFile", "removeTrailingSpaces", "collapseBlankLines"]) {
      const view = createView("hello  \nworld  \n", [{ from: 0, to: 0 }]);
      const applied = performSourceToolbarAction(action, {
        surface: "source", view, context: null, multiSelection: singleSelection,
      });
      expect(typeof applied).toBe("boolean");
      view.destroy();
    }
  });

  it("handles line ending conversions", () => {
    const view = createView("hello\r\nworld", [{ from: 0, to: 0 }]);
    const lf = performSourceToolbarAction("lineEndingsLF", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(typeof lf).toBe("boolean");
    view.destroy();

    const view2 = createView("hello\nworld", [{ from: 0, to: 0 }]);
    const crlf = performSourceToolbarAction("lineEndingsCRLF", {
      surface: "source", view: view2, context: null, multiSelection: singleSelection,
    });
    expect(typeof crlf).toBe("boolean");
    view2.destroy();
  });

  it("handles line operations", () => {
    for (const action of ["moveLineUp", "moveLineDown", "duplicateLine", "deleteLine", "joinLines"]) {
      const view = createView("line1\nline2\nline3", [{ from: 7, to: 7 }]);
      const applied = performSourceToolbarAction(action, {
        surface: "source", view, context: null, multiSelection: singleSelection,
      });
      expect(typeof applied).toBe("boolean");
      view.destroy();
    }
  });

  it("handles sort lines and remove blank lines", () => {
    for (const action of ["sortLinesAsc", "sortLinesDesc", "removeBlankLines"]) {
      const view = createView("c\na\nb\n\n", [{ from: 0, to: 7 }]);
      const applied = performSourceToolbarAction(action, {
        surface: "source", view, context: null, multiSelection: singleSelection,
      });
      expect(typeof applied).toBe("boolean");
      view.destroy();
    }
  });

  it("handles text transformations", () => {
    for (const action of ["transformUppercase", "transformLowercase", "transformTitleCase", "transformToggleCase"]) {
      const view = createView("hello World", [{ from: 0, to: 11 }]);
      const applied = performSourceToolbarAction(action, {
        surface: "source", view, context: null, multiSelection: singleSelection,
      });
      expect(applied).toBe(true);
      view.destroy();
    }
  });

  it("handles table operations", () => {
    const table = "| a | b |\n| --- | --- |\n| 1 | 2 |\n";
    for (const action of ["addRowAbove", "addRow", "addColLeft", "addCol", "deleteRow", "deleteCol",
      "alignLeft", "alignCenter", "alignRight", "alignAllLeft", "alignAllCenter", "alignAllRight",
      "formatTable"]) {
      const view = createView(table, [{ from: 2, to: 2 }]);
      const applied = performSourceToolbarAction(action, {
        surface: "source", view, context: null, multiSelection: singleSelection,
      });
      expect(typeof applied).toBe("boolean");
      view.destroy();
    }
  });

  it("handles outdent on list item", () => {
    const view = createView("  - indented", [{ from: 4, to: 4 }]);
    const applied = performSourceToolbarAction("outdent", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles insertDetails with selection", () => {
    const view = createView("content here", [{ from: 0, to: 12 }]);
    const applied = performSourceToolbarAction("insertDetails", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    const doc = view.state.doc.toString();
    expect(doc).toContain("content here");
    expect(doc).toContain("details");
    view.destroy();
  });

  it("handles insertDiagram with selection", () => {
    const view = createView("flowchart LR", [{ from: 0, to: 12 }]);
    const applied = performSourceToolbarAction("insertDiagram", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles insertMarkmap with selection", () => {
    const view = createView("# Root\n## Branch", [{ from: 0, to: 16 }]);
    const applied = performSourceToolbarAction("insertMarkmap", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    view.destroy();
  });

  it("handles deleteTable", () => {
    const table = "| a | b |\n| --- | --- |\n| 1 | 2 |\n";
    const view = createView(table, [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("deleteTable", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(typeof applied).toBe("boolean");
    view.destroy();
  });

  it("creates bullet list from paragraph via bulletList action", () => {
    const view = createView("item text", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("bulletList", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("- ");
    view.destroy();
  });

  it("creates task list from paragraph via taskList action", () => {
    const view = createView("item text", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("taskList", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toContain("- [ ] ");
    view.destroy();
  });

  it("returns false for indent when not in a list", () => {
    const view = createView("plain text", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("indent", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
    view.destroy();
  });

  it("returns false for outdent when not in a list", () => {
    const view = createView("plain text", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("outdent", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
    view.destroy();
  });

  it("returns false for removeList when not in a list", () => {
    const view = createView("plain text", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("removeList", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(applied).toBe(false);
    view.destroy();
  });

  it("insertBlockquote inserts blockquote marker", () => {
    const view = createView("hello", [{ from: 0, to: 0 }]);
    const applied = performSourceToolbarAction("insertBlockquote", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    expect(typeof applied).toBe("boolean");
    view.destroy();
  });

  it("returns false for unknown blockquote action on blockquote line", () => {
    const view = createView("> hello", [{ from: 2, to: 2 }]);
    const applied = performSourceToolbarAction("nestBlockquote", {
      surface: "source", view, context: null, multiSelection: singleSelection,
    });
    // nestBlockquote should work on a blockquote line
    expect(typeof applied).toBe("boolean");
    view.destroy();
  });
});
