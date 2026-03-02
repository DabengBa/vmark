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

// ---------------------------------------------------------------------------
// Helpers for plugin update tests
// ---------------------------------------------------------------------------

/**
 * Build a minimal EditorView with the auto-pair plugin installed,
 * appended to document.body so `dom.isConnected` is true.
 */
function createPluginView(initialDoc = ""): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const plugin = createMarkdownAutoPairPlugin();
  const state = EditorState.create({
    doc: initialDoc,
    extensions: [plugin],
  });
  return new EditorView({ state, parent });
}

/**
 * Simulate a single user-input.type transaction: insert `text` at `pos`,
 * replacing [pos, pos+deleteCount].
 */
function typeChar(view: EditorView, text: string, at?: number, deleteCount = 0): void {
  const pos = at ?? view.state.selection.main.head;
  view.dispatch({
    changes: { from: pos, to: pos + deleteCount, insert: text },
    selection: { anchor: pos + text.length },
    userEvent: "input.type",
  });
}

describe("createMarkdownAutoPairPlugin — handleAlwaysDoubleChar (=)", () => {
  let view: EditorView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsCodeMirrorComposing.mockReturnValue(false);
  });

  afterEach(() => {
    view?.destroy();
    vi.useRealTimers();
  });

  it("inserts closing == after typing second =", async () => {
    view = createPluginView("=");
    // cursor is at pos 1 after "="
    // Now type second "=" to complete "=="
    typeChar(view, "=", 1);
    // The insertClosingPair runs in setTimeout(0)
    await vi.runAllTimersAsync();
    // doc should now be "====" (opening == + closing ==)
    expect(view.state.doc.toString()).toBe("====");
  });

  it("does nothing when first = is typed (no preceding =)", () => {
    view = createPluginView("");
    typeChar(view, "=", 0);
    vi.runAllTimers();
    // Only one = — no closing pair added
    expect(view.state.doc.toString()).toBe("=");
  });
});

describe("createMarkdownAutoPairPlugin — handleDelayChar (*, ~, _)", () => {
  let view: EditorView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsCodeMirrorComposing.mockReturnValue(false);
  });

  afterEach(() => {
    view?.destroy();
    vi.useRealTimers();
  });

  it("inserts single closing char after delay expires", async () => {
    view = createPluginView("");
    typeChar(view, "*", 0);
    // Advance past 150ms delay
    vi.advanceTimersByTime(200);
    // The timeout fires — cursor should still be at pos 1
    await Promise.resolve();
    // Now closing * should be inserted
    expect(view.state.doc.toString()).toBe("**");
  });

  it("inserts double closing chars when second char typed quickly", async () => {
    view = createPluginView("");
    typeChar(view, "*", 0);
    // Type second * before delay expires
    typeChar(view, "*", 1);
    await vi.runAllTimersAsync();
    // Double close: **|** → doc = "****"
    expect(view.state.doc.toString()).toBe("****");
  });

  it("cancels pending pair when different delay char typed", async () => {
    view = createPluginView("");
    typeChar(view, "*", 0);
    // Type ~ before * delay expires — cancels * pending, starts ~ pending
    typeChar(view, "~", 1);
    vi.advanceTimersByTime(200);
    await Promise.resolve();
    // ~ timeout fires (cursor at pos 2), inserts single ~
    expect(view.state.doc.toString()).toBe("*~~");
  });

  it("handles ~ delay char pair", async () => {
    view = createPluginView("");
    typeChar(view, "~", 0);
    vi.advanceTimersByTime(200);
    await Promise.resolve();
    expect(view.state.doc.toString()).toBe("~~");
  });

  it("handles _ delay char pair", async () => {
    view = createPluginView("");
    typeChar(view, "_", 0);
    vi.advanceTimersByTime(200);
    await Promise.resolve();
    expect(view.state.doc.toString()).toBe("__");
  });
});

describe("createMarkdownAutoPairPlugin — handleBacktick", () => {
  let view: EditorView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsCodeMirrorComposing.mockReturnValue(false);
  });

  afterEach(() => {
    view?.destroy();
    vi.useRealTimers();
  });

  it("inserts closing backtick after delay for single backtick", async () => {
    view = createPluginView("");
    typeChar(view, "`", 0);
    vi.advanceTimersByTime(200);
    await Promise.resolve();
    expect(view.state.doc.toString()).toBe("``");
  });

  it("cancels single pair when second backtick typed (double backtick)", async () => {
    view = createPluginView("");
    typeChar(view, "`", 0);
    // Second backtick at pos 1 — this should cancel the pending single pair
    typeChar(view, "`", 1);
    vi.advanceTimersByTime(200);
    await Promise.resolve();
    // No closing backtick added for double `` (only triple inserts code fence)
    expect(view.state.doc.toString()).toBe("``");
  });

  it("inserts code fence for triple backtick at start of line", async () => {
    view = createPluginView("``");
    // Cursor at 2, type third ` to make ```
    typeChar(view, "`", 2);
    await vi.runAllTimersAsync();
    // Should add "\n\n```" after the ```
    expect(view.state.doc.toString()).toBe("```\n\n```");
  });

  it("does not insert code fence for triple backtick when preceded by text", async () => {
    view = createPluginView("text``");
    typeChar(view, "`", 6);
    await vi.runAllTimersAsync();
    // The line has "text" before ```, so no fence
    expect(view.state.doc.toString()).toBe("text```");
  });
});

describe("createMarkdownAutoPairPlugin — composing guard", () => {
  let view: EditorView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    view?.destroy();
    vi.useRealTimers();
  });

  it("skips update when composing", async () => {
    mockIsCodeMirrorComposing.mockReturnValue(true);
    view = createPluginView("");
    typeChar(view, "*", 0);
    vi.advanceTimersByTime(200);
    await Promise.resolve();
    // No closing pair because composing was active
    expect(view.state.doc.toString()).toBe("*");
  });
});

describe("createMarkdownAutoPairPlugin — safeDispatch failure paths", () => {
  let view: EditorView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsCodeMirrorComposing.mockReturnValue(false);
  });

  afterEach(() => {
    view?.destroy();
    vi.useRealTimers();
  });

  it("safeDispatch returns false when view is composing at dispatch time", async () => {
    view = createPluginView("");
    typeChar(view, "*", 0);
    // Make composing return true when the timeout fires
    mockIsCodeMirrorComposing.mockReturnValue(true);
    vi.advanceTimersByTime(200);
    await Promise.resolve();
    // No pair inserted because composing was true at dispatch time
    expect(view.state.doc.toString()).toBe("*");
  });

  it("safeDispatch returns false and does not throw for disconnected view", async () => {
    view = createPluginView("");
    typeChar(view, "*", 0);
    // Destroy view before timeout fires — dom.isConnected becomes false
    view.destroy();
    // Should not throw
    vi.advanceTimersByTime(200);
    await Promise.resolve();
  });
});

describe("createMarkdownAutoPairPlugin — destroy with pending timeout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsCodeMirrorComposing.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears pending timeout on destroy", async () => {
    const view = createPluginView("");
    typeChar(view, "*", 0);
    // Destroy while timeout is still pending
    view.destroy();
    // Advance timers — no error or spurious dispatch
    vi.advanceTimersByTime(500);
    await Promise.resolve();
  });
});
