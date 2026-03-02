/**
 * Tests for sourcePeekInline extension — extension structure, plugin state
 * init/apply, and re-exports.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock CSS
vi.mock("./source-peek-inline.css", () => ({}));

// Mock store
const mockStoreState = {
  isOpen: false,
  range: null as { from: number; to: number } | null,
  markdown: "",
  blockTypeName: null as string | null,
  hasUnsavedChanges: false,
  livePreview: false,
  toggleLivePreview: vi.fn(),
  setMarkdown: vi.fn(),
};
vi.mock("@/stores/sourcePeekStore", () => ({
  useSourcePeekStore: {
    getState: () => mockStoreState,
    setState: vi.fn(),
  },
}));

// Mock dependencies
vi.mock("@/utils/sourcePeek", () => ({
  applySourcePeekMarkdown: vi.fn(),
  getExpandedSourcePeekRange: vi.fn(() => ({ from: 0, to: 10 })),
}));

vi.mock("./sourcePeekHeader", () => ({
  createEditHeader: vi.fn(() => document.createElement("div")),
}));

vi.mock("./sourcePeekEditor", () => ({
  createCodeMirrorEditor: vi.fn(() => document.createElement("div")),
  cleanupCMView: vi.fn(),
}));

vi.mock("./sourcePeekActions", () => ({
  EDITING_STATE_CHANGED: "sourcePeekEditingChanged",
  getMarkdownOptions: vi.fn(() => ({})),
  canUseSourcePeek: vi.fn(() => true),
  openSourcePeekInline: vi.fn(),
  commitSourcePeek: vi.fn(),
  revertAndCloseSourcePeek: vi.fn(),
}));

import {
  sourcePeekInlineExtension,
  sourcePeekInlinePluginKey,
  EDITING_STATE_CHANGED,
  canUseSourcePeek,
  openSourcePeekInline,
  commitSourcePeek,
  revertAndCloseSourcePeek,
} from "./tiptap";

describe("sourcePeekInlineExtension", () => {
  beforeEach(() => {
    mockStoreState.isOpen = false;
    mockStoreState.range = null;
    mockStoreState.markdown = "";
    mockStoreState.blockTypeName = null;
    mockStoreState.hasUnsavedChanges = false;
    mockStoreState.livePreview = false;
  });

  it("has name 'sourcePeekInline'", () => {
    expect(sourcePeekInlineExtension.name).toBe("sourcePeekInline");
  });

  it("defines ProseMirror plugins", () => {
    expect(sourcePeekInlineExtension.config.addProseMirrorPlugins).toBeDefined();
  });

  it("creates a plugin with correct key", () => {
    const plugins = sourcePeekInlineExtension.config.addProseMirrorPlugins!.call({
      name: "sourcePeekInline",
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

describe("re-exports", () => {
  it("exports sourcePeekInlinePluginKey", () => {
    expect(sourcePeekInlinePluginKey).toBeDefined();
  });

  it("exports EDITING_STATE_CHANGED", () => {
    expect(EDITING_STATE_CHANGED).toBe("sourcePeekEditingChanged");
  });

  it("exports canUseSourcePeek", () => {
    expect(canUseSourcePeek).toBeTypeOf("function");
  });

  it("exports openSourcePeekInline", () => {
    expect(openSourcePeekInline).toBeTypeOf("function");
  });

  it("exports commitSourcePeek", () => {
    expect(commitSourcePeek).toBeTypeOf("function");
  });

  it("exports revertAndCloseSourcePeek", () => {
    expect(revertAndCloseSourcePeek).toBeTypeOf("function");
  });
});
