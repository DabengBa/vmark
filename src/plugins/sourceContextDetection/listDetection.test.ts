/**
 * Tests for listDetection — list item detection, conversion, and block bounds
 * in source mode.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// Mock settingsStore
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({ general: { tabSize: 2 } }),
  },
}));

import {
  getListItemInfo,
  indentListItem,
  outdentListItem,
  toBulletList,
  toOrderedList,
  toTaskList,
  removeList,
  getListBlockBounds,
  type ListItemInfo,
} from "./listDetection";

function createView(doc: string, pos?: number): EditorView {
  const parent = document.createElement("div");
  const selection = pos !== undefined
    ? EditorSelection.cursor(pos)
    : EditorSelection.cursor(0);
  const state = EditorState.create({ doc, selection });
  return new EditorView({ state, parent });
}

describe("getListItemInfo", () => {
  describe("bullet lists", () => {
    it("detects dash bullet item", () => {
      const view = createView("- item 1", 2);
      const info = getListItemInfo(view);
      expect(info).not.toBeNull();
      expect(info!.type).toBe("bullet");
      expect(info!.marker).toBe("- ");
      expect(info!.indent).toBe(0);
      expect(info!.number).toBeNull();
      expect(info!.checked).toBeNull();
    });

    it("detects asterisk bullet item", () => {
      const view = createView("* item 1", 2);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("bullet");
      expect(info!.marker).toBe("* ");
      view.destroy();
    });

    it("detects plus bullet item", () => {
      const view = createView("+ item 1", 2);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("bullet");
      expect(info!.marker).toBe("+ ");
      view.destroy();
    });

    it("detects indented bullet item", () => {
      const view = createView("  - nested item", 4);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("bullet");
      expect(info!.indent).toBe(1); // 2 spaces / tabSize 2
      view.destroy();
    });

    it("detects deeply nested bullet (5 levels)", () => {
      const view = createView("          - deep", 12);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("bullet");
      expect(info!.indent).toBe(5); // 10 spaces / tabSize 2
      view.destroy();
    });
  });

  describe("ordered lists", () => {
    it("detects ordered list item", () => {
      const view = createView("1. first", 3);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("ordered");
      expect(info!.number).toBe(1);
      expect(info!.marker).toBe("1. ");
      view.destroy();
    });

    it("detects multi-digit ordered list item", () => {
      const view = createView("123. item", 5);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("ordered");
      expect(info!.number).toBe(123);
      view.destroy();
    });

    it("detects indented ordered list item", () => {
      const view = createView("    1. nested ordered", 6);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("ordered");
      expect(info!.indent).toBe(2); // 4 spaces / tabSize 2
      view.destroy();
    });
  });

  describe("task lists", () => {
    it("detects unchecked task item", () => {
      const view = createView("- [ ] todo", 6);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("task");
      expect(info!.checked).toBe(false);
      expect(info!.marker).toBe("- [ ] ");
      view.destroy();
    });

    it("detects checked task item (lowercase x)", () => {
      const view = createView("- [x] done", 6);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("task");
      expect(info!.checked).toBe(true);
      view.destroy();
    });

    it("detects checked task item (uppercase X)", () => {
      const view = createView("- [X] done", 6);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("task");
      expect(info!.checked).toBe(true);
      view.destroy();
    });

    it("detects task with asterisk marker", () => {
      const view = createView("* [ ] task", 6);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("task");
      view.destroy();
    });

    it("detects task with plus marker", () => {
      const view = createView("+ [x] task", 6);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("task");
      expect(info!.checked).toBe(true);
      view.destroy();
    });

    it("detects indented task list item", () => {
      const view = createView("  - [ ] nested task", 8);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("task");
      expect(info!.indent).toBe(1);
      view.destroy();
    });
  });

  describe("non-list lines", () => {
    it("returns null for plain paragraph", () => {
      const view = createView("Hello world", 3);
      const info = getListItemInfo(view);
      expect(info).toBeNull();
      view.destroy();
    });

    it("returns null for heading", () => {
      const view = createView("# Heading", 3);
      const info = getListItemInfo(view);
      expect(info).toBeNull();
      view.destroy();
    });

    it("returns null for empty line", () => {
      const view = createView("", 0);
      const info = getListItemInfo(view);
      expect(info).toBeNull();
      view.destroy();
    });

    it("returns null for blockquote", () => {
      const view = createView("> quote", 3);
      const info = getListItemInfo(view);
      expect(info).toBeNull();
      view.destroy();
    });
  });

  describe("explicit position parameter", () => {
    it("uses provided position instead of selection", () => {
      const view = createView("plain text\n- item", 3);
      // cursor at position 3 in "plain text", but we specify pos in "- item"
      const info = getListItemInfo(view, 12);
      expect(info).not.toBeNull();
      expect(info!.type).toBe("bullet");
      view.destroy();
    });
  });

  describe("CJK content", () => {
    it("detects list with CJK content", () => {
      const view = createView("- 你好世界", 2);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("bullet");
      view.destroy();
    });

    it("detects task list with CJK content", () => {
      const view = createView("- [ ] 中文任务", 6);
      const info = getListItemInfo(view);
      expect(info!.type).toBe("task");
      view.destroy();
    });
  });

  describe("lineStart/lineEnd/contentStart positions", () => {
    it("reports correct positions for bullet item", () => {
      const view = createView("- content", 2);
      const info = getListItemInfo(view);
      expect(info!.lineStart).toBe(0);
      expect(info!.lineEnd).toBe(9);
      expect(info!.contentStart).toBe(2); // after "- "
      view.destroy();
    });

    it("reports correct positions on second line", () => {
      const view = createView("line one\n- item two", 10);
      const info = getListItemInfo(view);
      expect(info!.lineStart).toBe(9);
      expect(info!.contentStart).toBe(11); // 9 + "- ".length
      view.destroy();
    });
  });
});

describe("indentListItem", () => {
  it("adds indent spaces to a list item", () => {
    const view = createView("- item", 2);
    const info = getListItemInfo(view)!;
    indentListItem(view, info);
    expect(view.state.doc.toString()).toBe("  - item");
    view.destroy();
  });
});

describe("outdentListItem", () => {
  it("removes indent spaces from a list item", () => {
    const view = createView("  - item", 4);
    const info = getListItemInfo(view)!;
    outdentListItem(view, info);
    expect(view.state.doc.toString()).toBe("- item");
    view.destroy();
  });

  it("does nothing when no indentation to remove", () => {
    const view = createView("- item", 2);
    const info = getListItemInfo(view)!;
    outdentListItem(view, info);
    expect(view.state.doc.toString()).toBe("- item");
    view.destroy();
  });
});

describe("toBulletList", () => {
  it("converts ordered list to bullet", () => {
    const view = createView("1. item", 3);
    const info = getListItemInfo(view)!;
    toBulletList(view, info);
    expect(view.state.doc.toString()).toBe("- item");
    view.destroy();
  });

  it("converts task list to bullet", () => {
    const view = createView("- [ ] item", 6);
    const info = getListItemInfo(view)!;
    toBulletList(view, info);
    expect(view.state.doc.toString()).toBe("- item");
    view.destroy();
  });

  it("does nothing if already bullet", () => {
    const view = createView("- item", 2);
    const info = getListItemInfo(view)!;
    toBulletList(view, info);
    expect(view.state.doc.toString()).toBe("- item");
    view.destroy();
  });

  it("preserves indentation", () => {
    const view = createView("  1. indented", 5);
    const info = getListItemInfo(view)!;
    toBulletList(view, info);
    expect(view.state.doc.toString()).toBe("  - indented");
    view.destroy();
  });
});

describe("toOrderedList", () => {
  it("converts bullet list to ordered", () => {
    const view = createView("- item", 2);
    const info = getListItemInfo(view)!;
    toOrderedList(view, info);
    expect(view.state.doc.toString()).toBe("1. item");
    view.destroy();
  });

  it("converts task list to ordered", () => {
    const view = createView("- [x] done", 6);
    const info = getListItemInfo(view)!;
    toOrderedList(view, info);
    expect(view.state.doc.toString()).toBe("1. done");
    view.destroy();
  });

  it("does nothing if already ordered", () => {
    const view = createView("1. item", 3);
    const info = getListItemInfo(view)!;
    toOrderedList(view, info);
    expect(view.state.doc.toString()).toBe("1. item");
    view.destroy();
  });
});

describe("toTaskList", () => {
  it("converts bullet list to task", () => {
    const view = createView("- item", 2);
    const info = getListItemInfo(view)!;
    toTaskList(view, info);
    expect(view.state.doc.toString()).toBe("- [ ] item");
    view.destroy();
  });

  it("converts ordered list to task", () => {
    const view = createView("1. item", 3);
    const info = getListItemInfo(view)!;
    toTaskList(view, info);
    expect(view.state.doc.toString()).toBe("- [ ] item");
    view.destroy();
  });

  it("does nothing if already task", () => {
    const view = createView("- [ ] item", 6);
    const info = getListItemInfo(view)!;
    toTaskList(view, info);
    expect(view.state.doc.toString()).toBe("- [ ] item");
    view.destroy();
  });
});

describe("removeList", () => {
  it("removes bullet list formatting", () => {
    const view = createView("- item", 2);
    const info = getListItemInfo(view)!;
    removeList(view, info);
    expect(view.state.doc.toString()).toBe("item");
    view.destroy();
  });

  it("removes ordered list formatting", () => {
    const view = createView("1. item", 3);
    const info = getListItemInfo(view)!;
    removeList(view, info);
    expect(view.state.doc.toString()).toBe("item");
    view.destroy();
  });

  it("removes task list formatting", () => {
    const view = createView("- [ ] item", 6);
    const info = getListItemInfo(view)!;
    removeList(view, info);
    expect(view.state.doc.toString()).toBe("item");
    view.destroy();
  });
});

describe("getListBlockBounds", () => {
  it("returns bounds for a single list item", () => {
    const view = createView("- item", 2);
    const bounds = getListBlockBounds(view);
    expect(bounds).not.toBeNull();
    expect(bounds!.from).toBe(0);
    expect(bounds!.to).toBe(6);
    view.destroy();
  });

  it("returns bounds for contiguous list items", () => {
    const view = createView("- item 1\n- item 2\n- item 3", 2);
    const bounds = getListBlockBounds(view);
    expect(bounds!.from).toBe(0);
    expect(bounds!.to).toBe(26);
    view.destroy();
  });

  it("includes blank lines between list items (loose list)", () => {
    const view = createView("- item 1\n\n- item 2", 2);
    const bounds = getListBlockBounds(view);
    expect(bounds!.from).toBe(0);
    expect(bounds!.to).toBe(18);
    view.destroy();
  });

  it("returns null for non-list line", () => {
    const view = createView("Hello world", 3);
    const bounds = getListBlockBounds(view);
    expect(bounds).toBeNull();
    view.destroy();
  });

  it("returns null for horizontal rule (---)", () => {
    const view = createView("---", 1);
    const bounds = getListBlockBounds(view);
    expect(bounds).toBeNull();
    view.destroy();
  });

  it("returns null for horizontal rule (***)", () => {
    const view = createView("***", 1);
    const bounds = getListBlockBounds(view);
    expect(bounds).toBeNull();
    view.destroy();
  });

  it("returns null for horizontal rule (___)", () => {
    const view = createView("___", 1);
    const bounds = getListBlockBounds(view);
    expect(bounds).toBeNull();
    view.destroy();
  });

  it("stops at non-list content above", () => {
    const view = createView("paragraph\n- item 1\n- item 2", 12);
    const bounds = getListBlockBounds(view);
    expect(bounds!.from).toBe(10); // start of "- item 1"
    view.destroy();
  });

  it("stops at non-list content below", () => {
    const view = createView("- item 1\n- item 2\nparagraph", 2);
    const bounds = getListBlockBounds(view);
    expect(bounds!.to).toBe(17); // end of "- item 2"
    view.destroy();
  });

  it("trims trailing blank lines from block", () => {
    const view = createView("- item 1\n\nsome text", 2);
    const bounds = getListBlockBounds(view);
    // Should not include trailing blank line because "some text" is not a list
    expect(bounds!.to).toBe(8);
    view.destroy();
  });

  it("handles mixed list types", () => {
    const view = createView("- bullet\n1. ordered\n* another", 2);
    const bounds = getListBlockBounds(view);
    expect(bounds!.from).toBe(0);
    expect(bounds!.to).toBe(29);
    view.destroy();
  });

  it("handles cursor at position 0", () => {
    const view = createView("- item", 0);
    const bounds = getListBlockBounds(view);
    expect(bounds).not.toBeNull();
    view.destroy();
  });
});
