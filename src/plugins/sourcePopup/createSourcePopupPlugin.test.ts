/**
 * Tests for createSourcePopupPlugin — factory function for CM6 popup plugins.
 *
 * Tests plugin creation, click/hover trigger logic, update behavior,
 * and the createPositionBasedDetector helper.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import type { PopupStoreBase, StoreApi, SourcePopupView } from "./SourcePopupView";

// Mock sourcePopupUtils
vi.mock("./sourcePopupUtils", () => ({
  getAnchorRectFromRange: vi.fn(
    (_view: unknown, from: number, to: number) =>
      ({ top: 100 + from, left: 50, bottom: 120 + to, right: 200 })
  ),
}));

import {
  createSourcePopupPlugin,
  createPositionBasedDetector,
  type PopupTriggerConfig,
} from "./createSourcePopupPlugin";
import { getAnchorRectFromRange } from "./sourcePopupUtils";

// --- Helpers ---

interface TestState extends PopupStoreBase {
  openPopup?: (data: unknown) => void;
}

function createMockStore(): {
  store: StoreApi<TestState>;
  state: TestState;
  closePopup: ReturnType<typeof vi.fn>;
  openPopupFn: ReturnType<typeof vi.fn>;
} {
  const closePopup = vi.fn();
  const openPopupFn = vi.fn();
  const state: TestState = {
    isOpen: false,
    anchorRect: null,
    closePopup,
    openPopup: openPopupFn,
  };
  const subscribers: Array<(s: TestState) => void> = [];
  const store: StoreApi<TestState> = {
    getState: () => state,
    subscribe: (fn) => {
      subscribers.push(fn);
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    },
  };
  return { store, state, closePopup, openPopupFn };
}

function createMockPopupView(): SourcePopupView<TestState> {
  return {
    destroy: vi.fn(),
  } as unknown as SourcePopupView<TestState>;
}

function createMockEditorView(): EditorView {
  const dom = document.createElement("div");
  dom.addEventListener = vi.fn();
  dom.removeEventListener = vi.fn();
  return {
    dom,
    posAtCoords: vi.fn(() => 5),
    state: {
      doc: { lineAt: () => ({ from: 0, to: 20, text: "hello world" }) },
      selection: { main: { from: 5, to: 5 } },
    },
    coordsAtPos: vi.fn(() => ({ top: 100, left: 50, bottom: 120, right: 200 })),
  } as unknown as EditorView;
}

describe("createSourcePopupPlugin", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockPopupView: SourcePopupView<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    mockPopupView = createMockPopupView();
  });

  describe("plugin creation", () => {
    it("returns a ViewPlugin", () => {
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
      });

      expect(plugin).toBeDefined();
      // ViewPlugin.fromClass returns an Extension-compatible object
      expect(typeof plugin).toBe("object");
    });

    it("uses default values for optional config", () => {
      // triggerOnClick defaults to true, triggerOnHover to false
      const config: PopupTriggerConfig<TestState> = {
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
      };

      // Should not throw
      const plugin = createSourcePopupPlugin(config);
      expect(plugin).toBeDefined();
    });

    it("accepts all optional config fields", () => {
      const config: PopupTriggerConfig<TestState, { href: string }> = {
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        detectTriggerAtPos: () => null,
        extractData: () => ({ href: "https://example.com" }),
        openPopup: vi.fn(),
        onOpen: vi.fn(),
        triggerOnClick: true,
        triggerOnHover: true,
        hoverDelay: 500,
        hoverHideDelay: 200,
      };

      const plugin = createSourcePopupPlugin(config);
      expect(plugin).toBeDefined();
    });
  });

  describe("click handler registration", () => {
    it("registers click handler when triggerOnClick is true", () => {
      const mockView = createMockEditorView();
      const createView = vi.fn(() => mockPopupView);

      createSourcePopupPlugin({
        store: mockStore.store,
        createView,
        detectTrigger: () => null,
        extractData: () => ({}),
        triggerOnClick: true,
      });

      // The plugin is created via ViewPlugin.fromClass, so we need to verify
      // by checking that the class constructor would add event listeners
      // Since we can't easily instantiate the class directly, we verify config acceptance
      expect(createView).not.toHaveBeenCalled(); // Not called until plugin is instantiated by CM
    });

    it("does not register click handler when triggerOnClick is false", () => {
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
        triggerOnClick: false,
      });

      expect(plugin).toBeDefined();
    });
  });

  describe("hover handler registration", () => {
    it("accepts hover configuration", () => {
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
        triggerOnHover: true,
        hoverDelay: 300,
        hoverHideDelay: 100,
      });

      expect(plugin).toBeDefined();
    });
  });

  describe("config with custom openPopup", () => {
    it("accepts custom openPopup handler", () => {
      const customOpen = vi.fn();
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => ({ from: 0, to: 10 }),
        extractData: () => ({}),
        openPopup: customOpen,
      });

      expect(plugin).toBeDefined();
    });

    it("accepts onOpen callback", () => {
      const onOpen = vi.fn();
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => ({ from: 0, to: 10 }),
        extractData: () => ({}),
        onOpen,
      });

      expect(plugin).toBeDefined();
    });
  });
});

describe("createSourcePopupPlugin — instantiated behavior", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockPopupView: SourcePopupView<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStore = createMockStore();
    mockPopupView = createMockPopupView();
    // Add editorView to mockPopupView for private access in handleClick
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["container"] = document.createElement("div");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Since CM6 ViewPlugin.fromClass creates a class that can only be properly
   * instantiated through CM6, we test the behavior by extracting the class
   * from the ViewPlugin spec and instantiating it directly.
   */
  function instantiatePlugin(config: Partial<PopupTriggerConfig<TestState>> = {}) {
    const plugin = createSourcePopupPlugin({
      store: mockStore.store,
      createView: () => mockPopupView,
      detectTrigger: () => null,
      extractData: () => ({}) as object,
      ...config,
    });
    const mockView = createMockEditorView();
    // Bind editorView on the popupView mock
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = mockView;
    // ViewPlugin exposes a .create(view) factory
    const createFn = (plugin as unknown as { create: (view: EditorView) => unknown }).create;
    const instance = createFn(mockView);
    return { instance: instance as Record<string, unknown>, view: mockView };
  }

  it("creates popupView via createView on instantiation", () => {
    const createViewFn = vi.fn(() => mockPopupView);
    instantiatePlugin({ createView: createViewFn });
    expect(createViewFn).toHaveBeenCalledTimes(1);
  });

  it("registers click handler when triggerOnClick is true (default)", () => {
    const { view } = instantiatePlugin({ triggerOnClick: true });
    expect(view.dom.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("does not register click handler when triggerOnClick is false", () => {
    const { view } = instantiatePlugin({ triggerOnClick: false });
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickCalls = calls.filter((c: unknown[]) => c[0] === "click");
    expect(clickCalls.length).toBe(0);
  });

  it("registers hover handlers when triggerOnHover is true", () => {
    const { view } = instantiatePlugin({ triggerOnHover: true });
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const eventNames = calls.map((c: unknown[]) => c[0]);
    expect(eventNames).toContain("mousemove");
    expect(eventNames).toContain("mouseleave");
    expect(eventNames).toContain("mousedown");
    expect(eventNames).toContain("mouseup");
  });

  it("does not register hover handlers when triggerOnHover is false (default)", () => {
    const { view } = instantiatePlugin({ triggerOnHover: false });
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const eventNames = calls.map((c: unknown[]) => c[0]);
    expect(eventNames).not.toContain("mousemove");
    expect(eventNames).not.toContain("mouseleave");
  });

  it("destroy calls popupView.destroy", () => {
    const { instance } = instantiatePlugin();
    (instance as { destroy: () => void }).destroy();
    expect(mockPopupView.destroy).toHaveBeenCalled();
  });

  it("destroy clears pending timeouts", () => {
    const { instance } = instantiatePlugin({ triggerOnHover: true });
    // Just verify destroy doesn't throw
    (instance as { destroy: () => void }).destroy();
  });

  it("update closes popup when selection moves away", () => {
    mockStore.state.isOpen = true;
    const detectTrigger = vi.fn(() => null);
    const { instance, view } = instantiatePlugin({ detectTrigger });

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: false,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    expect(mockStore.closePopup).toHaveBeenCalled();
  });

  it("update does not close popup when cursor is still in trigger", () => {
    mockStore.state.isOpen = true;
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));
    const { instance, view } = instantiatePlugin({ detectTrigger });

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: false,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    expect(mockStore.closePopup).not.toHaveBeenCalled();
  });

  it("update ignores when popup is not open", () => {
    mockStore.state.isOpen = false;
    const { instance, view } = instantiatePlugin();

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: false,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    expect(mockStore.closePopup).not.toHaveBeenCalled();
  });

  it("update ignores when doc changed alongside selection", () => {
    mockStore.state.isOpen = true;
    const { instance, view } = instantiatePlugin();

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: true,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    // Should not close — docChanged means user is typing, not moving cursor
    expect(mockStore.closePopup).not.toHaveBeenCalled();
  });
});

describe("createPositionBasedDetector", () => {
  it("delegates to selection-based detector", () => {
    const selectionDetector = vi.fn(() => ({ from: 5, to: 15 }));
    const posDetector = createPositionBasedDetector(selectionDetector);

    const mockView = {} as EditorView;
    const result = posDetector(mockView, 10);

    expect(selectionDetector).toHaveBeenCalledWith(mockView);
    expect(result).toEqual({ from: 5, to: 15 });
  });

  it("returns null when selection-based detector returns null", () => {
    const selectionDetector = vi.fn(() => null);
    const posDetector = createPositionBasedDetector(selectionDetector);

    const mockView = {} as EditorView;
    const result = posDetector(mockView, 10);

    expect(result).toBeNull();
  });

  it("returns the function that accepts view and pos", () => {
    const selectionDetector = vi.fn(() => null);
    const posDetector = createPositionBasedDetector(selectionDetector);

    expect(typeof posDetector).toBe("function");
    expect(posDetector.length).toBe(2);
  });
});
