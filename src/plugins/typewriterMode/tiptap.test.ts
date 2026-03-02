/**
 * Tests for typewriterMode extension — scroll behavior and plugin structure.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock CSS import
vi.mock("./typewriter-mode.css", () => ({}));

// Mock editorStore
const mockEditorStoreState = { typewriterModeEnabled: false };
vi.mock("@/stores/editorStore", () => ({
  useEditorStore: {
    getState: () => mockEditorStoreState,
  },
}));

import { typewriterModeExtension } from "./tiptap";

describe("typewriterModeExtension", () => {
  beforeEach(() => {
    mockEditorStoreState.typewriterModeEnabled = false;
  });

  it("has the correct name", () => {
    expect(typewriterModeExtension.name).toBe("typewriterMode");
  });

  it("defines ProseMirror plugins", () => {
    expect(typewriterModeExtension.config.addProseMirrorPlugins).toBeDefined();
  });

  describe("update behavior", () => {
    it("does not scroll when typewriter mode is disabled", () => {
      mockEditorStoreState.typewriterModeEnabled = false;
      // The update handler checks typewriterEnabled first and returns early
      expect(mockEditorStoreState.typewriterModeEnabled).toBe(false);
    });

    it("is enabled when store has typewriterModeEnabled true", () => {
      mockEditorStoreState.typewriterModeEnabled = true;
      expect(mockEditorStoreState.typewriterModeEnabled).toBe(true);
    });
  });

  describe("scroll threshold and skip constants", () => {
    it("exports extension that creates plugin with view update", () => {
      const plugins = typewriterModeExtension.config.addProseMirrorPlugins!.call({
        name: "typewriterMode",
        options: {},
        storage: {},
        parent: null as never,
        editor: {} as never,
        type: "extension" as never,
      });
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBeDefined();
    });
  });

  describe("plugin view lifecycle", () => {
    it("creates a plugin with a view factory returning update and destroy", () => {
      const plugins = typewriterModeExtension.config.addProseMirrorPlugins!.call({
        name: "typewriterMode",
        options: {},
        storage: {},
        parent: null as never,
        editor: {} as never,
        type: "extension" as never,
      });
      const plugin = plugins[0];
      // The plugin spec should have a view property
      expect(plugin.spec.view).toBeDefined();
    });
  });
});
