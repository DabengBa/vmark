/**
 * Wiki Link Popup Extension (tiptap.ts) Tests
 *
 * Tests for the ProseMirror plugin that detects hover/mouseout on wiki link
 * nodes and manages the WikiLinkPopupPluginView lifecycle.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock stores and utilities before importing
const mockClosePopup = vi.fn();
const mockOpenPopup = vi.fn();

let storeState = {
  isOpen: false,
  target: "",
  nodePos: null as number | null,
  anchorRect: null as { top: number; left: number; bottom: number; right: number } | null,
  closePopup: mockClosePopup,
  openPopup: mockOpenPopup,
  updateTarget: vi.fn(),
};

vi.mock("@/stores/wikiLinkPopupStore", () => ({
  useWikiLinkPopupStore: {
    getState: () => storeState,
    subscribe: () => () => {},
  },
}));

vi.mock("@/utils/debug", () => ({
  wikiLinkPopupWarn: vi.fn(),
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: () => false,
}));

vi.mock("@/utils/popupComponents", () => ({
  popupIcons: { open: "o", copy: "c", save: "s", delete: "d", close: "x", folder: "f" },
  buildPopupIconButton: vi.fn(({ onClick, title }) => {
    const btn = document.createElement("button");
    btn.title = title;
    btn.addEventListener("click", onClick);
    return btn;
  }),
  buildPopupInput: vi.fn(({ placeholder, className, onInput, onKeydown }) => {
    const input = document.createElement("input");
    input.placeholder = placeholder;
    input.className = className;
    if (onInput) input.addEventListener("input", (e) => onInput((e.target as HTMLInputElement).value));
    if (onKeydown) input.addEventListener("keydown", onKeydown);
    return input;
  }),
  handlePopupTabNavigation: vi.fn(),
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: (dom: HTMLElement) => dom.closest(".editor-container"),
  toHostCoordsForDom: (_host: HTMLElement, pos: { top: number; left: number }) => pos,
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: vi.fn(() => ({
    emit: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({ rootPath: "/workspace" }),
  },
}));

vi.mock("../wiki-link-popup.css", () => ({}));

const mockPopupViewDestroy = vi.fn();
vi.mock("../WikiLinkPopupView", () => {
  return {
    WikiLinkPopupView: class MockWikiLinkPopupView {
      destroy = mockPopupViewDestroy;
    },
  };
});

import { wikiLinkPopupExtension } from "../tiptap";

// Helper to create a minimal mock EditorView for plugin view
function createMockPMView() {
  const editorDom = document.createElement("div");
  editorDom.className = "ProseMirror";
  const listeners: Record<string, Function[]> = {};
  editorDom.addEventListener = vi.fn((event: string, handler: Function) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }) as unknown as typeof editorDom.addEventListener;
  editorDom.removeEventListener = vi.fn((event: string, handler: Function) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((h) => h !== handler);
    }
  }) as unknown as typeof editorDom.removeEventListener;

  return {
    dom: editorDom,
    state: {
      doc: {
        resolve: vi.fn(() => ({
          parent: { type: { name: "wikiLink" }, attrs: { value: "my-page" } },
          before: vi.fn(() => 5),
        })),
        nodeAt: vi.fn(() => ({
          type: { name: "wikiLink" },
          attrs: { value: "my-page" },
        })),
      },
    },
    posAtDOM: vi.fn(() => 6),
    listeners,
    dispatch: vi.fn(),
    focus: vi.fn(),
  };
}

describe("wikiLinkPopupExtension", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState = {
      isOpen: false,
      target: "",
      nodePos: null,
      anchorRect: null,
      closePopup: mockClosePopup,
      openPopup: mockOpenPopup,
      updateTarget: vi.fn(),
    };
  });

  describe("extension creation", () => {
    it("has name 'wikiLinkPopup'", () => {
      expect(wikiLinkPopupExtension.name).toBe("wikiLinkPopup");
    });

    it("has addProseMirrorPlugins method", () => {
      expect(typeof wikiLinkPopupExtension.config.addProseMirrorPlugins).toBe("function");
    });
  });

  describe("WikiLinkPopupPluginView", () => {
    // Access the plugin's view class by calling addProseMirrorPlugins and extracting the view factory
    function createPluginView() {
      const mockView = createMockPMView();
      const plugins = wikiLinkPopupExtension.config.addProseMirrorPlugins!.call({
        editor: { view: mockView },
      } as unknown as Parameters<typeof wikiLinkPopupExtension.config.addProseMirrorPlugins>[0]);

      const plugin = plugins[0];
      const viewFactory = plugin.spec.view;
      const pluginView = typeof viewFactory === "function"
        ? (viewFactory as Function)(mockView)
        : null;

      return { pluginView, mockView };
    }

    it("registers mouseover and mouseout handlers on construction", () => {
      const { mockView } = createPluginView();
      const calls = (mockView.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
      const eventNames = calls.map((c: unknown[]) => c[0]);
      expect(eventNames).toContain("mouseover");
      expect(eventNames).toContain("mouseout");
    });

    it("destroy removes event listeners", () => {
      const { pluginView, mockView } = createPluginView();
      pluginView.destroy();
      const removeCalls = (mockView.dom.removeEventListener as ReturnType<typeof vi.fn>).mock.calls;
      const removedEvents = removeCalls.map((c: unknown[]) => c[0]);
      expect(removedEvents).toContain("mouseover");
      expect(removedEvents).toContain("mouseout");
    });

    it("mouseover on non-wiki-link element does nothing", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      const target = document.createElement("span");
      target.closest = vi.fn(() => null);

      const handler = mockView.listeners["mouseover"][0];
      handler({ target } as unknown as MouseEvent);

      vi.advanceTimersByTime(500);
      expect(mockOpenPopup).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("mouseover on wiki-link element starts hover timer", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      const wikiLinkEl = document.createElement("span");
      wikiLinkEl.className = "wiki-link";
      wikiLinkEl.closest = vi.fn((sel: string) =>
        sel === "span.wiki-link" ? wikiLinkEl : null
      );
      wikiLinkEl.getBoundingClientRect = vi.fn(() => ({
        top: 100, left: 50, bottom: 120, right: 200,
        width: 150, height: 20, x: 50, y: 100, toJSON: () => ({}),
      }));

      const handler = mockView.listeners["mouseover"][0];
      handler({ target: wikiLinkEl } as unknown as MouseEvent);

      // Not immediately
      expect(mockOpenPopup).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      // After 300ms hover delay, should try to show popup
      expect(mockOpenPopup).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("mouseover on same element does not restart timer", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      const wikiLinkEl = document.createElement("span");
      wikiLinkEl.className = "wiki-link";
      wikiLinkEl.closest = vi.fn((sel: string) =>
        sel === "span.wiki-link" ? wikiLinkEl : null
      );
      wikiLinkEl.getBoundingClientRect = vi.fn(() => ({
        top: 100, left: 50, bottom: 120, right: 200,
        width: 150, height: 20, x: 50, y: 100, toJSON: () => ({}),
      }));

      const handler = mockView.listeners["mouseover"][0];
      handler({ target: wikiLinkEl } as unknown as MouseEvent);
      vi.advanceTimersByTime(150);

      // Same element again
      handler({ target: wikiLinkEl } as unknown as MouseEvent);
      vi.advanceTimersByTime(150);

      // Timer should have fired after first 300ms
      expect(mockOpenPopup).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it("mouseout to non-popup element clears hover", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      const wikiLinkEl = document.createElement("span");
      wikiLinkEl.className = "wiki-link";
      wikiLinkEl.closest = vi.fn((sel: string) =>
        sel === "span.wiki-link" ? wikiLinkEl : null
      );

      const overHandler = mockView.listeners["mouseover"][0];
      overHandler({ target: wikiLinkEl } as unknown as MouseEvent);

      // Mouse out to unrelated element
      const outHandler = mockView.listeners["mouseout"][0];
      const unrelatedEl = document.createElement("div");
      unrelatedEl.closest = vi.fn(() => null);
      outHandler({
        relatedTarget: unrelatedEl,
      } as unknown as MouseEvent);

      vi.advanceTimersByTime(500);
      // The hover timer should have been cleared, and the hide timer starts
      // If popup was open, it would try to close
      vi.useRealTimers();
    });

    it("mouseout to wiki-link element does not close", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      const outHandler = mockView.listeners["mouseout"][0];
      const anotherWikiLink = document.createElement("span");
      anotherWikiLink.className = "wiki-link";
      anotherWikiLink.closest = vi.fn((sel: string) =>
        sel === "span.wiki-link" ? anotherWikiLink : null
      );

      storeState.isOpen = true;
      outHandler({
        relatedTarget: anotherWikiLink,
      } as unknown as MouseEvent);

      vi.advanceTimersByTime(500);
      expect(mockClosePopup).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("mouseout to popup element does not close", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      const outHandler = mockView.listeners["mouseout"][0];

      // Create a popup element
      const popupEl = document.createElement("div");
      popupEl.className = "wiki-link-popup";
      document.body.appendChild(popupEl);

      const targetInsidePopup = document.createElement("span");
      popupEl.appendChild(targetInsidePopup);

      // Patch document.querySelector to return our popup
      const origQuerySelector = document.querySelector.bind(document);
      document.querySelector = vi.fn((sel: string) => {
        if (sel === ".wiki-link-popup") return popupEl;
        return origQuerySelector(sel);
      }) as typeof document.querySelector;

      storeState.isOpen = true;
      outHandler({
        relatedTarget: targetInsidePopup,
      } as unknown as MouseEvent);

      vi.advanceTimersByTime(500);
      expect(mockClosePopup).not.toHaveBeenCalled();

      popupEl.remove();
      document.querySelector = origQuerySelector;
      vi.useRealTimers();
    });

    it("handles error in showPopupForLink gracefully", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      // Make posAtDOM throw
      mockView.posAtDOM.mockImplementation(() => { throw new Error("test error"); });

      const wikiLinkEl = document.createElement("span");
      wikiLinkEl.className = "wiki-link";
      wikiLinkEl.closest = vi.fn((sel: string) =>
        sel === "span.wiki-link" ? wikiLinkEl : null
      );

      const handler = mockView.listeners["mouseover"][0];
      handler({ target: wikiLinkEl } as unknown as MouseEvent);

      vi.advanceTimersByTime(300);

      // Should not throw, just log warning
      expect(mockOpenPopup).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("fallback to nodeAt when parent is not wikiLink", () => {
      vi.useFakeTimers();
      const { mockView } = createPluginView();

      // Override doc.resolve to return a non-wikiLink parent
      mockView.state.doc.resolve.mockReturnValue({
        parent: { type: { name: "paragraph" } },
        before: vi.fn(() => 5),
      });
      mockView.posAtDOM.mockReturnValue(6);

      const wikiLinkEl = document.createElement("span");
      wikiLinkEl.className = "wiki-link";
      wikiLinkEl.closest = vi.fn((sel: string) =>
        sel === "span.wiki-link" ? wikiLinkEl : null
      );
      wikiLinkEl.getBoundingClientRect = vi.fn(() => ({
        top: 100, left: 50, bottom: 120, right: 200,
        width: 150, height: 20, x: 50, y: 100, toJSON: () => ({}),
      }));

      const handler = mockView.listeners["mouseover"][0];
      handler({ target: wikiLinkEl } as unknown as MouseEvent);

      vi.advanceTimersByTime(300);

      // Should have called nodeAt with innerPos - 1 = 5
      expect(mockView.state.doc.nodeAt).toHaveBeenCalledWith(5);
      expect(mockOpenPopup).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("update method is a no-op", () => {
      const { pluginView } = createPluginView();
      // Should not throw
      pluginView.update();
    });
  });
});
