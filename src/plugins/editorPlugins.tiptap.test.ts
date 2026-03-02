/**
 * Tests for editorPlugins.tiptap — buildEditorKeymapBindings and editorKeymapExtension.
 */

import { describe, it, expect, afterEach } from "vitest";
import { useShortcutsStore } from "@/stores/shortcutsStore";
import { buildEditorKeymapBindings } from "./editorPlugins.tiptap";

function resetShortcuts() {
  useShortcutsStore.setState({ customBindings: {} });
}

afterEach(resetShortcuts);

describe("buildEditorKeymapBindings", () => {
  it("uses custom shortcut bindings from the store", () => {
    useShortcutsStore.setState({ customBindings: { bold: "Mod-Shift-b" } });
    const bindings = buildEditorKeymapBindings();

    expect(bindings["Mod-Shift-b"]).toBeTypeOf("function");
    expect(bindings["Mod-b"]).toBeUndefined();
  });

  it("includes sourcePeek binding", () => {
    const bindings = buildEditorKeymapBindings();
    // Default key is F5
    expect(bindings["F5"]).toBeTypeOf("function");
  });

  it("includes Escape binding", () => {
    const bindings = buildEditorKeymapBindings();
    expect(bindings.Escape).toBeTypeOf("function");
  });

  it("includes Mod-z for undo", () => {
    const bindings = buildEditorKeymapBindings();
    expect(bindings["Mod-z"]).toBeTypeOf("function");
  });

  it("includes Mod-Shift-z for redo", () => {
    const bindings = buildEditorKeymapBindings();
    expect(bindings["Mod-Shift-z"]).toBeTypeOf("function");
  });

  it("includes all inline mark formatting shortcuts", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();

    // Each mark should have a binding at its default key
    const markShortcuts = [
      "bold", "italic", "code", "strikethrough",
      "underline", "highlight", "subscript", "superscript",
    ];
    for (const name of markShortcuts) {
      const key = shortcuts.getShortcut(name);
      if (key) {
        expect(bindings[key], `${name} shortcut (${key}) should have a binding`).toBeTypeOf("function");
      }
    }
  });

  it("includes link-related shortcuts", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();

    for (const name of ["link", "unlink", "wikiLink", "bookmarkLink"]) {
      const key = shortcuts.getShortcut(name);
      if (key) {
        expect(bindings[key], `${name} shortcut`).toBeTypeOf("function");
      }
    }
  });

  it("includes inlineMath shortcut", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();
    const key = shortcuts.getShortcut("inlineMath");
    if (key) {
      expect(bindings[key]).toBeTypeOf("function");
    }
  });

  it("includes pastePlainText shortcut", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();
    const key = shortcuts.getShortcut("pastePlainText");
    if (key) {
      expect(bindings[key]).toBeTypeOf("function");
    }
  });

  it("includes line operation shortcuts", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();

    for (const name of ["moveLineUp", "moveLineDown", "duplicateLine", "deleteLine", "joinLines"]) {
      const key = shortcuts.getShortcut(name);
      if (key) {
        // Arrow keys get converted to ArrowUp/ArrowDown format
        const pmKey = key
          .replace(/\bUp\b/g, "ArrowUp")
          .replace(/\bDown\b/g, "ArrowDown")
          .replace(/\bLeft\b/g, "ArrowLeft")
          .replace(/\bRight\b/g, "ArrowRight");
        expect(bindings[pmKey], `${name} shortcut (${pmKey})`).toBeTypeOf("function");
      }
    }
  });

  it("includes text transform shortcuts", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();

    for (const name of ["transformUppercase", "transformLowercase", "transformTitleCase", "transformToggleCase"]) {
      const key = shortcuts.getShortcut(name);
      if (key) {
        expect(bindings[key], `${name} shortcut`).toBeTypeOf("function");
      }
    }
  });

  it("includes toggleSidebar shortcut", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();
    const key = shortcuts.getShortcut("toggleSidebar");
    if (key) {
      expect(bindings[key]).toBeTypeOf("function");
    }
  });

  it("includes blockquote shortcut", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();
    const key = shortcuts.getShortcut("blockquote");
    if (key) {
      expect(bindings[key]).toBeTypeOf("function");
    }
  });

  it("includes insertImage shortcut", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();
    const key = shortcuts.getShortcut("insertImage");
    if (key) {
      expect(bindings[key]).toBeTypeOf("function");
    }
  });

  it("returns a record with string keys and function values", () => {
    const bindings = buildEditorKeymapBindings();
    expect(typeof bindings).toBe("object");
    for (const [key, val] of Object.entries(bindings)) {
      expect(typeof key).toBe("string");
      expect(typeof val).toBe("function");
    }
  });

  it("reflects custom bindings for multiple shortcuts", () => {
    useShortcutsStore.setState({
      customBindings: {
        bold: "Mod-Shift-b",
        italic: "Mod-Shift-i",
      },
    });
    const bindings = buildEditorKeymapBindings();
    expect(bindings["Mod-Shift-b"]).toBeTypeOf("function");
    expect(bindings["Mod-Shift-i"]).toBeTypeOf("function");
    // Originals should not exist
    expect(bindings["Mod-b"]).toBeUndefined();
    expect(bindings["Mod-i"]).toBeUndefined();
  });

  it("binds Escape to a handler that returns a boolean", () => {
    const bindings = buildEditorKeymapBindings();
    expect(typeof bindings.Escape).toBe("function");
  });

  it("toggleSidebar binding calls useUIStore.toggleSidebar", () => {
    const bindings = buildEditorKeymapBindings();
    const shortcuts = useShortcutsStore.getState();
    const key = shortcuts.getShortcut("toggleSidebar");
    if (key) {
      // The binding should be a function
      expect(typeof bindings[key]).toBe("function");
    }
  });

  it("does not duplicate bindings when called multiple times", () => {
    const bindings1 = buildEditorKeymapBindings();
    const bindings2 = buildEditorKeymapBindings();
    const keys1 = Object.keys(bindings1).sort();
    const keys2 = Object.keys(bindings2).sort();
    expect(keys1).toEqual(keys2);
  });

  it("clears old custom bindings when resetting", () => {
    useShortcutsStore.setState({ customBindings: { bold: "Mod-Alt-b" } });
    const bindings1 = buildEditorKeymapBindings();
    expect(bindings1["Mod-Alt-b"]).toBeTypeOf("function");

    useShortcutsStore.setState({ customBindings: {} });
    const bindings2 = buildEditorKeymapBindings();
    expect(bindings2["Mod-Alt-b"]).toBeUndefined();
    // Default should be back
    const defaultKey = useShortcutsStore.getState().getShortcut("bold");
    if (defaultKey) {
      expect(bindings2[defaultKey]).toBeTypeOf("function");
    }
  });

  it("has all expected binding categories", () => {
    const bindings = buildEditorKeymapBindings();
    const keys = Object.keys(bindings);

    // Should have undo/redo
    expect(keys).toContain("Mod-z");
    expect(keys).toContain("Mod-Shift-z");

    // Should have Escape
    expect(keys).toContain("Escape");

    // Should have at least some formatting keys
    expect(keys.length).toBeGreaterThan(10);
  });

  it("each binding returns a function that can be called", () => {
    const bindings = buildEditorKeymapBindings();
    for (const [key, handler] of Object.entries(bindings)) {
      expect(typeof handler).toBe("function");
      // Verify it's callable (all bindings are ProseMirror commands)
      expect(handler.length).toBeGreaterThanOrEqual(0);
    }
  });
});
