/**
 * Tests for sourceFootnoteActions — footnote CRUD in Source mode (CodeMirror 6).
 *
 * Covers:
 *   - findFootnoteDefinition / findFootnoteDefinitionAtPos
 *   - findFootnoteReferences / findFootnoteReference
 *   - saveFootnoteContent / gotoFootnoteTarget / removeFootnote
 *   - Multi-line continuation scanning
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// Mock stores and utils
const mockGetState = vi.fn();
vi.mock("@/stores/footnotePopupStore", () => ({
  useFootnotePopupStore: { getState: () => mockGetState() },
}));

vi.mock("@/utils/imeGuard", () => ({
  runOrQueueCodeMirrorAction: vi.fn((_view: unknown, action: () => void) => action()),
}));

vi.mock("@/utils/debug", () => ({
  sourcePopupWarn: vi.fn(),
}));

import {
  findFootnoteDefinition,
  findFootnoteDefinitionAtPos,
  findFootnoteReferences,
  findFootnoteReference,
  saveFootnoteContent,
  gotoFootnoteTarget,
  removeFootnote,
} from "./sourceFootnoteActions";

function createView(doc: string): EditorView {
  const parent = document.createElement("div");
  const state = EditorState.create({ doc });
  return new EditorView({ state, parent });
}

describe("sourceFootnoteActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findFootnoteDefinition", () => {
    it("finds a simple definition", () => {
      const view = createView("Some text\n\n[^1]: This is a footnote");
      const result = findFootnoteDefinition(view, "1");
      expect(result).not.toBeNull();
      expect(result!.content).toBe("This is a footnote");
      view.destroy();
    });

    it("returns null when label not found", () => {
      const view = createView("No footnotes here");
      const result = findFootnoteDefinition(view, "missing");
      expect(result).toBeNull();
      view.destroy();
    });

    it("finds multi-line definition with continuation lines", () => {
      const view = createView("[^note]: First line\n  Second line\n  Third line\n\nOther text");
      const result = findFootnoteDefinition(view, "note");
      expect(result).not.toBeNull();
      expect(result!.content).toBe("First line\nSecond line\nThird line");
      view.destroy();
    });

    it("finds multi-line definition with tab-indented continuation", () => {
      const view = createView("[^note]: First line\n\tSecond line");
      const result = findFootnoteDefinition(view, "note");
      expect(result).not.toBeNull();
      expect(result!.content).toBe("First line\nSecond line");
      view.destroy();
    });

    it("stops at non-continuation line", () => {
      const view = createView("[^note]: First line\nNot indented");
      const result = findFootnoteDefinition(view, "note");
      expect(result).not.toBeNull();
      expect(result!.content).toBe("First line");
      view.destroy();
    });
  });

  describe("findFootnoteDefinitionAtPos", () => {
    it("finds definition at exact position", () => {
      const view = createView("[^1]: Definition text");
      const result = findFootnoteDefinitionAtPos(view, 0);
      expect(result).not.toBeNull();
      expect(result!.label).toBe("1");
      expect(result!.content).toBe("Definition text");
      view.destroy();
    });

    it("finds definition from continuation line position", () => {
      const view = createView("[^1]: First line\n  Continuation");
      // Position in the continuation line
      const contPos = "[^1]: First line\n  ".length;
      const result = findFootnoteDefinitionAtPos(view, contPos);
      expect(result).not.toBeNull();
      expect(result!.label).toBe("1");
      expect(result!.content).toContain("Continuation");
      view.destroy();
    });

    it("returns null for non-definition non-continuation line", () => {
      const view = createView("Regular text");
      const result = findFootnoteDefinitionAtPos(view, 0);
      expect(result).toBeNull();
      view.destroy();
    });

    it("returns null when scanning up finds no definition before non-continuation", () => {
      const view = createView("Not a def\n  Indented but orphan");
      const contPos = "Not a def\n  ".length;
      const result = findFootnoteDefinitionAtPos(view, contPos);
      expect(result).toBeNull();
      view.destroy();
    });
  });

  describe("findFootnoteReferences", () => {
    it("finds all references in document", () => {
      const view = createView("See [^1] and [^1] again.\n\n[^1]: Def");
      const refs = findFootnoteReferences(view, "1");
      expect(refs).toHaveLength(2);
      view.destroy();
    });

    it("does not match definition line as reference", () => {
      const view = createView("[^1]: Only a definition");
      const refs = findFootnoteReferences(view, "1");
      expect(refs).toHaveLength(0);
      view.destroy();
    });

    it("returns empty array when no references found", () => {
      const view = createView("No footnotes");
      const refs = findFootnoteReferences(view, "1");
      expect(refs).toHaveLength(0);
      view.destroy();
    });
  });

  describe("findFootnoteReference", () => {
    it("returns first reference", () => {
      const view = createView("See [^abc] here");
      const ref = findFootnoteReference(view, "abc");
      expect(ref).not.toBeNull();
      expect(ref!.from).toBe(4);
      view.destroy();
    });

    it("returns null when no references", () => {
      const view = createView("No refs");
      const ref = findFootnoteReference(view, "abc");
      expect(ref).toBeNull();
      view.destroy();
    });
  });

  describe("saveFootnoteContent", () => {
    it("updates definition content in document", () => {
      const view = createView("[^1]: Old content\n\nSome text");
      mockGetState.mockReturnValue({
        content: "New content",
        definitionPos: 0,
        label: "1",
      });
      saveFootnoteContent(view);
      expect(view.state.doc.toString()).toBe("[^1]: New content\n\nSome text");
      view.destroy();
    });

    it("does nothing when definitionPos is null", () => {
      const view = createView("[^1]: Content");
      mockGetState.mockReturnValue({
        content: "New",
        definitionPos: null,
        label: "1",
      });
      saveFootnoteContent(view);
      expect(view.state.doc.toString()).toBe("[^1]: Content");
      view.destroy();
    });

    it("does nothing when label is empty", () => {
      const view = createView("[^1]: Content");
      mockGetState.mockReturnValue({
        content: "New",
        definitionPos: 0,
        label: "",
      });
      saveFootnoteContent(view);
      expect(view.state.doc.toString()).toBe("[^1]: Content");
      view.destroy();
    });

    it("falls back to findFootnoteDefinition by label when pos lookup fails", () => {
      const view = createView("Some text\n[^1]: Old content");
      mockGetState.mockReturnValue({
        content: "Updated",
        definitionPos: 0, // points to "Some text" line (not a definition)
        label: "1",
      });
      saveFootnoteContent(view);
      expect(view.state.doc.toString()).toContain("[^1]: Updated");
      view.destroy();
    });
  });

  describe("gotoFootnoteTarget", () => {
    it("scrolls to definition when opened on reference", () => {
      const view = createView("See [^1]\n\n[^1]: Definition");
      mockGetState.mockReturnValue({
        definitionPos: 10,
        referencePos: 4,
      });
      gotoFootnoteTarget(view, true);
      expect(view.state.selection.main.anchor).toBe(10);
      view.destroy();
    });

    it("scrolls to reference when opened on definition", () => {
      const view = createView("See [^1]\n\n[^1]: Definition");
      mockGetState.mockReturnValue({
        definitionPos: 10,
        referencePos: 4,
      });
      gotoFootnoteTarget(view, false);
      expect(view.state.selection.main.anchor).toBe(4);
      view.destroy();
    });

    it("does nothing when target pos is null", () => {
      const view = createView("Text");
      mockGetState.mockReturnValue({
        definitionPos: null,
        referencePos: null,
      });
      const origAnchor = view.state.selection.main.anchor;
      gotoFootnoteTarget(view, true);
      expect(view.state.selection.main.anchor).toBe(origAnchor);
      view.destroy();
    });
  });

  describe("removeFootnote", () => {
    it("removes reference and definition", () => {
      const view = createView("See [^1] here.\n\n[^1]: Definition");
      mockGetState.mockReturnValue({
        label: "1",
        definitionPos: 16,
        referencePos: 4,
      });
      removeFootnote(view);
      const result = view.state.doc.toString();
      expect(result).not.toContain("[^1]");
      expect(result).not.toContain("Definition");
      view.destroy();
    });

    it("does nothing when label is empty", () => {
      const view = createView("See [^1]");
      mockGetState.mockReturnValue({
        label: "",
        definitionPos: null,
        referencePos: null,
      });
      removeFootnote(view);
      expect(view.state.doc.toString()).toBe("See [^1]");
      view.destroy();
    });

    it("does nothing when no references found", () => {
      const view = createView("No refs\n\n[^1]: Definition");
      mockGetState.mockReturnValue({
        label: "missing",
        definitionPos: null,
        referencePos: null,
      });
      removeFootnote(view);
      // Document unchanged - no references for "missing"
      expect(view.state.doc.toString()).toBe("No refs\n\n[^1]: Definition");
      view.destroy();
    });

    it("handles special regex characters in label", () => {
      const view = createView("See [^a.b] here.\n\n[^a.b]: Definition");
      mockGetState.mockReturnValue({
        label: "a.b",
        definitionPos: 18,
        referencePos: 4,
      });
      removeFootnote(view);
      const result = view.state.doc.toString();
      expect(result).not.toContain("[^a.b]");
      view.destroy();
    });
  });
});
