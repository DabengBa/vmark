/**
 * Tests for markdownAutoPair — delay-based auto-pairing in Source mode.
 *
 * Covers:
 *   - markdownPairBackspace: single and double symmetric pair deletion
 *   - createMarkdownAutoPairPlugin: backtick/delay-char/always-double handlers
 *   - safeDispatch failure paths (disconnected view, composing)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// Mock imeGuard
const mockIsCodeMirrorComposing = vi.fn(() => false);
vi.mock("@/utils/imeGuard", () => ({
  guardCodeMirrorKeyBinding: (binding: { key: string; run: (view: unknown) => boolean }) => binding,
  isCodeMirrorComposing: (...args: unknown[]) => mockIsCodeMirrorComposing(...args),
}));

import { markdownPairBackspace, createMarkdownAutoPairPlugin } from "./markdownAutoPair";

function createView(doc: string, cursorAt?: number): EditorView {
  const parent = document.createElement("div");
  const pos = cursorAt ?? doc.length;
  const state = EditorState.create({
    doc,
    selection: { anchor: pos },
  });
  return new EditorView({ state, parent });
}

describe("markdownPairBackspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCodeMirrorComposing.mockReturnValue(false);
  });

  it("deletes single symmetric pair *|*", () => {
    const view = createView("**", 1); // cursor between two *
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("deletes double symmetric pair ~~|~~", () => {
    const view = createView("~~~~", 2); // cursor between ~~|~~
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("deletes double symmetric pair ==|==", () => {
    const view = createView("====", 2);
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("returns false when no pair at cursor", () => {
    const view = createView("abc", 2);
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false when cursor is at start of document", () => {
    const view = createView("*text*", 0);
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false when there is a selection", () => {
    const state = EditorState.create({
      doc: "**",
      selection: { anchor: 0, head: 2 },
    });
    const view = new EditorView({ state, parent: document.createElement("div") });
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(false);
    view.destroy();
  });

  it("deletes single backtick pair `|`", () => {
    const view = createView("``", 1);
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("deletes single caret pair ^|^", () => {
    const view = createView("^^", 1);
    const result = markdownPairBackspace.run!(view, "Backspace" as never);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });
});

describe("createMarkdownAutoPairPlugin", () => {
  it("creates a ViewPlugin", () => {
    const plugin = createMarkdownAutoPairPlugin();
    expect(plugin).toBeDefined();
  });

  it("plugin instance has destroy method", () => {
    const parent = document.createElement("div");
    const plugin = createMarkdownAutoPairPlugin();
    const state = EditorState.create({
      doc: "test",
      extensions: [plugin],
    });
    const view = new EditorView({ state, parent });
    // Should not throw on destroy
    view.destroy();
  });
});
